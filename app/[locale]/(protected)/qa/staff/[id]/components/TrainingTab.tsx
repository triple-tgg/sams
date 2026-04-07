'use client'

import { useState, useMemo } from 'react'
import { BookOpen, History, Pencil, Check, X as XIcon, ClipboardList, Calendar, Building2, Award, Clock, AlertTriangle, ShieldCheck } from 'lucide-react'
import { StaffData, CurrentTrainingRecord } from '../types'
import { formatDate } from '../utils'
import { EditPreviousTrainingModal } from './EditPreviousTrainingModal'

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

// ── Training Needs Matrix Card ──
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
                                <span className="text-sm font-medium text-slate-800">{record.dateFrom}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">To</span>
                                <span className="text-sm font-medium text-slate-800">{record.dateTo}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Valid Until</span>
                                <span className="text-sm font-medium text-slate-800">{record.validUntil || 'Never'}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4 text-violet-600" />
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Conducted By</span>
                                <span className="text-sm font-medium text-slate-800">{record.provider}</span>
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

// ── Training Tab ──
export function TrainingTab({ staff }: { staff: StaffData }) {
    const [showEditPrevTraining, setShowEditPrevTraining] = useState(false)
    const [selectedTraining, setSelectedTraining] = useState<CurrentTrainingRecord | null>(null)

    const currentTraining = staff.currentTraining ?? []

    const stats = useMemo(() => {
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
    }, [currentTraining])

    return (
        <>
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

                    <TrainingNeedsMatrix staff={staff} />
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
                                                <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-700 whitespace-nowrap">{t.validUntil || '—'}</td>
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

                    {/* Previous Training Records */}
                    <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-50 text-violet-600">
                                    <History className="h-4 w-4" />
                                </div>
                                Previous Training Records
                            </div>
                            {(staff.previousTraining ?? []).length > 0 && (
                                <button
                                    onClick={() => setShowEditPrevTraining(true)}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-slate-200 bg-white text-slate-400 cursor-pointer transition-all duration-200 hover:border-slate-400 hover:text-slate-700 hover:shadow-sm"
                                    title="Edit Previous Training Records"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {(staff.previousTraining ?? []).length > 0 ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-left w-[60%]">Course</th>
                                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-left w-[40%]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(staff.previousTraining ?? []).map((t, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 font-semibold">{t.provider}</span>
                                                    <span className="text-slate-700">{t.course}</span>
                                                </div>
                                            </td>

                                            <td className="text-sm py-3 px-3.5 border-b border-slate-100 text-slate-700">
                                                <div className="flex items-end flex-col">
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3.5 text-left">Date From:</span> <span>{formatDate(t.dateFrom)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3.5 text-left">Date To:</span> <span>{formatDate(t.dateTo)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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
                                    onClick={() => setShowEditPrevTraining(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none"
                                >
                                    <History className="h-4 w-4" />
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

            {/* Edit Previous Training Modal */}
            <EditPreviousTrainingModal
                isOpen={showEditPrevTraining}
                onClose={() => setShowEditPrevTraining(false)}
                staff={staff}
                onSave={(data) => {
                    console.log('Save previous training:', data)
                    // TODO: call API to update staff data
                }}
            />
        </>
    )
}
