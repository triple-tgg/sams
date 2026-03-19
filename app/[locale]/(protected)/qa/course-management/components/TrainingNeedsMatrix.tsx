'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { CATEGORY_DOT } from '../types'
import { COURSES, MATRIX_ROLES, MATRIX_DATA, MATRIX_COURSES } from '../data'

export function TrainingNeedsMatrix() {
    const [hoveredRow, setHoveredRow] = useState<number | null>(null)
    const [hoveredCol, setHoveredCol] = useState<number | null>(null)

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Training Requirements Matrix</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">SAMS-FM-CM-014 Rev.03 — Required training per role</p>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded flex items-center justify-center bg-primary">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </span>
                        Required
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground" style={{ fontSize: 10 }}>—</span>
                        </span>
                        Not Required
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="text-xs border-collapse" style={{ minWidth: 900 }}>
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-20 bg-card border-r border-b border-border px-4 py-3 text-left text-muted-foreground w-64 min-w-[256px] font-medium">
                                Training Course
                            </th>
                            {MATRIX_ROLES.map((role, i) => (
                                <th
                                    key={i}
                                    className={`border-b border-border px-1 py-2 font-medium transition-colors ${
                                        hoveredCol === i ? 'bg-primary/5' : ''
                                    }`}
                                    style={{ minWidth: 42, width: 42 }}
                                    onMouseEnter={() => setHoveredCol(i)}
                                    onMouseLeave={() => setHoveredCol(null)}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-foreground font-semibold">{role.short}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {MATRIX_COURSES.map((mc, rowIdx) => {
                            const data = MATRIX_DATA[mc.id] || []
                            const courseInfo = COURSES.find(c => c.id === mc.id)
                            const catDot = courseInfo ? CATEGORY_DOT[courseInfo.category] || 'bg-muted-foreground' : 'bg-muted-foreground'
                            return (
                                <tr
                                    key={mc.id}
                                    className={`border-b border-border/50 transition-colors ${
                                        hoveredRow === rowIdx
                                            ? 'bg-primary/5'
                                            : rowIdx % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                                    }`}
                                    onMouseEnter={() => setHoveredRow(rowIdx)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <td
                                        className="sticky left-0 z-10 border-r border-border px-4 py-2.5 leading-snug"
                                        style={{
                                            background: hoveredRow === rowIdx
                                                ? 'hsl(var(--primary) / 0.05)'
                                                : rowIdx % 2 === 0
                                                    ? 'hsl(var(--card))'
                                                    : 'hsl(var(--muted) / 0.3)',
                                        }}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${catDot}`} />
                                            <span className="text-xs text-foreground leading-snug">{mc.name}</span>
                                            {courseInfo?.recurrent && (
                                                <span className="shrink-0 text-orange-400 text-xs">↺</span>
                                            )}
                                        </div>
                                    </td>
                                    {data.map((val, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={`text-center py-2 px-0.5 transition-colors cursor-default ${
                                                hoveredCol === colIdx ? 'bg-primary/[0.06]' : ''
                                            }`}
                                            onMouseEnter={() => setHoveredCol(colIdx)}
                                            onMouseLeave={() => setHoveredCol(null)}
                                        >
                                            {val === 1 ? (
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary">
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted">
                                                    <span className="text-muted-foreground" style={{ fontSize: 8 }}>✕</span>
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Role Tooltips Footer */}
            <div className="border-t border-border px-4 py-3 bg-muted/30 overflow-x-auto">
                <div className="flex gap-2 flex-wrap">
                    {MATRIX_ROLES.map((role, i) => (
                        <span
                            key={i}
                            className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
                                hoveredCol === i
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-card text-muted-foreground border border-border'
                            }`}
                        >
                            <strong className="font-semibold">{role.short}</strong> = {role.full}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}
