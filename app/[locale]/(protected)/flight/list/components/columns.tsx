"use client";
import { ColumnDef } from "@tanstack/react-table";
import type { FlightItem } from "@/lib/api/flight/filghtlist.interface";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleOff, MoreHorizontal, FileCheck, FilePenLine, Paperclip, SquarePen, Eye, Mail, BadgeDollarSign, AlertTriangle, Lock, LockKeyhole, RotateCcw, RefreshCw, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import clsx from "clsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatUtcToLocalDisplay } from "@/lib/utils/flightDatetime";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import type { ThfRevisionRecord } from "@/lib/store/useThfRevisionStore";
import { MENU } from "@/lib/permission-codes";

const getDatasourceColor = (datasource?: string | null) => {
  const ds = datasource?.trim().toLowerCase();
  if (ds === "adhoc") return "text-primary";
  if (ds === "recurring") return "text-purple-800 dark:text-purple-300";
  return "";
};

const getThfTagStyle = (flight: FlightItem, revRecord?: ThfRevisionRecord) => {
  const isRevisionRequired = flight.state === "revision_required" || revRecord?.state === "revision_required";
  const isPendingUnlock = flight.state === "pending_unlock" || revRecord?.state === "pending_unlock";
  const isLockedFromEdit = flight.isMapping === true && !isRevisionRequired && !isPendingUnlock;
  const isDone = flight.state === "save" || flight.state === "submitted";

  if (isRevisionRequired) {
    return {
      label: "Revision Required",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      dot: "bg-amber-500",
    };
  }
  if (isPendingUnlock) {
    return {
      label: "Pending Approval",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
      dot: "bg-yellow-500",
    };
  }
  if (isLockedFromEdit) {
    return {
      label: "Locked (Pre-Invoice)",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
      dot: "bg-blue-500",
    };
  }
  if (isDone) {
    return {
      label: "Done",
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      dot: "bg-emerald-500",
    };
  }
  return {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
  };
};

