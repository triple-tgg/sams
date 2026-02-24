"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const statsData = [
    { title: "Planned Assignments", value: "42", change: "Next 7 days", icon: "heroicons-outline:clipboard-document-list", color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Available Mechanics", value: "31", change: "Current shift", icon: "heroicons-outline:user-group", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Pending Tasks", value: "15", change: "Unassigned", icon: "heroicons-outline:exclamation-circle", color: "text-rose-500", bg: "bg-rose-500/10" },
    { title: "Efficiency", value: "94%", change: "+2% vs last week", icon: "heroicons-outline:bolt", color: "text-blue-500", bg: "bg-blue-500/10" },
];

const scheduleData = [
    { id: "PLN-001", date: "2026-02-24", shift: "Day", mechanic: "Kittisak W.", task: "B737 A-Check", flight: "TG-201", status: "Confirmed", priority: "High" },
    { id: "PLN-002", date: "2026-02-24", shift: "Day", mechanic: "Somchai P.", task: "A320 Line Maintenance", flight: "TG-305", status: "Confirmed", priority: "Normal" },
    { id: "PLN-003", date: "2026-02-24", shift: "Night", mechanic: "Wichai T.", task: "B737 Engine Boroscope", flight: "TG-112", status: "Confirmed", priority: "High" },
    { id: "PLN-004", date: "2026-02-25", shift: "Day", mechanic: "Nattapong S.", task: "Avionics System Check", flight: "TG-445", status: "Pending", priority: "Normal" },
    { id: "PLN-005", date: "2026-02-25", shift: "Day", mechanic: "—", task: "Wheel & Brake Change", flight: "TG-608", status: "Unassigned", priority: "High" },
    { id: "PLN-006", date: "2026-02-25", shift: "Night", mechanic: "Pranee C.", task: "NDT Inspection – Wing", flight: "TG-201", status: "Confirmed", priority: "Critical" },
    { id: "PLN-007", date: "2026-02-26", shift: "Day", mechanic: "Araya P.", task: "IFE System Repair", flight: "TG-310", status: "Pending", priority: "Low" },
    { id: "PLN-008", date: "2026-02-26", shift: "Night", mechanic: "—", task: "APU Inspection", flight: "TG-520", status: "Unassigned", priority: "Normal" },
];

