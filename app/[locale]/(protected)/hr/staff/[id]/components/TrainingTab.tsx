'use client'

import { useState, useMemo, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CollapsibleCard } from './CollapsibleCard'
import { BookOpen, History, Pencil, Check, X as XIcon, ClipboardList, Calendar, Building2, Clock, AlertTriangle, ShieldCheck, Trash2, Plus, Loader2, Search, Filter } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { StaffData, CurrentTrainingRecord } from '../types'
import { formatDate } from '../utils'
import { useStaffTrainingDashboard, useCreateTrainingHistory, useUpdateTrainingHistory, useDeleteTrainingHistory } from '@/lib/api/hooks/useQAStaffManagement'
import type { TrainingDashboardResponseData, TrainingDashboardCurrentTraining, TrainingDashboardPreviousTraining } from '@/lib/api/qa/staff-management'
import { toast } from 'sonner'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

// ── SVG Donut Chart ──
function DonutChart({ percentage }: { percentage: number }) {
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const filled = (percentage / 100) * circumference
    const empty = circumference - filled

    // Color based on completion
    const color = percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444'

    return (
        <div className="relative w-[140px] h-[140px] mx-auto mb-5">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                {/* Background ring */}
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                {/* Filled ring */}
                <circle
                    cx="60" cy="60" r={radius} fill="none"
                    stroke={color} strokeWidth="10"
                    strokeDasharray={`${filled} ${empty}`}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">{percentage}%</span>
            </div>
        </div>
    )
}

// ── Compute training status from validUntil ──
function getTrainingStatus(validUntil: string): 'Valid' | 'Expired' | 'Permanent' | 'Expiring Soon' {
    if (!validUntil || validUntil === '-') return 'Permanent'
    const parsed = new Date(validUntil)
    if (isNaN(parsed.getTime())) return 'Permanent'
    const now = new Date()
    if (parsed < now) return 'Expired'
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    if (parsed <= in90Days) return 'Expiring Soon'
    return 'Valid'
}