export function getFlightColumns({
  onCreateTHF,
  onEditFlight,
  onPreviewTHF,
  onAttach,
  onCancel,
  onDelete,
  enableSelection = false,
  onSendEmail,
  isCancelLoading = false,
  hideStatusActions = false,
  onPreInvoice,
  isPreInvoiceLoading = false,
  acTypeField = "code",
  airlineHeader = "airline Code",
  showAirlineFullName = false,
  onRequestRevision,
  onRequestUnlock,
  onReviewUnlock,
  getRevisionRecord,
}: {
  onCreateTHF?: (flight: FlightItem) => void;
  onEditFlight?: (flight: FlightItem) => void;
  onPreviewTHF?: (flight: FlightItem) => void;
  onAttach?: (filePath: string) => void;
  onCancel?: (flight: FlightItem) => void;
  /** Delete Flight action (POST /flight/delete-flightinfos). Menu item is gated by FLIGHT › canDelete. */
  onDelete?: (flight: FlightItem) => void;
  /** Adds a leading checkbox column for multi-select delete. Pass only when the user has FLIGHT › canDelete. */
  enableSelection?: boolean;
  onSendEmail?: (flight: FlightItem) => void;
  isCancelLoading?: boolean;
  hideStatusActions?: boolean;
  onPreInvoice?: (flight: FlightItem) => void;
  /** Disables "Create Pre-Invoice" while a Pre-Invoice request is running / being re-checked. */
  isPreInvoiceLoading?: boolean;
  /** Which field of acTypeObj the "A/C Type" column shows */
  acTypeField?: "code" | "familyCode";
  /** Header label for the Airline column */
  airlineHeader?: string;
  /** When true, displays Airline full name + code e.g. "Name (CODE)" */
  showAirlineFullName?: boolean;
  onRequestRevision?: (flight: FlightItem) => void;
  onRequestUnlock?: (flight: FlightItem) => void;
  onReviewUnlock?: (flight: FlightItem) => void;
  getRevisionRecord?: (flight: FlightItem) => ThfRevisionRecord | undefined;
}): ColumnDef<FlightItem>[] {
  const selectColumn: ColumnDef<FlightItem> = {
    id: "select",
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all flights on this page"
        className="border-white/80 bg-white/10 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-primary [&_svg]:stroke-primary"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select flight"
      />
    ),
  };

  return [
    ...(enableSelection ? [selectColumn] : []),
    // {
    //   accessorKey: "status", header: "-",
    //   cell: ({ row }) => <div className="bg-primary/10 border-l-4 border-l-red-600 px-6 h-20"></div>
    {
      accessorKey: "arrivalFlightNo", header: "Flight No",
      cell: ({ row }) => {
        const flight = row.original;
        const thfNo = (flight.thfNumber || (flight as any).thfNo)?.trim();
        const displayThf = thfNo ? (thfNo.toLowerCase().startsWith("thf") ? thfNo : `THF: ${thfNo}`) : "";
        const revRecord = getRevisionRecord?.(flight);
        const tagStyle = thfNo ? getThfTagStyle(flight, revRecord) : null;

        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className={clsx("font-medium text-sm whitespace-nowrap", getDatasourceColor(flight.datasource))}>
              {row.getValue("arrivalFlightNo")}
            </span>
            {thfNo && tagStyle && (
              <span
                title={`THF No: ${thfNo} (${tagStyle.label})`}
                className={clsx(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium leading-none whitespace-nowrap",
                  tagStyle.className
                )}
              >
                <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", tagStyle.dot)} />
                <span>{displayThf}</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "station",
      header: "STATION",
      accessorFn: (row) => row?.stationObj?.code ?? "",
      cell: ({ row, getValue }) => <span className={clsx("whitespace-nowrap", getDatasourceColor(row.original.datasource))}>{getValue() as string || "-"}</span>,
      filterFn: (row, _id, filterValue?: string[]) => {
        if (!filterValue?.length) return true;
        const cell = row.getValue("station") as string;
        return filterValue.includes(cell);
      },
    },
    {
      accessorKey: "airlineObj", header: airlineHeader,
      accessorFn: (row) => {
        const code = row?.airlineObj?.code?.trim() ?? "";
        const name = row?.airlineObj?.name?.trim() ?? "";
        if (showAirlineFullName) {
          if (name && code && name !== code) return `${name} (${code})`;
          return name || code;
        }
        return code;
      },
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", getDatasourceColor(row.original.datasource))}>{row.getValue("airlineObj") || "-"}</span>,
    },
    {
      accessorKey: "acReg", header: "A/C Reg",
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", getDatasourceColor(row.original.datasource))}>{row.getValue("acReg") || "-"}</span>
    },
    {
      accessorKey: "acType", header: "A/C Type",
      accessorFn: (row) =>
        `${(acTypeField === "familyCode" ? row?.acTypeObj?.familyCode : row?.acTypeObj?.code) ?? ""}`,
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", getDatasourceColor(row.original.datasource))}>{row.getValue("acType") || "-"}</span>,
    },
    {
      id: "sta", header: "STA(Local)",
      accessorFn: (row) => formatUtcToLocalDisplay(row?.arrivalStaDate),
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", getDatasourceColor(row.original.datasource))}>{(row.getValue("sta") as string) || "-"}</span>
    },
    {
      id: "std", header: "STD(Local)",
      accessorFn: (row) => formatUtcToLocalDisplay(row?.departureStdDate),
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", getDatasourceColor(row.original.datasource))}>{(row.getValue("std") as string) || "-"}</span>
    },
    {
      id: "ata", header: "ATA(Local)",
      accessorFn: (row) => formatUtcToLocalDisplay(row?.arrivalAtaDate),
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", getDatasourceColor(row.original.datasource))}>{(row.getValue("ata") as string) || "-"}</span>
    },
    {
      id: "atd", header: "ATD(Local)",
      accessorFn: (row) => formatUtcToLocalDisplay(row?.departureAtdDate),
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", getDatasourceColor(row.original.datasource))}>{row.getValue("atd") as string || "-"}</span>
    },
    {
      id: "actions",
      header: "Action",
      enableHiding: false,
      cell: ({ row }) => {
        const flight = row.original;
        const revRecord = getRevisionRecord?.(flight);
        const isRevisionRequired = flight.state === "revision_required" || revRecord?.state === "revision_required";
        const isPendingUnlock = flight.state === "pending_unlock" || revRecord?.state === "pending_unlock";
        const isRevised = flight.mappingStatus === "REVISED" || revRecord?.mappingStatus === "REVISED";
        // THF is locked for editing only once a Pre-Invoice has been issued (isMapping from /flight/listdata)
        const isLockedFromEdit = flight.isMapping === true && !isRevisionRequired && !isPendingUnlock;

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Revision Required Badge for Flight List */}
            {!hideStatusActions && isRevisionRequired && (
              <TooltipProvider>
                <Tooltip>
                  <PermissionActionGuard
                    menuCode={MENU.THF}
                    action="canEdit"
                    fallback={
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-600 cursor-default">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Revision Required</span>
                        </span>
                      </TooltipTrigger>
                    }
                  >
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onCreateTHF?.(flight)}
                        className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/25 transition-colors cursor-pointer animate-pulse"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Revision Required</span>
                      </button>
                    </TooltipTrigger>
                  </PermissionActionGuard>
                  <TooltipContent className="max-w-xs text-xs">
                    <p className="font-semibold text-amber-500">Revision Requested by {flight.revisionRequestedBy || revRecord?.requestedBy || 'Accounting'}:</p>
                    <p className="text-slate-100 mt-0.5">{flight.revisionReason || revRecord?.reason || 'Please review and update this THF.'}</p>
                    {(flight.revisionCategory || revRecord?.category) && (
                      <p className="text-[10px] text-slate-400 mt-1">Category: {flight.revisionCategory || revRecord?.category}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Pending Unlock Badge for Flight List */}
            {!hideStatusActions && isPendingUnlock && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 rounded bg-yellow-500/15 border border-yellow-500/30 px-2 py-0.5 text-xs font-semibold text-yellow-600 cursor-default">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Pending Approval</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p className="font-semibold text-yellow-500">Waiting for Accounting Approval:</p>
                    <p className="text-slate-100 mt-0.5">{revRecord?.unlockReason || 'Permission requested to edit document'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {!hideStatusActions && (flight.state === "save" || flight.state === "submitted") && !isRevisionRequired && !isPendingUnlock && (
              <PermissionActionGuard menuCode={MENU.FLIGHT_LIST} action="canEdit">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative inline-flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        color="secondary"
                        className="h-8 w-8"
                        disabled={!flight.airlineObj?.emailTo && !flight.airlineObj?.emailCc}
                        onClick={() => onSendEmail?.(flight)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {(flight.emailSuccessCount ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white leading-none pointer-events-none">
                          {flight.emailSuccessCount}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {flight.airlineObj?.emailTo || flight.airlineObj?.emailCc
                      ? `Send email to ${flight.airlineObj?.emailTo || flight.airlineObj?.emailCc}`
                      : 'No email configured'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              </PermissionActionGuard>
            )}

            {!hideStatusActions && flight.state !== "plan" && !isRevisionRequired && !isPendingUnlock && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      color="secondary"
                      className={clsx(
                        "h-8 w-8 cursor-default",
                        !isLockedFromEdit && (flight.state === "save" || flight.state === "submitted")
                          ? "text-emerald-600 dark:text-emerald-500 hover:text-emerald-600 disabled:opacity-100"
                          : "text-muted-foreground"
                      )}
                      tabIndex={-1}
                      disabled
                    >
                      {isLockedFromEdit ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <FileCheck
                          className={clsx(
                            "h-4 w-4",
                            (flight.state === "save" || flight.state === "submitted") &&
                            "text-emerald-600 dark:text-emerald-500"
                          )}
                        />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isLockedFromEdit
                      ? `Locked – Pre-Invoice issued (THF:${flight.thfNumber})`
                      : (flight.state === "save" || flight.state === "submitted")
                        ? `Done (THF:${flight.thfNumber})`
                        : `Draft (THF:${flight.thfNumber})`}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={flight.statusObj?.code === "Cancel" || isCancelLoading}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={flight.statusObj?.code === "Cancel" || isCancelLoading}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEditFlight && (
                  <PermissionActionGuard menuCode={MENU.FLIGHT_LIST} action="canEdit">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      disabled={flight.statusObj?.code === "Cancel"}
                      onClick={() => onEditFlight(flight)}
                    >
                      <SquarePen className="h-4 w-4 mr-2" />
                      Edit Flight
                    </DropdownMenuItem>
                  </PermissionActionGuard>
                )}

                {/* Create / Edit THF */}
                {onCreateTHF && !isLockedFromEdit && (
                  <PermissionActionGuard menuCode={MENU.THF} action={flight.state === "plan" ? "canCreate" : "canEdit"}>
                    <DropdownMenuItem
                      className={clsx(
                        "cursor-pointer",
                        isRevisionRequired && "text-amber-600 font-semibold focus:text-amber-600",
                        isPendingUnlock && "opacity-60 pointer-events-none"
                      )}
                      disabled={flight.statusObj?.code === "Cancel" || isPendingUnlock}
                      onClick={() => onCreateTHF(flight)}
                    >
                      {isRevisionRequired ? (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                          Edit THF (Revision Required)
                        </>
                      ) : isPendingUnlock ? (
                        <>
                          <Lock className="h-4 w-4 mr-2 text-yellow-600" />
                          Edit THF (Pending Approval)
                        </>
                      ) : (
                        <>
                          <FilePenLine className="h-4 w-4 mr-2" />
                          {flight.state === "plan" ? "Create THF" : "Edit THF"}
                        </>
                      )}
                    </DropdownMenuItem>
                  </PermissionActionGuard>
                )}

                {/* Engineer Request Edit (only when THF is locked by an issued Pre-Invoice) */}
                {!hideStatusActions && isLockedFromEdit && onRequestUnlock && (
                  <PermissionActionGuard menuCode={MENU.THF} action="canEdit">
                    <DropdownMenuItem
                      className="cursor-pointer text-blue-600 focus:text-blue-600"
                      disabled={flight.statusObj?.code === "Cancel"}
                      onSelect={() => onRequestUnlock(flight)}
                      onClick={() => onRequestUnlock(flight)}
                    >
                      <LockKeyhole className="h-4 w-4 mr-2" />
                      Request Edit
                    </DropdownMenuItem>
                  </PermissionActionGuard>
                )}

                {/* Accounting: Request Revision (in Invoice THF DOCUMENT) */}
                {hideStatusActions && onRequestRevision && !isPendingUnlock && !isRevisionRequired && (
                  <DropdownMenuItem
                    className="cursor-pointer text-amber-600 focus:text-amber-600"
                    disabled={flight.statusObj?.code === "Cancel"}
                    onSelect={() => onRequestRevision(flight)}
                    onClick={() => onRequestRevision(flight)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Request Revision
                  </DropdownMenuItem>
                )}

                {/* Accounting: Review Unlock / Edit Request (in Invoice THF DOCUMENT) */}
                {hideStatusActions && isPendingUnlock && onReviewUnlock && (
                  <DropdownMenuItem
                    className="cursor-pointer text-blue-600 focus:text-blue-600 font-medium bg-blue-50/50"
                    disabled={flight.statusObj?.code === "Cancel"}
                    onSelect={() => onReviewUnlock(flight)}
                    onClick={() => onReviewUnlock(flight)}
                  >
                    <LockKeyhole className="h-4 w-4 mr-2 text-blue-600" />
                    Review Edit Request
                  </DropdownMenuItem>
                )}


                {onPreviewTHF && flight.state !== "plan" && (
                  <PermissionActionGuard menuCode={MENU.THF} action="canView">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      disabled={flight.statusObj?.code === "Cancel"}
                      onClick={() => onPreviewTHF(flight)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview THF
                    </DropdownMenuItem>
                  </PermissionActionGuard>
                )}
                {onPreInvoice && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={flight.statusObj?.code === "Cancel" || isRevisionRequired || isPendingUnlock || isPreInvoiceLoading}
                    onClick={() => onPreInvoice(flight)}
                  >
                    <BadgeDollarSign className="h-4 w-4 mr-2" />
                    Create Pre-Invoice
                  </DropdownMenuItem>
                )}
                {onAttach && flight.isFiles && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => flight.filePath && onAttach(flight.filePath)}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    View Attachment
                  </DropdownMenuItem>
                )}
                {onCancel && (
                  <PermissionActionGuard menuCode={MENU.FLIGHT_LIST} action="canDelete">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      disabled={flight.statusObj?.code === "Cancel"}
                      onClick={() => onCancel(flight)}
                    >
                      <CircleOff className="h-4 w-4 mr-2" />
                      Cancel Flight
                    </DropdownMenuItem>
                  </PermissionActionGuard>
                )}
                {onDelete && (
                  <PermissionActionGuard menuCode={MENU.FLIGHT_LIST} action="canDelete">
                    {!onCancel && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      // A flight with an issued Pre-Invoice (isMapping) must not be deleted
                      disabled={!flight.flightInfosId || flight.isMapping === true}
                      onClick={() => onDelete(flight)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Flight
                    </DropdownMenuItem>
                  </PermissionActionGuard>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
