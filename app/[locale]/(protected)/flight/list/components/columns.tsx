"use client";
import { ColumnDef } from "@tanstack/react-table";
import type { FlightItem } from "@/lib/api/flight/filghtlist.interface";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleOff, EllipsisVertical, FileCheck, FilePenLine, Paperclip, SquarePen } from "lucide-react";
import clsx from "clsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatForDisplay, formatForDisplayDateTime, formatForValue, formatFromPicker } from "@/lib/utils/formatPicker";

export function getFlightColumns({
  onCreateTHF,
  onEditFlight,
  onAttach,
  onCancel,
  isCancelLoading = false,
}: {
  onCreateTHF?: (flight: FlightItem) => void;
  onEditFlight?: (flight: FlightItem) => void;
  onAttach?: (flight: FlightItem) => void;
  onCancel?: (flight: FlightItem) => void;
  isCancelLoading?: boolean;
}): ColumnDef<FlightItem>[] {
  return [
    // {
    //   accessorKey: "status", header: "-",
    //   cell: ({ row }) => <div className="bg-primary/10 border-l-4 border-l-red-600 px-6 h-20"></div>
    // },
    {
      accessorKey: "arrivalFlightNo", header: "Flight No",
      cell: ({ row }) => <div className="font-medium text-sm whitespace-nowrap">{row.getValue("arrivalFlightNo")}</div>
    },
    {
      id: "station",
      header: "STATION",
      accessorFn: (row) => row?.stationObj?.code ?? "",
      cell: ({ row, getValue }) => <span className={clsx("whitespace-nowrap", row.getValue("datasource") === "adhoc" ? "text-orange-400" : "")}>{getValue() as string || "-"}</span>,
      filterFn: (row, _id, filterValue?: string[]) => {
        if (!filterValue?.length) return true;
        const cell = row.getValue("station") as string;
        return filterValue.includes(cell);
      },
    },
    {
      accessorKey: "airlineObj", header: "airline Code",
      accessorFn: (row) => `${row?.airlineObj?.code ?? ""}`,
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.getValue("datasource") === "adhoc" ? "text-orange-400" : "")}>{row.getValue("airlineObj") || "-"}</span>,
    },
    {
      accessorKey: "acReg", header: "A/C Reg",
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row?.getValue("datasource") === "adhoc" ? "text-orange-400" : "")}>{row.getValue("acReg") || "-"}</span>
    },
    {
      accessorKey: "acType", header: "A/C Type",
      accessorFn: (row) => `${row?.acTypeObj?.code ?? ""}`,
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.getValue("datasource") === "adhoc" ? "text-orange-400" : "")}>{row.getValue("acType") || "-"}</span>,
    },
    {
      id: "ata", header: "ATA(UTC)",
      accessorFn: (row) => `${row?.arrivalDate ? formatForDisplayDateTime(row?.arrivalDate, row?.arrivalAtaTime) : ""}`,
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.getValue("datasource") === "adhoc" ? "text-orange-400" : "")}>{(row.getValue("ata") as string) || "-"}</span>
    },
    {
      id: "std", header: "ATD(UTC)",
      accessorFn: (row) => `${row?.departureDate ? formatForDisplayDateTime(row?.departureDate, row?.departureAtdtime) : ""}`,
      cell: ({ row }) => <span className={clsx("whitespace-nowrap", row.getValue("datasource") === "adhoc" ? "text-orange-400" : "")}>{row.getValue("std") as string || "-"}</span>
    },
    {
      id: "actions",
      header: "Action",
      enableHiding: false,
      cell: ({ row }) => {
        const flight = row.original;
        return (
          <div className="flex items-center gap-2 justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={flight.statusObj?.code === "Cancel" || isCancelLoading}>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-7 h-7 ring-offset-transparent border-default-300 text-default-500"
                  disabled={flight.statusObj?.code === "Cancel" || isCancelLoading}
                >
                  <EllipsisVertical className="w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {/* <DropdownMenuSeparator /> */}
                <DropdownMenuItem
                  disabled={flight.statusObj?.code === "Cancel"}
                  onClick={() => {
                    onEditFlight?.(flight)
                  }}
                >
                  <SquarePen className="w-4 h-4 me-4" /> <p>Edit Flight</p>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={flight.statusObj?.code === "Cancel"}
                  onClick={() => {
                    onCreateTHF?.(flight)
                  }}
                >
                  <FilePenLine className="w-4 h-4 me-4" /> {flight.state === "plan" ? <p>Create THF</p> : <p>Edit THF</p>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="bg-red-700 text-white hover:bg-red-800 focus:bg-red-800 hover:text-white focus:text-white"
                  disabled={flight.statusObj?.code === "Cancel"}
                  onClick={() => onCancel?.(flight)}
                >
                  <CircleOff className="w-4 h-4 me-4" /> <p>Cancel Flight</p>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={!flight.isFiles}
                    variant="outline"
                    size="icon"
                    className="w-7 h-7 ring-offset-transparent border-default-300 text-default-500"
                    color="secondary"
                    onClick={() => onAttach?.(flight)}
                  >
                    <Paperclip className="w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {flight.isFiles ? <p>Attach file</p> : <p>No file attached</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {flight.state !== "plan" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      // disabled={flight.state !== "save"}
                      variant="outline"
                      size="icon"
                      className="w-7 h-7 ring-offset-transparent border-default-300 text-default-500"
                      color="secondary"
                      onClick={() => onAttach?.(flight)}
                    >
                      {flight.state === "save" ? <FileCheck className="w-4" /> : <FilePenLine className="w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {flight.state === "save" ? <p>Save done</p> : <p>Draft Thf</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

          </div>
        );
      },
    },
  ];
}
