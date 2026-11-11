'use client'

import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { CATEGORY_DOT } from '../types'
import { COURSES } from '../data'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourseMatrix, upsertCourseMatrixRequirements } from '@/lib/api/qa/course'
import { toast } from 'sonner'
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'
import { MENU } from "@/lib/permission-codes";
import { useMenuPermission } from "@/hooks/use-menu-permission";

const HEADER_MODE_KEY = 'qa-course-matrix-header-mode'
const HEADER_MODES = [
    { value: 'code', label: 'Code' },
    { value: 'name', label: 'Name' },
] as const

export function TrainingNeedsMatrix() {
    const perm = useMenuPermission(MENU.QA_COURSE_MANAGEMENT);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null)
    const [hoveredCol, setHoveredCol] = useState<number | null>(null)
    const [editingCell, setEditingCell] = useState<{ courseId: number, courseName: string, roleIndex: number, currentVal: number, roleId: number } | null>(null)
    const queryClient = useQueryClient()
    const { user } = useReduxAuth()

    // Column header label: short role code (default) or full role name (rotated).
    const [headerMode, setHeaderMode] = useState<'code' | 'name'>('code')
    useEffect(() => {
        try {
            const saved = localStorage.getItem(HEADER_MODE_KEY)
            if (saved === 'code' || saved === 'name') setHeaderMode(saved)
        } catch { /* storage unavailable */ }
    }, [])
    const changeHeaderMode = (mode: 'code' | 'name') => {
        setHeaderMode(mode)
        try { localStorage.setItem(HEADER_MODE_KEY, mode) } catch { /* storage unavailable */ }
    }

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

    // Fetch API Data
    const { data: matrixResp, isLoading } = useQuery({
        queryKey: ['course-matrix'],
        queryFn: () => getCourseMatrix({ departmentId: 0, categoryId: 0, page: 1, perPage: 100 })
    })

    const apiRoles = matrixResp?.responseData?.departmentSubs || []
    const apiCourses = matrixResp?.responseData?.courses || []

    // Convert API format to the local matrixData format { [courseId]: [0, 1, 0, ...] }
    // In a real app, you might want to use useEffect to sync this with a local state,
    // but here we can just compute it if we aren't sending updates back immediately.
    // If we need local edits, we should keep it in state. Let's use state and sync it.
    const [localMatrixData, setLocalMatrixData] = useState<Record<number, number[]>>({})

    useEffect(() => {
        if (apiCourses.length > 0 && apiRoles.length > 0) {
            const initialData: Record<number, number[]> = {}
            apiCourses.forEach(course => {
                // Ensure the requirements align with the roles array
                const roleReqs = apiRoles.map(role => {
                    const req = course.requirements.find(r => r.departmentSubId === role.departmentSubId)
                    return req?.isRequired ? 1 : 0
                })
                initialData[course.courseId] = roleReqs
            })
            setLocalMatrixData(initialData)
        }
    }, [apiCourses, apiRoles])

    const mutation = useMutation({
        mutationFn: upsertCourseMatrixRequirements,
        onSuccess: () => {
            toast.success("Training requirement updated successfully")
            queryClient.invalidateQueries({ queryKey: ['course-matrix'] })
            setEditingCell(null)
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update training requirement")
        }
    })

    const handleConfirmChange = () => {
        if (!editingCell) return
        
        // Optimistic local update
        setLocalMatrixData(prev => {
            const newData = { ...prev }
            const rowData = [...(newData[editingCell.courseId] || [])]
            rowData[editingCell.roleIndex] = editingCell.currentVal === 1 ? 0 : 1
            newData[editingCell.courseId] = rowData
            return newData
        })

        // Send to API
        mutation.mutate([{
            courseId: editingCell.courseId,
            courseDepartmentSubId: editingCell.roleId,
            isRequired: editingCell.currentVal === 0, // Invert current value
            userName: user?.username || "system"
        }])
    }

    // Both tables share a fixed layout + colgroup so header and body columns line up.
    const COURSE_COL_W = 256
    const ROLE_COL_W = 42
    const tableStyle: React.CSSProperties = {
        tableLayout: 'fixed',
        width: '100%',
        minWidth: Math.max(900, COURSE_COL_W + ROLE_COL_W * apiRoles.length),
    }
    const colGroup = (
        <colgroup>
            <col style={{ width: COURSE_COL_W }} />
            {apiRoles.map((_, i) => <col key={i} style={{ width: ROLE_COL_W }} />)}
        </colgroup>
    )

    return (
        <TooltipProvider delayDuration={200}>
            <div className="bg-card rounded-xl border border-border overflow-clip">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Training Requirements Matrix</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">SAMS-FM-CM-014 Rev.03 — Required training per role</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div role="radiogroup" aria-label="Column header label" className="inline-flex rounded-lg border border-border bg-card p-0.5">
                        {HEADER_MODES.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                role="radio"
                                aria-checked={headerMode === opt.value}
                                onClick={() => changeHeaderMode(opt.value)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${headerMode === opt.value
                                    ? 'bg-primary text-white'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
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
            <div
                className="sticky z-30 bg-primary text-white overflow-hidden"
                style={{ top: stickyTop }}
                ref={headScrollRef}
            >
                <table className="text-xs border-collapse" style={tableStyle}>
                    {colGroup}
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-20 bg-primary border-r border-white/20 px-4 py-3 align-bottom text-left text-white w-64 min-w-[256px] font-medium">
                                Training Course
                            </th>
                            {apiRoles.map((role, i) => (
                                <th
                                    key={i}
                                    title={`${role.departmentSubCode} - ${role.departmentSubName}`}
                                    className={`px-1 py-2 font-medium align-bottom transition-colors ${
                                        hoveredCol === i ? 'bg-white/15' : ''
                                    }`}
                                    style={{ minWidth: 42, width: 42 }}
                                    onMouseEnter={() => setHoveredCol(i)}
                                    onMouseLeave={() => setHoveredCol(null)}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        {headerMode === 'code' ? (
                                            <span className="text-white font-semibold">{role.departmentSubCode}</span>
                                        ) : (
                                            <span className="text-white font-semibold [writing-mode:vertical-rl] rotate-180 whitespace-nowrap overflow-hidden text-ellipsis max-h-44 leading-tight">
                                                {role.departmentSubName}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
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
                <table className="text-xs border-collapse" style={tableStyle}>
                    {colGroup}
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={apiRoles.length + 1} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                        Loading matrix data...
                                    </div>
                                </td>
                            </tr>
                        ) : apiCourses.length === 0 ? (
                            <tr>
                                <td colSpan={apiRoles.length + 1} className="text-center py-12 text-muted-foreground">
                                    No matrix data found.
                                </td>
                            </tr>
                        ) : apiCourses.map((mc, rowIdx) => {
                            const data = localMatrixData[mc.courseId] || []
                            const courseInfo = COURSES.find(c => c.id === mc.courseId)
                            const catDot = courseInfo ? CATEGORY_DOT[courseInfo.category] || 'bg-muted-foreground' : 'bg-muted-foreground'
                            return (
                                <tr
                                    key={mc.courseId}
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
                                                    <span className="text-xs text-foreground leading-snug line-clamp-2">{mc.courseName}</span>
                                                    {courseInfo?.recurrent && (
                                                        <span className="shrink-0 text-orange-400 text-xs">↺</span>
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="max-w-[300px] p-0 bg-white text-zinc-900 border border-zinc-200 shadow-xl z-[5000] overflow-hidden">
                                                <div className={`${catDot || 'bg-muted-foreground'} px-3 py-2 text-white`}>
                                                    <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider mb-0.5">Training Course</p>
                                                    <p className="text-sm font-bold leading-snug">{mc.courseName}</p>
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
                                            onClick={() => perm.canEdit && setEditingCell({
                                                courseId: mc.courseId,
                                                courseName: mc.courseName,
                                                roleIndex: colIdx,
                                                currentVal: val,
                                                roleId: apiRoles[colIdx]?.departmentSubId
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
                                                            <p className="text-[13px] font-bold leading-snug">{apiRoles[colIdx]?.departmentSubName}</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-0.5">Abbreviation</p>
                                                                <p className="text-xs font-medium">{apiRoles[colIdx]?.departmentSubCode}</p>
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
                                    <span className="text-foreground">{apiRoles[editingCell.roleIndex]?.departmentSubName} ({apiRoles[editingCell.roleIndex]?.departmentSubCode})</span>
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
                        <Button variant="outline" onClick={() => setEditingCell(null)} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button color="primary" onClick={handleConfirmChange} disabled={mutation.isPending}>
                            {mutation.isPending ? "Updating..." : "Confirm Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    )
}