// ── Format validUntil: show "Permanent" as-is, otherwise format as date ──
function formatValidUntil(val: string, fallback = '—'): string {
    if (!val) return fallback
    const parsed = new Date(val)
    if (isNaN(parsed.getTime())) return val // e.g. "Permanent"
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

type NeedsMatrixCourse = TrainingDashboardResponseData['needsMatrix']['courses'][number]

// The API reports `status` ("Valid" / "Required" / ...); `completed` is the older field.
function isCourseValid(c: NeedsMatrixCourse): boolean {
    return c.completed ?? c.status?.trim().toLowerCase() === 'valid'
}

function courseStatusLabel(c: NeedsMatrixCourse): string {
    if (isCourseValid(c)) return 'Valid'
    const raw = c.status?.trim() || 'Required'
    // Normalize case so "expired" and "Expired" land in the same group.
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

/** Display order of statuses; anything else follows, alphabetically. */
const STATUS_ORDER = ['Valid', 'Expired', 'Required']

function statusRank(label: string): number {
    const i = STATUS_ORDER.indexOf(label)
    return i === -1 ? STATUS_ORDER.length : i
}

function compareStatus(a: string, b: string): number {
    return statusRank(a) - statusRank(b) || a.localeCompare(b)
}

// ── Training Needs Matrix Card (API-driven) ──
function TrainingNeedsMatrixFromApi({ matrix }: { matrix: TrainingDashboardResponseData['needsMatrix'] | null }) {
    const total = matrix?.totalRequired ?? 0
    const completed = matrix?.validCount ?? 0
    const percentage = matrix?.completionPercentage ?? 0
    const [statusFilter, setStatusFilter] = useState<string>('All')
    const [search, setSearch] = useState('')

    // Valid, Expired, Required, then any other status; the API's order is kept within each group.
    const courses = useMemo(() => {
        const list = matrix?.courses ?? []
        return list
            .map((c, i) => ({ c, i, label: courseStatusLabel(c) }))
            .sort((a, b) => compareStatus(a.label, b.label) || a.i - b.i)
            .map(({ c }) => c)
    }, [matrix])

    // "All" then each status in display order, with counts. Valid, Expired and Required always show.
    const statusOptions = useMemo(() => {
        const counts = new Map<string, number>()
        for (const c of courses) {
            const label = courseStatusLabel(c)
            counts.set(label, (counts.get(label) ?? 0) + 1)
        }
        const labels = Array.from(new Set([...STATUS_ORDER, ...counts.keys()])).sort(compareStatus)
        return [
            { label: 'All', count: courses.length },
            ...labels.map((label) => ({ label, count: counts.get(label) ?? 0 })),
        ]
    }, [courses])

    const visibleCourses = useMemo(() => {
        const q = search.trim().toLowerCase()
        return courses.filter((c) => {
            if (statusFilter !== 'All' && courseStatusLabel(c) !== statusFilter) return false
            if (!q) return true
            return (c.name || c.courseName || '').toLowerCase().includes(q)
        })
    }, [courses, statusFilter, search])

    if (!matrix || total === 0) {
        return (
            <CollapsibleCard icon={<ClipboardList className="h-4 w-4" />} iconClassName="bg-emerald-50 text-emerald-600" title="Training Needs Matrix">
                {/* Warning */}
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
                        <AlertTriangle className="h-6 w-6 text-amber-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">No Required Courses</p>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">
                        Please select <span className="font-semibold text-slate-500">Position</span> and <span className="font-semibold text-slate-500">Department</span> in Employment info to view required courses.
                    </p>
                </div>
            </CollapsibleCard>
        )
    }

    return (
        <CollapsibleCard icon={<ClipboardList className="h-4 w-4" />} iconClassName="bg-emerald-50 text-emerald-600" title="Training Needs Matrix">

            {/* Donut chart */}
            <DonutChart percentage={percentage} />

            {/* Summary */}
            <div className="text-center mb-5">
                <span className="text-sm text-slate-500">
                    <span className="font-bold text-slate-800">{completed}</span> / {total} courses valid
                </span>
            </div>

            {/* Filters */}
            <div className="mb-3 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                    {statusOptions.map(({ label, count }) => {
                        const active = statusFilter === label
                        const tone =
                            label === 'Valid'
                                ? active ? 'bg-emerald-600 text-white border-emerald-600' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                : label === 'All'
                                    ? active ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                                    : label === 'Expired'
                                        ? active ? 'bg-amber-500 text-white border-amber-500' : 'text-amber-700 border-amber-200 hover:bg-amber-50'
                                        : active ? 'bg-red-500 text-white border-red-500' : 'text-red-600 border-red-200 hover:bg-red-50'
                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => setStatusFilter(label)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${tone}`}
                            >
                                {label}
                                <span className={active ? 'opacity-80' : 'opacity-60'}>{count}</span>
                            </button>
                        )
                    })}
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search course"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder:text-slate-400"
                />
            </div>

            {/* Course checklist */}
            <ScrollArea viewportClassName="max-h-[500px]">
            <div className="space-y-2 pr-3">
                {visibleCourses.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No courses match the filter.</p>
                )}
                {visibleCourses.map((c, i) => {
                    const isValid = isCourseValid(c)
                    const statusLabel = courseStatusLabel(c)
                    return (
                    <div key={c.courseId ?? i} className="flex items-start gap-2.5 py-1.5">
                        {/* Icon */}
                        {isValid ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                            </div>
                        ) : statusLabel === 'Expired' ? (
                            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Clock className="h-3 w-3 text-amber-600" strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                <XIcon className="h-3 w-3 text-red-500" strokeWidth={3} />
                            </div>
                        )}
                        {/* Course info */}
                        <div className="flex-1 min-w-0">
                            {(() => {
                                const courseName = (c.name || c.courseName || '-').replace(/\s*\n\s*/g, ' ')
                                return (
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className={`line-clamp-2 break-words cursor-default text-[13px] font-medium leading-snug ${isValid ? 'text-slate-700' : 'text-slate-500'}`}>
                                                    {courseName}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="z-[9999] max-w-sm text-xs font-normal bg-slate-900 text-slate-50 shadow-md px-2.5 py-1.5 rounded">
                                                {courseName}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )
                            })()}
                        </div>
                        {/* Status badge */}
                        {!isValid && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${statusLabel === 'Expired' ? 'text-amber-600' : 'text-red-500'}`}>
                                {statusLabel}
                            </span>
                        )}
                    </div>
                    )
                })}
            </div>
            </ScrollArea>
        </CollapsibleCard>
    )
}

