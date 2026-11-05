"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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

import type { FlightItem, ThfMappingStatus } from "@/lib/api/flight/filghtlist.interface";
import clsx from "clsx";
import { routerPushNewTab } from "@/lib/utils/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { useMapContractsV2 } from "@/lib/api/contract/mappingContractsV2.hooks";
import { RequestRevisionModal } from "./RequestRevisionModal";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, AlertCircle, RotateCcw, RefreshCw, Layers, LockKeyhole, Lock } from "lucide-react";
import { useAllThfRevisions } from "@/lib/store/useThfRevisionStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ReviewUnlockModal } from "./ReviewUnlockModal";

const STATUS_DESCRIPTIONS: Record<ThfMappingStatus, string> = {
    MAPPED: "จับคู่ THF กับ contract แล้ว ยังแก้ไขข้อมูลและดำเนินการออก Pre-Invoice ได้",
    LOCKED: "จับคู่แล้ว ถูกล็อกหลังสร้าง Pre-Invoice ห้ามแก้ไข THF จับคู่ contract ใหม่ หรือออก Pre-Invoice ซ้ำ",
    REVISED: "มีการแก้ไขข้อมูลเรียบร้อย",
    REVISION_REQUESTED: "ต้องการให้ผู้รับผิดชอบในการกรอกข้อมูลTHF กรอกข้อมูลมาใหม่ให้ถูกต้อง",
    NONE: "THF สถานะเป็น done แต่ยังไม่ MAPPED",
};

interface ThfDocumentTableProps {
    searchParams: InvoiceRequest;
    hasSearched: boolean;
    searchTrigger?: number;
}

