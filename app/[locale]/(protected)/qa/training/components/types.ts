import { ReactNode } from 'react';

// ── Color Palette ──
export const C = {
    primary: '#1a56db',
    primary2: '#1e40af',
    primary3: '#3b82f6',
    primary4: '#93c5fd',
    primary5: '#dbeafe',
    green: '#16a34a',
    greenL: '#dcfce7',
    orange: '#d97706',
    orangeL: '#fef3c7',
    red: '#dc2626',
    redL: '#fee2e2',
    yellow: '#ca8a04',
    bg: '#f0f4ff',
    surface: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    muted: '#64748b',
    mutedL: '#94a3b8',
} as const;

// ── KPI Card ──
export interface KpiItem {
    label: string;
    val: string;
    sub: string;
    color: string;
    dotColor: string;
    icon: ReactNode;
    bg: string;
    border: string;
}

// ── Authorization Donut ──
export interface AuthItem {
    name: string;
    value: number;
    color: string;
}

// ── Workload Bar Chart ──
export interface WorkloadItem {
    month: string;
    scheduled: number;
    available: number;
    overload: number;
}

// ── Missing Skills ──
export interface MissingSkill {
    rank: number;
    name: string;
    cat: string;
    pct: number;
}

// ── Critical Alert ──
export interface CriticalAlert {
    emp: string;
    course: string;
    since: string;
    days: number;
    dept: string;
}

// ── Quick Stat ──
export interface QuickStatItem {
    label: string;
    val: string;
    icon: ReactNode;
    color: string;
    bg: string;
    border: string;
}
