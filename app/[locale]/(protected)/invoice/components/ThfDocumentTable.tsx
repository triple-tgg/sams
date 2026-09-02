"use client";

import React, { useState, useMemo } from "react";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useThfDocumentListQuery } from "@/lib/api/hooks/useThfDocumentListQuery";
import {
    buildListDoneOrMappedRequest,
    mapDoneOrMappedToFlightItem,
} from "@/lib/api/lineMaintenances/listDoneOrMapped";
import { getFlightColumns } from "../../flight/list/components/columns";
import { Pagination } from "../../flight/list/components/Pagination";
import { useAirlines } from "@/lib/api/hooks/useAirlines";
import { useStations } from "@/lib/api/hooks/useStations";
import { useAircraftTypesFull } from "@/lib/api/hooks/useAircraftTypesFull";
import { useStatus } from "@/lib/api/hooks/useStatus";
import type { InvoiceRequest } from "@/lib/api/contract/invoiceApi";
import { useCancelFlightMutation } from "@/lib/api/hooks/useCancelFlightMutation";
import { PreviewThfModal } from "../../flight/list/components/PreviewThfModal";
import CreateThfModal from "../../flight/thf/create/components/CreateThfModal";

import type { FlightItem } from "@/lib/api/flight/filghtlist.interface";
import clsx from "clsx";
import { routerPushNewTab } from "@/lib/utils/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { PreInvoiceModal } from "./PreInvoiceModal";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign } from "lucide-react";

interface ThfDocumentTableProps {
    searchParams: InvoiceRequest;
    hasSearched: boolean;
}

