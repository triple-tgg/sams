"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const statsData = [
    { title: "Total Mechanics", value: "89", icon: "heroicons-outline:wrench-screwdriver", color: "text-violet-500", bg: "bg-violet-500/10" },
    { title: "Active", value: "76", icon: "heroicons-outline:check-circle", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "On Leave", value: "8", icon: "heroicons-outline:calendar-days", color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Certified", value: "68", icon: "heroicons-outline:shield-check", color: "text-blue-500", bg: "bg-blue-500/10" },
];

const mechanics = [
    { id: "EMP-0029", name: "Kittisak Wongsawat", avatar: "KW", specialization: "Airframe & Powerplant", certifications: ["B1", "B2", "A320"], status: "Active", experience: "12 yrs", shift: "Day", rating: 4.8 },
    { id: "EMP-0038", name: "Nattapong Srisuk", avatar: "NS", specialization: "Avionics", certifications: ["B2", "B737"], status: "Active", experience: "8 yrs", shift: "Day", rating: 4.5 },
    { id: "EMP-0042", name: "Somchai Prasert", avatar: "SP", specialization: "Airframe & Powerplant", certifications: ["B1", "A320", "B737"], status: "Active", experience: "15 yrs", shift: "Night", rating: 4.9 },
    { id: "EMP-0044", name: "Suthep Rattana", avatar: "SR", specialization: "Electrical Systems", certifications: ["B2", "EWIS"], status: "On Leave", experience: "6 yrs", shift: "Day", rating: 4.3 },
    { id: "EMP-0055", name: "Wichai Tanaka", avatar: "WT", specialization: "Airframe & Powerplant", certifications: ["B1", "B737", "NDT-II"], status: "Active", experience: "10 yrs", shift: "Night", rating: 4.7 },
    { id: "EMP-0061", name: "Pranee Chaiyo", avatar: "PC", specialization: "NDT Inspector", certifications: ["NDT-II", "UT", "MT"], status: "Active", experience: "7 yrs", shift: "Day", rating: 4.6 },
    { id: "EMP-0073", name: "Araya Pimchan", avatar: "AP", specialization: "Avionics", certifications: ["B2"], status: "Active", experience: "3 yrs", shift: "Day", rating: 4.1 },
    { id: "EMP-0081", name: "Thawatchai Boonmi", avatar: "TB", specialization: "Airframe & Powerplant", certifications: ["B1", "A320"], status: "On Leave", experience: "9 yrs", shift: "Night", rating: 4.4 },
];

const getStatusColor = (s: string) => s === "Active" ? "bg-emerald-500" : "bg-amber-500";
const avatarGradients = ["from-blue-500 to-cyan-400", "from-violet-500 to-purple-400", "from-emerald-500 to-teal-400", "from-rose-500 to-pink-400", "from-amber-500 to-orange-400", "from-indigo-500 to-blue-400"];
const getGradient = (name: string) => avatarGradients[name.charCodeAt(0) % avatarGradients.length];

const MechProfilePage = () => {
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"grid" | "list">("grid");
    const filtered = mechanics.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()) || m.specialization.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                        <Icon icon="heroicons-outline:user-circle" className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-default-900">Mech. Profile</h1>
                        <p className="text-sm text-default-500">View and manage mechanic profiles</p>
                    </div>
                </div>
                <Button className="gap-2"><Icon icon="heroicons-outline:plus" className="h-4 w-4" />Add Mechanic</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map(s => (
                    <Card key={s.title} className="border border-default-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bg}`}><Icon icon={s.icon} className={`h-5 w-5 ${s.color}`} /></div>
                                <div><p className="text-xs text-default-500">{s.title}</p><p className="text-xl font-bold text-default-900">{s.value}</p></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Icon icon="heroicons-outline:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-default-400" />
                    <Input placeholder="Search mechanics..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <div className="flex border border-default-200 rounded-lg overflow-hidden">
                    <button onClick={() => setView("grid")} className={`px-3 py-1.5 text-sm transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "bg-transparent text-default-500 hover:bg-default-100"}`}><Icon icon="heroicons-outline:squares-2x2" className="h-4 w-4" /></button>
                    <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "bg-transparent text-default-500 hover:bg-default-100"}`}><Icon icon="heroicons-outline:bars-3" className="h-4 w-4" /></button>
                </div>
            </div>

            {view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(m => (
                        <Card key={m.id} className="group border border-default-200 hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden">
                            <CardContent className="p-0">
                                <div className={`h-16 bg-linear-to-r ${getGradient(m.name)} relative`}>
                                    <div className="absolute -bottom-6 left-4">
                                        <div className={`h-14 w-14 rounded-xl bg-linear-to-br ${getGradient(m.name)} flex items-center justify-center text-white text-lg font-bold shadow-lg border-4 border-card`}>{m.avatar}</div>
                                    </div>
                                    <div className="absolute top-3 right-3"><div className={`h-3 w-3 rounded-full ${getStatusColor(m.status)} ring-2 ring-white/50`} /></div>
                                </div>
                                <div className="pt-8 px-4 pb-4">
                                    <h3 className="font-semibold text-default-900 text-sm">{m.name}</h3>
                                    <p className="text-xs text-default-400 mb-2">{m.id} · {m.experience}</p>
                                    <p className="text-xs text-default-500 mb-3">{m.specialization}</p>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {m.certifications.map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{c}</span>)}
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-default-100">
                                        <div className="flex items-center gap-1"><Icon icon="heroicons-solid:star" className="h-3.5 w-3.5 text-amber-400" /><span className="text-xs font-medium text-default-700">{m.rating}</span></div>
                                        <Badge className={`text-[10px] ${m.status === "Active" ? "text-emerald-600 border-emerald-200 bg-emerald-500/10" : "text-amber-600 border-amber-200 bg-amber-500/10"}`}>{m.status}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y divide-default-100">
                            {filtered.map(m => (
                                <div key={m.id} className="flex items-center gap-4 p-4 hover:bg-default-50/50 transition-colors">
                                    <div className={`h-10 w-10 shrink-0 rounded-lg bg-linear-to-br ${getGradient(m.name)} flex items-center justify-center text-white text-sm font-bold`}>{m.avatar}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2"><h3 className="font-medium text-default-900 text-sm">{m.name}</h3><div className={`h-2 w-2 rounded-full ${getStatusColor(m.status)}`} /></div>
                                        <p className="text-xs text-default-400">{m.id} · {m.specialization} · {m.experience}</p>
                                    </div>
                                    <div className="hidden sm:flex flex-wrap gap-1">{m.certifications.map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{c}</span>)}</div>
                                    <div className="flex items-center gap-1 shrink-0"><Icon icon="heroicons-solid:star" className="h-3.5 w-3.5 text-amber-400" /><span className="text-xs font-medium text-default-700">{m.rating}</span></div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Icon icon="heroicons-outline:eye" className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MechProfilePage;