export const ThfDocumentTable = ({
    searchParams,
    hasSearched,
    searchTrigger = 0,
}: ThfDocumentTableProps) => {
    const [page, setPage] = useState(1);
    const perPage = 50;

    useEffect(() => {
        setPage(1);
    }, [searchParams, searchTrigger]);

    const listRequest = useMemo(
        () => buildListDoneOrMappedRequest(searchParams, page, perPage),
        [searchParams, page]
    );

    const { data, isLoading, isError, error, isFetching } = useThfDocumentListQuery(
        listRequest,
        hasSearched,
        searchTrigger
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
            airlineById: new Map(
                (airlinesData?.responseData ?? []).map(
                    (a) => [a.id, { code: a.code, name: a.name }] as const
                )
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { records, getRevisionForFlight, reMapSuccess } = useAllThfRevisions();
    const cancelFlightMutation = useCancelFlightMutation();
    const mapContractsMutation = useMapContractsV2();

    const isPreInvoiceProcessing = mapContractsMutation.isProcessing;

    const handleCreatePreInvoice = useCallback(async (ids: number[]) => {
        // Block duplicate submissions while a request runs or is being re-checked after a timeout
        if (!ids.length || isPreInvoiceProcessing) return;
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
    }, [mapContractsMutation, reMapSuccess, isPreInvoiceProcessing]);

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
            airlineHeader: "Airline",
            showAirlineFullName: true,
            onRequestRevision: handleRequestRevision,
            onReviewUnlock: handleReviewUnlock,
            getRevisionRecord: (flight) => getRevisionForFlight(flight.flightInfosId, flight.lineMaintenancesId, flight.thfNumber),
            onPreviewTHF: (flight) => {
                if (flight.flightInfosId) {
                    setSelectedPreviewThfId(flight.flightInfosId);
                    setPreviewThfOpen(true);
                }
            },
            isPreInvoiceLoading: isPreInvoiceProcessing,
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
                    const status = rev?.mappingStatus ?? (flight.mappingStatus as ThfMappingStatus) ?? (flight.isMapping ? "MAPPED" : "NONE");

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

                    // REVISED : สีส้ม
                    if (status === "REVISED") {
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-orange-700 border border-orange-300 cursor-help">
                                            <RotateCcw className="h-3 w-3 text-orange-600" />
                                            REVISED
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                        <p className="font-semibold text-orange-400 mb-0.5">REVISED</p>
                                        <p className="text-slate-100">{STATUS_DESCRIPTIONS.REVISED}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    // 2. REVISION_REQUESTED : สีแดง
                    if (status === "REVISION_REQUESTED") {
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-red-700 border border-red-200 cursor-help">
                                            <AlertCircle className="h-3 w-3 text-red-600" />
                                            REVISION REQUESTED
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                        <p className="font-semibold text-red-400 mb-0.5">REVISION REQUESTED</p>
                                        <p className="text-slate-100">{STATUS_DESCRIPTIONS.REVISION_REQUESTED}</p>
                                        {rev?.reason && (
                                            <p className="text-[11px] text-amber-300 mt-1">เหตุผล: {rev.reason}</p>
                                        )}
                                        {rev?.category && (
                                            <p className="text-[10px] text-slate-400 mt-0.5">Category: {rev.category}</p>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            By: {rev?.requestedBy || "Accounting"} ({rev?.requestedAt ? new Date(rev.requestedAt).toLocaleTimeString() : "-"})
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    // 5. LOCKED : สีเทาอ่อน
                    if (status === "LOCKED") {
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-600 border border-slate-300 cursor-help">
                                            <Lock className="h-3 w-3 text-slate-500" />
                                            LOCKED
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                        <p className="font-semibold text-slate-300 mb-0.5">LOCKED</p>
                                        <p className="text-slate-100">{STATUS_DESCRIPTIONS.LOCKED}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    // 4. MAPPED : สี primary
                    if (status === "MAPPED") {
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-primary border border-primary/30 cursor-help">
                                            MAPPED
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                        <p className="font-semibold text-primary mb-0.5">MAPPED</p>
                                        <p className="text-slate-100">{STATUS_DESCRIPTIONS.MAPPED}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    // NONE : สีเทาเข้ม
                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-800 border border-slate-400 cursor-help">
                                        NONE
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-slate-300 mb-0.5">NONE</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.NONE}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
            },
            ...baseColumns
        ];
    }, [getRevisionForFlight, handleRequestRevision, handleReviewUnlock, handleCreatePreInvoice, isPreInvoiceProcessing]);

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
        let locked = 0;
        let pendingUnlock = 0;

        rows.forEach(r => {
            const rev = getRevisionForFlight(r.flightInfosId, r.lineMaintenancesId, r.thfNumber);
            if (rev?.state === "pending_unlock") {
                pendingUnlock++;
            }
            const status: ThfMappingStatus = rev?.mappingStatus ?? (r.mappingStatus as ThfMappingStatus) ?? (r.isMapping ? "MAPPED" : "NONE");
            if (status === "REVISED") revised++;
            else if (status === "REVISION_REQUESTED") revisionReq++;
            else if (status === "LOCKED") locked++;
            else if (status === "MAPPED") mapped++;
            else none++;
        });

        return { total: rows.length, mapped, none, revisionReq, revised, locked, pendingUnlock };
    }, [rows, records, getRevisionForFlight]);

    if (!hasSearched) return null;

    if ((isLoading || isFetching) && !rows.length && !isPreInvoiceProcessing) {
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
            <div className="p-3 border-b bg-slate-50/70 text-xs min-h-[52px]">
                {/* Mobile View (< md): Clean Dashboard Cards Layout */}
                <div className="flex flex-col gap-2.5 md:hidden">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 tracking-tight">STATUS SUMMARY</span>
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                            Total: {summaryStats.total}
                        </span>
                    </div>

                    {/* 5-Column Stat Cards */}
                    <div className="grid grid-cols-5 gap-1.5">
                        {/* 1. None */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-md bg-slate-200 border border-slate-400 text-slate-800 text-center cursor-help min-h-[48px] shadow-2xs">
                                        <span className="text-sm font-bold leading-none mb-1">{summaryStats.none}</span>
                                        <span className="text-[9.5px] font-medium leading-tight text-slate-700">None</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-slate-300 mb-0.5">NONE</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.NONE}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* 2. Revision Requested */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-center cursor-help min-h-[48px] shadow-2xs">
                                        <div className="flex items-center gap-0.5 leading-none mb-1">
                                            <AlertCircle className="h-3 w-3 text-red-600 shrink-0" />
                                            <span className="text-sm font-bold leading-none">{summaryStats.revisionReq}</span>
                                        </div>
                                        <span className="text-[9px] font-medium leading-tight text-red-700">Revision Req.</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-red-400 mb-0.5">REVISION REQUESTED</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.REVISION_REQUESTED}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* 3. Revised */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-md bg-orange-50 border border-orange-300 text-orange-700 text-center cursor-help min-h-[48px] shadow-2xs">
                                        <div className="flex items-center gap-0.5 leading-none mb-1">
                                            <RotateCcw className="h-3 w-3 text-orange-600 shrink-0" />
                                            <span className="text-sm font-bold leading-none">{summaryStats.revised}</span>
                                        </div>
                                        <span className="text-[9.5px] font-medium leading-tight text-orange-700">Revised</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-orange-400 mb-0.5">REVISED</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.REVISED}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* 4. Mapped */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-md bg-primary/10 border border-primary/30 text-primary text-center cursor-help min-h-[48px] shadow-2xs">
                                        <span className="text-sm font-bold leading-none mb-1">{summaryStats.mapped}</span>
                                        <span className="text-[9.5px] font-medium leading-tight text-primary">Mapped</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-primary mb-0.5">MAPPED</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.MAPPED}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* 5. Locked */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center justify-center py-1.5 px-1 rounded-md bg-slate-100 border border-slate-300 text-slate-600 text-center cursor-help min-h-[48px] shadow-2xs">
                                        <div className="flex items-center gap-0.5 leading-none mb-1">
                                            <Lock className="h-3 w-3 text-slate-500 shrink-0" />
                                            <span className="text-sm font-bold leading-none">{summaryStats.locked}</span>
                                        </div>
                                        <span className="text-[9.5px] font-medium leading-tight text-slate-600">Locked</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-slate-300 mb-0.5">LOCKED</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.LOCKED}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Pending Unlock on Mobile */}
                    {summaryStats.pendingUnlock > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center justify-between p-2 rounded-md bg-blue-100 border border-blue-300 text-blue-800 text-xs font-semibold animate-pulse cursor-help">
                                        <span className="flex items-center gap-1.5">
                                            <LockKeyhole className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                            Unlock Requested
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-blue-200 text-blue-900 font-bold text-xs">
                                            {summaryStats.pendingUnlock}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-blue-400 mb-0.5">UNLOCK REQUESTED</p>
                                    <p className="text-slate-100">มีคำขอปลดล็อก THF จากแผนกซ่อมบำรุงที่รอแผนกบัญชีอนุมัติ</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Row Selection on Mobile */}
                    {Object.keys(rowSelection).length > 0 && (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                            <span className="text-xs font-medium text-slate-700">
                                {Object.keys(rowSelection).length} selected
                            </span>
                            <Button
                                size="sm"
                                className="h-8 text-xs flex-1 max-w-[170px]"
                                disabled={isPreInvoiceProcessing}
                                onClick={() => {
                                    const selectedRows = table.getSelectedRowModel().rows;
                                    const ids = selectedRows
                                        .map((r) => r.original.lineMaintenancesId)
                                        .filter((id): id is number => id != null);
                                    handleCreatePreInvoice(ids);
                                }}
                            >
                                <BadgeDollarSign className="w-4 h-4 mr-1.5" />
                                Create Pre-Invoice
                            </Button>
                        </div>
                    )}
                </div>

                {/* Desktop View (>= md): Single Line Bar */}
                <div className="hidden md:flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-700">STATUS SUMMARY:</span>
                        {/* 1. NONE : สีเทาเข้ม */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center rounded-full bg-slate-200 border border-slate-400 px-2.5 py-0.5 font-medium text-slate-800 cursor-help">
                                        None: {summaryStats.none}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-slate-300 mb-0.5">NONE</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.NONE}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* 2. REVISION_REQUESTED : สีแดง */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 font-medium text-red-700 cursor-help">
                                        <AlertCircle className="h-3 w-3 text-red-600" />
                                        Revision Requested: {summaryStats.revisionReq}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-red-400 mb-0.5">REVISION REQUESTED</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.REVISION_REQUESTED}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* 3. REVISED : สีส้ม */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-300 px-2.5 py-0.5 font-medium text-orange-700 cursor-help">
                                        <RotateCcw className="h-3 w-3 text-orange-600" />
                                        Revised: {summaryStats.revised}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-orange-400 mb-0.5">REVISED</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.REVISED}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* 4. MAPPED : สี primary */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 font-medium text-primary cursor-help">
                                        Mapped: {summaryStats.mapped}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-primary mb-0.5">MAPPED</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.MAPPED}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* 5. LOCKED : สีเทาอ่อน */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 font-medium text-slate-600 cursor-help">
                                        <Lock className="h-3 w-3 text-slate-500" />
                                        Locked: {summaryStats.locked}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold text-slate-300 mb-0.5">LOCKED</p>
                                    <p className="text-slate-100">{STATUS_DESCRIPTIONS.LOCKED}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* PENDING UNLOCK (Awaiting Approval) */}
                        {summaryStats.pendingUnlock > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-300 px-2.5 py-0.5 font-semibold text-blue-800 animate-pulse cursor-help">
                                            <LockKeyhole className="h-3 w-3 text-blue-600" />
                                            Unlock Requested: {summaryStats.pendingUnlock}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                        <p className="font-semibold text-blue-400 mb-0.5">UNLOCK REQUESTED</p>
                                        <p className="text-slate-100">มีคำขอปลดล็อก THF จากแผนกซ่อมบำรุงที่รอแผนกบัญชีอนุมัติ</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>

                    {Object.keys(rowSelection).length > 0 && (
                        <div className="flex items-center gap-3 ml-auto">
                            <span className="text-xs font-medium text-slate-700">
                                {Object.keys(rowSelection).length} selected
                            </span>
                            <Button
                                size="sm"
                                className="h-8 text-xs"
                                disabled={isPreInvoiceProcessing}
                                onClick={() => {
                                    const selectedRows = table.getSelectedRowModel().rows;
                                    const ids = selectedRows
                                        .map((r) => r.original.lineMaintenancesId)
                                        .filter((id): id is number => id != null);
                                    handleCreatePreInvoice(ids);
                                }}
                            >
                                <BadgeDollarSign className="w-4 h-4 mr-1.5" />
                                Create Pre-Invoice
                            </Button>
                        </div>
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
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((h) => (
                                    <TableHead
                                        key={h.id}
                                        className={clsx(
                                            "whitespace-nowrap px-4 py-3 text-xs",
                                            h.id === "select" &&
                                                "sticky left-0 z-20 w-[44px] min-w-[44px] max-w-[44px] bg-default-100",
                                            h.id === "thfNumber" &&
                                                "sticky left-[44px] z-20 bg-default-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]",
                                            h.id === "actions" &&
                                                "sticky right-0 z-20 bg-default-100 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                                        )}
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
                                            "group hover:bg-slate-50",
                                            isCancelled && "bg-destructive/5 border-l-4 border-l-destructive"
                                        )}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className={clsx(
                                                    "px-4 py-3 text-sm",
                                                    cell.column.id === "select" &&
                                                        "sticky left-0 z-10 w-[44px] min-w-[44px] max-w-[44px] bg-background group-hover:bg-slate-50 group-data-[state=selected]:bg-muted",
                                                    cell.column.id === "thfNumber" &&
                                                        "sticky left-[44px] z-10 bg-background group-hover:bg-slate-50 group-data-[state=selected]:bg-muted shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]",
                                                    cell.column.id === "actions" &&
                                                        "sticky right-0 z-10 bg-background group-hover:bg-slate-50 group-data-[state=selected]:bg-muted shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                                                )}
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

            {mounted && isPreInvoiceProcessing && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-3 border border-slate-200 dark:border-slate-800 min-w-[300px] max-w-sm mx-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <div className="text-center">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                {mapContractsMutation.isAwaitingServer ? "Pre-Invoice is still processing..." : "Creating Pre-Invoice..."}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {mapContractsMutation.isAwaitingServer
                                    ? "Please wait a moment — the list will refresh automatically."
                                    : "Sending contract mapping request, please wait..."}
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
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