export const ThfDocumentTable = ({
    searchParams,
    hasSearched,
}: ThfDocumentTableProps) => {
    const [page, setPage] = useState(1);
    const perPage = 50;

    const listRequest = useMemo(
        () => buildListDoneOrMappedRequest(searchParams, page, perPage),
        [searchParams, page]
    );

    const { data, isLoading, isError, error, isFetching } = useThfDocumentListQuery(
        listRequest,
        hasSearched
    );

    // Master data → resolve the ids returned by the endpoint into codes
    const { data: airlinesData } = useAirlines();
    const { data: stationsData } = useStations();
    const { data: aircraftTypes } = useAircraftTypesFull();
    const { data: statusData } = useStatus();

    const lookups = useMemo(
        () => ({
            airlineCodeById: new Map(
                (airlinesData?.responseData ?? []).map((a) => [a.id, a.code] as const)
            ),
            stationCodeById: new Map(
                (stationsData?.responseData ?? []).map((s) => [s.id, s.code] as const)
            ),
            acTypeById: new Map(
                (aircraftTypes ?? []).map(
                    (t) => [t.id, { code: t.code, familyCode: t.familyCode }] as const
                )
            ),
            statusCodeById: new Map(
                (statusData?.responseData ?? []).map((s) => [s.id, s.code] as const)
            ),
        }),
        [airlinesData, stationsData, aircraftTypes, statusData]
    );

    const rows: FlightItem[] = useMemo(
        () => (data?.responseData ?? []).map((item) => mapDoneOrMappedToFlightItem(item, lookups)),
        [data, lookups]
    );
    const total = data?.totalAll ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / perPage));

    // Modals state
    const [createThfOpen, setCreateThfOpen] = useState(false);
    const [selectedFlightThfId, setSelectedFlightThfId] = useState<number | null>(null);

    const [previewThfOpen, setPreviewThfOpen] = useState(false);
    const [selectedPreviewThfId, setSelectedPreviewThfId] = useState<number | null>(null);

    const [preInvoiceOpen, setPreInvoiceOpen] = useState(false);
    const [selectedPreInvoiceIds, setSelectedPreInvoiceIds] = useState<number[]>([]);

    const [rowSelection, setRowSelection] = useState({});

    const cancelFlightMutation = useCancelFlightMutation();

    const columns = useMemo(() => {
        const baseColumns = getFlightColumns({
            hideStatusActions: true,
            // A/C Type shows the family code (e.g. A320) on THF DOCUMENT
            acTypeField: "familyCode",
            onPreviewTHF: (flight) => {
                if (flight.flightInfosId) {
                    setSelectedPreviewThfId(flight.flightInfosId);
                    setPreviewThfOpen(true);
                }
            },
            onPreInvoice: (flight) => {
                if (flight.lineMaintenancesId) {
                    setSelectedPreInvoiceIds([flight.lineMaintenancesId]);
                    setPreInvoiceOpen(true);
                }
            }
        });

        return [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "thfNumber",
                header: "THF NUMBER",
                cell: ({ row }) => (
                    <span className="font-medium text-sm whitespace-nowrap text-slate-700">
                        {row.original.thfNumber || "-"}
                    </span>
                ),
            },
            {
                id: "mappingStatus",
                header: "STATUS",
                cell: ({ row }) => row.original.isMapping ? (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-primary border border-primary/20">
                        MAPPED
                    </span>
                ) : (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-red-700 border border-red-200">
                        NONE
                    </span>
                ),
            },
            ...baseColumns
        ];
    }, []);

    const table = useReactTable({
        data: rows,
        columns,
        state: {
            pagination: { pageIndex: Math.max(0, page - 1), pageSize: perPage },
            rowSelection,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        manualPagination: true,
        pageCount,
        getCoreRowModel: getCoreRowModel(),
    });

    if (!hasSearched) return null;

    if (isLoading || isFetching) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading THF Documents...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 text-red-600 bg-red-50 rounded-md">
                {(error as Error)?.message ?? "Failed to load THF Documents"}
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-md border">
            {Object.keys(rowSelection).length > 0 && (
                <div className="p-3 border-b flex items-center justify-between bg-slate-50">
                    <span className="text-sm font-medium text-slate-700">
                        {Object.keys(rowSelection).length} selected
                    </span>
                    <Button 
                        size="sm" 
                        onClick={() => {
                            const selectedRows = table.getSelectedRowModel().rows;
                            const ids = selectedRows
                                .map(r => r.original.lineMaintenancesId)
                                .filter((id): id is number => id != null);
                            setSelectedPreInvoiceIds(ids);
                            setPreInvoiceOpen(true);
                        }}
                    >
                        <BadgeDollarSign className="w-4 h-4 mr-2" />
                        Pre-Invoice
                    </Button>
                </div>
            )}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((h) => (
                                    <TableHead
                                        key={h.id}
                                        className={h.id === 'actions' ? 'sticky right-0 z-20 bg-default-100 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap px-4 py-3 text-xs' : 'whitespace-nowrap px-4 py-3 text-xs'}
                                    >
                                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const flight = row.original;
                                const isCancelled = flight.statusObj?.code === "Cancel";
                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className={clsx(
                                            isCancelled && "bg-destructive/5 border-l-4 border-l-destructive",
                                            "hover:bg-slate-50"
                                        )}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className={cell.column.id === 'actions' ? 'sticky right-0 z-10 bg-background shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)] px-4 py-3 text-sm' : 'px-4 py-3 text-sm'}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                                    No Results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white rounded-b-md">
                <Pagination
                    pageIndex={table.getState().pagination.pageIndex}
                    pageCount={pageCount}
                    onPageChange={(p) => setPage(p + 1)}
                    onNextPage={() => setPage(p => Math.min(pageCount, p + 1))}
                    onPrevPage={() => setPage(p => Math.max(1, p - 1))}
                />
            </div>

            {createThfOpen && (
                <CreateThfModal
                    open={createThfOpen}
                    onOpenChange={setCreateThfOpen}
                    flightInfosId={selectedFlightThfId}
                    onClose={() => setSelectedFlightThfId(null)}
                />
            )}

            <PreviewThfModal
                open={previewThfOpen}
                onOpenChange={setPreviewThfOpen}
                flightInfosId={selectedPreviewThfId}
            />

            <PreInvoiceModal
                open={preInvoiceOpen}
                onOpenChange={(open) => {
                    setPreInvoiceOpen(open);
                    if (!open) {
                        setRowSelection({});
                    }
                }}
                lineMaintenanceIds={selectedPreInvoiceIds}
            />
        </div>
    );
};
