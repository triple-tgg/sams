'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { CATEGORY_DOT } from '../types'
import { COURSES, MATRIX_ROLES, MATRIX_DATA, MATRIX_COURSES } from '../data'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export function TrainingNeedsMatrix() {
    const [hoveredRow, setHoveredRow] = useState<number | null>(null)
    const [hoveredCol, setHoveredCol] = useState<number | null>(null)
    const [matrixData, setMatrixData] = useState<Record<number, number[]>>(MATRIX_DATA)
    const [editingCell, setEditingCell] = useState<{ courseId: number, courseName: string, roleIndex: number, currentVal: number } | null>(null)

    const handleConfirmChange = () => {
        if (!editingCell) return
        
        setMatrixData(prev => {
            const newData = { ...prev }
            const rowData = [...(newData[editingCell.courseId] || [])]
            rowData[editingCell.roleIndex] = editingCell.currentVal === 1 ? 0 : 1
            newData[editingCell.courseId] = rowData
            return newData
        })
        setEditingCell(null)
    }

    return (
        <TooltipProvider delayDuration={200}>
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
                            const data = matrixData[mc.id] || []
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
                                                ? 'color-mix(in srgb, hsl(var(--primary)) 5%, hsl(var(--card)))'
                                                : rowIdx % 2 === 0
                                                    ? 'hsl(var(--card))'
                                                    : 'color-mix(in srgb, hsl(var(--muted)) 30%, hsl(var(--card)))',
                                        }}
                                    >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-start gap-2 cursor-pointer">
                                                    <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${catDot}`} />
                                                    <span className="text-xs text-foreground leading-snug line-clamp-2">{mc.name}</span>
                                                    {courseInfo?.recurrent && (
                                                        <span className="shrink-0 text-orange-400 text-xs">↺</span>
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="max-w-[300px] p-0 bg-white text-zinc-900 border border-zinc-200 shadow-xl z-[5000] overflow-hidden">
                                                <div className={`${catDot || 'bg-muted-foreground'} px-3 py-2 text-white`}>
                                                    <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider mb-0.5">Training Course</p>
                                                    <p className="text-sm font-bold leading-snug">{mc.name}</p>
                                                </div>
                                                <div className="space-y-3 p-3">
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">Category</p>
                                                        <p className="text-xs">{courseInfo?.category || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">Training Type</p>
                                                        <p className="text-xs">{courseInfo?.recurrent ? `Recurrent (${courseInfo.recurrentYears} yrs)` : 'Initial'}</p>
                                                    </div>
                                                    {courseInfo?.note && (
                                                        <div>
                                                            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">Note</p>
                                                            <div className="text-xs text-zinc-700 leading-relaxed [&>p]:mb-1 [&>p:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: courseInfo.note }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </td>
                                    {data.map((val, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={`text-center transition-colors cursor-pointer hover:bg-primary/10 ${
                                                hoveredCol === colIdx ? 'bg-primary/[0.06]' : ''
                                            }`}
                                            onMouseEnter={() => setHoveredCol(colIdx)}
                                            onMouseLeave={() => setHoveredCol(null)}
                                            onClick={() => setEditingCell({
                                                courseId: mc.id,
                                                courseName: mc.name,
                                                roleIndex: colIdx,
                                                currentVal: val
                                            })}
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="w-full h-full flex justify-center items-center py-2 px-0.5">
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
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" sideOffset={10} className="max-w-[250px] bg-white text-zinc-900 border border-zinc-200 shadow-xl z-[5000]">
                                                    <div className="space-y-3 p-1">
                                                        <div>
                                                            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">Role / Department</p>
                                                            <p className="text-[13px] font-bold leading-snug">{MATRIX_ROLES[colIdx].full}</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">Abbreviation</p>
                                                                <p className="text-xs font-medium">{MATRIX_ROLES[colIdx].short}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">Status Required</p>
                                                                {val === 1 ? (
                                                                    <span className="inline-block text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 font-semibold">Required</span>
                                                                ) : (
                                                                    <span className="inline-block text-[10px] bg-zinc-50 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-100 font-semibold">Not Required</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </td>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>



        </div>

            {/* Confirmation Modal */}
            <Dialog open={!!editingCell} onOpenChange={(open) => !open && setEditingCell(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Change</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to change the requirement status for this course?
                        </DialogDescription>
                    </DialogHeader>

                    {editingCell && (
                        <div className="py-4 text-sm">
                            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="text-muted-foreground font-medium">Course:</span>
                                    <span className="text-foreground">{editingCell.courseName}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="text-muted-foreground font-medium">Role:</span>
                                    <span className="text-foreground">{MATRIX_ROLES[editingCell.roleIndex].full} ({MATRIX_ROLES[editingCell.roleIndex].short})</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="text-muted-foreground font-medium">Status:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="line-through opacity-60 text-destructive">
                                            {editingCell.currentVal === 1 ? 'Required' : 'Not Required'}
                                        </span>
                                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                        <span className="text-primary font-semibold">
                                            {editingCell.currentVal === 1 ? 'Not Required' : 'Required'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCell(null)}>
                            Cancel
                        </Button>
                        <Button color="primary" onClick={handleConfirmChange}>
                            Confirm Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    )
}
