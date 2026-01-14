"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, FileText, Upload, Filter } from "lucide-react";
import { useTranslations } from "next-intl";

import {
    InvoiceTabType,
    PreInvoice,
    DraftInvoice,
    mockPreInvoices,
    mockDraftInvoices,
    InvoiceTabs,
    InvoiceFilters,
    PreInvoiceTable,
    DraftInvoiceTable,
} from "./components";

const InvoicePage = () => {
    const t = useTranslations("Menu");

    // Filter State
    const [selectedAirline, setSelectedAirline] = useState<string>("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Check if all required filters are filled
    const filtersComplete = selectedAirline !== "" && startDate !== "" && endDate !== "";

    // State
    const [activeTab, setActiveTab] = useState<InvoiceTabType>("pre-invoice");
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Get data based on active tab (only when searched)
    const currentData = activeTab === "pre-invoice" ? mockPreInvoices : mockDraftInvoices;
    const totalAll = filtersComplete ? currentData.length : 0;
    const totalPages = Math.ceil(totalAll / perPage);

    // Paginated data
    const paginatedPreInvoices = useMemo(() => {
        if (!filtersComplete || activeTab !== "pre-invoice") return [];
        return mockPreInvoices.slice((page - 1) * perPage, page * perPage);
    }, [activeTab, page, filtersComplete]);

    const paginatedDraftInvoices = useMemo(() => {
        if (!filtersComplete || activeTab !== "draft-invoice") return [];
        return mockDraftInvoices.slice((page - 1) * perPage, page * perPage);
    }, [activeTab, page, filtersComplete]);

    // Tab counts
    const tabCounts = useMemo(
        () => ({
            "pre-invoice": filtersComplete ? mockPreInvoices.length : 0,
            "draft-invoice": filtersComplete ? mockDraftInvoices.length : 0,
        }),
        [filtersComplete]
    );

    const handleTabChange = (tab: InvoiceTabType) => {
        setActiveTab(tab);
        setPage(1);
    };

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    const handleViewPreInvoice = (invoice: PreInvoice) => {
        console.log("View pre-invoice:", invoice);
    };

    const handleEditPreInvoice = (invoice: PreInvoice) => {
        console.log("Edit pre-invoice:", invoice);
    };

    const handleDeletePreInvoice = (invoice: PreInvoice) => {
        console.log("Delete pre-invoice:", invoice);
    };

    const handleViewDraftInvoice = (invoice: DraftInvoice) => {
        console.log("View draft invoice:", invoice);
    };

    const handleEditDraftInvoice = (invoice: DraftInvoice) => {
        console.log("Edit draft invoice:", invoice);
    };

    const handleDeleteDraftInvoice = (invoice: DraftInvoice) => {
        console.log("Delete draft invoice:", invoice);
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
                        <Button variant="outline" color="success">
                            <FileText className="h-4 w-4 mr-2" />
                            Template
                        </Button>
                        <Button variant="outline" color="primary">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                        </Button>
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
                    />

                    {/* Show content only when all filters are filled */}
                    {filtersComplete ? (
                        <>
                            {/* Tabs */}
                            <InvoiceTabs
                                activeTab={activeTab}
                                onTabChange={handleTabChange}
                                tabCounts={tabCounts}
                            />

                            {/* Table based on active tab */}
                            <div className="mt-4">
                                {activeTab === "pre-invoice" ? (
                                    <PreInvoiceTable
                                        invoices={paginatedPreInvoices}
                                        onView={handleViewPreInvoice}
                                        onEdit={handleEditPreInvoice}
                                        onDelete={handleDeletePreInvoice}
                                    />
                                ) : (
                                    <DraftInvoiceTable
                                        invoices={paginatedDraftInvoices}
                                        onView={handleViewDraftInvoice}
                                        onEdit={handleEditDraftInvoice}
                                        onDelete={handleDeleteDraftInvoice}
                                    />
                                )}
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-6 px-2">
                                <div className="text-sm text-muted-foreground">
                                    Showing {currentData.length > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
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
                        </>
                    ) : (
                        /* Empty state - show message when no filter selected */
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Filter className="h-16 w-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                Please Select Filter Criteria
                            </h3>
                            <p className="text-sm text-muted-foreground/70 max-w-md">
                                Select a Customer Airline and Date Range (Start Date - End Date) to view invoice records.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default InvoicePage;