"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import { useTranslations } from "next-intl";

import {
    InvoiceTabType,
    InvoiceTabs,
    InvoiceFilters,
    PreInvoiceTable,
    DraftInvoiceTable,
} from "./components";
import { PrintPreviewModal } from "./components/PrintPreviewModal";
import { exportPreInvoiceToExcel } from "./components/exportExcel";
import { usePreInvoice, useDraftInvoice } from "@/lib/api/hooks/useInvoice";
import type { InvoiceRequest } from "@/lib/api/contract/invoiceApi";

const InvoicePage = () => {
    const t = useTranslations("Menu");

    // ── Filter State ────────────────────────────────────────
    const [selectedAirline, setSelectedAirline] = useState<string>("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedAircraftTypes, setSelectedAircraftTypes] = useState<string[]>([]);

    // ── Search State (committed on Search click) ────────────
    const [searchParams, setSearchParams] = useState<InvoiceRequest | null>(null);
    const hasSearched = searchParams !== null;

    // ── Tab State ───────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<InvoiceTabType>("pre-invoice");
    const [printPreviewOpen, setPrintPreviewOpen] = useState(false);

    // ── API Hooks ───────────────────────────────────────────
    const {
        data: preInvoiceData,
        isLoading: isLoadingPre,
        isFetching: isFetchingPre,
    } = usePreInvoice(searchParams!, hasSearched);

    const {
        data: draftInvoiceData,
        isLoading: isLoadingDraft,
        isFetching: isFetchingDraft,
    } = useDraftInvoice(searchParams!, hasSearched);

    const preInvoices = preInvoiceData?.responseData ?? [];
    const draftInvoices = draftInvoiceData?.responseData ?? [];
    const isSearching = isFetchingPre || isFetchingDraft;

    // ── Pagination ──────────────────────────────────────────
    const [page, setPage] = useState(1);
    const perPage = 50;

    const currentData = activeTab === "pre-invoice" ? preInvoices : draftInvoices;
    const totalAll = currentData.length;
    const totalPages = Math.ceil(totalAll / perPage);

    const paginatedPreInvoices = useMemo(() => {
        if (activeTab !== "pre-invoice") return [];
        return preInvoices.slice((page - 1) * perPage, page * perPage);
    }, [activeTab, page, preInvoices]);

    const paginatedDraftInvoices = useMemo(() => {
        if (activeTab !== "draft-invoice") return [];
        return draftInvoices.slice((page - 1) * perPage, page * perPage);
    }, [activeTab, page, draftInvoices]);

    // ── Tab Counts ──────────────────────────────────────────
    const tabCounts = useMemo(
        () => ({
            "pre-invoice": preInvoices.length,
            "draft-invoice": draftInvoices.length,
        }),
        [preInvoices.length, draftInvoices.length]
    );

    // ── Handlers ────────────────────────────────────────────
    const handleTabChange = (tab: InvoiceTabType) => {
        setActiveTab(tab);
        setPage(1);
    };

    const handleSearch = useCallback(() => {
        const request: InvoiceRequest = {
            dateStart: startDate,
            dateEnd: endDate,
            airlineCode: selectedAirline || "",
            stationCodeList: selectedLocations,
            airCraftTypeCodeList: selectedAircraftTypes,
        };
        setSearchParams(request);
        setPage(1);
    }, [startDate, endDate, selectedAirline, selectedLocations, selectedAircraftTypes]);

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    // ── Export (PRE-INVOICE only) ─────────────────────────────
    const handleExport = useCallback(() => {
        if (preInvoices.length === 0 || !searchParams) return;
        exportPreInvoiceToExcel(
            preInvoices,
            searchParams.airlineCode,
            searchParams.dateStart,
            searchParams.dateEnd
        );
    }, [preInvoices, searchParams]);

    // ── Print Preview (DRAFT-INVOICE only) ──────────────────
    const handleOpenPrintPreview = () => {
        setPrintPreviewOpen(true);
    };

    return (
        <div>
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle>{t("invoice")}</CardTitle>
                    <CardDescription>
                        Manage pre-invoices and draft invoices for airline maintenance services.
                    </CardDescription>
                    <div className="flex items-center gap-2 ml-auto">
                        {hasSearched && activeTab === "pre-invoice" && (
                            <Button variant="outline" color="primary" onClick={handleExport} disabled={preInvoices.length === 0}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        )}
                        {hasSearched && activeTab === "draft-invoice" && (
                            <Button variant="outline" color="info" onClick={handleOpenPrintPreview} disabled={draftInvoices.length === 0}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <InvoiceFilters
                        selectedAirline={selectedAirline}
                        onAirlineChange={setSelectedAirline}
                        startDate={startDate}
                        onStartDateChange={setStartDate}
                        endDate={endDate}
                        onEndDateChange={setEndDate}
                        selectedLocations={selectedLocations}
                        onLocationsChange={setSelectedLocations}
                        selectedAircraftTypes={selectedAircraftTypes}
                        onAircraftTypesChange={setSelectedAircraftTypes}
                        onSearch={handleSearch}
                        isSearching={isSearching}
                    />

                    {/* Show content when user has searched */}
                    {hasSearched ? (
                        <>
                            {/* Tabs */}
                            <InvoiceTabs
                                activeTab={activeTab}
                                onTabChange={handleTabChange}
                                tabCounts={tabCounts}
                            />

                            {/* Table based on active tab */}
                            <div id="invoice-table-container" className="mt-4">
                                {activeTab === "pre-invoice" ? (
                                    <PreInvoiceTable
                                        invoices={paginatedPreInvoices}
                                        isLoading={isLoadingPre}
                                    />
                                ) : (
                                    <DraftInvoiceTable
                                        invoices={paginatedDraftInvoices}
                                        isLoading={isLoadingDraft}
                                    />
                                )}
                            </div>

                            {/* Pagination */}
                            {totalAll > perPage && (
                                <div className="flex items-center justify-between mt-6 px-2">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {totalAll > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
                                        {Math.min(page * perPage, totalAll)} of {totalAll} entries
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={handlePrevPage}
                                            disabled={page <= 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
                                            (pageNum) => (
                                                <Button
                                                    key={pageNum}
                                                    variant={page === pageNum ? "default" : "outline"}
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            )
                                        )}
                                        {totalPages > 5 && (
                                            <>
                                                <span className="px-2 text-muted-foreground">...</span>
                                                <Button
                                                    variant={page === totalPages ? "default" : "outline"}
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setPage(totalPages)}
                                                >
                                                    {totalPages}
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={handleNextPage}
                                            disabled={page >= totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <svg className="h-16 w-16 text-muted-foreground/30 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                            </svg>
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                Select Date Range and Search
                            </h3>
                            <p className="text-sm text-muted-foreground/70 max-w-md">
                                Select a Date Range (Start Date - End Date) and click &quot;Search&quot; to view invoice records.
                                Airline, Location, and Aircraft filters are optional.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Print Preview Modal for Draft-Invoice */}
            <PrintPreviewModal
                open={printPreviewOpen}
                onClose={() => setPrintPreviewOpen(false)}
                invoices={draftInvoices}
                airlineCode={searchParams?.airlineCode}
                dateRange={searchParams ? `${searchParams.dateStart} to ${searchParams.dateEnd}` : ""}
            />
        </div>
    );
};

export default InvoicePage;