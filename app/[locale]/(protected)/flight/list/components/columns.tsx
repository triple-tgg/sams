"use client";
import { ColumnDef } from "@tanstack/react-table";
import type { FlightItem } from "@/lib/api/flight/filghtlist.interface";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleOff, Paperclip, SquarePen } from "lucide-react";
import clsx from "clsx";

export function getFlightColumns({
  onCreateTHF,
  onAttach,
  onCancel,
  isCancelLoading = false,
}: {
  onCreateTHF?: (flight: FlightItem) => void;
  onAttach?: (flight: FlightItem) => void;
  onCancel?: (flight: FlightItem) => void;
  isCancelLoading?: boolean;
}): ColumnDef<FlightItem>[] {
  return [
    {
      accessorKey: "arrivalFlightNo", header: "Flight No",
      cell: ({ row }) => <div className="font-medium text-sm whitespace-nowrap">{row.getValue("arrivalFlightNo")}</div>
    },
    {
      id: "station",
      header: "STATION",
      accessorFn: (row) => row?.stationObj?.code ?? "",
      cell: ({ getValue }) => <span className="whitespace-nowrap">{(getValue() as string) || "n/a"}</span>,
      filterFn: (row, _id, filterValue?: string[]) => {
        if (!filterValue?.length) return true;
        const cell = row.getValue("station") as string;
        return filterValue.includes(cell);
      },
    },
    {
      accessorKey: "acReg", header: "A/C Reg",
      cell: ({ row }) => <span className="whitespace-nowrap">{row.getValue("acReg") || "n/a"}</span>
    },
    {
      accessorKey: "acType", header: "A/C Type",
      cell: ({ row }) => <span className="whitespace-nowrap">{row.getValue("acType") || "n/a"}</span>
    },
    {
      id: "sta", header: "STA(UTC)",
      accessorFn: (row) => `${row?.arrivalDate ?? ""} ${row?.arrivalStatime ?? ""}`.trim(),
      cell: ({ getValue }) => <span className="whitespace-nowrap">{(getValue() as string) || "n/a"}</span>
    },
    {
      id: "std", header: "STD(UTC)",
      accessorFn: (row) => `${row?.departureDate ?? ""} ${row?.departureStdTime ?? ""}`.trim(),
      cell: ({ getValue }) => <span className="whitespace-nowrap">{(getValue() as string) || "n/a"}</span>
    },
    {
      id: "actions",
      header: "Action",
      enableHiding: false,
      cell: ({ row }) => {
        const flight = row.original;
        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled
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
                  <p>Attach file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={flight.statusObj.code === "Cancel"}
                    variant="outline"
                    size="icon"
                    className="w-7 h-7 ring-offset-transparent border-default-300 text-default-500"
                    color="secondary"
                    onClick={() => onCreateTHF?.(flight)}
                  >
                    <SquarePen className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Create THF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={flight.statusObj.code === "Cancel" ? "default" : "outline"}
                    size="icon"
                    className={clsx("w-7 h-7 ring-offset-transparent border-default-300 text-default-500", flight.statusObj.code === "Cancel" && "text-secondary")}
                    color="destructive"
                    onClick={() => onCancel?.(flight)}
                    disabled={flight.statusObj.code === "Cancel" || isCancelLoading}
                  >
                    <CircleOff className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-destructive text-destructive-foreground">
                  <p>{isCancelLoading ? "Cancelling..." : "Cancel"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];
}
