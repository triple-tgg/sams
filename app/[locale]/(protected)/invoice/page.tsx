"use client";

import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, FileText, Upload, Filter, Printer } from "lucide-react";
import { useTranslations } from "next-intl";

import {
    InvoiceTabType,
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



    // Print function - prints only the table with title (A4 optimized)
    const handlePrint = () => {
        const printContent = document.getElementById('invoice-table-container');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const title = activeTab === 'pre-invoice' ? 'PRE-INVOICE Report' : 'DRAFT-INVOICE Report';
        const dateRange = startDate && endDate ? `${startDate} to ${endDate}` : '';
        const airline = selectedAirline || '';
        const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        // Different styles for pre-invoice (landscape, smaller font) vs draft-invoice (portrait)
        const isPreInvoice = activeTab === 'pre-invoice';
        const pageOrientation = isPreInvoice ? 'landscape' : 'portrait';
        const fontSize = isPreInvoice ? '7px' : '11px';
        const cellPadding = isPreInvoice ? '3px 4px' : '8px';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    @page {
                        size: A4 ${pageOrientation};
                        margin: 10mm;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 10px;
                        margin: 0;
                        font-size: ${fontSize};
                    }
                    h1 { 
                        text-align: center; 
                        margin-bottom: 5px;
                        font-size: 16px;
                    }
                    .info { 
                        text-align: center; 
                        margin-bottom: 10px; 
                        color: #666;
                        font-size: 10px;
                    }
                    .print-date {
                        text-align: right;
                        font-size: 9px;
                        color: #999;
                        margin-bottom: 10px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        font-size: ${fontSize};
                        table-layout: auto;
                    }
                    th, td { 
                        border: 1px solid #ccc; 
                        padding: ${cellPadding}; 
                        text-align: left;
                        word-wrap: break-word;
                        vertical-align: top;
                    }
                    th { 
                        background-color: #e8e8e8; 
                        font-weight: bold;
                        font-size: ${isPreInvoice ? '6px' : '10px'};
                        white-space: nowrap;
                    }
                    tr:nth-child(even) { 
                        background-color: #f9f9f9; 
                    }
                    tr { 
                        page-break-inside: avoid;
                    }
                    thead {
                        display: table-header-group;
                    }
                    tbody {
                        display: table-row-group;
                    }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    .font-medium { font-weight: 500; }
                    .font-semibold { font-weight: 600; }
                    
                    /* Hide scrollbar wrapper elements */
                    [data-radix-scroll-area-viewport] {
                        overflow: visible !important;
                    }
                    
                    @media print {
                        body { 
                            print-color-adjust: exact; 
                            -webkit-print-color-adjust: exact; 
                        }
                        table {
                            page-break-inside: auto;
                        }
                        tr {
                            page-break-inside: avoid;
                            page-break-after: auto;
                        }
                        thead {
                            display: table-header-group;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-date">Printed: ${printDate}</div>
                <h1>${title}</h1>
                <div class="info">
                    <p><strong>Customer:</strong> ${airline} | <strong>Period:</strong> ${dateRange}</p>
                </div>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
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
                        <Button variant="outline" color="info" onClick={handlePrint} disabled={!filtersComplete}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
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
                            <div id="invoice-table-container" className="mt-4">
                                {activeTab === "pre-invoice" ? (
                                    <PreInvoiceTable
                                        invoices={paginatedPreInvoices}
                                    />
                                ) : (
                                    <DraftInvoiceTable
                                        invoices={paginatedDraftInvoices}
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