"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
// Import centralized dayjs configuration to ensure plugins like UTC are loaded
import "@/lib/dayjs";
import { TimeComparisonDialog } from "./time-comparison-dialog";

const HeaderClock = () => {
    const [mounted, setMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState(dayjs());
    const [localLocation, setLocalLocation] = useState("");
    const [localCity, setLocalCity] = useState("");
    const [compareOpen, setCompareOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz) {
                // Extracts "Bangkok" from "Asia/Bangkok"
                const city = tz.split('/').pop()?.replace(/_/g, ' ');
                if (city) {
                    setLocalLocation(`(${city})`);
                    setLocalCity(city);
                }
            }
        } catch (e) {
            // fallback
        }

        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="hidden xl:flex items-center text-[13px] font-medium text-slate-600 dark:text-slate-300 mr-2">
                <div className="h-4 w-[230px] bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
            </div>
        );
    }

    const utcText = currentTime.utc().format("DD MMM YYYY HH:mm:ss");

    // Collapsed: Local only. Hover / keyboard focus slides the UTC part open.
    // The grid-template-columns 0fr → 1fr transition animates to the content's natural width.
    // Click opens the 24-hour Local vs UTC comparison.
    return (
        <>
        <button
            type="button"
            onClick={() => setCompareOpen(true)}
            title="Show 24-hour time comparison"
            aria-label={`Local time ${currentTime.format("DD MMM YYYY HH:mm:ss")}, UTC ${utcText}. Show 24-hour time comparison`}
            className="group hidden xl:flex items-center text-[13px] font-medium text-slate-600 dark:text-slate-300 mr-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary/30 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
            <div className="flex items-center gap-1.5">
                <span className="text-slate-400 dark:text-slate-500 font-semibold text-[10px] tracking-widest uppercase">Local {localLocation}</span>
                <span className="font-mono tracking-tight min-w-[140px] text-center">{currentTime.format("DD MMM YYYY HH:mm:ss")}</span>
            </div>
            <div className="grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] duration-300 ease-out group-hover:grid-cols-[1fr] group-hover:opacity-100 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100 motion-reduce:transition-none">
                <div className="min-w-0 overflow-hidden" aria-hidden>
                    <div className="flex items-center gap-4 pl-4 whitespace-nowrap">
                        <div className="h-3 w-px bg-slate-300 dark:bg-slate-600"></div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 dark:text-slate-500 font-semibold text-[10px] tracking-widest uppercase">UTC</span>
                            <span className="font-mono tracking-tight min-w-[140px] text-center">{utcText}</span>
                        </div>
                    </div>
                </div>
            </div>
        </button>
        <TimeComparisonDialog
            open={compareOpen}
            onOpenChange={setCompareOpen}
            now={currentTime}
            localCity={localCity}
        />
        </>
    );
};

export default HeaderClock;
