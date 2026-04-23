// ─── Types ──────────────────────────────────────────────────────────────────

export interface Session {
    id: number
    courseId: number
    courseName: string
    courseCode: string
    category: string
    dateStart: string
    dateEnd: string
    timeStart: string
    timeEnd: string
    instructor: string
    venue: string
    dept: string
    maxParticipants: number
    enrolled: number
    status: string
    type: string
}

export interface Instructor {
    id: number
    name: string
    dept: string
}

export type SessionFormData = Omit<Session, 'id' | 'courseId'> & { courseId: number | string }

// ─── Status Config ──────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    Scheduled:  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    label: 'Scheduled' },
    Completed:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' },
    Full:       { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500',   label: 'Full' },
    Cancelled:  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-400',     label: 'Cancelled' },
    InProgress: { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  dot: 'bg-purple-500',  label: 'In Progress' },
}

export const CAT_COLOR: Record<string, { bar: string; light: string; text: string }> = {
    'Core':                    { bar: '#1a56db', light: '#eff6ff', text: '#1e40af' },
    'Aircraft Familiarization': { bar: '#0ea5e9', light: '#f0f9ff', text: '#0369a1' },
    'Aircraft Type':           { bar: '#6366f1', light: '#eef2ff', text: '#3730a3' },
    'Specialized':             { bar: '#f59e0b', light: '#fffbeb', text: '#92400e' },
    'Compliance':              { bar: '#10b981', light: '#f0fdf4', text: '#065f46' },
}

export const STATUSES = ['All', 'Scheduled', 'Completed', 'Full', 'Cancelled'] as const

// ─── Constants ──────────────────────────────────────────────────────────────

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ─── Helpers ────────────────────────────────────────────────────────────────

export function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
export function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay() }

/** Convert Date to YYYY-MM-DD string using local date components (timezone-safe) */
export function toYMD(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}
export function parseYMD(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }

export function formatDate(s: string) {
    const d = parseYMD(s)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function sessionDays(s: { dateStart: string; dateEnd: string }) {
    const a = parseYMD(s.dateStart), b = parseYMD(s.dateEnd)
    return Math.round((b.getTime() - a.getTime()) / 86400000) + 1
}

export const BLANK_FORM: SessionFormData = {
    courseId: '', courseName: '', courseCode: '', category: 'Core',
    dateStart: '', dateEnd: '', timeStart: '09:00', timeEnd: '17:00',
    instructor: '', venue: '', dept: 'All Departments',
    maxParticipants: 20, enrolled: 0, status: 'Scheduled', type: 'Initial',
}
