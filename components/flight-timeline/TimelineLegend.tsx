'use client';

/** Key for the bar styles used by the Day and Week timelines (see getFlightBarStyle in utils). */
export function TimelineLegend() {
    return (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 pt-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-2">
                <span className="h-4 w-7 rounded bg-slate-700 dark:bg-slate-300" />
                Current
            </span>
            <span className="flex items-center gap-2">
                <span className="h-4 w-7 rounded border-2 border-dashed border-slate-700 bg-slate-700/30 dark:border-slate-300 dark:bg-slate-300/30" />
                Planning
            </span>
            <span className="flex items-center gap-2">
                <span
                    className="h-4 w-7 rounded border border-dashed border-slate-500"
                    style={{ background: 'repeating-linear-gradient(135deg, rgba(100,116,139,0.18) 0 4px, rgba(100,116,139,0.38) 4px 8px)' }}
                />
                Cancelled
            </span>
            <span className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">!</span>
                Missing staff (CS / MECH)
            </span>
        </div>
    );
}
