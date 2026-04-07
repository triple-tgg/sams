'use client'

import { Employee, CourseRef, getStatus, getDaysLeft, STATUS_META, SortField, SortDir } from '../types'

interface StatusMatrixProps {
    employees: Employee[]
    courses: CourseRef[]
    selectedId: string | null
    onSelect: (id: string | null) => void
    sortField: SortField
    sortDir: SortDir
    onSort: (field: SortField) => void
    SortIcon: React.ComponentType<{ field: SortField }>
}

export function StatusMatrix({ employees, courses, selectedId, onSelect, sortField, sortDir, onSort, SortIcon }: StatusMatrixProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="bg-muted/50 border-b-2 border-border">
                        <th
                            className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none"
                            style={{ minWidth: 40 }}
                            onClick={() => onSort('no')}
                        >
                            <span className="inline-flex items-center gap-1"># <SortIcon field="no" /></span>
                        </th>
                        <th
                            className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none"
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
                            <th key={c.id} className="px-1 py-2 text-center text-muted-foreground font-bold border-l border-border" style={{ minWidth: 42 }}>
                                <div className="text-[10px] leading-snug">{c.short}</div>
                                <div className="text-[9px] text-muted-foreground/60 font-medium">{c.interval}m</div>
                            </th>
                        ))}
                        <th
                            className="px-3 py-2 text-center text-muted-foreground font-bold border-l-2 border-border cursor-pointer hover:text-foreground transition-colors select-none"
                            style={{ minWidth: 70 }}
                            onClick={() => onSort('score')}
                        >
                            <span className="inline-flex items-center gap-1">Score <SortIcon field="score" /></span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp, ri) => {
                        const statuses = courses.map(c => getStatus(emp.courses[c.id]))
                        const applicable = statuses.filter(s => s !== 'na' && s !== 'missing')
                        const validCount = applicable.filter(s => s === 'valid').length
                        const score = applicable.length > 0 ? Math.round(validCount / applicable.length * 100) : null
                        const hasIssue = statuses.some(s => s === 'expired' || s === 'warning')
                        const isSelected = selectedId === emp.id

                        return (
                            <tr key={emp.id}
                                onClick={() => onSelect(selectedId === emp.id ? null : emp.id)}
                                className={`border-b border-border/50 cursor-pointer transition-colors ${
                                    isSelected ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' :
                                    hasIssue ? (ri % 2 === 0 ? 'bg-amber-50/50' : 'bg-amber-50/30') :
                                    ri % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                                } hover:bg-muted/40`}>
                                <td className="px-3 py-1.5 text-muted-foreground font-semibold">{emp.no}</td>
                                <td className="px-3 py-1.5 font-semibold text-foreground whitespace-nowrap">{emp.name}</td>
                                <td className="px-3 py-1.5 text-primary font-bold text-[11px]">{emp.id}</td>
                                <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap text-[11px]">{emp.pos}</td>
                                {courses.map(c => {
                                    const due = emp.courses[c.id]
                                    const s = getStatus(due)
                                    const m = STATUS_META[s]
                                    const d = getDaysLeft(due)
                                    return (
                                        <td key={c.id}
                                            className="text-center border-l border-border/50 transition-opacity"
                                            style={{ background: m.bg, padding: '6px 4px', minWidth: 38 }}
                                            onClick={e => { e.stopPropagation(); onSelect(emp.id) }}>
                                            <div className="w-2.5 h-2.5 rounded-full mx-auto"
                                                style={{
                                                    background: m.dot,
                                                    boxShadow: s === 'expired' ? `0 0 0 3px ${m.dot}33` :
                                                               s === 'warning' ? `0 0 0 2px ${m.dot}44` : 'none',
                                                }} />
                                            {s === 'warning' && d !== null && (
                                                <div className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: m.text }}>{d}d</div>
                                            )}
                                            {s === 'expired' && (
                                                <div className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: m.text }}>EXP</div>
                                            )}
                                        </td>
                                    )
                                })}
                                <td className="px-3 py-1.5 text-center border-l-2 border-border">
                                    {score !== null ? (
                                        <div>
                                            <div className="text-[13px] font-extrabold"
                                                style={{ color: score === 100 ? '#16a34a' : score >= 70 ? '#d97706' : '#dc2626' }}>
                                                {score}%
                                            </div>
                                            <div className="h-[3px] bg-muted rounded-full mt-0.5 w-12 mx-auto overflow-hidden">
                                                <div className="h-full rounded-full" style={{
                                                    width: `${score}%`,
                                                    background: score === 100 ? '#16a34a' : score >= 70 ? '#f59e0b' : '#dc2626'
                                                }} />
                                            </div>
                                        </div>
                                    ) : '—'}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
