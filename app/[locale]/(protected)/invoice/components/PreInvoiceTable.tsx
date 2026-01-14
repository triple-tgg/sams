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
import { PreInvoice } from "./types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface PreInvoiceTableProps {
    invoices: PreInvoice[];
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatCurrency = (value: number) => {
    if (value === 0) return "-";
    return `$${value.toLocaleString()}`;
};

export const PreInvoiceTable = ({
    invoices,
}: PreInvoiceTableProps) => {
    return (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        {/* Flight Info */}
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[80px]">Station</TableHead>
                        <TableHead className="min-w-[100px]">Flight No.</TableHead>
                        <TableHead className="min-w-[120px]">Aircraft Type</TableHead>
                        <TableHead className="min-w-[100px]">A/C Reg.</TableHead>
                        <TableHead className="min-w-[80px] text-center">Cert 145</TableHead>
                        {/* Time */}
                        <TableHead className="min-w-[70px]">ATA</TableHead>
                        <TableHead className="min-w-[70px]">ATD</TableHead>
                        <TableHead className="min-w-[100px]">T/R Time (mins)</TableHead>
                        {/* Transit Checks */}
                        <TableHead className="min-w-[150px]">T/S CHK &lt;2hrs w/ Cert</TableHead>
                        <TableHead className="min-w-[180px]">T/S CHK ≥2 &lt;3hrs w/o Cert</TableHead>
                        <TableHead className="min-w-[180px]">T/S CHK ≥3 &lt;4hrs w/o Cert</TableHead>
                        <TableHead className="min-w-[160px]">T/S CHK ≤2hrs w/o Cert</TableHead>
                        <TableHead className="min-w-[160px]">T/S CHK &gt;2hrs w/o Cert</TableHead>
                        {/* Routine Checks */}
                        <TableHead className="min-w-[120px]">Stand-by</TableHead>
                        <TableHead className="min-w-[130px]">Pre-Flight Check</TableHead>
                        <TableHead className="min-w-[120px]">Weekly Check</TableHead>
                        {/* Labor */}
                        <TableHead className="min-w-[140px]">Add. LAE MH/Hr</TableHead>
                        <TableHead className="min-w-[150px]">Add. Mech MH/Hr</TableHead>
                        {/* Wheel Services */}
                        <TableHead className="min-w-[180px]">LH/RH Nose Wheel RPL</TableHead>
                        <TableHead className="min-w-[180px]">LH&RH Nose Wheel RPL</TableHead>
                        <TableHead className="min-w-[140px]">Main Wheel RPL</TableHead>
                        <TableHead className="min-w-[180px]">2 MW RPL (No Repo)</TableHead>
                        <TableHead className="min-w-[180px]">2 MW RPL (Repo)</TableHead>
                        <TableHead className="min-w-[120px]">Brake RPL</TableHead>
                        {/* Ground Services */}
                        <TableHead className="min-w-[100px]">Towing</TableHead>
                        <TableHead className="min-w-[130px]">Storage Fee</TableHead>
                        <TableHead className="min-w-[150px]">Storage Handling</TableHead>
                        {/* Fluids/N2 */}
                        <TableHead className="min-w-[120px]">Engine Oil</TableHead>
                        <TableHead className="min-w-[130px]">Hydraulic Fluid</TableHead>
                        <TableHead className="min-w-[120px]">Maint. Step</TableHead>
                        <TableHead className="min-w-[140px]">Low Pressure N2</TableHead>
                        <TableHead className="min-w-[140px]">High Pressure N2</TableHead>
                        {/* Other */}
                        <TableHead className="min-w-[160px]">Defect Rect. Tools</TableHead>
                        <TableHead className="min-w-[150px]">Material Handling</TableHead>
                        <TableHead className="min-w-[100px]">Marshalling</TableHead>
                        {/* Total */}
                        <TableHead className="min-w-[140px] font-semibold">Total (USD)</TableHead>
                        <TableHead className="min-w-[200px]">Remark</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={40} className="text-center py-8 text-muted-foreground">
                                No pre-invoice records found
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                {/* Flight Info */}
                                <TableCell className="font-medium">{formatDate(invoice.date)}</TableCell>
                                <TableCell>{invoice.station}</TableCell>
                                <TableCell className="font-medium">{invoice.flightNo}</TableCell>
                                <TableCell>{invoice.aircraftType}</TableCell>
                                <TableCell>{invoice.acReg}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center">
                                        {invoice.cert145 ? (
                                            <CheckCircle2 className="h-5 w-5 text-success" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-muted-foreground/40" />
                                        )}
                                    </div>
                                </TableCell>
                                {/* Time */}
                                <TableCell>{invoice.ata}</TableCell>
                                <TableCell>{invoice.atd}</TableCell>
                                <TableCell>{invoice.trTimeMins}</TableCell>
                                {/* Transit Checks */}
                                <TableCell>{formatCurrency(invoice.tsChkUnder2hrsCert)}</TableCell>
                                <TableCell>{formatCurrency(invoice.tsChk2to3hrsNoCert)}</TableCell>
                                <TableCell>{formatCurrency(invoice.tsChk3to4hrsNoCert)}</TableCell>
                                <TableCell>{formatCurrency(invoice.tsChkUnder2hrsNoCert)}</TableCell>
                                <TableCell>{formatCurrency(invoice.tsChkOver2hrsNoCert)}</TableCell>
                                {/* Routine Checks */}
                                <TableCell>{formatCurrency(invoice.standbyPerCheck)}</TableCell>
                                <TableCell>{formatCurrency(invoice.preFlightCheck)}</TableCell>
                                <TableCell>{formatCurrency(invoice.weeklyCheck)}</TableCell>
                                {/* Labor */}
                                <TableCell>{formatCurrency(invoice.additionalLaeMhHr)}</TableCell>
                                <TableCell>{formatCurrency(invoice.additionalMechMhHr)}</TableCell>
                                {/* Wheel Services */}
                                <TableCell>{formatCurrency(invoice.lhOrRhNoseWheelRpl)}</TableCell>
                                <TableCell>{formatCurrency(invoice.lhAndRhNoseWheelRpl)}</TableCell>
                                <TableCell>{formatCurrency(invoice.mainWheelRpl)}</TableCell>
                                <TableCell>{formatCurrency(invoice.twoMwRplNoReposition)}</TableCell>
                                <TableCell>{formatCurrency(invoice.twoMwRplReposition)}</TableCell>
                                <TableCell>{formatCurrency(invoice.brakeRpl)}</TableCell>
                                {/* Ground Services */}
                                <TableCell>{formatCurrency(invoice.towingPerService)}</TableCell>
                                <TableCell>{formatCurrency(invoice.storageFeeMonth)}</TableCell>
                                <TableCell>{formatCurrency(invoice.storageHandlingFee)}</TableCell>
                                {/* Fluids/N2 */}
                                <TableCell>{formatCurrency(invoice.engineOilQuad)}</TableCell>
                                <TableCell>{formatCurrency(invoice.hydraulicFluidQuad)}</TableCell>
                                <TableCell>{formatCurrency(invoice.maintStepHr)}</TableCell>
                                <TableCell>{formatCurrency(invoice.lowPressureN2)}</TableCell>
                                <TableCell>{formatCurrency(invoice.highPressureN2)}</TableCell>
                                {/* Other */}
                                <TableCell>{formatCurrency(invoice.defectRectificationTools)}</TableCell>
                                <TableCell>{formatCurrency(invoice.materialHandlingFee)}</TableCell>
                                <TableCell>{formatCurrency(invoice.marshalling)}</TableCell>
                                {/* Total */}
                                <TableCell className="font-semibold text-primary">
                                    {formatCurrency(invoice.totalServicePrice)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{invoice.remark || "-"}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
};