// ── Training Needs Matrix Card (Fallback from StaffData) ──
function TrainingNeedsMatrix({ staff }: { staff: StaffData }) {
    const matrix = useMemo(() => {
        // Only track courses that have a validUntil (recurrent / certification courses)
        const trackable = (staff.currentTraining ?? []).filter(t => t.validUntil)
        const courses = trackable.map(t => ({
            name: t.course,
            status: getTrainingStatus(t.validUntil),
            completed: getTrainingStatus(t.validUntil) === 'Valid',
        }))
        const total = courses.length
        const completed = courses.filter(c => c.completed).length
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
        return { courses, total, completed, percentage }
    }, [staff.currentTraining])

    if (matrix.total === 0) {
        return (
            <CollapsibleCard icon={<ClipboardList className="h-4 w-4" />} iconClassName="bg-emerald-50 text-emerald-600" title="Training Needs Matrix">
                {/* Warning */}
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
                        <AlertTriangle className="h-6 w-6 text-amber-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">No Required Courses</p>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">
                        Please select <span className="font-semibold text-slate-500">Position</span> and <span className="font-semibold text-slate-500">Department</span> in Employment info to view required courses.
                    </p>
                </div>
            </CollapsibleCard>
        )
    }

    return (
        <CollapsibleCard icon={<ClipboardList className="h-4 w-4" />} iconClassName="bg-emerald-50 text-emerald-600" title="Training Needs Matrix">

            {/* Donut chart */}
            <DonutChart percentage={matrix.percentage} />

            {/* Summary */}
            <div className="text-center mb-5">
                <span className="text-sm text-slate-500">
                    <span className="font-bold text-slate-800">{matrix.completed}</span> / {matrix.total} courses valid
                </span>
            </div>

            {/* Course checklist */}
            <ScrollArea viewportClassName="max-h-[500px]">
            <div className="space-y-2 pr-3">
                {matrix.courses.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5 py-1.5">
                        {/* Icon */}
                        {c.completed ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                <XIcon className="h-3 w-3 text-red-500" strokeWidth={3} />
                            </div>
                        )}
                        {/* Course info */}
                        <div className="flex-1 min-w-0">
                            {(() => {
                                const courseName = c.name || (c as { courseName?: string }).courseName || '-'
                                return (
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className={`line-clamp-2 break-words cursor-default text-[13px] font-medium leading-snug ${c.completed ? 'text-slate-700' : 'text-slate-500'}`}>
                                                    {courseName}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="z-[9999] max-w-sm text-xs font-normal bg-slate-900 text-slate-50 shadow-md px-2.5 py-1.5 rounded">
                                                {courseName}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )
                            })()}
                        </div>
                        {/* Status badge */}
                        {!c.completed && (
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider shrink-0 mt-0.5">
                                Required
                            </span>
                        )}
                    </div>
                ))}
            </div>
            </ScrollArea>
        </CollapsibleCard>
    )
}

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
    const styles = {
        Valid: 'bg-green-50 text-green-600',
        Expired: 'bg-red-50 text-red-600',
        Permanent: 'bg-sky-50 text-slate-500',
        'Expiring Soon': 'bg-amber-50 text-amber-600',
    }[status] ?? 'bg-slate-100 text-slate-500'

    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${styles}`}>
            {status}
        </span>
    )
}

// ── Training Detail Modal ──
function TrainingDetailModal({ record, onClose }: { record: CurrentTrainingRecord | null; onClose: () => void }) {
    if (!record) return null

    const status = getTrainingStatus(record.validUntil)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="text-base font-bold text-slate-800">Training Detail</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-all duration-200 border-none bg-transparent"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-7 py-6 space-y-5">
                    {/* Course Name */}
                    <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Training Course</span>
                        <span className="text-[15px] font-semibold text-slate-800 leading-snug">{record.course}</span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                        <StatusBadge status={status} />
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">From</span>
                                <span className="text-sm font-medium text-slate-800">{record.dateFrom ? formatDate(record.dateFrom) : '-'}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">To</span>
                                <span className="text-sm font-medium text-slate-800">{record.dateTo ? formatDate(record.dateTo) : '-'}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Valid Until</span>
                                <span className="text-sm font-medium text-slate-800">{formatValidUntil(record.validUntil, 'Never')}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4 text-violet-600" />
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Conducted By</span>
                                <span className="text-sm font-medium text-slate-800">{record.provider || "-"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-7 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Loading Skeleton ──
function TrainingLoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 animate-pulse">
            <div className="min-w-0 xl:col-span-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white border border-[#e8ecf1] rounded-[14px] py-3.5 px-3.5 sm:py-5 sm:px-5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 mb-3" />
                            <div className="h-8 w-12 bg-slate-100 rounded mb-1" />
                            <div className="h-3 w-24 bg-slate-100 rounded" />
                        </div>
                    ))}
                </div>
                <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-4 px-4 sm:py-6 sm:px-7">
                    <div className="h-5 w-40 bg-slate-100 rounded mb-5" />
                    <div className="w-[140px] h-[140px] rounded-full bg-slate-100 mx-auto mb-5" />
                    <div className="h-4 w-32 bg-slate-100 rounded mx-auto mb-5" />
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-4 bg-slate-100 rounded" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="min-w-0 xl:col-span-8">
                <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-4 px-4 sm:py-6 sm:px-7 mb-4">
                    <div className="h-5 w-40 bg-slate-100 rounded mb-5" />
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-10 bg-slate-100 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Training Tab ──
// ── Inline editing types ──
interface EditingHistoryRow {
    courseName: string
    academyName: string
    dateFrom: string
    dateTo: string
}

const emptyHistoryRow = (): EditingHistoryRow => ({
    courseName: '', academyName: '', dateFrom: '', dateTo: '',
})

/** Case-insensitive match on a course name; an empty query matches everything. */
function matchesCourse(name: string | null | undefined, query: string): boolean {
    const q = query.trim().toLowerCase()
    return !q || (name ?? '').toLowerCase().includes(q)
}

type TrainingStatus = ReturnType<typeof getTrainingStatus>

/** Filter order: the statuses that need action first. */
const TRAINING_STATUS_ORDER: TrainingStatus[] = ['Expired', 'Expiring Soon', 'Valid', 'Permanent']

// ── Status column header with a filter list ──
function StatusFilterHeader({
    label,
    value,
    onChange,
    counts,
}: {
    label: string
    value: TrainingStatus | 'All'
    onChange: (v: TrainingStatus | 'All') => void
    counts: Record<TrainingStatus, number>
}) {
    const [open, setOpen] = useState(false)
    const total = TRAINING_STATUS_ORDER.reduce((sum, st) => sum + counts[st], 0)
    const active = value !== 'All'
    const options: Array<[TrainingStatus | 'All', number]> = [['All', total], ...TRAINING_STATUS_ORDER.map((st) => [st, counts[st]] as [TrainingStatus, number])]

    return (
        <span className="inline-flex items-center gap-1.5">
            {label}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={`inline-flex items-center justify-center w-5 h-5 rounded cursor-pointer border-none ${active ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-transparent hover:text-blue-600 hover:bg-blue-50'}`}
                        title="Filter by status"
                        aria-label="Filter by status"
                    >
                        <Filter className="h-3.5 w-3.5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1 normal-case tracking-normal">
                    {options.map(([st, count]) => {
                        const selected = value === st
                        return (
                            <button
                                key={st}
                                type="button"
                                onClick={() => { onChange(st); setOpen(false) }}
                                disabled={st !== 'All' && count === 0}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left cursor-pointer bg-transparent border-none disabled:opacity-40 disabled:cursor-not-allowed ${selected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Check className={`h-3.5 w-3.5 ${selected ? 'opacity-100' : 'opacity-0'}`} />
                                    {st === 'All' ? 'All statuses' : <StatusBadge status={st} />}
                                </span>
                                <span className="text-slate-400 tabular-nums">{count}</span>
                            </button>
                        )
                    })}
                </PopoverContent>
            </Popover>
            {active && (
                <button
                    type="button"
                    onClick={() => onChange('All')}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold normal-case tracking-normal cursor-pointer border-none hover:bg-blue-100"
                    title="Clear status filter"
                >
                    {value}
                    <XIcon className="h-3 w-3" />
                </button>
            )}
        </span>
    )
}

