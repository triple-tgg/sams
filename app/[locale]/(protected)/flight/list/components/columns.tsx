"use client";
import { ColumnDef } from "@tanstack/react-table";
import type { FlightItem } from "@/lib/api/flight/filghtlist.interface";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleOff, MoreHorizontal, FileCheck, FilePenLine, Paperclip, SquarePen, Eye, Mail } from "lucide-react";
import clsx from "clsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatForDisplay, formatForDisplayDateTime, formatForValue, formatFromPicker } from "@/lib/utils/formatPicker";

export function getFlightColumns({
  onCreateTHF,
  onEditFlight,
  onAttach,
  onCancel,
  onSendEmail,
  isCancelLoading = false,
}: {
  onCreateTHF?: (flight: FlightItem) => void;
  onEditFlight?: (flight: FlightItem) => void;
  onAttach?: (filePath: string) => void;
  onCancel?: (flight: FlightItem) => void;
  onSendEmail?: (flight: FlightItem) => void;
  isCancelLoading?: boolean;
}): ColumnDef<FlightItem>[] {
  return [
    // {
    //   accessorKey: "status", header: "-",
    //   cell: ({ row }) => <div className="bg-primary/10 border-l-4 border-l-red-600 px-6 h-20"></div>
    // },
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
      accessorFn: (row) => `${row?.acTypeObj?.code ?? ""}`,
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{row.getValue("acType") || "-"}</span>,
    },
    {
      id: "ata", header: "ATA(UTC)",
      accessorFn: (row) => `${row?.arrivalDate ? formatForDisplayDateTime(row?.arrivalDate, row?.arrivalAtaTime) : ""}`,
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{(row.getValue("ata") as string) || "-"}</span>
    },
    {
      id: "atd", header: "ATD(UTC)",
      accessorFn: (row) => `${row?.departureDate ? formatForDisplayDateTime(row?.departureDate, row?.departureAtdtime) : ""}`,
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.original.datasource === "adhoc" ? "text-orange-400" : "")}>{row.getValue("atd") as string || "-"}</span>
    },
    {
      id: "actions",
      header: "Action",
      enableHiding: false,
      cell: ({ row }) => {
        const flight = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            {flight.state === "save" && (
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
            {flight.state !== "plan" && (
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
                    {flight.state === "save"
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
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={flight.statusObj?.code === "Cancel"}
                  onClick={() => onEditFlight?.(flight)}
                >
                  <SquarePen className="h-4 w-4 mr-2" />
                  Edit Flight
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={flight.statusObj?.code === "Cancel"}
                  onClick={() => onCreateTHF?.(flight)}
                >
                  <FilePenLine className="h-4 w-4 mr-2" />
                  {flight.state === "plan" ? "Create THF" : "Edit THF"}
                </DropdownMenuItem>
                {flight.isFiles && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => flight.filePath && onAttach?.(flight.filePath)}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    View Attachment
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  disabled={flight.statusObj?.code === "Cancel"}
                  onClick={() => onCancel?.(flight)}
                >
                  <CircleOff className="h-4 w-4 mr-2" />
                  Cancel Flight
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
