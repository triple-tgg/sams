"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DraftInvoice } from "./types";

interface DraftInvoiceTableProps {
    invoices: DraftInvoice[];
}

const formatCurrency = (value: number) => {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const DraftInvoiceTable = ({
    invoices,
}: DraftInvoiceTableProps) => {
    // Calculate totals
    const totalQuantity = invoices.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-muted/50">
                    <TableHead className="w-[80px]">ITEM</TableHead>
                    <TableHead className="min-w-[300px]">DESCRIPTION</TableHead>
                    <TableHead className="w-[120px] text-right">QUANTITY</TableHead>
                    <TableHead className="w-[150px] text-right">UNIT PRICE</TableHead>
                    <TableHead className="w-[150px] text-right">AMOUNT</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No draft invoice records found
                        </TableCell>
                    </TableRow>
                ) : (
                    <>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.item}</TableCell>
                                <TableCell>{invoice.description}</TableCell>
                                <TableCell className="text-right">{invoice.quantity}</TableCell>
                                <TableCell className="text-right">{formatCurrency(invoice.unitPrice)}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(invoice.amount)}</TableCell>
                            </TableRow>
                        ))}
                        {/* Total Row */}
                        <TableRow className="bg-muted/30 border-t-2">
                            <TableCell className="font-bold">TOTAL</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-bold">{totalQuantity}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-bold text-primary">{formatCurrency(totalAmount)}</TableCell>
                        </TableRow>
                    </>
                )}
            </TableBody>
        </Table>
    );
};
