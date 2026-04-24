'use client'

import { Employee, CourseRef, getStatus, getDaysLeft, STATUS_META, SortField, SortDir } from '../types'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { MOCK_SESSIONS } from './CourseEnrollmentModal'

interface StatusMatrixProps {
    employees: Employee[]
    courses: CourseRef[]
    selectedId: string | null
    onSelect: (id: string | null) => void
    sortField: SortField
    sortDir: SortDir
    onSort: (field: SortField) => void
    SortIcon: React.ComponentType<{ field: SortField }>
    onEnroll?: (empId: string, courseId: string) => void
    enrollments?: Record<string, string>
}

export function StatusMatrix({ employees, courses, selectedId, onSelect, sortField, sortDir, onSort, SortIcon, onEnroll, enrollments }: StatusMatrixProps) {
    return (
        <TooltipProvider>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-muted/50 border-b-2 border-border">
                            <th
                                className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none sticky left-0 z-20 bg-slate-100 dark:bg-slate-900 shadow-[1px_0_0_0_var(--border)]"
                                style={{ minWidth: 180 }}
                                onClick={() => onSort('name')}
                            >
                                <span className="inline-flex items-center gap-1">Staff <SortIcon field="name" /></span>
                            </th>
                            <th
                                className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none"
                                style={{ minWidth: 60 }}
                                onClick={() => onSort('id')}
                            >
                                <span className="inline-flex items-center gap-1">ID <SortIcon field="id" /></span>
                            </th>
                            <th
                                className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none"
                                style={{ minWidth: 160 }}
                                onClick={() => onSort('pos')}
                            >
                                <span className="inline-flex items-center gap-1">Position <SortIcon field="pos" /></span>
                            </th>
                            {courses.map(c => (
                                <th key={c.id} title={c.label} className="px-1 py-2 text-center text-muted-foreground font-bold border-l border-border" style={{ minWidth: 100 }}>
                                    <div className="text-[10px] leading-snug">{c.short}</div>
                                    <div className="text-[9px] text-muted-foreground/60 font-medium">{c.interval}m</div>
                                </th>
                            ))}
                            <th
                                className="px-3 py-2 text-center text-muted-foreground font-bold border-l-2 border-border cursor-pointer hover:text-foreground transition-colors select-none sticky right-0 z-20 bg-slate-100 dark:bg-slate-900 shadow-[-1px_0_0_0_var(--border)]"
                                style={{ minWidth: 90 }}
                                onClick={() => onSort('expiry')}
                            >
                                <span className="inline-flex items-center gap-1">Next Expiry <SortIcon field="expiry" /></span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp, ri) => {
                            const statuses = courses.map(c => getStatus(emp.courses[c.id]))
                            const hasIssue = statuses.some(s => s === 'expired' || s === 'warning')
                            const isSelected = selectedId === emp.id

                            const nearestExpiry = courses.reduce<Date | null>((acc, c) => {
                                const dueStr = emp.courses[c.id]
                                if (dueStr && dueStr !== '-' && dueStr !== 'na') {
                                    const due = new Date(dueStr)
                                    if (!isNaN(due.getTime()) && (!acc || due.getTime() < acc.getTime())) {
                                        return due
                                    }
                                }
                                return acc
                            }, null)
                            const nearestDays = nearestExpiry ? Math.floor((nearestExpiry.getTime() - new Date('2026-03-19').getTime()) / 86400000) : null

                            return (
                                <tr key={emp.id}
                                    onClick={() => onSelect(selectedId === emp.id ? null : emp.id)}
                                    className={`border-b border-border/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' :
                                        hasIssue ? (ri % 2 === 0 ? 'bg-amber-100' : 'bg-amber-50') :
                                            ri % 2 === 0 ? 'bg-card' : 'bg-slate-50'
                                        } hover:!bg-slate-100`}>
                                    <td className="px-3 py-1.5 font-semibold text-foreground whitespace-nowrap sticky left-0 z-10 bg-inherit shadow-[1px_0_0_0_var(--border)]">{emp.name}</td>
                                    <td className="px-3 py-1.5 text-primary font-bold text-[11px]">{emp.id}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap text-[11px]">{emp.pos}</td>
                                    {courses.map(c => {
                                        const due = emp.courses[c.id]
                                        const s = getStatus(due)
                                        const m = STATUS_META[s]
                                        const d = getDaysLeft(due)

                                        let lastTrainingStr = '-'
                                        let dueDateStr = '-'
                                        if (due && due !== '-' && due !== 'na') {
                                            const dueDate = new Date(due)
                                            if (!isNaN(dueDate.getTime())) {
                                                const lastTraining = new Date(dueDate)
                                                lastTraining.setMonth(lastTraining.getMonth() - c.interval)
                                                lastTrainingStr = lastTraining.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                                                dueDateStr = dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                                            }
                                        }

                                        const tooltipLines = [
                                            `📘 ${c.label}`,
                                            `Interval: ${c.interval} months`,
                                            `Status: ${m.label}`,
                                            ...(s !== 'na' && s !== 'missing' ? [
                                                `Last Training: ${lastTrainingStr}`,
                                                `Due Date: ${dueDateStr}`,
                                                ...(d !== null && s === 'warning' ? [`⚠️ ${d} days left`] : []),
                                                ...(s === 'expired' ? [`🚨 Expired`] : []),
                                            ] : []),
                                        ].join('\n')
                                        const isEnrolled = !!enrollments?.[`${emp.id}-${c.id}`]
                                        const enrolledSession = isEnrolled ? MOCK_SESSIONS.find(session => session.id === enrollments[`${emp.id}-${c.id}`]) : null

                                        return (
                                            <td key={c.id}
                                                className="text-center border-l border-border/50 transition-opacity"
                                                style={{ background: m.bg, padding: '6px 2px', minWidth: 100 }}
                                                onClick={(e) => e.stopPropagation()}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                                            {s === 'na' || s === 'missing' ? (
                                                                <div className="w-2.5 h-2.5 rounded-full mx-auto"
                                                                    style={{ background: m.dot }} />
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center min-h-[32px] w-full h-full gap-0.5">
                                                                    {isEnrolled ? (
                                                                        <div
                                                                            onClick={(e) => { e.stopPropagation(); onEnroll?.(emp.id, c.id) }}
                                                                            className="w-full flex-1 flex flex-col items-center justify-center text-[11px] font-extrabold px-1.5 py-0.5 rounded-sm text-white bg-primary border border-primary/30 hover:opacity-80 transition-opacity">
                                                                            ENROLLED
                                                                        </div>
                                                                    ) : s === 'warning' && d !== null ? (
                                                                        <div
                                                                            onClick={(e) => { e.stopPropagation(); onEnroll?.(emp.id, c.id) }}
                                                                            className="w-full flex-1 flex flex-col items-center justify-center font-extrabold px-1.5 py-0.5 rounded-sm text-white hover:opacity-80 transition-opacity" style={{ background: m.dot }}>
                                                                            <div className='text-[14px] leading-none'>{d}</div>
                                                                            <div className='text-[8px] mt-0.5'>DAYS LEFT</div>
                                                                        </div>
                                                                    ) : s === 'expired' ? (
                                                                        <div
                                                                            onClick={(e) => { e.stopPropagation(); onEnroll?.(emp.id, c.id) }}
                                                                            className="w-full flex-1 flex flex-col items-center justify-center text-md font-extrabold px-1.5 py-0.5 rounded-sm text-white hover:opacity-80 transition-opacity" style={{ background: m.dot }}>EXP</div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="text-[10px] font-medium text-muted-foreground bg-black/5 px-1.5 rounded">{lastTrainingStr}</div>
                                                                            <div className="text-[10px] font-bold" style={{ color: m.text }}>{dueDateStr}</div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs bg-white text-foreground border border-border shadow-lg">
                                                        <div className="space-y-1 text-xs">
                                                            <div className="font-bold text-sm">{c.label}</div>
                                                            {c.code && (
                                                                <div className="text-[10px] text-muted-foreground/80 mt-1 mb-1 font-mono">
                                                                    <div>{c.code}</div>
                                                                </div>
                                                            )}
                                                            <div className="text-muted-foreground">Interval: {c.interval} months</div>
                                                            <div className="flex items-center justify-start gap-1.5">
                                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.dot }} />
                                                                <span className="font-semibold">{m.label}</span>
                                                            </div>
                                                            {s !== 'na' && s !== 'missing' && (
                                                                <>
                                                                    <div className="border-t border-border/50 pt-1 mt-1 space-y-0.5 text-start">
                                                                        <div>Last Training: <span className="font-semibold">{lastTrainingStr}</span></div>
                                                                        <div>Due Date: <span className="font-semibold" style={{ color: m.text }}>{dueDateStr}</span></div>
                                                                        {d !== null && s === 'warning' && (
                                                                            <div className="font-bold text-amber-600">{d} days left</div>
                                                                        )}
                                                                        {s === 'expired' && (
                                                                            <div className="font-bold text-red-600">Expired</div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                            {isEnrolled && enrolledSession && (
                                                                <div className="border-t border-border pt-1.5 mt-1.5 border-dashed space-y-0.5 bg-primary/5 p-1.5 rounded-sm">
                                                                    <div className="font-bold text-primary flex items-center gap-1.5">
                                                                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                                                        Currently Enrolled
                                                                    </div>
                                                                    <div className="font-medium text-foreground">{enrolledSession.date}</div>
                                                                    <div className="text-muted-foreground text-[10px]">{enrolledSession.location}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </td>
                                        )
                                    })}
                                    <td className="px-3 py-1.5 text-center border-l-2 border-border font-bold sticky right-0 z-10 bg-inherit shadow-[-1px_0_0_0_var(--border)]">
                                        {nearestExpiry ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[11px] text-foreground">
                                                    {nearestExpiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                </span>
                                                {nearestDays !== null && nearestDays <= 90 && (
                                                    <span className={`text-[9px] mt-0.5 px-1.5 rounded-sm text-white ${nearestDays < 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
                                                        {nearestDays < 0 ? 'EXP' : `${nearestDays}d LEFT`}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/40">—</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </TooltipProvider>
    )
}