// ── Column header that turns into a search box when its icon is clicked ──
function ColumnSearchHeader({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false)
    const active = value.trim() !== ''

    if (!open && !active) {
        return (
            <span className="inline-flex items-center gap-1.5">
                {label}
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center justify-center w-5 h-5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer bg-transparent border-none"
                    title={`Search ${label.toLowerCase()}`}
                    aria-label={`Search ${label.toLowerCase()}`}
                >
                    <Search className="h-3.5 w-3.5" />
                </button>
            </span>
        )
    }

    const close = () => {
        onChange('')
        setOpen(false)
    }

    return (
        <div className="relative normal-case tracking-normal font-normal">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500" />
            <input
                type="text"
                value={value}
                autoFocus
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') close() }}
                onBlur={() => { if (!value.trim()) setOpen(false) }}
                placeholder={`Search ${label.toLowerCase()}`}
                className="w-full min-w-[160px] pl-7 pr-7 py-1 border border-blue-300 rounded-md text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
            />
            <button
                type="button"
                // mousedown so the input's blur does not close the box before the click lands
                onMouseDown={(e) => { e.preventDefault(); close() }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
                title="Clear search"
                aria-label="Clear search"
            >
                <XIcon className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}

export function TrainingTab({ staff }: { staff: StaffData }) {
    const [selectedTraining, setSelectedTraining] = useState<CurrentTrainingRecord | null>(null)

    // ── Inline editing state ──
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editingData, setEditingData] = useState<EditingHistoryRow>(emptyHistoryRow())
    const [isAdding, setIsAdding] = useState(false)
    const [previousOpen, setPreviousOpen] = useState(false)
    const [addingData, setAddingData] = useState<EditingHistoryRow>(emptyHistoryRow())
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [trainingSearch, setTrainingSearch] = useState('')
    const [trainingStatusFilter, setTrainingStatusFilter] = useState<TrainingStatus | 'All'>('All')
    const [previousSearch, setPreviousSearch] = useState('')

    // ── Fetch training dashboard from API ──
    const { data: trainingData, isLoading, isError } = useStaffTrainingDashboard(staff.id)
    const apiData = trainingData?.responseData

    // ── Mutation hooks ──
    const createMutation = useCreateTrainingHistory(staff.id)
    const updateMutation = useUpdateTrainingHistory(staff.id)
    const deleteMutation = useDeleteTrainingHistory(staff.id)

    // ── Determine if API data is available (call succeeded) ──
    const hasApiData = !!apiData

    // ── Map API data to component-usable format ──
    const currentTraining: CurrentTrainingRecord[] = useMemo(() => {
        if (hasApiData) {
            const records = apiData?.records ?? []
            return records.map((t: TrainingDashboardCurrentTraining) => {
                return {
                    dateFrom: t.dateFrom ?? '',
                    dateTo: t.dateTo ?? '',
                    validUntil: t.validUntil,
                    course: t.courseName,
                    provider: t.providedBy,
                }
            })
        }
        // Fallback to StaffData prop (only when API failed)
        return staff.currentTraining ?? []
    }, [hasApiData, apiData?.records, apiData?.histories, staff.currentTraining])

    const previousTraining = useMemo(() => {
        if (hasApiData) {
            return (apiData?.histories ?? []).map((t: TrainingDashboardPreviousTraining) => ({
                dateFrom: t.dateFrom,
                dateTo: t.dateTo,
                course: t.courseName,
                provider: t.academyName,
            }))
        }
        return staff.previousTraining ?? []
    }, [hasApiData, apiData?.histories, staff.previousTraining])

    const stats = useMemo(() => {
        if (hasApiData && apiData?.summary) {
            return {
                total: apiData.summary.totalCourses ?? 0,
                expired: apiData.summary.expired ?? 0,
                permanent: apiData.summary.permanent ?? 0,
                expiringSoon: apiData.summary.expiringSoon ?? 0,
            }
        }
        // Fallback: compute from currentTraining (only when API failed)
        const total = currentTraining.length
        const expired = currentTraining.filter(t => getTrainingStatus(t.validUntil) === 'Expired').length
        const permanent = currentTraining.filter(t => getTrainingStatus(t.validUntil) === 'Permanent').length
        const now = new Date()
        const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        const expiringSoon = currentTraining.filter(t => {
            if (!t.validUntil || t.validUntil === '-') return false
            const parsed = new Date(t.validUntil)
            if (isNaN(parsed.getTime())) return false
            return parsed >= now && parsed <= in90Days
        }).length
        return { total, expired, permanent, expiringSoon }
    }, [hasApiData, apiData?.summary, currentTraining])

    // ── Inline editing handlers ──
    const apiHistories = apiData?.histories ?? []

    // Status counts follow the course search, so each option says how many rows it would show.
    const trainingStatusCounts = useMemo(() => {
        const counts: Record<TrainingStatus, number> = { Valid: 0, Expired: 0, Permanent: 0, 'Expiring Soon': 0 }
        for (const t of currentTraining) {
            if (matchesCourse(t.course, trainingSearch)) counts[getTrainingStatus(t.validUntil)]++
        }
        return counts
    }, [currentTraining, trainingSearch])

    const visibleTraining = useMemo(
        () =>
            currentTraining.filter(
                (t) =>
                    matchesCourse(t.course, trainingSearch) &&
                    (trainingStatusFilter === 'All' || getTrainingStatus(t.validUntil) === trainingStatusFilter)
            ),
        [currentTraining, trainingSearch, trainingStatusFilter]
    )
    // The row being edited stays visible even if the edit makes it stop matching.
    const visibleHistories = useMemo(
        () => apiHistories.filter((h) => h.id === editingId || matchesCourse(h.courseName, previousSearch)),
        [apiHistories, previousSearch, editingId]
    )

    const isAnyMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

    const startEdit = useCallback((history: TrainingDashboardPreviousTraining) => {
        setEditingId(history.id)
        setEditingData({
            courseName: history.courseName,
            academyName: history.academyName,
            dateFrom: history.dateFrom,
            dateTo: history.dateTo,
        })
    }, [])

    const cancelEdit = useCallback(() => {
        setEditingId(null)
        setEditingData(emptyHistoryRow())
    }, [])

    const validateDates = useCallback((data: EditingHistoryRow): boolean => {
        if (!data.dateFrom) {
            toast.error('Date From is required')
            return false
        }
        if (!data.dateTo) {
            toast.error('Date To is required')
            return false
        }
        if (data.dateFrom > data.dateTo) {
            toast.error('Date From must be before or equal to Date To')
            return false
        }
        return true
    }, [])

    const saveEdit = useCallback(() => {
        if (!editingId || !editingData.courseName.trim()) {
            toast.error('Course Name is required')
            return
        }
        if (!validateDates(editingData)) return
        updateMutation.mutate(
            { historyId: editingId, data: editingData },
            { onSuccess: () => cancelEdit() }
        )
    }, [editingId, editingData, updateMutation, cancelEdit, validateDates])

    const startAdd = useCallback(() => {
        setIsAdding(true)
        setAddingData(emptyHistoryRow())
    }, [])

    const cancelAdd = useCallback(() => {
        setIsAdding(false)
        setAddingData(emptyHistoryRow())
    }, [])

    const saveAdd = useCallback(() => {
        if (!addingData.courseName.trim()) {
            toast.error('Course Name is required')
            return
        }
        if (!validateDates(addingData)) return
        createMutation.mutate(addingData, {
            onSuccess: () => cancelAdd()
        })
    }, [addingData, createMutation, cancelAdd, validateDates])

    const handleDelete = useCallback((historyId: number) => {
        setDeletingId(historyId)
    }, [])

    const confirmDelete = useCallback(() => {
        if (!deletingId) return
        deleteMutation.mutate(deletingId, {
            onSuccess: () => setDeletingId(null)
        })
    }, [deletingId, deleteMutation])

    // ── Loading state ──
    if (isLoading) {
        return <TrainingLoadingSkeleton />
    }

    return (
        <>
            {/* Error banner (non-blocking - still shows fallback data) */}
            {isError && (
                <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm text-amber-700">
                        Unable to load training data from server. Showing cached data.
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="min-w-0 xl:col-span-4">
                    {/* Summary Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2 sm:gap-3 mb-4">
                        {/* Training Course Count */}
                        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-3.5 px-3.5 sm:py-5 sm:px-5 min-w-0">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">{stats.total}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide sm:tracking-wider break-words">Training Courses</div>
                        </div>

                        {/* Training Expired Count */}
                        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-3.5 px-3.5 sm:py-5 sm:px-5 min-w-0">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-500">
                                    <Clock className="h-4 w-4" />
                                </div>
                            </div>
                            <div className={`text-2xl sm:text-3xl font-bold mb-1 ${stats.expired > 0 ? 'text-red-500' : 'text-slate-800'}`}>{stats.expired}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide sm:tracking-wider break-words">Expired</div>
                        </div>

                        {/* Training Permanent Count */}
                        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-3.5 px-3.5 sm:py-5 sm:px-5 min-w-0">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-sky-50 text-sky-500">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">{stats.permanent}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide sm:tracking-wider break-words">Permanent</div>
                        </div>

                        {/* Training Expiring Soon Count */}
                        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-3.5 px-3.5 sm:py-5 sm:px-5 min-w-0">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-500">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                            </div>
                            <div className={`text-2xl sm:text-3xl font-bold mb-1 ${stats.expiringSoon > 0 ? 'text-amber-500' : 'text-slate-800'}`}>{stats.expiringSoon}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide sm:tracking-wider break-words">Expiring Soon</div>
                        </div>
                    </div>

                    {/* Training Needs Matrix: prefer API data, fallback to StaffData-based */}
                    {hasApiData ? (
                        <TrainingNeedsMatrixFromApi matrix={apiData?.needsMatrix ?? null} />
                    ) : (
                        <TrainingNeedsMatrix staff={staff} />
                    )}
                </div>
                {/* On xl the right column is taken out of the row-height calculation (absolute) so the
                    left column (stats + Needs Matrix) alone sets the height and the right side fills it */}
                <div className="min-w-0 xl:col-span-8 xl:relative">
                <div className="xl:absolute xl:inset-0 xl:flex xl:flex-col">
                    {/* Training Records */}
                    <CollapsibleCard icon={<BookOpen className="h-4 w-4" />} iconClassName="bg-orange-50 text-orange-600" title="Training Records" defaultOpen>
                        {currentTraining.length > 0 ? (
                            <>
                            <TooltipProvider delayDuration={0}>
                                <ScrollArea scrollbars="both" className="-mx-1" viewportClassName="max-h-[500px] px-1">
                                <table className="w-full min-w-[560px] border-collapse">
                                <thead>
                                    <tr>
                                        {['Training Course', 'Valid Until', 'By', 'Status'].map((h, i) => (
                                            <th key={h} className={`text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 bg-white sticky top-0 text-left whitespace-nowrap ${i === 0 ? 'left-0 z-[3] shadow-[inset_0_-1px_0_#e8ecf1,1px_0_0_0_#f1f5f9]' : 'z-[2] shadow-[inset_0_-1px_0_#e8ecf1]'}`}>
                                                {i === 0 ? (
                                                    <ColumnSearchHeader label={h} value={trainingSearch} onChange={setTrainingSearch} />
                                                ) : h === 'Status' ? (
                                                    <StatusFilterHeader label={h} value={trainingStatusFilter} onChange={setTrainingStatusFilter} counts={trainingStatusCounts} />
                                                ) : (
                                                    h
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleTraining.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-center text-xs text-slate-400">No training records match the current search or status filter.</td>
                                        </tr>
                                    )}
                                    {visibleTraining.map((t, i) => {
                                        const status = getTrainingStatus(t.validUntil)
                                        return (
                                            <tr key={i} className="group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedTraining(t)}>
                                                <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 font-medium min-w-[180px] max-w-[320px] bg-white group-hover:bg-slate-50 transition-colors sticky left-0 z-[1] shadow-[1px_0_0_0_#f1f5f9]">
                                                    {t.course ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="line-clamp-2 break-words leading-snug cursor-default">
                                                                    {t.course}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="z-[9999] max-w-sm text-xs font-normal bg-slate-900 text-slate-50 shadow-md px-2.5 py-1.5 rounded">
                                                                {t.course}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-700 whitespace-nowrap">{formatValidUntil(t.validUntil)}</td>
                                                <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-500">{t.provider}</td>
                                                <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700">
                                                    <StatusBadge status={status} />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                                </ScrollArea>
                        </TooltipProvider>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                                    <BookOpen className="h-7 w-7 text-orange-300" />
                                </div>
                                <p className="text-sm font-semibold text-slate-500 mb-1">No Training Records</p>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-[260px]">
                                    This staff member has not registered for any training courses yet. Please register for the required training courses.
                                </p>
                            </div>
                        )}
                    </CollapsibleCard>

                    {/* Previous Training Records — Inline Editable Table (stretches to match the Needs Matrix column on xl) */}
                    <CollapsibleCard
                        icon={<History className="h-4 w-4" />}
                        iconClassName="bg-violet-50 text-violet-600"
                        title="Previous Training Records"
                        open={previousOpen}
                        onOpenChange={setPreviousOpen}
                        className="xl:flex xl:flex-1 xl:flex-col xl:min-h-0"
                        bodyClassName="xl:flex xl:flex-1 xl:flex-col xl:min-h-0"
                        action={!isAdding && editingId === null && (
                            <button
                                onClick={() => { setPreviousOpen(true); startAdd() }}
                                disabled={isAnyMutating}
                                className="inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Record
                            </button>
                        )}
                    >


                        {apiHistories.length > 0 || isAdding ? (
                            <>
                            <TooltipProvider delayDuration={0}>
                                <ScrollArea scrollbars="both" className="-mx-1 xl:h-0 xl:min-h-[240px] xl:flex-1" viewportClassName="max-h-[500px] px-1 xl:max-h-none">
                                <table className="w-full min-w-[560px] border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 bg-white sticky top-0 left-0 z-[3] shadow-[inset_0_-1px_0_#e8ecf1,1px_0_0_0_#f1f5f9] text-left whitespace-nowrap">
                                            <ColumnSearchHeader label="Course Name" value={previousSearch} onChange={setPreviousSearch} />
                                        </th>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 bg-white sticky top-0 z-[2] shadow-[inset_0_-1px_0_#e8ecf1] text-left whitespace-nowrap">Academy / Venue</th>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 bg-white sticky top-0 z-[2] shadow-[inset_0_-1px_0_#e8ecf1] text-left whitespace-nowrap">Date From</th>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 bg-white sticky top-0 z-[2] shadow-[inset_0_-1px_0_#e8ecf1] text-left whitespace-nowrap">Date To</th>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 bg-white sticky top-0 z-[2] shadow-[inset_0_-1px_0_#e8ecf1] text-center w-[100px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apiHistories.length > 0 && visibleHistories.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-6 text-center text-xs text-slate-400">No courses match &quot;{previousSearch.trim()}&quot;.</td>
                                        </tr>
                                    )}
                                    {visibleHistories.map((h) => {
                                        const isEditing = editingId === h.id
                                        const isLocked = (editingId !== null && !isEditing) || isAdding || isAnyMutating

                                        if (isEditing) {
                                            return (
                                                <tr key={h.id} className="bg-blue-50/50">
                                                    <td className="py-2 px-2 border-b border-slate-100 min-w-[200px] bg-[#f5f8ff] sticky left-0 z-[1] shadow-[1px_0_0_0_#f1f5f9]">
                                                        <input type="text" value={editingData.courseName} onChange={e => setEditingData(d => ({ ...d, courseName: e.target.value }))} placeholder="Course name" className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                                                    </td>
                                                    <td className="py-2 px-2 border-b border-slate-100">
                                                        <input type="text" value={editingData.academyName} onChange={e => setEditingData(d => ({ ...d, academyName: e.target.value }))} placeholder="Academy / Venue" className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                                                    </td>
                                                    <td className="py-2 px-2 border-b border-slate-100">
                                                        <input type="date" value={editingData.dateFrom} onChange={e => setEditingData(d => ({ ...d, dateFrom: e.target.value }))} className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                                                    </td>
                                                    <td className="py-2 px-2 border-b border-slate-100">
                                                        <input type="date" value={editingData.dateTo} onChange={e => setEditingData(d => ({ ...d, dateTo: e.target.value }))} className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                                                    </td>
                                                    <td className="py-2 px-2 border-b border-slate-100">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button onClick={saveEdit} disabled={updateMutation.isPending} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-all bg-transparent border-none disabled:opacity-50">
                                                                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                            </button>
                                                            <button onClick={cancelEdit} disabled={updateMutation.isPending} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer transition-all bg-transparent border-none disabled:opacity-50">
                                                                <XIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        }

                                        return (
                                            <tr key={h.id} className={`group hover:bg-slate-50 transition-colors ${isLocked ? 'opacity-50 pointer-events-none' : ''} ${deletingId === h.id ? 'bg-red-50/50' : ''}`}>
                                                <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 font-medium min-w-[180px] max-w-[320px] bg-white group-hover:bg-slate-50 transition-colors sticky left-0 z-[1] shadow-[1px_0_0_0_#f1f5f9]">
                                                    {h.courseName ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="line-clamp-2 break-words leading-snug cursor-default">
                                                                    {h.courseName}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="z-[9999] max-w-sm text-xs font-normal bg-slate-900 text-slate-50 shadow-md px-2.5 py-1.5 rounded">
                                                                {h.courseName}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-500 min-w-[140px]">{h.academyName || '-'}</td>
                                                <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 whitespace-nowrap">{formatDate(h.dateFrom)}</td>
                                                <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 whitespace-nowrap">{formatDate(h.dateTo)}</td>
                                                <td className="py-3 px-3.5 border-b border-slate-100">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button onClick={() => startEdit(h)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-all bg-transparent border-none">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(h.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-all bg-transparent border-none">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}

                                    {/* Add new row */}
                                    {isAdding && (
                                        <tr className="bg-emerald-50/30">
                                            <td className="py-2 px-2 border-b border-slate-100 min-w-[200px] bg-[#f7fcf9] sticky left-0 z-[1] shadow-[1px_0_0_0_#f1f5f9]">
                                                <input type="text" value={addingData.courseName} onChange={e => setAddingData(d => ({ ...d, courseName: e.target.value }))} placeholder="Course name" autoFocus className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                                            </td>
                                            <td className="py-2 px-2 border-b border-slate-100">
                                                <input type="text" value={addingData.academyName} onChange={e => setAddingData(d => ({ ...d, academyName: e.target.value }))} placeholder="Academy / Venue" className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                                            </td>
                                            <td className="py-2 px-2 border-b border-slate-100">
                                                <input type="date" value={addingData.dateFrom} onChange={e => setAddingData(d => ({ ...d, dateFrom: e.target.value }))} className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                                            </td>
                                            <td className="py-2 px-2 border-b border-slate-100">
                                                <input type="date" value={addingData.dateTo} onChange={e => setAddingData(d => ({ ...d, dateTo: e.target.value }))} className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                                            </td>
                                            <td className="py-2 px-2 border-b border-slate-100">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={saveAdd} disabled={createMutation.isPending} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-all bg-transparent border-none disabled:opacity-50">
                                                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                    </button>
                                                    <button onClick={cancelAdd} disabled={createMutation.isPending} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer transition-all bg-transparent border-none disabled:opacity-50">
                                                        <XIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                                </ScrollArea>
                        </TooltipProvider>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                                    <History className="h-7 w-7 text-violet-300" />
                                </div>
                                <p className="text-sm font-semibold text-slate-500 mb-1">No Previous Training</p>
                                <p className="text-xs text-slate-400 mb-5">Previous training records have not been added yet.</p>
                                <button
                                    onClick={startAdd}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Previous Training
                                </button>
                            </div>
                        )}
                    </CollapsibleCard>
                </div>
                </div>
            </div>

            {/* Training Detail Modal */}
            <TrainingDetailModal
                record={selectedTraining}
                onClose={() => setSelectedTraining(null)}
            />

            {/* Delete Confirmation Modal */}
            {deletingId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleteMutation.isPending && setDeletingId(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-7 pt-7 pb-5 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="h-7 w-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Training Record</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Are you sure you want to delete this training record? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={() => setDeletingId(null)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 border-none rounded-lg cursor-pointer transition-all hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
