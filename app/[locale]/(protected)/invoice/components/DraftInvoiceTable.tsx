"use client";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { DraftInvoice } from "./types";

interface DraftInvoiceTableProps {
    invoices: DraftInvoice[];
    onView?: (invoice: DraftInvoice) => void;
    onEdit?: (invoice: DraftInvoice) => void;
    onDelete?: (invoice: DraftInvoice) => void;
}

const formatCurrency = (value: number) => {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const DraftInvoiceTable = ({
    invoices,
    onView,
    onEdit,
    onDelete,
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
                    <TableHead className="w-[80px] text-center">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                                <TableCell>
                                    <div className="flex items-center justify-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => onView?.(invoice)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => onEdit?.(invoice)}
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                    onClick={() => onDelete?.(invoice)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {/* Total Row */}
                        <TableRow className="bg-muted/30 border-t-2">
                            <TableCell className="font-bold">TOTAL</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-bold">{totalQuantity}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-bold text-primary">{formatCurrency(totalAmount)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </>
                )}
            </TableBody>
        </Table>
    );
};
