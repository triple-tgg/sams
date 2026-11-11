import type { TrainingMonitoringStaffCourse } from '@/lib/api/qa/dashboardSummary'

// ─── Course Definitions ─────────────────────────────────────────────────────

export interface CourseRef {
    id: string
    short: string
    label: string
    interval: number // months (recurrenceIntervalYears × 12; 0 when not recurrent)
    code?: string | string[]
    /** From the course list API: 'Initial' (one-time) or 'Recurrent' */
    courseType?: string
}

/** Short header label: "2yr" for recurrent courses, "Initial" otherwise. */
export function courseCycleLabel(c: CourseRef): string {
    return c.courseType === 'Recurrent' && c.interval > 0 ? `${c.interval / 12}yr` : 'Initial'
}

/** Long tooltip label: "Recurrent — every 2 years" or "Initial training". */
export function courseCycleText(c: CourseRef): string {
    if (c.courseType === 'Recurrent' && c.interval > 0) {
        const years = c.interval / 12
        return `Recurrent — every ${years} year${years === 1 ? '' : 's'}`
    }
    return 'Initial training'
}

export interface Employee {
    staffId?: number
    no: number
    id: string
    name: string
    pos: string
    posGroup: string
    courses: Record<string, string>
    courseStatuses?: Record<string, StatusType>
    courseDaysLeft?: Record<string, number | null>
    courseIssueDates?: Record<string, string | null>
    staffCourseData?: Record<string, TrainingMonitoringStaffCourse>
}

export interface AlertItem {
    emp: Employee
    course: CourseRef
    daysLeft: number | null
    status: StatusType
}

// ─── Status Type ────────────────────────────────────────────────────────────

export type StatusType = 'valid' | 'warning' | 'expired' | 'missing' | 'na' | 'Not Assigned'

// ─── Status Helpers ─────────────────────────────────────────────────────────

export function getStatus(dueStr: string): StatusType {
    if (!dueStr || dueStr === '-') return 'missing'
    if (dueStr === 'na') return 'na'
    if (dueStr === 'Not Assigned') return 'Not Assigned'
    if (dueStr.toLowerCase() === 'permanent' || dueStr.toLowerCase() === 'never' || dueStr.startsWith('9999')) return 'valid'
    const due = new Date(dueStr)
    if (isNaN(due.getTime())) return 'missing'
    const diff = Math.floor((due.getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'expired'
    if (diff <= 90) return 'warning'
    return 'valid'
}

export function getDaysLeft(dueStr: string): number | null {
    if (!dueStr || dueStr === '-' || dueStr === 'na') return null
    if (dueStr.toLowerCase() === 'permanent' || dueStr.toLowerCase() === 'never' || dueStr.startsWith('9999')) return null
    const due = new Date(dueStr)
    if (isNaN(due.getTime())) return null
    return Math.floor((due.getTime() - Date.now()) / 86400000)
}

export function computeStatusAndDaysLeft(validUntil: string | null | undefined): { status: StatusType; daysLeft: number | null } {
    if (!validUntil || validUntil === '-' || validUntil === 'na') {
        return { status: 'missing', daysLeft: null }
    }
    if (validUntil.toLowerCase() === 'permanent' || validUntil.toLowerCase() === 'never' || validUntil.startsWith('9999')) {
        return { status: 'valid', daysLeft: null }
    }
    const d = new Date(validUntil)
    if (isNaN(d.getTime())) {
        return { status: 'missing', daysLeft: null }
    }
    const diff = Math.floor((d.getTime() - Date.now()) / 86400000)
    if (diff < 0) return { status: 'expired', daysLeft: diff }
    if (diff <= 90) return { status: 'warning', daysLeft: diff }
    return { status: 'valid', daysLeft: diff }
}

export function formatDisplayDate(dateStr: string | null | undefined): string {
    if (!dateStr || dateStr === '-' || dateStr === 'na') return '-'
    if (dateStr.toLowerCase() === 'permanent' || dateStr.toLowerCase() === 'never' || dateStr.startsWith('9999')) return 'Never'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function toInputDateFormat(dateStr: string | null | undefined): string {
    if (!dateStr || dateStr === '-' || dateStr === 'na') return ''
    if (dateStr.toLowerCase() === 'permanent' || dateStr.toLowerCase() === 'never' || dateStr.startsWith('9999')) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

export function getEmployeeCourseStatus(employee: Employee, courseId: string): StatusType {
    return employee.courseStatuses?.[courseId] ?? getStatus(employee.courses[courseId])
}

export function getEmployeeCourseDaysLeft(employee: Employee, courseId: string): number | null {
    if (employee.courseDaysLeft && courseId in employee.courseDaysLeft) {
        return employee.courseDaysLeft[courseId]
    }
    return getDaysLeft(employee.courses[courseId])
}

export function fmtDate(dueStr: string): string | null {
    if (!dueStr || dueStr === '-' || dueStr === 'na') return null
    const d = new Date(dueStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Status Visual Config ───────────────────────────────────────────────────

export const STATUS_META: Record<StatusType, { bg: string; dot: string; text: string; label: string }> = {
    valid:          { bg: '#dcfce7', dot: '#16a34a', text: '#15803d', label: 'Valid' },
    warning:        { bg: '#fef3c7', dot: '#d97706', text: '#92400e', label: 'Warning' },
    expired:        { bg: '#fee2e2', dot: '#dc2626', text: '#991b1b', label: 'Expired' },
    missing:        { bg: '#f1f5f9', dot: '#94a3b8', text: '#64748b', label: '—' },
    na:             { bg: '#f8fafc', dot: '#cbd5e1', text: '#94a3b8', label: 'N/A' },
    'Not Assigned': { bg: '#f8fafc', dot: '#cbd5e1', text: '#94a3b8', label: 'Not Assigned' },
}

// ─── TW class versions ──────────────────────────────────────────────────────

export const STATUS_CLASSES: Record<StatusType, { bg: string; dot: string; text: string }> = {
    valid:          { bg: 'bg-emerald-50',  dot: 'bg-emerald-500', text: 'text-emerald-700' },
    warning:        { bg: 'bg-amber-50',    dot: 'bg-amber-500',   text: 'text-amber-800' },
    expired:        { bg: 'bg-red-50',      dot: 'bg-red-500',     text: 'text-red-800' },
    missing:        { bg: 'bg-muted/50',    dot: 'bg-muted-foreground/40', text: 'text-muted-foreground' },
    na:             { bg: 'bg-muted/20',    dot: 'bg-muted-foreground/20', text: 'text-muted-foreground/60' },
    'Not Assigned': { bg: 'bg-muted/20',    dot: 'bg-muted-foreground/20', text: 'text-muted-foreground/60' },
}

// ─── Sort Type ──────────────────────────────────────────────────────────────

export type SortField = 'no' | 'name' | 'id' | 'pos' | 'expiry'
export type SortDir = 'asc' | 'desc'