const getStatusBadge = (s: string) => {
    const m: Record<string, string> = { Confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-200", Pending: "bg-amber-500/10 text-amber-600 border-amber-200", Unassigned: "bg-rose-500/10 text-rose-600 border-rose-200" };
    return m[s] || "";
};
const getPriorityDot = (p: string) => {
    const m: Record<string, string> = { Critical: "bg-rose-500", High: "bg-amber-500", Normal: "bg-blue-500", Low: "bg-default-400" };
    return m[p] || "bg-default-400";
};

const days = ["Mon 24", "Tue 25", "Wed 26", "Thu 27", "Fri 28"];
const timelineSlots = [
    { mech: "Kittisak W.", blocks: [{ day: 0, label: "B737 A-Check", color: "bg-blue-500" }, { day: 2, label: "A320 Line", color: "bg-emerald-500" }] },
    { mech: "Somchai P.", blocks: [{ day: 0, label: "A320 Line Maint.", color: "bg-emerald-500" }, { day: 1, label: "B737 Transit", color: "bg-blue-500" }, { day: 3, label: "Engine Run", color: "bg-violet-500" }] },
    { mech: "Wichai T.", blocks: [{ day: 0, label: "Engine Boroscope", color: "bg-violet-500" }, { day: 4, label: "B737 B-Check", color: "bg-blue-500" }] },
    { mech: "Pranee C.", blocks: [{ day: 1, label: "NDT Wing", color: "bg-rose-500" }, { day: 3, label: "NDT Fuselage", color: "bg-rose-500" }] },
    { mech: "Nattapong S.", blocks: [{ day: 1, label: "Avionics Check", color: "bg-cyan-500" }] },
];

const AutoPlanMechPage = () => {
    const [tab, setTab] = useState<"schedule" | "timeline">("schedule");

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                        <Icon icon="heroicons-outline:calendar" className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-default-900">Auto Plan Mech.</h1>
                        <p className="text-sm text-default-500">Auto-assign mechanics based on skills & availability</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2"><Icon icon="heroicons-outline:arrow-path" className="h-4 w-4" />Re-generate</Button>
                    <Button className="gap-2"><Icon icon="heroicons-outline:sparkles" className="h-4 w-4" />Generate Plan</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map(s => (
                    <Card key={s.title} className="border border-default-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bg}`}><Icon icon={s.icon} className={`h-5 w-5 ${s.color}`} /></div>
                                <div><p className="text-xs text-default-500">{s.title}</p><p className="text-xl font-bold text-default-900">{s.value}</p><p className="text-xs text-default-400">{s.change}</p></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tab Toggle */}
            <div className="flex border-b border-default-200">
                <button onClick={() => setTab("schedule")} className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === "schedule" ? "border-primary text-primary" : "border-transparent text-default-500 hover:text-default-700"}`}>
                    <Icon icon="heroicons-outline:table-cells" className="h-4 w-4 inline mr-1.5" />Schedule
                </button>
                <button onClick={() => setTab("timeline")} className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === "timeline" ? "border-primary text-primary" : "border-transparent text-default-500 hover:text-default-700"}`}>
                    <Icon icon="heroicons-outline:chart-bar" className="h-4 w-4 inline mr-1.5" />Timeline View
                </button>
            </div>

            {tab === "schedule" ? (
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">Assignment Schedule — Feb 24-28, 2026</CardTitle></CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-default-50 text-left">
                                <th className="px-4 py-3 font-semibold text-default-600">Plan ID</th>
                                <th className="px-4 py-3 font-semibold text-default-600">Date</th>
                                <th className="px-4 py-3 font-semibold text-default-600">Shift</th>
                                <th className="px-4 py-3 font-semibold text-default-600">Mechanic</th>
                                <th className="px-4 py-3 font-semibold text-default-600">Task</th>
                                <th className="px-4 py-3 font-semibold text-default-600">Flight</th>
                                <th className="px-4 py-3 font-semibold text-default-600">Priority</th>
                                <th className="px-4 py-3 font-semibold text-default-600">Status</th>
                                <th className="px-4 py-3 font-semibold text-default-600 text-center">Actions</th>
                            </tr></thead>
                            <tbody className="divide-y divide-default-100">
                                {scheduleData.map(row => (
                                    <tr key={row.id} className="hover:bg-default-50/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-default-500">{row.id}</td>
                                        <td className="px-4 py-3 text-default-700">{row.date}</td>
                                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${row.shift === "Day" ? "bg-sky-100 text-sky-700" : "bg-indigo-100 text-indigo-700"}`}>{row.shift}</span></td>
                                        <td className="px-4 py-3 text-default-900 font-medium">{row.mechanic}</td>
                                        <td className="px-4 py-3 text-default-700">{row.task}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-default-500">{row.flight}</td>
                                        <td className="px-4 py-3"><div className="flex items-center gap-1.5"><div className={`h-2 w-2 rounded-full ${getPriorityDot(row.priority)}`} /><span className="text-xs text-default-600">{row.priority}</span></div></td>
                                        <td className="px-4 py-3"><Badge className={`text-xs ${getStatusBadge(row.status)}`}>{row.status}</Badge></td>
                                        <td className="px-4 py-3 text-center">
                                            {row.status === "Unassigned" ? (
                                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Icon icon="heroicons-outline:user-plus" className="h-3 w-3" />Assign</Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><Icon icon="heroicons-outline:pencil-square" className="h-4 w-4" /></Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">Weekly Timeline — Feb 24-28, 2026</CardTitle></CardHeader>
                    <CardContent className="p-4 overflow-x-auto">
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-[140px_repeat(5,1fr)] gap-1 mb-2">
                                <div className="text-xs font-semibold text-default-500 p-2">Mechanic</div>
                                {days.map(d => <div key={d} className="text-xs font-semibold text-default-500 text-center p-2 bg-default-50 rounded">{d}</div>)}
                            </div>
                            {timelineSlots.map(slot => (
                                <div key={slot.mech} className="grid grid-cols-[140px_repeat(5,1fr)] gap-1 mb-1">
                                    <div className="text-sm font-medium text-default-700 p-2 flex items-center">{slot.mech}</div>
                                    {days.map((_, i) => {
                                        const block = slot.blocks.find(b => b.day === i);
                                        return (
                                            <div key={i} className="p-1 min-h-[40px] flex items-center">
                                                {block ? (
                                                    <div className={`${block.color} text-white text-[10px] font-medium px-2 py-1.5 rounded w-full text-center truncate`}>{block.label}</div>
                                                ) : (
                                                    <div className="w-full h-full rounded border border-dashed border-default-200" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AutoPlanMechPage;
