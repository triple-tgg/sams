'use client'

import { useState, useMemo, useCallback } from 'react'
import { BookOpen, History, Pencil, Check, X as XIcon, ClipboardList, Calendar, Building2, Clock, AlertTriangle, ShieldCheck, Trash2, Plus, Loader2 } from 'lucide-react'
import { StaffData, CurrentTrainingRecord } from '../types'
import { formatDate } from '../utils'
import { useStaffTrainingDashboard, useCreateTrainingHistory, useUpdateTrainingHistory, useDeleteTrainingHistory } from '@/lib/api/hooks/useQAStaffManagement'
import type { TrainingDashboardResponseData, TrainingDashboardCurrentTraining, TrainingDashboardPreviousTraining } from '@/lib/api/qa/staff-management'
import { toast } from 'sonner'

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

// ── Training Needs Matrix Card (API-driven) ──
function TrainingNeedsMatrixFromApi({ matrix }: { matrix: TrainingDashboardResponseData['needsMatrix'] | null }) {
    const total = matrix?.totalRequired ?? 0
    const completed = matrix?.validCount ?? 0
    const percentage = matrix?.completionPercentage ?? 0
    const courses = matrix?.courses ?? []

    if (!matrix || total === 0) {
        return (
            <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                {/* Header */}
                <div className="flex items-center gap-2.5 text-base font-bold text-slate-800 mb-5 pb-3.5 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                        <ClipboardList className="h-4 w-4" />
                    </div>
                    Training Needs Matrix
                </div>
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
            </div>
        )
    }

    return (
        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
            {/* Header */}
            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800 mb-5 pb-3.5 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                    <ClipboardList className="h-4 w-4" />
                </div>
                Training Needs Matrix
            </div>

            {/* Donut chart */}
            <DonutChart percentage={percentage} />

            {/* Summary */}
            <div className="text-center mb-5">
                <span className="text-sm text-slate-500">
                    <span className="font-bold text-slate-800">{completed}</span> / {total} courses valid
                </span>
            </div>

            {/* Course checklist */}
            <div className="space-y-2">
                {courses.map((c, i) => (
                    <div key={c.courseId ?? i} className="flex items-start gap-2.5 py-1.5">
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
                            <span className={`text-[13px] font-medium leading-tight ${c.completed ? 'text-slate-700' : 'text-slate-500'}`}>
                                {c.name}
                            </span>
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
        </div>
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
            <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                {/* Header */}
                <div className="flex items-center gap-2.5 text-base font-bold text-slate-800 mb-5 pb-3.5 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                        <ClipboardList className="h-4 w-4" />
                    </div>
                    Training Needs Matrix
                </div>
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
            </div>
        )
    }

    return (
        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
            {/* Header */}
            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800 mb-5 pb-3.5 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                    <ClipboardList className="h-4 w-4" />
                </div>
                Training Needs Matrix
            </div>

            {/* Donut chart */}
            <DonutChart percentage={matrix.percentage} />

            {/* Summary */}
            <div className="text-center mb-5">
                <span className="text-sm text-slate-500">
                    <span className="font-bold text-slate-800">{matrix.completed}</span> / {matrix.total} courses valid
                </span>
            </div>

            {/* Course checklist */}
            <div className="space-y-2">
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
                            <span className={`text-[13px] font-medium leading-tight ${c.completed ? 'text-slate-700' : 'text-slate-500'}`}>
                                {c.name}
                            </span>
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
        </div>
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
        <div className="grid grid-cols-12 gap-4 animate-pulse">
            <div className="col-span-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white border border-[#e8ecf1] rounded-[14px] py-5 px-5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 mb-3" />
                            <div className="h-8 w-12 bg-slate-100 rounded mb-1" />
                            <div className="h-3 w-24 bg-slate-100 rounded" />
                        </div>
                    ))}
                </div>
                <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7">
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
            <div className="col-span-8">
                <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
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

export function TrainingTab({ staff }: { staff: StaffData }) {
    const [selectedTraining, setSelectedTraining] = useState<CurrentTrainingRecord | null>(null)

    // ── Inline editing state ──
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editingData, setEditingData] = useState<EditingHistoryRow>(emptyHistoryRow())
    const [isAdding, setIsAdding] = useState(false)
    const [addingData, setAddingData] = useState<EditingHistoryRow>(emptyHistoryRow())
    const [deletingId, setDeletingId] = useState<number | null>(null)

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

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 ">
                    {/* Summary Stat Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Training Course Count */}
                        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-5 px-5">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800 mb-1">{stats.total}</div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Training Courses</div>
                        </div>

                        {/* Training Expired Count */}
                        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-5 px-5">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-500">
                                    <Clock className="h-4 w-4" />
                                </div>
                            </div>
                            <div className={`text-3xl font-bold mb-1 ${stats.expired > 0 ? 'text-red-500' : 'text-slate-800'}`}>{stats.expired}</div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expired</div>
                        </div>

                        {/* Training Permanent Count */}
                        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-5 px-5">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-sky-50 text-sky-500">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800 mb-1">{stats.permanent}</div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Permanent</div>
                        </div>

                        {/* Training Expiring Soon Count */}
                        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-5 px-5">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-500">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                            </div>
                            <div className={`text-3xl font-bold mb-1 ${stats.expiringSoon > 0 ? 'text-amber-500' : 'text-slate-800'}`}>{stats.expiringSoon}</div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiring Soon</div>
                        </div>
                    </div>

                    {/* Training Needs Matrix: prefer API data, fallback to StaffData-based */}
                    {hasApiData ? (
                        <TrainingNeedsMatrixFromApi matrix={apiData?.needsMatrix ?? null} />
                    ) : (
                        <TrainingNeedsMatrix staff={staff} />
                    )}
                </div>
                <div className="col-span-8">
                    {/* Training Records */}
                    <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-50 text-orange-600">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                                Training Records
                            </div>
                        </div>
                        {currentTraining.length > 0 ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        {['Training Course', 'Valid Until', 'By', 'Status'].map(h => (
                                            <th key={h} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-left">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTraining.map((t, i) => {
                                        const status = getTrainingStatus(t.validUntil)
                                        return (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedTraining(t)}>
                                                <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 font-medium">{t.course}</td>
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
                    </div>

                    {/* Previous Training Records — Inline Editable Table */}
                    <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-50 text-violet-600">
                                    <History className="h-4 w-4" />
                                </div>
                                Previous Training Records
                            </div>
                            {!isAdding && editingId === null && (
                                <button
                                    onClick={startAdd}
                                    disabled={isAnyMutating}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add Record
                                </button>
                            )}
                        </div>


                        {apiHistories.length > 0 || isAdding ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-left">Course Name</th>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-left">Academy / Venue</th>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-left">Date From</th>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-left">Date To</th>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-center w-[100px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apiHistories.map((h) => {
                                        const isEditing = editingId === h.id
                                        const isLocked = (editingId !== null && !isEditing) || isAdding || isAnyMutating

                                        if (isEditing) {
                                            return (
                                                <tr key={h.id} className="bg-blue-50/50">
                                                    <td className="py-2 px-2 border-b border-slate-100">
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
                                            <tr key={h.id} className={`hover:bg-slate-50 transition-colors ${isLocked ? 'opacity-50 pointer-events-none' : ''} ${deletingId === h.id ? 'bg-red-50/50' : ''}`}>
                                                <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 font-medium">{h.courseName}</td>
                                                <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-500">{h.academyName}</td>
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
                                            <td className="py-2 px-2 border-b border-slate-100">
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
