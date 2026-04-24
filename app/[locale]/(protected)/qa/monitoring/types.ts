// ─── Course Definitions ─────────────────────────────────────────────────────

export interface CourseRef {
    id: string
    short: string
    label: string
    interval: number // months
    code?: string | string[]
}

export interface Employee {
    no: number
    id: string
    name: string
    pos: string
    posGroup: string
    courses: Record<string, string>
}

export interface AlertItem {
    emp: Employee
    course: CourseRef
    daysLeft: number | null
    status: StatusType
}

// ─── Status Type ────────────────────────────────────────────────────────────

export type StatusType = 'valid' | 'warning' | 'expired' | 'missing' | 'na'

// ─── Status Helpers ─────────────────────────────────────────────────────────

// TODO: Replace with new Date() or server time when connected to real API
const TODAY = new Date('2026-03-19')

export function getStatus(dueStr: string): StatusType {
    if (!dueStr || dueStr === '-') return 'missing'
    if (dueStr === 'na') return 'na'
    const due = new Date(dueStr)
    const diff = Math.floor((due.getTime() - TODAY.getTime()) / 86400000)
    if (diff < 0) return 'expired'
    if (diff <= 90) return 'warning'
    return 'valid'
}

export function getDaysLeft(dueStr: string): number | null {
    if (!dueStr || dueStr === '-' || dueStr === 'na') return null
    const due = new Date(dueStr)
    return Math.floor((due.getTime() - TODAY.getTime()) / 86400000)
}

export function fmtDate(dueStr: string): string | null {
    if (!dueStr || dueStr === '-' || dueStr === 'na') return null
    const d = new Date(dueStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Status Visual Config ───────────────────────────────────────────────────

export const STATUS_META: Record<StatusType, { bg: string; dot: string; text: string; label: string }> = {
    valid:   { bg: '#dcfce7', dot: '#16a34a', text: '#15803d', label: 'Valid' },
    warning: { bg: '#fef3c7', dot: '#d97706', text: '#92400e', label: 'Warning' },
    expired: { bg: '#fee2e2', dot: '#dc2626', text: '#991b1b', label: 'Expired' },
    missing: { bg: '#f1f5f9', dot: '#94a3b8', text: '#64748b', label: '—' },
    na:      { bg: '#f8fafc', dot: '#cbd5e1', text: '#94a3b8', label: 'N/A' },
}

// ─── TW class versions ──────────────────────────────────────────────────────

export const STATUS_CLASSES: Record<StatusType, { bg: string; dot: string; text: string }> = {
    valid:   { bg: 'bg-emerald-50',  dot: 'bg-emerald-500', text: 'text-emerald-700' },
    warning: { bg: 'bg-amber-50',    dot: 'bg-amber-500',   text: 'text-amber-800' },
    expired: { bg: 'bg-red-50',      dot: 'bg-red-500',     text: 'text-red-800' },
    missing: { bg: 'bg-muted/50',    dot: 'bg-muted-foreground/40', text: 'text-muted-foreground' },
    na:      { bg: 'bg-muted/20',    dot: 'bg-muted-foreground/20', text: 'text-muted-foreground/60' },
}

// ─── Sort Type ──────────────────────────────────────────────────────────────

export type SortField = 'no' | 'name' | 'id' | 'pos' | 'expiry'
export type SortDir = 'asc' | 'desc'
