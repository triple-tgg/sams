'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Check } from 'lucide-react'
import { CATEGORY_DOT } from '../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourseMatrix, upsertCourseMatrixRequirements, getCourseById, getCourseCategories, getCourseList } from '@/lib/api/qa/course'
import { TransferBox } from '@/components/ui/transfer-box'
import { useCombinations } from '@/lib/api/master/aircraft-engine/aircraftEngine.hooks'
import { groupCombinationDisplayLabels } from '@/lib/utils/aircraftEngineDisplay'
import { toast } from 'sonner'
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'
import { MENU } from "@/lib/permission-codes";
import { useMenuPermission } from "@/hooks/use-menu-permission";

const HEADER_MODE_KEY = 'qa-course-matrix-header-mode'
const HEADER_MODES = [
    { value: 'code', label: 'Code' },
    { value: 'name', label: 'Name' },
] as const

interface TrainingNeedsMatrixProps {
    /** Course department filter (0 = all). */
    departmentId?: number
    /** Course category filter (0 = all). */
    categoryId?: number
    /** Show only this role column (department sub / position id); null = all roles of the department. */
    departmentSubId?: number | null
}

export function TrainingNeedsMatrix({ departmentId = 0, categoryId = 0, departmentSubId = null }: TrainingNeedsMatrixProps = {}) {
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
        queryKey: ['course-matrix', departmentId, categoryId],
        queryFn: () => getCourseMatrix({ departmentId, categoryId, page: 1, perPage: 100 })
    })

    const apiRoles = useMemo(() => {
        const roles = matrixResp?.responseData?.departmentSubs || []
        // A selected role narrows the matrix to that single column
        return departmentSubId ? roles.filter(r => r.departmentSubId === departmentSubId) : roles
    }, [matrixResp, departmentSubId])
    const apiCourses = useMemo(() => matrixResp?.responseData?.courses || [], [matrixResp])

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

    // ── Edit requirement dialog ──
    // The status is chosen explicitly (not just flipped) so a Required Type Course cell can be
    // reopened to change its aircraft type licences without toggling it off.
    const [targetRequired, setTargetRequired] = useState(true)
    const [selectedComboIds, setSelectedComboIds] = useState<number[]>([])
    const [initialComboIds, setInitialComboIds] = useState<number[]>([])
    const [comboTouched, setComboTouched] = useState(false)
    const { data: combinations } = useCombinations()
    const activeCombinations = combinations || []

    const { data: categoryListResp } = useQuery({
        queryKey: ['course-categories'],
        queryFn: getCourseCategories,
    })
    // Category + aircraft types per course (the matrix endpoint carries neither)
    const { data: courseListResp } = useQuery({
        queryKey: ['course-list-matrix-meta'],
        queryFn: () => getCourseList({ categoryId: null, courseName: '', courseDepartmentRequirementId: null, page: 1, perPage: 999 }),
    })
    const courseMeta = useMemo(() => {
        const map = new Map<number, { category: string; recurrent: boolean; recurrentYears: number | null; note: string | null; comboIds: number[] }>()
        for (const c of courseListResp?.responseData ?? []) {
            map.set(c.id, {
                category: c.courseCategory?.name ?? '',
                recurrent: c.courseType === 'Recurrent',
                recurrentYears: c.recurrenceIntervalYears,
                note: c.additionalNote,
                comboIds: c.aircraftEngineCombinationIds ?? [],
            })
        }
        return map
    }, [courseListResp])
    /** Only Type Course requirements are editable from the matrix. */
    const isTypeCourseRow = (courseId: number) => courseMeta.get(courseId)?.category === 'Type Course'

    const { data: editingCourseResp, isLoading: isLoadingEditingCourse } = useQuery({
        queryKey: ['course-detail', editingCell?.courseId],
        queryFn: () => getCourseById(editingCell!.courseId),
        enabled: !!editingCell?.courseId,
    })
    const editingCategoryName = categoryListResp?.responseData?.find(
        c => c.id === editingCourseResp?.responseData?.course?.courseCategoryId
    )?.name
    const isTypeCourse = editingCategoryName === 'Type Course'
    const wasRequired = editingCell?.currentVal === 1
    // Licences apply only to a Required Type Course requirement
    const needsAircraftTypes = !!editingCell && isTypeCourse && targetRequired
    const aircraftTypesMissing = needsAircraftTypes && selectedComboIds.length === 0
    const sameIds = (a: number[], b: number[]) =>
        a.length === b.length && a.every(id => b.includes(id))
    const hasChanges = !!editingCell && (
        targetRequired !== wasRequired ||
        (needsAircraftTypes && !sameIds(selectedComboIds, initialComboIds))
    )

    // Clicking a Not Required cell proposes Required; a Required cell opens as-is for editing.
    // Kept apart from the licence prefill below so late-loading course data cannot undo the user's choice.
    useEffect(() => {
        if (editingCell) setTargetRequired(true)
    }, [editingCell])

    // Reset the form each time a cell is opened.
    // Licences come from the requirement itself when the matrix sends them, else from the course.
    useEffect(() => {
        if (!editingCell) {
            setSelectedComboIds([])
            setInitialComboIds([])
            setComboTouched(false)
            return
        }
        const req = apiCourses
            .find(c => c.courseId === editingCell.courseId)
            ?.requirements.find(r => r.departmentSubId === editingCell.roleId)
        const fromRequirement = editingCell.currentVal === 1 ? req?.aircraftEngineCombinationIds : undefined
        const fromCourse = editingCourseResp?.responseData?.aircraftEngineCombinations
            ?.map(c => c.aircraftEngineCombinationId) ?? []
        const ids = fromRequirement && fromRequirement.length > 0 ? fromRequirement : fromCourse
        setSelectedComboIds(ids)
        // A Not Required cell has no saved licences, so any selection counts as a change
        setInitialComboIds(editingCell.currentVal === 1 ? ids : [])
    }, [editingCell, editingCourseResp, apiCourses])

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
        if (!editingCell || !hasChanges) return
        if (aircraftTypesMissing) {
            setComboTouched(true)
            return
        }

        // Optimistic local update
        setLocalMatrixData(prev => {
            const newData = { ...prev }
            const rowData = [...(newData[editingCell.courseId] || [])]
            rowData[editingCell.roleIndex] = targetRequired ? 1 : 0
            newData[editingCell.courseId] = rowData
            return newData
        })

        mutation.mutate([{
            courseId: editingCell.courseId,
            courseDepartmentSubId: editingCell.roleId,
            isRequired: targetRequired,
            aircraftEngineCombinationIds: needsAircraftTypes ? selectedComboIds : [],
        }])
    }

    // Both tables share a fixed layout + colgroup so header and body columns line up.
    const COURSE_COL_W = 256
    const ROLE_COL_W = 42
    const AIRCRAFT_COL_W = 42
    const tableStyle: React.CSSProperties = {
        tableLayout: 'fixed',
        width: '100%',
        // Only as wide as the columns need — a fixed 900px floor overflowed narrow screens
        // and pushed the role columns out of view when only a few roles are shown.
        minWidth: COURSE_COL_W + AIRCRAFT_COL_W + ROLE_COL_W * apiRoles.length,
    }
    const colGroup = (
        <colgroup>
            {/* No fixed width: the course column takes the leftover space, role columns stay 42px */}
            <col />
            <col style={{ width: AIRCRAFT_COL_W }} />
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
                            <th className="sticky left-0 z-20 bg-primary border-r border-white/20 px-4 py-3 align-bottom text-left text-white font-medium">
                                Training Course
                            </th>
                            <th className="bg-primary border-r border-white/20 px-1 py-2 align-bottom text-white font-medium">
                                {/* Vertical label, same style as the role columns */}
                                <div className="flex flex-col items-center">
                                    <span className="text-white font-semibold [writing-mode:vertical-rl] rotate-180 whitespace-nowrap leading-tight">
                                        Aircraft Type
                                    </span>
                                </div>
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
                className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30"
                onScroll={(e) => {
                    if (headScrollRef.current) headScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
                }}
            >
                <table className="text-xs border-collapse" style={tableStyle}>
                    {colGroup}
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={apiRoles.length + 2} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                        Loading matrix data...
                                    </div>
                                </td>
                            </tr>
                        ) : apiCourses.length === 0 ? (
                            <tr>
                                <td colSpan={apiRoles.length + 2} className="text-center py-12 text-muted-foreground">
                                    No matrix data found.
                                </td>
                            </tr>
                        ) : apiCourses.map((mc, rowIdx) => {
                            const data = localMatrixData[mc.courseId] || []
                            const courseInfo = courseMeta.get(mc.courseId)
                            const catDot = courseInfo ? CATEGORY_DOT[courseInfo.category] || 'bg-muted-foreground' : 'bg-muted-foreground'
                            const rowEditable = perm.canEdit && isTypeCourseRow(mc.courseId)
                            const aircraftLabels = courseInfo?.comboIds.length
                                ? groupCombinationDisplayLabels(courseInfo.comboIds, activeCombinations)
                                : []
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
                                    {/* Aircraft Type: ✓ when the course covers aircraft types (listed in the tooltip), ✕ otherwise */}
                                    <td className="border-r border-border text-center">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="w-full h-full flex justify-center items-center py-2 px-0.5">
                                                    {aircraftLabels.length > 0 ? (
                                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary">
                                                            <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted">
                                                            <span className="text-muted-foreground" style={{ fontSize: 8 }}>✕</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" sideOffset={10} className="max-w-[260px] bg-white text-zinc-900 border border-zinc-200 shadow-xl z-[5000]">
                                                <div className="p-1">
                                                    <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">Aircraft Type</p>
                                                    {aircraftLabels.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {aircraftLabels.map(label => (
                                                                <span key={label} className="inline-flex rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-inset ring-sky-100">
                                                                    {label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-zinc-500">No aircraft type</p>
                                                    )}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </td>
                                    {data.map((val, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={`text-center transition-colors ${
                                                rowEditable ? 'cursor-pointer hover:bg-primary/10' : 'cursor-default'
                                            } ${hoveredCol === colIdx ? 'bg-primary/[0.06]' : ''}`}
                                            onMouseEnter={() => setHoveredCol(colIdx)}
                                            onMouseLeave={() => setHoveredCol(null)}
                                            onClick={() => rowEditable && setEditingCell({
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

            {/* Edit Requirement Modal */}
            <Dialog open={!!editingCell} onOpenChange={(open) => !open && setEditingCell(null)}>
                <DialogContent size={needsAircraftTypes ? 'md' : 'default'} className={needsAircraftTypes ? 'max-w-3xl' : undefined}>
                    <DialogHeader>
                        <DialogTitle>Edit Training Requirement</DialogTitle>
                        <DialogDescription>
                            Set whether this role requires the course{isTypeCourse ? ' and which aircraft types it applies to' : ''}.
                        </DialogDescription>
                    </DialogHeader>

                    {editingCell && (
                        <div className="space-y-4 py-2 text-sm">
                            {/* Summary */}
                            <div className="space-y-2.5 bg-muted/50 p-4 rounded-lg">
                                <div className="grid grid-cols-[90px_1fr] gap-2">
                                    <span className="text-muted-foreground font-medium">Course:</span>
                                    <span className="text-foreground">{editingCell.courseName}</span>
                                </div>
                                <div className="grid grid-cols-[90px_1fr] gap-2">
                                    <span className="text-muted-foreground font-medium">Role:</span>
                                    <span className="text-foreground">{apiRoles[editingCell.roleIndex]?.departmentSubName} ({apiRoles[editingCell.roleIndex]?.departmentSubCode})</span>
                                </div>
                                {editingCategoryName && (
                                    <div className="grid grid-cols-[90px_1fr] gap-2">
                                        <span className="text-muted-foreground font-medium">Category:</span>
                                        <span className="text-foreground">{editingCategoryName}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-[90px_1fr] gap-2">
                                    <span className="text-muted-foreground font-medium">Current:</span>
                                    <span className={wasRequired ? 'text-primary font-medium' : 'text-muted-foreground'}>
                                        {wasRequired ? 'Required' : 'Not Required'}
                                    </span>
                                </div>
                            </div>

                            {/* Status choice */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Requirement</label>
                                <div role="radiogroup" className="grid grid-cols-2 gap-2">
                                    {([true, false] as const).map(opt => {
                                        const active = targetRequired === opt
                                        return (
                                            <button
                                                key={String(opt)}
                                                type="button"
                                                role="radio"
                                                aria-checked={active}
                                                onClick={() => setTargetRequired(opt)}
                                                disabled={mutation.isPending}
                                                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                                    active
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-border text-foreground/70 hover:bg-muted'
                                                }`}
                                            >
                                                <span className={`flex h-4 w-4 items-center justify-center rounded ${opt ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                    {opt ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="text-[10px] leading-none">–</span>}
                                                </span>
                                                <span className="text-sm font-medium">{opt ? 'Required' : 'Not Required'}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Aircraft Type License — Type Course + Required only */}
                            {isLoadingEditingCourse ? (
                                <p className="text-xs text-muted-foreground">Loading course details…</p>
                            ) : needsAircraftTypes && (
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                                        Aircraft Type License <span className="text-red-400">*</span>
                                    </label>
                                    <TransferBox
                                        items={activeCombinations.map(combo => ({ id: combo.id, name: combo.displayLabel, groupKey: combo.familyCode }))}
                                        selected={new Set(activeCombinations.filter(combo => selectedComboIds.includes(combo.id)).map(combo => combo.displayLabel))}
                                        onSelectedChange={(selectedNames) => {
                                            setSelectedComboIds(activeCombinations.filter(combo => selectedNames.has(combo.displayLabel)).map(combo => combo.id))
                                        }}
                                        emptyLabel="No aircraft type selected"
                                        hasError={comboTouched && aircraftTypesMissing}
                                        height={240}
                                        renderSelectedGroupLabel={(_, groupItems) =>
                                            groupCombinationDisplayLabels(groupItems.map(item => Number(item.id)), activeCombinations).join(', ')
                                        }
                                    />
                                    {comboTouched && aircraftTypesMissing && (
                                        <p className="text-[11px] text-red-500 mt-1">Aircraft Type License is required</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCell(null)} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleConfirmChange}
                            disabled={mutation.isPending || isLoadingEditingCourse || !hasChanges}
                        >
                            {mutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    )
}
