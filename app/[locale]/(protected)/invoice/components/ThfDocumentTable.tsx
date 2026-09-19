"use client";

import React, { useState, useMemo, useCallback } from "react";
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
import { useMapContractsV2 } from "@/lib/api/contract/mappingContractsV2.hooks";
import { RequestRevisionModal } from "./RequestRevisionModal";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, AlertCircle, RotateCcw, RefreshCw, Layers, LockKeyhole } from "lucide-react";
import { useAllThfRevisions } from "@/lib/store/useThfRevisionStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ReviewUnlockModal } from "./ReviewUnlockModal";

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

    const [revisionModalOpen, setRevisionModalOpen] = useState(false);
    const [selectedRevisionFlight, setSelectedRevisionFlight] = useState<FlightItem | null>(null);

    const [reviewUnlockOpen, setReviewUnlockOpen] = useState(false);
    const [selectedUnlockFlight, setSelectedUnlockFlight] = useState<FlightItem | null>(null);

    const [rowSelection, setRowSelection] = useState({});

    const { getRevisionForFlight, reMapSuccess } = useAllThfRevisions();
    const cancelFlightMutation = useCancelFlightMutation();
    const mapContractsMutation = useMapContractsV2();

    const handleCreatePreInvoice = useCallback(async (ids: number[]) => {
        if (!ids.length) return;
        try {
            await mapContractsMutation.mutateAsync({
                lineMaintenanceIdLiist: ids,
            });
            ids.forEach((id) => {
                reMapSuccess({ lineMaintenanceId: id });
            });
            setRowSelection({});
        } catch {
            // Error toast is handled in useMapContractsV2 onError
        }
    }, [mapContractsMutation, reMapSuccess]);

    const handleRequestRevision = useCallback((flight: FlightItem) => {
        setSelectedRevisionFlight(flight);
        setRevisionModalOpen(true);
    }, []);

    const handleReviewUnlock = useCallback((flight: FlightItem) => {
        setSelectedUnlockFlight(flight);
        setReviewUnlockOpen(true);
    }, []);

    const columns = useMemo(() => {
        const baseColumns = getFlightColumns({
            hideStatusActions: true,
            // A/C Type shows the family code (e.g. A320) on THF DOCUMENT
            acTypeField: "familyCode",
            onRequestRevision: handleRequestRevision,
            onReviewUnlock: handleReviewUnlock,
            getRevisionRecord: (flight) => getRevisionForFlight(flight.flightInfosId, flight.lineMaintenancesId, flight.thfNumber),
            onPreviewTHF: (flight) => {
                if (flight.flightInfosId) {
                    setSelectedPreviewThfId(flight.flightInfosId);
                    setPreviewThfOpen(true);
                }
            },
            onPreInvoice: (flight) => {
                if (flight.lineMaintenancesId) {
                    handleCreatePreInvoice([flight.lineMaintenancesId]);
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
                cell: ({ row }) => {
                    const flight = row.original;
                    const rev = getRevisionForFlight(flight.flightInfosId, flight.lineMaintenancesId, flight.thfNumber);
                    const isRevisionReq = rev?.mappingStatus === "REVISION_REQUESTED";
                    const isPendingUnlock = rev?.state === "pending_unlock";

                    if (isRevisionReq || isPendingUnlock) {
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="inline-block cursor-not-allowed opacity-40">
                                            <Checkbox disabled checked={false} aria-label="Cannot select item" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">
                                        {isPendingUnlock
                                            ? "Cannot be selected: Edit approval pending from Accounting"
                                            : "Cannot be selected while under revision (Revision Requested)"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    return (
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                        />
                    );
                },
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
                cell: ({ row }) => {
                    const flight = row.original;
                    const rev = getRevisionForFlight(flight.flightInfosId, flight.lineMaintenancesId, flight.thfNumber);
                    const isPendingUnlock = rev?.state === "pending_unlock";
                    const status = rev?.mappingStatus ?? (flight.isMapping ? "MAPPED" : "NONE");

                    if (isPendingUnlock) {
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => handleReviewUnlock(flight)}
                                            className="inline-flex items-center gap-1 rounded bg-blue-100 hover:bg-blue-200 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-blue-700 border border-blue-300 animate-pulse cursor-pointer transition-colors"
                                        >
                                            <LockKeyhole className="h-3 w-3 text-blue-600" />
                                            UNLOCK REQUESTED
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                        <p className="font-semibold text-blue-400">Maintenance Requested Edit:</p>
                                        <p className="text-slate-100 mt-0.5">{rev?.unlockReason || "Requested edit permission"}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            By: {rev?.requestedBy || "Engineer"} ({rev?.unlockRequestedAt ? new Date(rev.unlockRequestedAt).toLocaleTimeString() : "-"})
                                        </p>
                                        <p className="text-[10px] text-blue-400 font-semibold mt-1">Click to Review / Approve</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    if (status === "REVISION_REQUESTED") {
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-700 border border-amber-300 animate-pulse cursor-help">
                                            <AlertCircle className="h-3 w-3 text-amber-600" />
                                            REVISION REQUESTED
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                        <p className="font-semibold text-amber-500">Reason for Revision Request:</p>
                                        <p className="text-slate-100 mt-0.5">{rev?.reason || "-"}</p>
                                        {rev?.category && (
                                            <p className="text-[10px] text-slate-400 mt-1">Category: {rev.category}</p>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            By: {rev?.requestedBy || "Accounting"} ({rev?.requestedAt ? new Date(rev.requestedAt).toLocaleTimeString() : "-"})
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    if (status === "REVISED") {
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-purple-700 border border-purple-300 cursor-help">
                                            <RotateCcw className="h-3 w-3 text-purple-600" />
                                            REVISED
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                        <p className="font-semibold text-purple-400">Revision Completed by Maintenance</p>
                                        <p className="text-slate-100 mt-0.5">Document is ready to Create Pre-Invoice for billing and invoice calculation.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    if (status === "LOCKED") {
                        return (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-700 border border-slate-300">
                                LOCKED
                            </span>
                        );
                    }

                    if (status === "MAPPED") {
                        return (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-primary border border-primary/20">
                                MAPPED
                            </span>
                        );
                    }

                    return (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-red-700 border border-red-200">
                            NONE
                        </span>
                    );
                },
            },
            ...baseColumns
        ];
    }, [getRevisionForFlight, handleRequestRevision, handleReviewUnlock]);

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

    // Calculate summary counts across currently displayed rows (must be before any early return)
    const summaryStats = useMemo(() => {
        let mapped = 0;
        let none = 0;
        let revisionReq = 0;
        let revised = 0;
        let pendingUnlock = 0;

        rows.forEach(r => {
            const rev = getRevisionForFlight(r.flightInfosId, r.lineMaintenancesId, r.thfNumber);
            if (rev?.state === "pending_unlock") {
                pendingUnlock++;
            } else {
                const status = rev?.mappingStatus ?? (r.isMapping ? "MAPPED" : "NONE");
                if (status === "REVISION_REQUESTED") revisionReq++;
                else if (status === "REVISED") revised++;
                else if (status === "MAPPED") mapped++;
                else none++;
            }
        });

        return { total: rows.length, mapped, none, revisionReq, revised, pendingUnlock };
    }, [rows, getRevisionForFlight]);

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
            {/* Status Overview Header Bar */}
            <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-700">STATUS SUMMARY:</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-medium text-emerald-700">
                        Mapped: {summaryStats.mapped}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 font-medium text-red-700">
                        None: {summaryStats.none}
                    </span>
                    {summaryStats.revised > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 border border-purple-300 px-2.5 py-0.5 font-semibold text-purple-700 animate-pulse">
                            <RotateCcw className="h-3 w-3" />
                            Revised (Ready for Create Pre-Invoice): {summaryStats.revised}
                        </span>
                    )}
                    {summaryStats.pendingUnlock > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-300 px-2.5 py-0.5 font-semibold text-blue-800 animate-pulse">
                            <LockKeyhole className="h-3 w-3 text-blue-600" />
                            Unlock Requested (Awaiting Approval): {summaryStats.pendingUnlock}
                        </span>
                    )}
                    {summaryStats.revisionReq > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 font-semibold text-amber-800">
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                            Revision Requested: {summaryStats.revisionReq}
                        </span>
                    )}
                </div>
            </div>

            {/* Pending Unlock Alert Banner */}
            {summaryStats.pendingUnlock > 0 && (
                <div className="mx-3 mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 rounded-lg flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 shadow-xs">
                    <div className="flex items-center gap-2 font-medium">
                        <LockKeyhole className="h-4 w-4 text-blue-600 animate-pulse" />
                        <span><strong>{summaryStats.pendingUnlock}</strong> flight(s) have THF edit requests from Maintenance awaiting your approval.</span>
                    </div>
                    <span className="text-[11px] text-blue-700 dark:text-blue-400">Click <strong>UNLOCK REQUESTED</strong> or <strong>... &gt; Review Edit Request</strong> to approve or reject.</span>
                </div>
            )}

            {Object.keys(rowSelection).length > 0 && (
                <div className="p-3 border-b flex items-center justify-between bg-slate-50">
                    <span className="text-sm font-medium text-slate-700">
                        {Object.keys(rowSelection).length} selected
                    </span>
                    <Button 
                        size="sm" 
                        disabled={mapContractsMutation.isPending}
                        onClick={() => {
                            const selectedRows = table.getSelectedRowModel().rows;
                            const ids = selectedRows
                                .map(r => r.original.lineMaintenancesId)
                                .filter((id): id is number => id != null);
                            handleCreatePreInvoice(ids);
                        }}
                    >
                        <BadgeDollarSign className="w-4 h-4 mr-2" />
                        Create Pre-Invoice
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

            {mapContractsMutation.isPending && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-3 border border-slate-200 dark:border-slate-800 min-w-[280px]">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <div className="text-center">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                Creating Pre-Invoice...
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sending contract mapping request, please wait...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <RequestRevisionModal
                open={revisionModalOpen}
                onOpenChange={setRevisionModalOpen}
                flight={selectedRevisionFlight}
                onSuccess={() => setSelectedRevisionFlight(null)}
            />

            <ReviewUnlockModal
                open={reviewUnlockOpen}
                onOpenChange={setReviewUnlockOpen}
                flight={selectedUnlockFlight}
                onSuccess={() => setSelectedUnlockFlight(null)}
            />
        </div>
    );
};
