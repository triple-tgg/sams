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
        title: "Total Programs",
        value: "24",
        change: "+3 this month",
        icon: "heroicons-outline:academic-cap",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        title: "Active Trainees",
        value: "156",
        change: "+12 this week",
        icon: "heroicons-outline:users",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        title: "Completion Rate",
        value: "87%",
        change: "+2.4% vs last quarter",
        icon: "heroicons-outline:chart-bar",
        color: "text-violet-500",
        bg: "bg-violet-500/10",
    },
    {
        title: "Upcoming Sessions",
        value: "8",
        change: "Next 7 days",
        icon: "heroicons-outline:clock",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
];

const trainingPrograms = [
    {
        id: "TRN-001",
        name: "Boeing 737 Type Rating",
        type: "Type Rating",
        duration: "6 weeks",
        status: "Active",
        enrolled: 18,
        maxCapacity: 20,
        progress: 72,
        startDate: "2026-01-15",
    },
    {
        id: "TRN-002",
        name: "Airbus A320 Family Maintenance",
        type: "Recurrent",
        duration: "4 weeks",
        status: "Active",
        enrolled: 24,
        maxCapacity: 25,
        progress: 45,
        startDate: "2026-02-01",
    },
    {
        id: "TRN-003",
        name: "NDI/NDT Inspection Techniques",
        type: "Specialist",
        duration: "2 weeks",
        status: "Upcoming",
        enrolled: 12,
        maxCapacity: 15,
        progress: 0,
        startDate: "2026-03-10",
    },
    {
        id: "TRN-004",
        name: "EWIS (Electrical Wiring)",
        type: "Mandatory",
        duration: "1 week",
        status: "Active",
        enrolled: 32,
        maxCapacity: 40,
        progress: 88,
        startDate: "2026-02-10",
    },
    {
        id: "TRN-005",
        name: "Human Factors in Maintenance",
        type: "Mandatory",
        duration: "3 days",
        status: "Completed",
        enrolled: 45,
        maxCapacity: 45,
        progress: 100,
        startDate: "2026-01-05",
    },
    {
        id: "TRN-006",
        name: "Fuel Tank Safety (CDCCL)",
        type: "Specialist",
        duration: "2 weeks",
        status: "Upcoming",
        enrolled: 8,
        maxCapacity: 20,
        progress: 0,
        startDate: "2026-04-01",
    },
];

const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        Active: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
        Upcoming: "bg-blue-500/10 text-blue-600 border-blue-200",
        Completed: "bg-default-200 text-default-600 border-default-300",
    };
    return styles[status] || "";
};

const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
        "Type Rating": "bg-violet-500/10 text-violet-600",
        Recurrent: "bg-cyan-500/10 text-cyan-600",
        Specialist: "bg-amber-500/10 text-amber-600",
        Mandatory: "bg-rose-500/10 text-rose-600",
    };
    return styles[type] || "bg-default-100 text-default-600";
};

const TrainingPage = () => {
    const [search, setSearch] = useState("");

    const filtered = trainingPrograms.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <Icon icon="heroicons-outline:book-open" className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-default-900">Training Module</h1>
                        <p className="text-sm text-default-500">Manage training programs and track progress</p>
                    </div>
                </div>
                <Button className="gap-2">
                    <Icon icon="heroicons-outline:plus" className="h-4 w-4" />
                    New Program
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat) => (
                    <Card key={stat.title} className="border border-default-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                                    <Icon icon={stat.icon} className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-default-500 truncate">{stat.title}</p>
                                    <p className="text-xl font-bold text-default-900">{stat.value}</p>
                                    <p className="text-xs text-default-400">{stat.change}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Training Programs Table */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4">
                    <CardTitle className="flex-1 text-base">Training Programs</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Icon
                                icon="heroicons-outline:magnifying-glass"
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-default-400"
                            />
                            <Input
                                placeholder="Search programs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 w-[240px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-default-50">
                                <TableHead className="font-semibold">Program ID</TableHead>
                                <TableHead className="font-semibold">Program Name</TableHead>
                                <TableHead className="font-semibold">Type</TableHead>
                                <TableHead className="font-semibold">Duration</TableHead>
                                <TableHead className="font-semibold">Enrolled</TableHead>
                                <TableHead className="font-semibold">Progress</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((program) => (
                                <TableRow key={program.id} className="hover:bg-default-50/50 transition-colors">
                                    <TableCell className="font-mono text-xs text-default-500">
                                        {program.id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-default-900">{program.name}</div>
                                        <div className="text-xs text-default-400">Start: {program.startDate}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadge(program.type)}`}>
                                            {program.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-default-600">{program.duration}</TableCell>
                                    <TableCell>
                                        <span className="text-default-900 font-medium">{program.enrolled}</span>
                                        <span className="text-default-400">/{program.maxCapacity}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-default-100 rounded-full overflow-hidden w-20">
                                                <div
                                                    className={`h-full rounded-full transition-all ${program.progress === 100
                                                            ? "bg-default-400"
                                                            : program.progress >= 70
                                                                ? "bg-emerald-500"
                                                                : "bg-blue-500"
                                                        }`}
                                                    style={{ width: `${program.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-default-500 w-8">{program.progress}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-xs ${getStatusBadge(program.status)}`}>
                                            {program.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Icon icon="heroicons-outline:eye" className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Icon icon="heroicons-outline:pencil-square" className="h-4 w-4" />
                                        </Button>
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

export default TrainingPage;
