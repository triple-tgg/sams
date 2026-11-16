"use client";

import React, { useMemo } from "react";
import dayjs, { type Dayjs } from "dayjs";
import "@/lib/dayjs";
import { Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TimeComparisonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Live "now", ticked by the header clock. */
    now: Dayjs;
    /** e.g. "Bangkok" */
    localCity: string;
    /** Portal target (e.g. a fullscreen element). Defaults to document.body. */
    container?: HTMLElement | null;
}

/** "+07:00" style offset of local time against UTC. */
const formatOffset = (minutes: number) => {
    const sign = minutes >= 0 ? "+" : "-";
    const abs = Math.abs(minutes);
    return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
};

/** Minimum px per hour cell; cells stretch to fill the dialog and the strip scrolls below this. */
const MIN_HOUR_W = 30;
const LABEL_W = 56;

/** Local vs UTC for every hour of today's local day, with the current hour highlighted. */
export function TimeComparisonDialog({ open, onOpenChange, now, localCity, container }: TimeComparisonDialogProps) {
    const offsetLabel = formatOffset(now.utcOffset());
    const nowHour = now.hour();
    const dayKey = now.format("YYYY-MM-DD");

    // 24 local hours of today mapped to UTC. Rebuilt only when the local day changes.
    const hours = useMemo(() => {
        const start = dayjs(dayKey).startOf("day");
        return Array.from({ length: 24 }, (_, h) => {
            const local = start.add(h, "hour");
            return { h, local, utc: local.utc() };
        });
    }, [dayKey]);

    // "Now" marker position inside the strip, as a percentage so it follows the stretched cells
    const nowLeftPct = ((nowHour + now.minute() / 60) / 24) * 100;
    // Show minutes only when the offset is not a whole hour (e.g. UTC+05:30)
    const cellFormat = now.utcOffset() % 60 === 0 ? "HH" : "HH:mm";

    const localDate = now.format("ddd, DD MMM YYYY");
    const utcNow = now.utc();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" container={container} className="p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4 text-primary" /> Time Comparison (24 hours)
                    </DialogTitle>
                    <DialogDescription>
                        Local time {localCity ? `(${localCity}) ` : ""}is {offsetLabel}. Each column shows the same moment in both time zones.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 px-6 py-5">
                    {/* Live clocks */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                                Local {localCity ? `(${localCity})` : ""} · {offsetLabel}
                            </p>
                            <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-default-900">{now.format("HH:mm:ss")}</p>
                            <p className="text-xs text-default-500">{localDate}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-default-500">UTC</p>
                            <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-default-900">{utcNow.format("HH:mm:ss")}</p>
                            <p className="text-xs text-default-500">{utcNow.format("ddd, DD MMM YYYY")}</p>
                        </div>
                    </div>

                    {/* 24-hour strip */}
                    <div className="overflow-x-auto pb-1">
                        <div className="flex" style={{ minWidth: LABEL_W + MIN_HOUR_W * 24 }}>
                            {/* Row labels */}
                            <div style={{ width: LABEL_W }} className="shrink-0 pr-2 text-[10px] font-semibold uppercase tracking-wider text-default-500">
                                <div className="h-5" />
                                <div className="flex h-10 items-center">Local</div>
                                <div className="flex h-10 items-center">UTC</div>
                            </div>

                            <div className="relative min-w-0 flex-1">
                                {/* Date labels: local day on top, UTC day changes below */}
                                <div className="flex h-5 items-end text-[10px] text-default-400">
                                    <span className="pl-1">{now.format("DD MMM")}</span>
                                </div>

                                {/* Local row */}
                                <div className="flex h-10">
                                    {hours.map(({ h, local }) => {
                                        const current = h === nowHour;
                                        return (
                                            <div
                                                key={`l-${h}`}
                                                style={{ minWidth: MIN_HOUR_W }}
                                                className={`flex flex-1 items-center justify-center border-y border-l border-border font-mono text-xs first:rounded-l-md last:rounded-r-md last:border-r ${
                                                    current
                                                        ? "bg-primary text-white font-semibold border-primary"
                                                        : h >= 6 && h < 18
                                                            ? "bg-card text-default-700"
                                                            : "bg-slate-50 text-default-500 dark:bg-slate-800/40"
                                                }`}
                                            >
                                                {local.format(cellFormat)}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* UTC row */}
                                <div className="flex h-10">
                                    {hours.map(({ h, utc }, i) => {
                                        const current = h === nowHour;
                                        const dayChanged = i > 0 && utc.date() !== hours[i - 1].utc.date();
                                        return (
                                            <div
                                                key={`u-${h}`}
                                                style={{ minWidth: MIN_HOUR_W }}
                                                className={`relative flex flex-1 items-center justify-center border-b border-l border-border font-mono text-xs first:rounded-bl-md last:rounded-br-md last:border-r ${
                                                    current ? "bg-primary/10 text-primary font-semibold" : "bg-card text-default-600"
                                                } ${dayChanged ? "border-l-2 border-l-amber-400" : ""}`}
                                            >
                                                {utc.format(cellFormat)}
                                                {(i === 0 || dayChanged) && (
                                                    <span className="absolute -bottom-4 left-1 whitespace-nowrap text-[10px] font-sans font-medium text-amber-600">
                                                        {utc.format("DD MMM")}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Now marker */}
                                <div
                                    className="pointer-events-none absolute top-5 bottom-0 w-0.5 bg-red-500"
                                    style={{ left: `${nowLeftPct}%` }}
                                    aria-hidden
                                >
                                    <span className="absolute -top-1.5 -left-[3px] h-2 w-2 rounded-full bg-red-500" />
                                </div>
                            </div>
                        </div>
                        <div className="h-5" />
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-default-500">
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-primary" /> Current hour</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-red-500" /> Now</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-border bg-slate-50 dark:bg-slate-800/40" /> Night (18:00–06:00 local)</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-amber-400" /> UTC date changes</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default TimeComparisonDialog;
