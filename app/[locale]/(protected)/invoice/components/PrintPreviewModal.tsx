"use client";

import { useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";
import type { DraftInvoiceItem } from "@/lib/api/contract/invoiceApi";

interface PrintPreviewModalProps {
    open: boolean;
    onClose: () => void;
    invoices: DraftInvoiceItem[];
    airlineCode?: string;
    dateRange?: string;
}

const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const PrintPreviewModal = ({
    open,
    onClose,
    invoices,
    airlineCode = "",
    dateRange = "",
}: PrintPreviewModalProps) => {
    const printRef = useRef<HTMLDivElement>(null);

    const totalQuantity = invoices.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const printDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>DRAFT-INVOICE Report</title>
                <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    * { box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 0; margin: 0; font-size: 11px; color: #333; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a56db; padding-bottom: 15px; }
                    .header h1 { font-size: 20px; margin: 0 0 5px 0; color: #1a56db; letter-spacing: 1px; }
                    .header .sub { font-size: 11px; color: #666; margin: 3px 0; }
                    .print-date { text-align: right; font-size: 9px; color: #999; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th { background-color: #1a56db; color: white; font-weight: 600; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
                    th:nth-child(1) { width: 60px; }
                    th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
                    td { border-bottom: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
                    td:nth-child(3), td:nth-child(4), td:nth-child(5) { text-align: right; }
                    tr:nth-child(even) { background-color: #f9fafb; }
                    .total-row td { border-top: 2px solid #1a56db; font-weight: bold; font-size: 12px; padding: 12px 8px; background-color: #eff6ff; }
                    .description { white-space: pre-line; line-height: 1.4; }
                    @media print {
                        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; }
                        thead { display: table-header-group; }
                    }
                </style>
            </head>
            <body>
                <div class="print-date">Printed: ${printDate}</div>
                <div class="header">
                    <h1>DRAFT-INVOICE</h1>
                    <p class="sub"><strong>Customer:</strong> ${airlineCode || "All Airlines"}</p>
                    <p class="sub"><strong>Period:</strong> ${dateRange}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoices.map(inv => `
                            <tr>
                                <td>${inv.item}</td>
                                <td class="description">${inv.descrition}</td>
                                <td>${formatCurrency(inv.quantity)}</td>
                                <td>${formatCurrency(inv.unitPrice)}</td>
                                <td>${formatCurrency(inv.amount)}</td>
                            </tr>
                        `).join("")}
                        <tr class="total-row">
                            <td>TOTAL</td>
                            <td></td>
                            <td>${formatCurrency(totalQuantity)}</td>
                            <td></td>
                            <td>${formatCurrency(totalAmount)}</td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="flex flex-col p-0 max-h-[85vh]" size="md">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="text-lg">Draft Invoice Preview</DialogTitle>
                </DialogHeader>

                {/* A4 Preview */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto bg-slate-200 p-6"
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "transparent transparent",
                    } as React.CSSProperties}
                    onMouseEnter={(e) => {
                        (e.currentTarget.style as unknown as Record<string, string>).scrollbarColor = "rgba(148,163,184,0.6) transparent";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget.style as unknown as Record<string, string>).scrollbarColor = "transparent transparent";
                    }}
                >
                    <div
                        ref={printRef}
                        className="bg-white shadow-xl mx-auto max-w-[210mm] min-h-[297mm] p-10 relative"
                        style={{ fontFamily: "Arial, sans-serif" }}
                    >
                        {/* Document Header */}
                        <div className="text-center border-b-2 border-primary pb-4 mb-6">
                            <h1 className="text-2xl font-bold text-primary tracking-wide">DRAFT-INVOICE</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                <strong>Customer:</strong> {airlineCode || "All Airlines"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                <strong>Period:</strong> {dateRange}
                            </p>
                        </div>

                        {/* Print Date */}
                        <p className="text-right text-xs text-muted-foreground/60 mb-4">
                            Printed: {printDate}
                        </p>

                        {/* Table */}
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-primary text-primary-foreground">
                                    <TableHead className="w-[60px] text-primary-foreground">Item</TableHead>
                                    <TableHead className="text-primary-foreground">Description</TableHead>
                                    <TableHead className="w-[100px] text-right text-primary-foreground">Quantity</TableHead>
                                    <TableHead className="w-[120px] text-right text-primary-foreground">Unit Price</TableHead>
                                    <TableHead className="w-[120px] text-right text-primary-foreground">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((inv, idx) => (
                                    <TableRow key={idx} className={idx % 2 === 1 ? "bg-muted/30" : ""}>
                                        <TableCell className="font-medium">{inv.item}</TableCell>
                                        <TableCell className="whitespace-pre-line text-xs leading-relaxed">
                                            {inv.descrition}
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(inv.quantity)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(inv.unitPrice)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(inv.amount)}</TableCell>
                                    </TableRow>
                                ))}
                                {/* Total */}
                                <TableRow className="bg-primary/5 border-t-2 border-primary">
                                    <TableCell className="font-bold text-sm">TOTAL</TableCell>
                                    <TableCell />
                                    <TableCell className="text-right font-bold">{formatCurrency(totalQuantity)}</TableCell>
                                    <TableCell />
                                    <TableCell className="text-right font-bold text-primary text-sm">
                                        {formatCurrency(totalAmount)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t shrink-0">
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
