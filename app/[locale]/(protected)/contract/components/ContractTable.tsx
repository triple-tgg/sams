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
import { MoreHorizontal, Eye, Pencil, Trash2, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Contract } from "./types";
import { getContractExpiryWarning } from "@/lib/utils/contractExpiry";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";

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

const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
        active: { className: "bg-success/10 text-success border-success/20", label: "Active" },
        draft: { className: "bg-slate-100 text-slate-600 border-slate-200", label: "Draft" },
        "pending approval": { className: "bg-warning/10 text-warning border-warning/20", label: "Pending Approval" },
        "on hold": { className: "bg-warning/10 text-warning border-warning/20", label: "On Hold" },
        "on-hold": { className: "bg-warning/10 text-warning border-warning/20", label: "On Hold" },
        terminated: { className: "bg-destructive/10 text-destructive border-destructive/20", label: "Terminated" },
        expired: { className: "bg-destructive/10 text-destructive border-destructive/20", label: "Expired" },
        suspended: { className: "bg-orange-100 text-orange-600 border-orange-200", label: "Suspended" },
        "expiring soon": { className: "bg-amber-100 text-amber-600 border-amber-200", label: "Expiring Soon" },
    };
    // Fallback for unknown status
    const statusConfig = config[status.toLowerCase()] || { className: "bg-muted/10 text-muted-foreground border-muted/20", label: status || "Unknown" };
    return <Badge className={`${statusConfig.className} min-w-[120px] text-center justify-center`}>{statusConfig.label}</Badge>;
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
                    <TableHead className="whitespace-nowrap">Contract No.</TableHead>
                    <TableHead className="whitespace-nowrap">Contract Type</TableHead>
                    <TableHead className="whitespace-nowrap">Customer Airline</TableHead>
                    <TableHead className="whitespace-nowrap">Effective</TableHead>
                    <TableHead className="whitespace-nowrap">Expires</TableHead>
                    <TableHead className="whitespace-nowrap text-center">No Expiry</TableHead>
                    <TableHead className="whitespace-nowrap">Location</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap text-center">Action</TableHead>
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
                    contracts.map((contract) => {
                        const expiryWarning = getContractExpiryWarning(contract.expires, contract.noExpiry);
                        return (
                            <TableRow key={contract.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col items-start gap-1.5">
                                        <span>{contract.contractNo}</span>
                                        {expiryWarning && (
                                            <Badge
                                                className={`gap-1 px-1.5 py-0.5 text-[10px] leading-3 font-medium whitespace-nowrap ${expiryWarning === "under-3-months"
                                                    ? "bg-red-50 text-red-700 border-red-200"
                                                    : "bg-amber-50 text-amber-800 border-amber-200"}`}
                                            >
                                                {expiryWarning === "under-3-months"
                                                    ? <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                                                    : <Clock className="h-2.5 w-2.5" aria-hidden="true" />}
                                                {expiryWarning === "under-3-months" ? "Expires in < 3 months" : "Expires in < 6 months"}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{contract.contractType}</TableCell>
                                <TableCell className="whitespace-nowrap">{contract.customerAirline}</TableCell>
                                <TableCell className="whitespace-nowrap">{formatDate(contract.effective)}</TableCell>
                                <TableCell className="whitespace-nowrap">{contract.noExpiry || !contract.expires ? "-" : formatDate(contract.expires)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center">
                                        {contract.noExpiry ? (
                                            <CheckCircle2 className="h-5 w-5 text-success" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-muted-foreground/40" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{contract.location}</TableCell>
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
                                                <PermissionActionGuard menuCode="CONTRACT" action="canEdit">
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={() => onEdit?.(contract)}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                </PermissionActionGuard>
                                                <PermissionActionGuard menuCode="CONTRACT" action="canDelete">
                                                    <DropdownMenuItem
                                                        className="cursor-pointer text-destructive focus:text-destructive"
                                                        onClick={() => onDelete?.(contract)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </PermissionActionGuard>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
    );
};
