"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useState } from "react";

const statsData = [
    {
        title: "Total Certificates",
        value: "312",
        icon: "heroicons-outline:document-check",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        title: "Active",
        value: "278",
        icon: "heroicons-outline:check-badge",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        title: "Expiring Soon",
        value: "18",
        icon: "heroicons-outline:exclamation-triangle",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
    {
        title: "Expired",
        value: "16",
        icon: "heroicons-outline:x-circle",
        color: "text-rose-500",
        bg: "bg-rose-500/10",
    },
];

const certificates = [
    {
        id: "CERT-001",
        name: "AME License - Category B1",
        holder: "Somchai Prasert",
        employeeId: "EMP-0042",
        issueDate: "2024-06-15",
        expiryDate: "2026-06-15",
        status: "Active",
        authority: "CAAT",
    },
    {
        id: "CERT-002",
        name: "AME License - Category B2",
        holder: "Nattapong Srisuk",
        employeeId: "EMP-0038",
        issueDate: "2024-03-20",
        expiryDate: "2026-03-20",
        status: "Expiring",
        authority: "CAAT",
    },
    {
        id: "CERT-003",
        name: "Boeing 737 Type Rating",
        holder: "Wichai Tanaka",
        employeeId: "EMP-0055",
        issueDate: "2025-01-10",
        expiryDate: "2027-01-10",
        status: "Active",
        authority: "Boeing",
    },
    {
        id: "CERT-004",
        name: "NDT Level II - Ultrasonic",
        holder: "Pranee Chaiyo",
        employeeId: "EMP-0061",
        issueDate: "2023-08-01",
        expiryDate: "2025-08-01",
        status: "Expired",
        authority: "ASNT",
    },
    {
        id: "CERT-005",
        name: "Airbus A320 Family Maintenance",
        holder: "Kittisak Wongsawat",
        employeeId: "EMP-0029",
        issueDate: "2025-05-20",
        expiryDate: "2027-05-20",
        status: "Active",
        authority: "Airbus",
    },
    {
        id: "CERT-006",
        name: "EWIS Authorization",
        holder: "Suthep Rattana",
        employeeId: "EMP-0044",
        issueDate: "2024-11-01",
        expiryDate: "2026-04-01",
        status: "Expiring",
        authority: "CAAT",
    },
    {
        id: "CERT-007",
        name: "Human Factors Training",
        holder: "Araya Pimchan",
        employeeId: "EMP-0073",
        issueDate: "2025-09-15",
        expiryDate: "2027-09-15",
        status: "Active",
        authority: "EASA",
    },
];

const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        Active: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
        Expiring: "bg-amber-500/10 text-amber-600 border-amber-200",
        Expired: "bg-rose-500/10 text-rose-600 border-rose-200",
    };
    return styles[status] || "";
};

const CertificatePage = () => {
    const [search, setSearch] = useState("");

    const expiringCount = certificates.filter((c) => c.status === "Expiring").length;

    const filtered = certificates.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.holder.toLowerCase().includes(search.toLowerCase()) ||
            c.employeeId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Icon icon="heroicons-outline:document-check" className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-default-900">Certificate Module</h1>
                        <p className="text-sm text-default-500">Track certifications and manage renewals</p>
                    </div>
                </div>
                <Button className="gap-2">
                    <Icon icon="heroicons-outline:plus" className="h-4 w-4" />
                    Issue Certificate
                </Button>
            </div>

            {/* Expiring Alert */}
            {expiringCount > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-500/5 dark:border-amber-500/20 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                        <Icon icon="heroicons-outline:exclamation-triangle" className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                            {expiringCount} certificate{expiringCount > 1 ? "s" : ""} expiring within 60 days
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                            Review and initiate renewal process to maintain compliance.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/10">
                        View All
                    </Button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat) => (
                    <Card key={stat.title} className="border border-default-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                                    <Icon icon={stat.icon} className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-default-500">{stat.title}</p>
                                    <p className="text-xl font-bold text-default-900">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Certificates Table */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4">
                    <CardTitle className="flex-1 text-base">All Certificates</CardTitle>
                    <div className="relative">
                        <Icon
                            icon="heroicons-outline:magnifying-glass"
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-default-400"
                        />
                        <Input
                            placeholder="Search certificates..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 w-[240px]"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-default-50">
                                <TableHead className="font-semibold">Cert ID</TableHead>
                                <TableHead className="font-semibold">Certificate Name</TableHead>
                                <TableHead className="font-semibold">Holder</TableHead>
                                <TableHead className="font-semibold">Authority</TableHead>
                                <TableHead className="font-semibold">Issue Date</TableHead>
                                <TableHead className="font-semibold">Expiry Date</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((cert) => (
                                <TableRow
                                    key={cert.id}
                                    className={`hover:bg-default-50/50 transition-colors ${cert.status === "Expired" ? "opacity-60" : ""
                                        }`}
                                >
                                    <TableCell className="font-mono text-xs text-default-500">{cert.id}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-default-900">{cert.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-default-900">{cert.holder}</div>
                                        <div className="text-xs text-default-400">{cert.employeeId}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-default-100 text-default-600">
                                            {cert.authority}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-default-600 text-sm">{cert.issueDate}</TableCell>
                                    <TableCell className="text-default-600 text-sm">{cert.expiryDate}</TableCell>
                                    <TableCell>
                                        <Badge className={`text-xs ${getStatusBadge(cert.status)}`}>
                                            {cert.status === "Expiring" ? "⚠ Expiring" : cert.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Icon icon="heroicons-outline:eye" className="h-4 w-4" />
                                        </Button>
                                        {cert.status === "Expiring" || cert.status === "Expired" ? (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500">
                                                <Icon icon="heroicons-outline:arrow-path" className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Icon icon="heroicons-outline:pencil-square" className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default CertificatePage;
