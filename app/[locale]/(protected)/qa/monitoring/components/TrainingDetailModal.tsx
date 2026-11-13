'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    BookOpen,
    Building2,
    Calendar,
    Check,
    Clock,
    GraduationCap,
    Loader2,
    Pencil,
    User,
    X as XIcon,
} from 'lucide-react'
import { CourseRef, Employee, fmtDate, formatDisplayDate, getStatus, StatusType, toInputDateFormat } from '../types'
import { useStaffTrainingDashboard } from '@/lib/api/hooks/useQAStaffManagement'
import { toast } from 'sonner'
import { MENU } from "@/lib/permission-codes";
import { useMenuPermission } from "@/hooks/use-menu-permission";

export interface EditedTrainingData {
    dateFrom: string
    dateTo: string
    validUntil: string
    provider: string
    status: string
}

interface TrainingDetailModalProps {
    isOpen: boolean
    onClose: () => void
    employee: Employee | null
    course: CourseRef | null
    initialData?: Partial<EditedTrainingData>
    onSave?: (data: EditedTrainingData) => void | Promise<void>
    onEnroll?: (empId: string, courseId: string) => void
}

function StatusBadge({ status }: { status: string }) {
    let bg = 'bg-slate-100 text-slate-600 border border-slate-200'
    const s = status.toLowerCase()
    if (s.includes('valid')) bg = 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    else if (s.includes('warn') || s.includes('expiring') || s.includes('soon')) bg = 'bg-amber-50 text-amber-700 border border-amber-200'
    else if (s.includes('expir')) bg = 'bg-red-50 text-red-700 border border-red-200'
    else if (s.includes('perm') || s.includes('never')) bg = 'bg-sky-50 text-sky-700 border border-sky-200'

    const label = (s.includes('perm') || s === 'never') ? 'Never' : status

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${bg}`}>
            {label}
        </span>
    )
}

function isPermanentOrNever(val: string | null | undefined): boolean {
    if (!val) return false
    const lower = val.toLowerCase()
    return lower === 'permanent' || lower === 'never' || lower.startsWith('9999')
}

function formatValidUntil(dateStr: string | null | undefined, emptyLabel: string = '-'): string {
    if (!dateStr || dateStr === '-') return emptyLabel
    if (isPermanentOrNever(dateStr)) return 'Never'
    return formatDisplayDate(dateStr)
}

export function TrainingDetailModal({
    isOpen,
    onClose,
    employee,
    course,
    initialData,
    onSave,
    onEnroll,
}: TrainingDetailModalProps) {
    const perm = useMenuPermission(MENU.QA_TRAINING_MONITORING);
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Fetch staff training dashboard if staffId is available
    const staffId = employee?.staffId ?? 0
    const { data: dashboardResp } = useStaffTrainingDashboard(staffId)

    // Match course in dashboard records
    const matchedRecord = useMemo(() => {
        if (!course || !dashboardResp?.responseData?.records) return null
        const records = dashboardResp.responseData.records
        const cCode = (typeof course.code === 'string' ? course.code : course.short).toLowerCase().trim()
        const cShort = course.short.toLowerCase().trim()
        const cName = course.label.toLowerCase().trim()

        return records.find(r => {
            const rCode = (r.courseCode || '').toLowerCase().trim()
            const rName = (r.courseName || '').toLowerCase().trim()
            return (rCode && (rCode === cCode || rCode === cShort)) || (rName && rName === cName)
        }) || null
    }, [course, dashboardResp])

    // Fallback data from employee course record
    const staffCourse = employee && course ? employee.staffCourseData?.[course.id] : null
    const cellExpiry = employee && course ? employee.courses[course.id] : null
    const cellIssue = employee && course ? employee.courseIssueDates?.[course.id] : null

    // Determine baseline values
    const baseDateFrom = initialData?.dateFrom
        ?? matchedRecord?.dateFrom
        ?? staffCourse?.issueDate
        ?? cellIssue
        ?? ''
    const baseDateTo = initialData?.dateTo
        ?? matchedRecord?.dateTo
        ?? staffCourse?.issueDate
        ?? cellIssue
        ?? ''
    const baseValidUntil = initialData?.validUntil
        ?? matchedRecord?.validUntil
        ?? staffCourse?.expiryDate
        ?? cellExpiry
        ?? ''
    const baseProvider = initialData?.provider
        ?? matchedRecord?.providedBy
        ?? ''
    const baseStatus = initialData?.status
        ?? matchedRecord?.status
        ?? staffCourse?.status
        ?? (baseValidUntil ? (isPermanentOrNever(baseValidUntil) ? 'Never' : getStatus(baseValidUntil) === 'valid' ? 'Valid' : getStatus(baseValidUntil) === 'warning' ? 'Expiring Soon' : 'Expired') : 'Expired')

    // Editable form state
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [validUntil, setValidUntil] = useState('')
    const [isPermanent, setIsPermanent] = useState(false)
    const [provider, setProvider] = useState('')

    // Automatically compute status from valid until and permanent flag
    const computedStatus = useMemo(() => {
        const curValidUntil = isEditing ? (isPermanent ? 'Never' : validUntil) : baseValidUntil
        if (!curValidUntil || curValidUntil === '-' || curValidUntil === 'na') {
            const normalizedBase = baseStatus?.toLowerCase() === 'permanent' ? 'Never' : baseStatus
            return normalizedBase || 'Expired'
        }
        if (isPermanentOrNever(curValidUntil)) {
            return 'Never'
        }
        const d = new Date(curValidUntil)
        if (isNaN(d.getTime())) {
            const normalizedBase = baseStatus?.toLowerCase() === 'permanent' ? 'Never' : baseStatus
            return normalizedBase || 'Expired'
        }
        const now = new Date()
        if (d < now) return 'Expired'
        const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        if (d <= in90Days) return 'Expiring Soon'
        return 'Valid'
    }, [isEditing, isPermanent, validUntil, baseValidUntil, baseStatus])

    // Synchronize form when modal opens or baseline values change
    useEffect(() => {
        if (isOpen) {
            const isPerm = isPermanentOrNever(baseValidUntil)
            setDateFrom(toInputDateFormat(baseDateFrom))
            setDateTo(toInputDateFormat(baseDateTo))
            setValidUntil(isPerm ? '' : toInputDateFormat(baseValidUntil))
            setIsPermanent(isPerm)
            setProvider(baseProvider)
            setIsEditing(false)
        }
    }, [isOpen, baseDateFrom, baseDateTo, baseValidUntil, baseProvider])

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [isOpen, onClose])

    if (!isOpen || !employee || !course) return null

    const courseCode = typeof course.code === 'string' ? course.code : (course.code?.[0] || course.short)
    const courseName = course.label

    const displayDateFrom = isEditing ? dateFrom : baseDateFrom
    const displayDateTo = isEditing ? dateTo : baseDateTo
    const displayValidUntil = isEditing ? (isPermanent ? 'Never' : validUntil) : baseValidUntil
    const displayProvider = isEditing ? provider : baseProvider
    const displayStatus = computedStatus

    const handleSave = async () => {
        const finalValidUntil = isPermanent ? 'Never' : validUntil
        if (!isPermanent && !validUntil) {
            toast.error('Please specify a Valid Until date or check Never')
            return
        }

        setIsSaving(true)
        try {
            const dataToSave: EditedTrainingData = {
                dateFrom,
                dateTo,
                validUntil: finalValidUntil,
                provider: provider.trim(),
                status: computedStatus,
            }
            if (onSave) {
                await onSave(dataToSave)
            }
            setIsEditing(false)
        } catch (error) {
            console.error('Error saving training data:', error)
            toast.error('Failed to save training data')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 sm:px-7 py-4 sm:py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="text-base font-bold text-slate-800">
                            {isEditing ? 'Edit Training Data' : 'Training Detail'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-all duration-200 border-none bg-transparent"
                        aria-label="Close modal"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 sm:px-7 py-5 sm:py-6 space-y-4 sm:space-y-5 overflow-y-auto">
                    {/* Staff Banner */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 pb-2.5 border-b border-slate-100 flex-wrap">
                        <User className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-slate-800">{employee.name}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-primary font-bold">ID: {employee.id}</span>
                        {employee.pos && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-600 truncate">{employee.pos}</span>
                            </>
                        )}
                    </div>

                    {/* Course Name */}
                    <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Training Course
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                            {courseCode && (
                                <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                                    {courseCode}
                                </span>
                            )}
                            <span className="text-[15px] font-semibold text-slate-800 leading-snug">
                                {courseName}
                            </span>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Status
                        </span>
                        <StatusBadge status={displayStatus} />
                    </div>

                    {/* 2x2 Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        {/* FROM */}
                        <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                                    From
                                </span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full mt-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-slate-800">
                                        {formatDisplayDate(displayDateFrom)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* TO */}
                        <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                                    To
                                </span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full mt-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-slate-800">
                                        {formatDisplayDate(displayDateTo)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* VALID UNTIL */}
                        <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                                    Valid Until
                                </span>
                                {isEditing ? (
                                    <div className="space-y-1.5 mt-1">
                                        {!isPermanent ? (
                                            <input
                                                type="date"
                                                value={validUntil}
                                                onChange={(e) => setValidUntil(e.target.value)}
                                                className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            />
                                        ) : (
                                            <div className="px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 rounded-lg border border-sky-200">
                                                Never
                                            </div>
                                        )}
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={isPermanent}
                                                onChange={(e) => {
                                                    setIsPermanent(e.target.checked)
                                                }}
                                                className="rounded border-slate-300 text-primary focus:ring-primary/20"
                                            />
                                            <span>Never (No expiration)</span>
                                        </label>
                                    </div>
                                ) : (
                                    <span className="text-sm font-medium text-slate-800">
                                        {formatValidUntil(displayValidUntil, 'Never')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* CONDUCTED BY */}
                        <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4 text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                                    Conducted By
                                </span>
                                {/* Read-only: Conducted By comes from the course record and is not editable here */}
                                <span className="text-sm font-medium text-slate-800">
                                    {displayProvider || '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 sm:px-7 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                    {isEditing ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    // Reset to initial baseline
                                    const isPerm = isPermanentOrNever(baseValidUntil)
                                    setDateFrom(toInputDateFormat(baseDateFrom))
                                    setDateTo(toInputDateFormat(baseDateTo))
                                    setValidUntil(isPerm ? '' : toInputDateFormat(baseValidUntil))
                                    setIsPermanent(isPerm)
                                    setProvider(baseProvider)
                                    setIsEditing(false)
                                }}
                                disabled={isSaving}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50 border-none"
                            >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                {onEnroll && perm.canEdit && (displayStatus.toLowerCase().includes('expir') || displayStatus.toLowerCase().includes('warn')) && (
                                    <button
                                        type="button"
                                        onClick={() => onEnroll(employee.id, course.id)}
                                        className="px-3.5 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer border-none flex items-center gap-1.5"
                                    >
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        Enroll Course
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {perm.canEdit && (<button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 border-none"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                </button>)}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

