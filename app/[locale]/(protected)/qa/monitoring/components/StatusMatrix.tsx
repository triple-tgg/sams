'use client'

import { useEffect, useRef, useState } from 'react'
import { Employee, CourseRef, getEmployeeCourseDaysLeft, getEmployeeCourseStatus, STATUS_META, SortField, SortDir, courseCycleLabel, courseCycleText } from '../types'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

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
    onCellClick?: (emp: Employee, course: CourseRef) => void
    /** Course column header shows the course code (default) or the course name */
    courseHeaderMode?: 'code' | 'name'
    /** Course header text (code or name) runs horizontally (default) or rotated vertically */
    courseHeaderOrientation?: 'horizontal' | 'vertical'
}

export function StatusMatrix({ employees, courses, selectedId, onSelect, sortField, sortDir, onSort, SortIcon, onEnroll, enrollments, onCellClick, courseHeaderMode = 'code', courseHeaderOrientation = 'horizontal' }: StatusMatrixProps) {
    const verticalHeader = courseHeaderOrientation === 'vertical'
    // Sticky header: the header row lives in its own strip that sticks below the
    // app navbar on page scroll, and mirrors the body's horizontal scroll.
    const headScrollRef = useRef<HTMLDivElement>(null)
    const [stickyTop, setStickyTop] = useState(0)
    useEffect(() => {
        const navbar = document.querySelector('header')
        if (!navbar) return
        const update = () => {
            const top = parseFloat(getComputedStyle(navbar).top) || 0
            setStickyTop(navbar.getBoundingClientRect().height + top)
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(navbar)
        return () => ro.disconnect()
    }, [])

    // Header and body are separate tables, so both use a fixed layout + shared colgroup to keep columns aligned.
    const STAFF_W = 180, ID_W = 70, POS_W = 160, EXPIRY_W = 100
    const COURSE_W = verticalHeader ? 80 : courseHeaderMode === 'name' ? 120 : 100
    const tableStyle: React.CSSProperties = {
        tableLayout: 'fixed',
        width: '100%',
        minWidth: STAFF_W + ID_W + POS_W + EXPIRY_W + COURSE_W * courses.length,
    }
    const colGroup = (
        <colgroup>
            <col style={{ width: STAFF_W }} />
            <col style={{ width: ID_W }} />
            <col style={{ width: POS_W }} />
            {courses.map(c => <col key={c.id} style={{ width: COURSE_W }} />)}
            <col style={{ width: EXPIRY_W }} />
        </colgroup>
    )

    return (
        <TooltipProvider>
            <div
                ref={headScrollRef}
                className="sticky z-30 overflow-hidden bg-primary"
                style={{ top: stickyTop }}
            >
                <table className="border-collapse text-xs" style={tableStyle}>
                    {colGroup}
                    <thead>
                        <tr className={verticalHeader ? '[&>th]:align-bottom' : undefined}>
                            <th
                                className="px-3 py-2 text-left text-primary-foreground font-bold whitespace-nowrap cursor-pointer hover:text-primary-foreground/80 transition-colors select-none sticky left-0 z-30 bg-primary shadow-[1px_0_0_0_rgb(255_255_255/0.2),inset_0_-2px_0_0_rgb(255_255_255/0.2)]"
                                onClick={() => onSort('name')}
                            >
                                <span className="inline-flex items-center gap-1">Staff <SortIcon field="name" /></span>
                            </th>
                            <th
                                className="px-3 py-2 text-left text-primary-foreground font-bold whitespace-nowrap cursor-pointer hover:text-primary-foreground/80 transition-colors select-none bg-primary shadow-[inset_0_-2px_0_0_rgb(255_255_255/0.2)]"
                                onClick={() => onSort('id')}
                            >
                                <span className="inline-flex items-center gap-1">ID <SortIcon field="id" /></span>
                            </th>
                            <th
                                className="px-3 py-2 text-left text-primary-foreground font-bold whitespace-nowrap cursor-pointer hover:text-primary-foreground/80 transition-colors select-none bg-primary shadow-[inset_0_-2px_0_0_rgb(255_255_255/0.2)]"
                                onClick={() => onSort('pos')}
                            >
                                <span className="inline-flex items-center gap-1">Position <SortIcon field="pos" /></span>
                            </th>
                            {courses.map(c => (
                                <th key={c.id} title={courseHeaderMode === 'name' ? c.short : c.label} className={`relative px-1 ${verticalHeader ? 'pt-1' : 'pt-2'} pb-4 text-center ${verticalHeader ? 'align-bottom' : 'align-top'} text-primary-foreground font-bold border-l border-white/20 bg-primary shadow-[inset_0_-2px_0_0_rgb(255_255_255/0.2)]`}>
                                    {verticalHeader
                                        // Rotated text (reads bottom-to-top). Fixed 120px text height keeps the header ≤ 150px;
                                        // text that doesn't fit wraps onto extra (vertical) lines.
                                        ? <span className="inline-block h-[120px] max-w-full text-[10px] leading-[1.15] text-left [writing-mode:vertical-rl] rotate-180 whitespace-normal [overflow-wrap:anywhere] overflow-hidden">{courseHeaderMode === 'code' ? c.short : (c.label || c.short)}</span>
                                        : courseHeaderMode === 'name'
                                            // Full name wraps horizontally and is always shown in full (header grows to fit)
                                            ? <div className="text-[10px] leading-snug [overflow-wrap:anywhere]">{c.label || c.short}</div>
                                            : <div className="text-[10px] leading-snug [overflow-wrap:anywhere]">{c.short}</div>}
                                    {/* Pinned to the cell's bottom edge so the labels line up across columns */}
                                    <div className="absolute inset-x-0 bottom-1 text-[9px] text-primary-foreground/70 font-medium">{courseCycleLabel(c)}</div>
                                </th>
                            ))}
                            <th
                                className="px-3 py-2 text-center text-primary-foreground font-bold border-l-2 border-white/20 cursor-pointer hover:text-primary-foreground/80 transition-colors select-none md:sticky md:right-0 md:z-30 bg-primary shadow-[-1px_0_0_0_rgb(255_255_255/0.2),inset_0_-2px_0_0_rgb(255_255_255/0.2)]"
                                onClick={() => onSort('expiry')}
                            >
                                <span className="inline-flex items-center gap-1">Next Expiry <SortIcon field="expiry" /></span>
                            </th>
                        </tr>
                    </thead>
                </table>
            </div>
            <div
                className="overflow-x-auto"
                onScroll={(e) => {
                    if (headScrollRef.current) headScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
                }}
            >
                <table className="border-collapse text-xs" style={tableStyle}>
                    {colGroup}
                    <tbody>
                        {employees.map((emp, ri) => {
                            const statuses = courses.map(c => getEmployeeCourseStatus(emp, c.id))
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
                            const nearestDays = nearestExpiry ? Math.floor((nearestExpiry.getTime() - Date.now()) / 86400000) : null

                            return (
                                <tr key={emp.id}
                                    onClick={() => onSelect(selectedId === emp.id ? null : emp.id)}
                                    className={`border-b border-border/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' :
                                        hasIssue ? (ri % 2 === 0 ? 'bg-amber-100' : 'bg-amber-50') :
                                            ri % 2 === 0 ? 'bg-card' : 'bg-slate-50'
                                        } hover:!bg-slate-100`}>
                                    <td className="px-3 py-1.5 font-semibold text-foreground whitespace-nowrap truncate sticky left-0 z-10 bg-inherit shadow-[1px_0_0_0_var(--border)]">{emp.name}</td>
                                    <td className="px-3 py-1.5 text-primary font-bold text-[11px] whitespace-nowrap">{emp.id}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap truncate text-[11px]" title={emp.pos}>{emp.pos}</td>
                                    {courses.map(c => {
                                        const due = emp.courses[c.id]
                                        const s = getEmployeeCourseStatus(emp, c.id)
                                        const m = STATUS_META[s]
                                        const d = getEmployeeCourseDaysLeft(emp, c.id)

                                        let lastTrainingStr = '-'
                                        let dueDateStr = '-'
                                        const issueDate = emp.courseIssueDates?.[c.id]
                                        if (issueDate) {
                                            const parsedIssueDate = new Date(issueDate)
                                            if (!isNaN(parsedIssueDate.getTime())) {
                                                lastTrainingStr = parsedIssueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                                            }
                                        } else if (due && due !== '-' && due !== 'na') {
                                            if (due.toLowerCase() === 'permanent' || due.toLowerCase() === 'never' || due.startsWith('9999')) {
                                                lastTrainingStr = '-'
                                            } else {
                                                const dueDate = new Date(due)
                                                if (!isNaN(dueDate.getTime()) && c.interval > 0) {
                                                    const lastTraining = new Date(dueDate)
                                                    lastTraining.setMonth(lastTraining.getMonth() - c.interval)
                                                    lastTrainingStr = lastTraining.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                                                }
                                            }
                                        }
                                        if (due && due !== '-' && due !== 'na') {
                                            if (due.toLowerCase() === 'permanent' || due.toLowerCase() === 'never' || due.startsWith('9999')) {
                                                dueDateStr = 'Never'
                                            } else {
                                                const dueDate = new Date(due)
                                                if (!isNaN(dueDate.getTime())) {
                                                    dueDateStr = dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                                                }
                                            }
                                        }

                                        const tooltipLines = [
                                            `📘 ${c.label}`,
                                            courseCycleText(c),
                                            `Status: ${m.label}`,
                                            ...(s !== 'na' && s !== 'missing' ? [
                                                `Last Training: ${lastTrainingStr}`,
                                                `Due Date: ${dueDateStr}`,
                                                ...(d !== null && s === 'warning' ? [`⚠️ ${d} days left`] : []),
                                                ...(s === 'expired' ? [`🚨 Expired`] : []),
                                            ] : []),
                                        ].join('\n')
                                        const isEnrolled = !!enrollments?.[`${emp.id}-${c.id}`]

                                        return (
                                            <td key={c.id}
                                                className="text-center border-l border-border/50 transition-all cursor-pointer hover:ring-2 hover:ring-primary/40 hover:z-10 relative select-none"
                                                style={{ background: m.bg, padding: '6px 2px' }}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onCellClick?.(emp, c)
                                                }}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                                            {s === 'na' || s === 'missing' ? (
                                                                <div className="w-2.5 h-2.5 rounded-full mx-auto"
                                                                    style={{ background: m.dot }} />
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center min-h-[32px] w-full h-full gap-0.5">
                                                                    {isEnrolled ? (
                                                                        <div className="w-full flex-1 flex flex-col items-center justify-center text-[11px] font-extrabold px-1.5 py-0.5 rounded-sm text-white bg-primary border border-primary/30 hover:opacity-80 transition-opacity">
                                                                            ENROLLED
                                                                        </div>
                                                                    ) : (
                                                                        // Valid / Warning / Expired share one layout; color comes from STATUS_META
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
                                                            <div className="text-muted-foreground">{courseCycleText(c)}</div>
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
                                                            {isEnrolled && (
                                                                <div className="border-t border-border pt-1.5 mt-1.5 border-dashed space-y-0.5 bg-primary/5 p-1.5 rounded-sm">
                                                                    <div className="font-bold text-primary flex items-center gap-1.5">
                                                                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                                                        Currently Enrolled
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="border-t border-border/50 pt-1 mt-1 text-[10px] text-primary font-semibold">
                                                                Click to view & edit details
                                                            </div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </td>
                                        )
                                    })}
                                    <td className="px-3 py-1.5 text-center border-l-2 border-border font-bold md:sticky right-0 md:z-10 bg-inherit shadow-[-1px_0_0_0_var(--border)]">
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
