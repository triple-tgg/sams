'use client'

import { useEffect } from 'react'
import { Employee, CourseRef, getStatus, getDaysLeft, STATUS_META, fmtDate } from '../types'
import { ALL_COURSES } from '../data'
import { X as XIcon, User, BadgeCheck, AlertTriangle, Clock } from 'lucide-react'

interface EmployeeDetailDrawerProps {
    employee: Employee | null
    onClose: () => void
}

export function EmployeeDetailDrawer({ employee: emp, onClose }: EmployeeDetailDrawerProps) {
    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (emp) window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [emp, onClose])

    if (!emp) return null

    // Compute stats for this employee
    const courseStatuses = ALL_COURSES.map(c => ({
        course: c,
        status: getStatus(emp.courses[c.id]),
        daysLeft: getDaysLeft(emp.courses[c.id]),
        due: emp.courses[c.id],
    }))

    const validCount = courseStatuses.filter(c => c.status === 'valid').length
    const warningCount = courseStatuses.filter(c => c.status === 'warning').length
    const expiredCount = courseStatuses.filter(c => c.status === 'expired').length
    const applicable = courseStatuses.filter(c => c.status !== 'na' && c.status !== 'missing')
    const overallScore = applicable.length > 0
        ? Math.round(applicable.filter(c => c.status === 'valid').length / applicable.length * 100)
        : null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-[480px] max-w-[90vw] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-base text-foreground">{emp.name}</p>
                                <p className="text-xs text-primary font-semibold">
                                    ID: {emp.id} · {emp.pos}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted cursor-pointer transition-colors border-none bg-transparent"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-2 mt-4">
                        {overallScore !== null && (
                            <div className="rounded-lg px-3 py-1.5 text-sm font-extrabold" style={{
                                background: overallScore === 100 ? '#dcfce7' : overallScore >= 70 ? '#fef3c7' : '#fee2e2',
                                color: overallScore === 100 ? '#16a34a' : overallScore >= 70 ? '#d97706' : '#dc2626',
                            }}>
                                {overallScore}% Compliance
                            </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1">
                            <BadgeCheck className="w-3 h-3" />{validCount}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1">
                            <Clock className="w-3 h-3" />{warningCount}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-red-700 bg-red-50 rounded-lg px-2 py-1">
                            <AlertTriangle className="w-3 h-3" />{expiredCount}
                        </div>
                    </div>
                </div>

                {/* Course List */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                        Course Status ({applicable.length} applicable)
                    </p>
                    <div className="space-y-1.5">
                        {courseStatuses.map(({ course: c, status: s, daysLeft: d, due }) => {
                            const m = STATUS_META[s]
                            
                            let lastTrainingStr = '-'
                            let dueDateStr = s === 'na' ? 'N/A' : s === 'missing' ? '—' : s === 'expired' ? 'Expired' : fmtDate(due)

                            if (s !== 'na' && s !== 'missing') {
                                const dDate = new Date(due)
                                if (!isNaN(dDate.getTime())) {
                                    const lastTraining = new Date(dDate)
                                    lastTraining.setMonth(lastTraining.getMonth() - c.interval)
                                    lastTrainingStr = lastTraining.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                    dueDateStr = dDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                }
                            }

                            return (
                                <div key={c.id} className="rounded-lg py-2.5 px-3 flex items-center gap-3 transition-colors hover:ring-1 hover:ring-border"
                                    style={{ background: m.bg, border: `1px solid ${m.dot}22` }}>
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.dot }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                {c.short}
                                            </span>
                                            <span className="text-xs font-medium text-foreground truncate">{c.label}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col items-end">
                                        {s === 'missing' || s === 'na' ? (
                                           <div className="text-xs font-bold" style={{ color: m.text }}>
                                               {s === 'na' ? 'N/A' : '—'}
                                           </div>
                                        ) : (
                                           <>
                                               <div className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                   <span>Last Training:</span>
                                                   <span className="font-semibold text-foreground">{lastTrainingStr}</span>
                                               </div>
                                               <div className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1.5 leading-tight">
                                                   <span>Due Date:</span>
                                                   <span className="font-bold" style={{ color: m.text }}>
                                                       {s === 'expired' ? 'Expired' : dueDateStr}
                                                   </span>
                                               </div>
                                               {d !== null && (
                                                   <div className="text-[9px] font-extrabold mt-0.5 bg-black/5 px-1 rounded-sm" style={{ color: m.text }}>
                                                       {d < 0 ? `${Math.abs(d)} DAYS OVERDUE` : `${d} DAYS LEFT`}
                                                   </div>
                                               )}
                                           </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-border bg-muted/30">
                    <p className="text-[10px] text-muted-foreground text-center">
                        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] border border-border">ESC</kbd> to close
                    </p>
                </div>
            </div>

            <style jsx global>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.25s ease-out;
                }
            `}</style>
        </>
    )
}
