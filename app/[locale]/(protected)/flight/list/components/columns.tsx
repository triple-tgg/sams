"use client";
import { ColumnDef } from "@tanstack/react-table";
import type { FlightItem } from "@/lib/api/flight/filghtlist.interface";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleOff, MoreHorizontal, FileCheck, FilePenLine, Paperclip, SquarePen, Eye, Mail, BadgeDollarSign, AlertTriangle, Lock, LockKeyhole, RotateCcw, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatUtcToLocalDisplay } from "@/lib/utils/flightDatetime";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import type { ThfRevisionRecord } from "@/lib/store/useThfRevisionStore";

export function getFlightColumns({
  onCreateTHF,
  onEditFlight,
  onPreviewTHF,
  onAttach,
  onCancel,
  onSendEmail,
  isCancelLoading = false,
  hideStatusActions = false,
  onPreInvoice,
  acTypeField = "code",
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
  onSendEmail?: (flight: FlightItem) => void;
  isCancelLoading?: boolean;
  hideStatusActions?: boolean;
  onPreInvoice?: (flight: FlightItem) => void;
  /** Which field of acTypeObj the "A/C Type" column shows */
  acTypeField?: "code" | "familyCode";
  onRequestRevision?: (flight: FlightItem) => void;
  onRequestUnlock?: (flight: FlightItem) => void;
  onReviewUnlock?: (flight: FlightItem) => void;
  getRevisionRecord?: (flight: FlightItem) => ThfRevisionRecord | undefined;
}): ColumnDef<FlightItem>[] {
  return [
    // {
    //   accessorKey: "status", header: "-",
    //   cell: ({ row }) => <div className="bg-primary/10 border-l-4 border-l-red-600 px-6 h-20"></div>
    {
      accessorKey: "arrivalFlightNo", header: "Flight No",
      cell: ({ row }) => <div className={clsx("font-medium text-sm whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{row.getValue("arrivalFlightNo")}</div>
    },
    {
      id: "station",
      header: "STATION",
      accessorFn: (row) => row?.stationObj?.code ?? "",
      cell: ({ row, getValue }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{getValue() as string || "-"}</span>,
      filterFn: (row, _id, filterValue?: string[]) => {
        if (!filterValue?.length) return true;
        const cell = row.getValue("station") as string;
        return filterValue.includes(cell);
      },
    },
    {
      accessorKey: "airlineObj", header: "airline Code",
      accessorFn: (row) => `${row?.airlineObj?.code ?? ""}`,
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{row.getValue("airlineObj") || "-"}</span>,
    },
    {
      accessorKey: "acReg", header: "A/C Reg",
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{row.getValue("acReg") || "-"}</span>
    },
    {
      accessorKey: "acType", header: "A/C Type",
      accessorFn: (row) =>
        `${(acTypeField === "familyCode" ? row?.acTypeObj?.familyCode : row?.acTypeObj?.code) ?? ""}`,
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{row.getValue("acType") || "-"}</span>,
    },
    {
      id: "sta", header: "STA(Local)",
      accessorFn: (row) => formatUtcToLocalDisplay(row?.arrivalStaDate),
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{(row.getValue("sta") as string) || "-"}</span>
    },
    {
      id: "std", header: "STD(Local)",
      accessorFn: (row) => formatUtcToLocalDisplay(row?.departureStdDate),
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{(row.getValue("std") as string) || "-"}</span>
    },
    {
      id: "ata", header: "ATA(Local)",
      accessorFn: (row) => formatUtcToLocalDisplay(row?.arrivalAtaDate),
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{(row.getValue("ata") as string) || "-"}</span>
    },
    {
      id: "atd", header: "ATD(Local)",
      accessorFn: (row) => formatUtcToLocalDisplay(row?.departureAtdDate),
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{row.getValue("atd") as string || "-"}</span>
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
        const isLockedFromEdit = (flight.state === "save" || flight.state === "submitted") && !isRevisionRequired && !isPendingUnlock;

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Revision Required Badge for Flight List */}
            {!hideStatusActions && isRevisionRequired && (
              <TooltipProvider>
                <Tooltip>
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
            )}

            {!hideStatusActions && flight.state !== "plan" && !isRevisionRequired && !isPendingUnlock && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      color="secondary"
                      className="h-8 w-8 text-muted-foreground cursor-default"
                      tabIndex={-1}
                      disabled
                    >
                      <FileCheck className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {(flight.state === "save" || flight.state === "submitted")
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
                  <PermissionActionGuard menuCode="FLIGHT" action="canEdit">
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
                  <PermissionActionGuard menuCode="THF" action={flight.state === "plan" ? "canCreate" : "canEdit"}>
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

                {/* Engineer Request Edit (when THF is already saved/done) */}
                {!hideStatusActions && (flight.state === "save" || flight.state === "submitted") && !isRevisionRequired && !isPendingUnlock && onRequestUnlock && (
                  <DropdownMenuItem
                    className="cursor-pointer text-blue-600 focus:text-blue-600"
                    disabled={flight.statusObj?.code === "Cancel"}
                    onSelect={() => onRequestUnlock(flight)}
                    onClick={() => onRequestUnlock(flight)}
                  >
                    <LockKeyhole className="h-4 w-4 mr-2" />
                    Request Edit
                  </DropdownMenuItem>
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
                  <PermissionActionGuard menuCode="THF" action="canView">
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
                    disabled={flight.statusObj?.code === "Cancel" || isRevisionRequired || isPendingUnlock}
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
                  <PermissionActionGuard menuCode="FLIGHT" action="canDelete">
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
