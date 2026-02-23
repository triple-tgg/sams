"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { PreInvoiceItem } from "@/lib/api/contract/invoiceApi";

interface PreInvoiceTableProps {
    invoices: PreInvoiceItem[];
    isLoading?: boolean;
}

const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatValue = (value: number) => {
    if (value === 0) return "-";
    return value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const PreInvoiceTable = ({
    invoices,
    isLoading = false,
}: PreInvoiceTableProps) => {
    // Calculate grand total
    const grandTotal = invoices.reduce((sum, inv) => sum + inv.totalServicePrice, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading pre-invoice data...</p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        {/* Flight Info */}
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[80px]">Airline</TableHead>
                        <TableHead className="min-w-[80px]">Station</TableHead>
                        <TableHead className="min-w-[130px]">Flight No.</TableHead>
                        <TableHead className="min-w-[100px]">Aircraft</TableHead>
                        <TableHead className="min-w-[90px]">A/C Reg.</TableHead>
                        <TableHead className="min-w-[70px] text-center">Cert</TableHead>
                        {/* Time */}
                        <TableHead className="min-w-[60px]">ATA</TableHead>
                        <TableHead className="min-w-[60px]">ATD</TableHead>
                        <TableHead className="min-w-[70px]">T/R Time</TableHead>
                        {/* Transit Checks - With Cert */}
                        <TableHead className="min-w-[100px]">&lt;2hrs Cert</TableHead>
                        <TableHead className="min-w-[100px]">2-3hrs Cert</TableHead>
                        <TableHead className="min-w-[100px]">3-4hrs Cert</TableHead>
                        <TableHead className="min-w-[100px]">4-5hrs Cert</TableHead>
                        <TableHead className="min-w-[100px]">5-6hrs Cert</TableHead>
                        <TableHead className="min-w-[100px]">6+hrs Cert</TableHead>
                        {/* Transit Checks - Without Cert */}
                        <TableHead className="min-w-[110px]">&lt;2hrs NoCert</TableHead>
                        <TableHead className="min-w-[110px]">2-3hrs NoCert</TableHead>
                        <TableHead className="min-w-[110px]">3-4hrs NoCert</TableHead>
                        <TableHead className="min-w-[110px]">4-5hrs NoCert</TableHead>
                        <TableHead className="min-w-[110px]">5-6hrs NoCert</TableHead>
                        <TableHead className="min-w-[110px]">6+hrs NoCert</TableHead>
                        {/* Other Checks */}
                        <TableHead className="min-w-[90px]">Standby</TableHead>
                        <TableHead className="min-w-[90px]">On Call</TableHead>
                        <TableHead className="min-w-[100px]">Pre-Flight</TableHead>
                        <TableHead className="min-w-[90px]">Weekly</TableHead>
                        <TableHead className="min-w-[90px]">Night Stop</TableHead>
                        {/* Labor */}
                        <TableHead className="min-w-[100px]">Add. LAE</TableHead>
                        <TableHead className="min-w-[100px]">Add. Mech</TableHead>
                        {/* Ground */}
                        <TableHead className="min-w-[90px]">Towing</TableHead>
                        <TableHead className="min-w-[100px]">Marshalling</TableHead>
                        {/* Fluids */}
                        <TableHead className="min-w-[100px]">Engine Oil</TableHead>
                        <TableHead className="min-w-[110px]">Hydraulic</TableHead>
                        {/* Total */}
                        <TableHead className="min-w-[120px] font-semibold">Total (USD)</TableHead>
                        <TableHead className="min-w-[180px]">Remark</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={35} className="text-center py-8 text-muted-foreground">
                                No pre-invoice records found
                            </TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {invoices.map((inv, idx) => (
                                <TableRow key={idx}>
                                    {/* Flight Info */}
                                    <TableCell className="font-medium">{formatDate(inv.activityDate)}</TableCell>
                                    <TableCell>
                                        <span
                                            className="px-1.5 py-0.5 rounded text-xs font-medium"
                                            style={{
                                                backgroundColor: inv.airlineObj?.colorBackground || "#e5e7eb",
                                                color: inv.airlineObj?.colorForeground || "#374151",
                                            }}
                                        >
                                            {inv.airlineObj?.code || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell>{inv.stationCode}</TableCell>
                                    <TableCell className="font-medium">{inv.flightNo}</TableCell>
                                    <TableCell>{inv.aircraftCode}</TableCell>
                                    <TableCell>{inv.acReg || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center">
                                            {inv.flagCert ? (
                                                <CheckCircle2 className="h-5 w-5 text-success" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-muted-foreground/40" />
                                            )}
                                        </div>
                                    </TableCell>
                                    {/* Time */}
                                    <TableCell>{inv.ataTime || "-"}</TableCell>
                                    <TableCell>{inv.atdTime || "-"}</TableCell>
                                    <TableCell>{inv.trTime || "-"}</TableCell>
                                    {/* Transit Checks - With Cert */}
                                    <TableCell>{formatValue(inv.tsChkUnder2hrsCert)}</TableCell>
                                    <TableCell>{formatValue(inv.tsChk2to3hrsCert)}</TableCell>
                                    <TableCell>{formatValue(inv.tsChk3to4hrsCert)}</TableCell>
                                    <TableCell>{formatValue(inv.tsChk4to5hrsCert)}</TableCell>
                                    <TableCell>{formatValue(inv.tsChk5to6hrsCert)}</TableCell>
                                    <TableCell>{formatValue(inv.additionalFee6hrsPlusCert)}</TableCell>
                                    {/* Transit Checks - Without Cert */}
                                    <TableCell>{formatValue(inv.tsChkUnder2hrsNoCert)}</TableCell>
                                    <TableCell>{formatValue(inv.tsChk2to3hrsNoCert)}</TableCell>
                                    <TableCell>{formatValue(inv.tsChk3to4hrsNoCert)}</TableCell>
                                    <TableCell>{formatValue(inv.tsChk4to5hrsNoCert)}</TableCell>
                                    <TableCell>{formatValue(inv.tsChk5to6hrsNoCert)}</TableCell>
                                    <TableCell>{formatValue(inv.additionalFee6hrsPlusNoCert)}</TableCell>
                                    {/* Other Checks */}
                                    <TableCell>{formatValue(inv.standbyPerCheck)}</TableCell>
                                    <TableCell>{formatValue(inv.onCallPerCheck)}</TableCell>
                                    <TableCell>{formatValue(inv.preFlightCheck)}</TableCell>
                                    <TableCell>{formatValue(inv.weeklyCheck)}</TableCell>
                                    <TableCell>{formatValue(inv.nightStop)}</TableCell>
                                    {/* Labor */}
                                    <TableCell>{formatValue(inv.additionalLaeMhHr)}</TableCell>
                                    <TableCell>{formatValue(inv.additionalMechMhHr)}</TableCell>
                                    {/* Ground */}
                                    <TableCell>{formatValue(inv.towingPerService)}</TableCell>
                                    <TableCell>{formatValue(inv.marshalling)}</TableCell>
                                    {/* Fluids */}
                                    <TableCell>{formatValue(inv.engineOilQuad)}</TableCell>
                                    <TableCell>{formatValue(inv.hydraulicFluidQuad)}</TableCell>
                                    {/* Total */}
                                    <TableCell className="font-semibold text-primary">
                                        {formatValue(inv.totalServicePrice)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{inv.remark || "-"}</TableCell>
                                </TableRow>
                            ))}
                            {/* Grand Total Row */}
                            {invoices.length > 0 && (
                                <TableRow className="bg-muted/30 border-t-2">
                                    <TableCell colSpan={33} className="font-bold text-right">
                                        GRAND TOTAL
                                    </TableCell>
                                    <TableCell className="font-bold text-primary">
                                        {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            )}
                        </>
                    )}
                </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
};
