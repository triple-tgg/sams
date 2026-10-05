'use client';

import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StationItem } from '@/lib/api/master/stations/stations.interface';

export function RosterHeader({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    {icon}
                </div>
                <div className="min-w-0">
                    <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
            {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
    );
}

export function StationSelect({
    stations,
    value,
    onChange,
    allowAll = false,
    extraOptions = [],
}: {
    stations: StationItem[];
    value: string;
    onChange: (code: string) => void;
    allowAll?: boolean;
    extraOptions?: { value: string; label: string }[];
}) {
    return (
        <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Station</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
                {allowAll && <option value="">All stations</option>}
                {stations.map((s) => (
                    <option key={s.id} value={s.code}>
                        {s.code}
                    </option>
                ))}
                {extraOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

export function WeekNav({ weekStart, onChange }: { weekStart: Date; onChange: (next: Date) => void }) {
    const start = dayjs(weekStart);
    const label = `${start.format('DD MMM')} – ${start.add(6, 'day').format('DD MMM YYYY')}`;
    const btn =
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted';
    return (
        <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Previous week" className={btn} onClick={() => onChange(start.subtract(7, 'day').toDate())}>
                <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[170px] text-center text-sm font-medium tabular-nums">{label}</span>
            <button type="button" aria-label="Next week" className={btn} onClick={() => onChange(start.add(7, 'day').toDate())}>
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

export function StatTile({
    label,
    value,
    unit,
    tone = 'default',
}: {
    label: string;
    value: ReactNode;
    unit?: string;
    tone?: 'default' | 'danger' | 'success' | 'warning';
}) {
    return (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
                <span
                    className={cn(
                        'text-2xl font-semibold tabular-nums',
                        tone === 'danger' && 'text-red-600 dark:text-red-400',
                        tone === 'success' && 'text-emerald-600 dark:text-emerald-400',
                        tone === 'warning' && 'text-amber-600 dark:text-amber-400'
                    )}
                >
                    {value}
                </span>
                {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
            </div>
        </div>
    );
}

export function Pill({
    children,
    tone = 'default',
    title,
}: {
    children: ReactNode;
    tone?: 'default' | 'danger' | 'success' | 'warning' | 'info';
    title?: string;
}) {
    return (
        <span
            title={title}
            className={cn(
                'inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium',
                tone === 'default' && 'bg-muted text-muted-foreground',
                tone === 'danger' && 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
                tone === 'success' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                tone === 'warning' && 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
                tone === 'info' && 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
            )}
        >
            {children}
        </span>
    );
}

export function LoadingBlock({ label = 'Loading...' }: { label?: string }) {
    return (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {label}
        </div>
    );
}

export function EmptyBlock({ children }: { children: ReactNode }) {
    return <div className="py-16 text-center text-sm text-muted-foreground">{children}</div>;
}

/** Shared table cell classes so the four pages read as one module. */
export const th = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap';
export const td = 'px-3 py-2 text-sm align-top';
