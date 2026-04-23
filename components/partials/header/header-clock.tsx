"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
// Import centralized dayjs configuration to ensure plugins like UTC are loaded
import "@/lib/dayjs"; 

const HeaderClock = () => {
    const [mounted, setMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState(dayjs());
    const [localLocation, setLocalLocation] = useState("");

    useEffect(() => {
        setMounted(true);
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz) {
                // Extracts "Bangkok" from "Asia/Bangkok"
                const city = tz.split('/').pop()?.replace(/_/g, ' ');
                if (city) setLocalLocation(`(${city})`);
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
            <div className="hidden xl:flex items-center gap-4 text-[13px] font-medium text-slate-600 dark:text-slate-300 mr-2">
                <div className="h-4 w-[150px] bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
                <div className="h-3 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="h-4 w-[150px] bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="hidden xl:flex items-center gap-4 text-[13px] font-medium text-slate-600 dark:text-slate-300 mr-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
                <span className="text-slate-400 dark:text-slate-500 font-semibold text-[10px] tracking-widest uppercase">Local {localLocation}</span>
                <span className="font-mono tracking-tight min-w-[140px] text-center">{currentTime.format("DD MMM YYYY HH:mm:ss")}</span>
            </div>
            <div className="h-3 w-px bg-slate-300 dark:bg-slate-600"></div>
            <div className="flex items-center gap-1.5">
                <span className="text-slate-400 dark:text-slate-500 font-semibold text-[10px] tracking-widest uppercase">UTC</span>
                <span className="font-mono tracking-tight min-w-[140px] text-center">{currentTime.utc().format("DD MMM YYYY HH:mm:ss")}</span>
            </div>
        </div>
    );
};

export default HeaderClock;
