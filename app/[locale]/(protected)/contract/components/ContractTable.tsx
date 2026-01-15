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
import { MoreHorizontal, Eye, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Contract } from "./types";

interface ContractTableProps {
    contracts: Contract[];
    onView?: (contract: Contract) => void;
    onEdit?: (contract: Contract) => void;
    onDelete?: (contract: Contract) => void;
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getStatusBadge = (status: Contract["status"]) => {
    const config = {
        active: { className: "bg-success/10 text-success border-success/20", label: "Active" },
        "on-hold": { className: "bg-warning/10 text-warning border-warning/20", label: "On Hold" },
        terminated: { className: "bg-destructive/10 text-destructive border-destructive/20", label: "Terminated" },
    };
    const { className, label } = config[status];
    return <Badge className={className}>{label}</Badge>;
};

export const ContractTable = ({
    contracts,
    onView,
    onEdit,
    onDelete,
}: ContractTableProps) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Contract No.</TableHead>
                    <TableHead>Contract Type</TableHead>
                    <TableHead>Customer Airline</TableHead>
                    <TableHead>Effective</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-center">No Expiry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {contracts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No contracts found
                        </TableCell>
                    </TableRow>
                ) : (
                    contracts.map((contract) => (
                        <TableRow key={contract.id}>
                            <TableCell className="font-medium">{contract.contractNo}</TableCell>
                            <TableCell>{contract.contractType}</TableCell>
                            <TableCell>{contract.customerAirline}</TableCell>
                            <TableCell>{formatDate(contract.effective)}</TableCell>
                            <TableCell>{formatDate(contract.expires)}</TableCell>
                            <TableCell>
                                <div className="flex items-center justify-center">
                                    {contract.noExpiry ? (
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-muted-foreground/40" />
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{contract.location}</TableCell>
                            <TableCell>{getStatusBadge(contract.status)}</TableCell>
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
                                                onClick={() => onView?.(contract)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={() => onEdit?.(contract)}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer text-destructive focus:text-destructive"
                                                onClick={() => onDelete?.(contract)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
};
