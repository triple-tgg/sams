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
    ThfDocumentTable,
} from "./components";
import { PrintPreviewModal } from "./components/PrintPreviewModal";
import { exportPreInvoiceToExcel } from "./components/exportExcel";
import { usePreInvoice, useDraftInvoice } from "@/lib/api/hooks/useInvoice";
import { useThfDocumentListQuery } from "@/lib/api/hooks/useThfDocumentListQuery";
import { buildListDoneOrMappedRequest } from "@/lib/api/lineMaintenances/listDoneOrMapped";
import type { InvoiceRequest } from "@/lib/api/contract/invoiceApi";
import { CURRENCY_VALUES, CurrencyType } from "@/lib/constants/currency";

import { dateTimeUtils } from "@/lib/dayjs";
import { MENU } from "@/lib/permission-codes";
import { useMenuPermission } from "@/hooks/use-menu-permission";

const InvoicePage = () => {
    const perm = useMenuPermission(MENU.INVOICE);
    const t = useTranslations("Menu");

    // Today's date in YYYY-MM-DD format (user's local timezone)
    const today = dateTimeUtils.todayLocal();

    // ── Filter State ────────────────────────────────────────
    const [selectedAirline, setSelectedAirline] = useState<string>("");
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedAircraftTypes, setSelectedAircraftTypes] = useState<string[]>([]);
    const [thfNumber, setThfNumber] = useState<string>("");
    const [selectedCurrency, setSelectedCurrency] = useState<string>(CurrencyType.USD);

    // ── Search State (committed on Search click) ────────────
    const [searchParams, setSearchParams] = useState<InvoiceRequest>({
        dateStart: today,
        dateEnd: today,
        airlineCode: "",
        stationCodeList: [],
        airCraftTypeCodeList: [],
        thfNumber: "",
        currencyType: CurrencyType.USD,
    });
    const [searchTrigger, setSearchTrigger] = useState(0);
    const hasSearched = true;

    // ── Tab State ───────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<InvoiceTabType>("thf-document");
    const [printPreviewOpen, setPrintPreviewOpen] = useState(false);

    // ── API Hooks ───────────────────────────────────────────
    const canFetchInvoice = hasSearched && Boolean(searchParams.airlineCode);

    const {
        data: preInvoiceData,
        isLoading: isLoadingPre,
        isFetching: isFetchingPre,
    } = usePreInvoice(searchParams, canFetchInvoice, searchTrigger);

    const {
        data: draftInvoiceData,
        isLoading: isLoadingDraft,
        isFetching: isFetchingDraft,
    } = useDraftInvoice(searchParams, canFetchInvoice, searchTrigger);

    // THF DOCUMENT tab count – matches page 1 of ThfDocumentTable so React Query deduplicates the request
    const thfCountRequest = useMemo(
        () => buildListDoneOrMappedRequest(searchParams, 1, 50),
        [searchParams]
    );
    const { data: thfData, isFetching: isFetchingThf } = useThfDocumentListQuery(
        thfCountRequest,
        hasSearched,
        searchTrigger
    );

    const rawPreInvoices = useMemo(
        () => (canFetchInvoice ? preInvoiceData?.responseData ?? [] : []),
        [canFetchInvoice, preInvoiceData?.responseData]
    );
    const rawDraftInvoices = useMemo(
        () => (canFetchInvoice ? draftInvoiceData?.responseData ?? [] : []),
        [canFetchInvoice, draftInvoiceData?.responseData]
    );

    const currencyOptions = useMemo(() => {
        const set = new Set<string>(CURRENCY_VALUES);
        for (const item of rawPreInvoices) {
            const c = item.currencyType?.trim().toUpperCase();
            if (c) set.add(c);
        }
        for (const item of rawDraftInvoices) {
            const c = item.currencyType?.trim().toUpperCase();
            if (c) set.add(c);
        }
        return Array.from(set);
    }, [rawPreInvoices, rawDraftInvoices]);

    const activeCurrencyFilter = (selectedCurrency || searchParams.currencyType || CurrencyType.USD).trim().toUpperCase();

    const preInvoices = useMemo(() => {
        if (!activeCurrencyFilter) return rawPreInvoices;
        return rawPreInvoices.filter((inv) => {
            const c = (inv.currencyType ?? "").trim().toUpperCase();
            return !c || c === activeCurrencyFilter;
        });
    }, [rawPreInvoices, activeCurrencyFilter]);

    const draftInvoices = useMemo(() => {
        if (!activeCurrencyFilter) return rawDraftInvoices;
        return rawDraftInvoices.filter((inv) => {
            const c = (inv.currencyType ?? "").trim().toUpperCase();
            return !c || c === activeCurrencyFilter;
        });
    }, [rawDraftInvoices, activeCurrencyFilter]);

    const isSearching = isFetchingPre || isFetchingDraft || isFetchingThf;

    // ── Pagination ──────────────────────────────────────────
    const [page, setPage] = useState(1);
    const perPage = 50;

    const currentData = activeTab === "pre-invoice" ? preInvoices : activeTab === "draft-invoice" ? draftInvoices : [];
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
            "thf-document": thfData?.totalAll ?? 0,
            "pre-invoice": preInvoices.length,
            "draft-invoice": draftInvoices.length,
        }),
        [thfData?.totalAll, preInvoices.length, draftInvoices.length]
    );

    // ── Handlers ────────────────────────────────────────────
    const handleTabChange = (tab: InvoiceTabType) => {
        setActiveTab(tab);
        setPage(1);
        if (tab !== "thf-document" && selectedAirline && !searchParams.airlineCode) {
            setSearchParams((prev) => ({
                ...prev,
                airlineCode: selectedAirline,
                currencyType: selectedCurrency || CurrencyType.USD,
            }));
        }
    };

    const handleSearch = useCallback(() => {
        if (activeTab !== "thf-document" && !selectedAirline) {
            return;
        }
        const request: InvoiceRequest = {
            dateStart: startDate,
            dateEnd: endDate,
            airlineCode: selectedAirline || "",
            stationCodeList: selectedLocations,
            airCraftTypeCodeList: selectedAircraftTypes,
            thfNumber: activeTab === "thf-document" ? thfNumber.trim() : "",
            currencyType: selectedCurrency || CurrencyType.USD,
        };
        setSearchParams(request);
        setSearchTrigger((prev) => prev + 1);
        setPage(1);
    }, [startDate, endDate, selectedAirline, selectedLocations, selectedAircraftTypes, activeTab, thfNumber, selectedCurrency]);

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
            searchParams.dateEnd,
            activeCurrencyFilter
        );
    }, [preInvoices, searchParams, activeCurrencyFilter]);

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
                        {perm.canExport && hasSearched && activeTab === "pre-invoice" && (
                            <Button variant="outline" color="primary" onClick={handleExport} disabled={preInvoices.length === 0}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        )}
                        {perm.canExport && hasSearched && activeTab === "draft-invoice" && (
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
                        allowAllAirline={activeTab === "thf-document"}
                        startDate={startDate}
                        onStartDateChange={setStartDate}
                        endDate={endDate}
                        onEndDateChange={setEndDate}
                        selectedLocations={selectedLocations}
                        onLocationsChange={setSelectedLocations}
                        selectedAircraftTypes={selectedAircraftTypes}
                        onAircraftTypesChange={setSelectedAircraftTypes}
                        thfNumber={thfNumber}
                        onThfNumberChange={setThfNumber}
                        showThfNumber={activeTab === "thf-document"}
                        selectedCurrency={selectedCurrency}
                        onCurrencyChange={(val) => {
                            const nextCurrency = val || CurrencyType.USD;
                            setSelectedCurrency(nextCurrency);
                            setSearchParams((prev) => ({
                                ...prev,
                                currencyType: nextCurrency,
                            }));
                            setPage(1);
                        }}
                        showCurrencyFilter={activeTab === "pre-invoice" || activeTab === "draft-invoice"}
                        currencyOptions={currencyOptions}
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
                                {activeTab === "thf-document" ? (
                                    <ThfDocumentTable
                                        searchParams={searchParams}
                                        hasSearched={hasSearched}
                                        searchTrigger={searchTrigger}
                                    />
                                ) : !searchParams.airlineCode ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center rounded-md border">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">
                                            Please select an Airline to search
                                        </p>
                                        <p className="text-xs text-muted-foreground/70">
                                            Select an Airline from the filter above and click &quot;Search&quot; to view {activeTab === "pre-invoice" ? "Pre-Invoice" : "Draft-Invoice"} records.
                                        </p>
                                    </div>
                                ) : activeTab === "pre-invoice" ? (
                                    <PreInvoiceTable
                                        invoices={paginatedPreInvoices}
                                        isLoading={isLoadingPre}
                                        currencyType={activeCurrencyFilter}
                                    />
                                ) : (
                                    <DraftInvoiceTable
                                        invoices={paginatedDraftInvoices}
                                        isLoading={isLoadingDraft}
                                        currencyType={activeCurrencyFilter}
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
                stationCodes={searchParams?.stationCodeList?.length > 0 ? searchParams.stationCodeList.join(", ") : ""}
                dateRange={searchParams ? `${searchParams.dateStart} to ${searchParams.dateEnd}` : ""}
                currencyType={activeCurrencyFilter}
            />
        </div>
    );
};

export default InvoicePage;