"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams } from "next/navigation";

const modules = [
    {
        title: "Training",
        description: "Manage mechanic training programs, track progress, and schedule upcoming sessions.",
        href: "/hr/training",
        icon: "heroicons-outline:book-open",
        gradient: "from-blue-500 to-cyan-400",
        bgGlow: "bg-blue-500/10",
        stats: [
            { label: "Programs", value: "24" },
            { label: "Active Trainees", value: "156" },
            { label: "Completion Rate", value: "87%" },
        ],
    },
    {
        title: "Certificate",
        description: "Track certifications, monitor expiry dates, and manage renewal workflows.",
        href: "/hr/certificate",
        icon: "heroicons-outline:document-check",
        gradient: "from-emerald-500 to-teal-400",
        bgGlow: "bg-emerald-500/10",
        stats: [
            { label: "Total Certs", value: "312" },
            { label: "Active", value: "278" },
            { label: "Expiring Soon", value: "18" },
        ],
    },
    {
        title: "Mech. Profile",
        description: "View mechanic profiles, specializations, skill badges, and employment details.",
        href: "/hr/mech-profile",
        icon: "heroicons-outline:user-circle",
        gradient: "from-violet-500 to-purple-400",
        bgGlow: "bg-violet-500/10",
        stats: [
            { label: "Total Mechanics", value: "89" },
            { label: "Active", value: "76" },
            { label: "Certified", value: "68" },
        ],
    },
    {
        title: "Auto Plan Mech.",
        description: "Auto-assign mechanics to maintenance tasks based on certifications and availability.",
        href: "/hr/auto-plan-mech",
        icon: "heroicons-outline:calendar",
        gradient: "from-amber-500 to-orange-400",
        bgGlow: "bg-amber-500/10",
        stats: [
            { label: "Planned", value: "42" },
            { label: "Available", value: "31" },
            { label: "Efficiency", value: "94%" },
        ],
    },
];

const HRPage = () => {
    const params = useParams();
    const locale = params?.locale || "en";

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary/90 via-primary to-primary/80 p-8 text-primary-foreground">
                <div className="absolute inset-0 bg-[url('/images/all-img/widget-bg-2.png')] bg-cover bg-center opacity-10" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <Icon icon="heroicons-outline:academic-cap" className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Human Resources</h1>
                            <p className="text-primary-foreground/80 text-sm">
                                Manage mechanic workforce, training, and certifications
                            </p>
                        </div>
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
                <div className="absolute -right-4 -bottom-12 h-32 w-32 rounded-full bg-white/5" />
            </div>

            {/* Module Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {modules.map((mod) => (
                    <Link
                        key={mod.href}
                        href={`/${locale}${mod.href}`}
                        className="group block"
                    >
                        <Card className="relative overflow-hidden border border-default-200 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 h-full">
                            {/* Gradient accent bar */}
                            <div
                                className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${mod.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}
                            />

                            <CardContent className="p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${mod.bgGlow} transition-transform duration-300 group-hover:scale-110`}
                                    >
                                        <Icon
                                            icon={mod.icon}
                                            className={`h-6 w-6 bg-linear-to-r ${mod.gradient} bg-clip-text`}
                                            style={{
                                                color: mod.gradient.includes("blue")
                                                    ? "#3b82f6"
                                                    : mod.gradient.includes("emerald")
                                                        ? "#10b981"
                                                        : mod.gradient.includes("violet")
                                                            ? "#8b5cf6"
                                                            : "#f59e0b",
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-default-900 group-hover:text-primary transition-colors">
                                            {mod.title}
                                        </h3>
                                        <p className="text-sm text-default-500 mt-1 line-clamp-2">
                                            {mod.description}
                                        </p>
                                    </div>
                                    <Icon
                                        icon="heroicons-outline:arrow-right"
                                        className="h-5 w-5 text-default-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0 mt-1"
                                    />
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-default-100">
                                    {mod.stats.map((stat) => (
                                        <div key={stat.label} className="text-center">
                                            <div className="text-lg font-bold text-default-900">
                                                {stat.value}
                                            </div>
                                            <div className="text-xs text-default-500">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default HRPage;
