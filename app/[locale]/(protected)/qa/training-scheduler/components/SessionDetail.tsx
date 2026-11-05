'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, Tag, Building2, Pencil, Trash2, X, Video, Link as LinkIcon, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { Session, STATUS_CONFIG, CAT_COLOR, formatDate, sessionDays } from '../types'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard"
import { useQuery } from '@tanstack/react-query'
import { getSchedulerById } from '@/lib/api/qa/scheduler'
import { useTrainingDataStatuses } from '@/lib/api/master/trainingDataStatuses.hooks'

interface SessionDetailProps {
    session: Session
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
}

export function SessionDetail({ session: s, onClose, onEdit, onDelete }: SessionDetailProps) {
    // Fetch live detail from API, fall back to session prop while loading
    const { data: detailResp } = useQuery({
        queryKey: ['scheduler-session-detail', s.id],
        queryFn: () => getSchedulerById(s.id),
        enabled: !!s.id,
    })

    const detail = detailResp?.responseData
    const { data: trainingStatusesResp } = useTrainingDataStatuses()
    const trainingStatuses = trainingStatusesResp?.responseData ?? []

    // Merge API data over session prop
    const enrolled = detail?.enrolledCount ?? s.enrolled
    const maxParticipants = detail?.maxParticipants ?? s.maxParticipants
    const instructor = detail?.instructor ?? s.instructor
    const venue = detail?.venue ?? s.venue
    const trainingAttendanceTypeId = detail?.trainingAttendanceTypeObj?.id ?? s.trainingAttendanceTypeId ?? 1
    const attendanceTypeName = detail?.trainingAttendanceTypeObj?.name ?? (trainingAttendanceTypeId === 2 ? 'Online' : 'Onsite')
    const link = detail?.link ?? s.link ?? ''
    const linkUrl = detail?.linkUrl ?? s.linkUrl ?? ''
    const linkMaterials = detail?.linkMaterials ?? s.linkMaterials ?? ''
    const note = detail?.note ?? null
    const isOnline = attendanceTypeName.toLowerCase().includes('online')

    const statusName = (detail?.trainingDataStatusesId
        ? trainingStatuses.find((st) => st.id === detail.trainingDataStatusesId)?.name
        : undefined) || s.status
    const cfg = STATUS_CONFIG[statusName] || STATUS_CONFIG.Scheduled
    const cc = CAT_COLOR[s.category] || { bar: '#94a3b8', light: '#f8fafc', text: '#475569' }
    const pct = maxParticipants > 0 ? Math.round((enrolled / maxParticipants) * 100) : 0
    const days = sessionDays(s)

    // Read calendar datetime directly — no UTC conversion
    const dateStart = detail?.startDate ? detail.startDate.split('T')[0] : s.dateStart
    const dateEnd = detail?.endDate ? detail.endDate.split('T')[0] : s.dateEnd
    const timeStart = detail?.startDate ? detail.startDate.split('T')[1]?.substring(0, 5) : s.timeStart
    const timeEnd = detail?.endDate ? detail.endDate.split('T')[1]?.substring(0, 5) : s.timeEnd

    // Use totalHours from API detail response, fallback to session prop
    const computedTotalHours = detail?.totalHours ?? s.totalHours ?? 0

    const INFO_ROWS = [
        { key: 'date', icon: Calendar, label: 'Date', val: `${formatDate(dateStart)} - ${formatDate(dateEnd)}` },
        { key: 'time', icon: Clock, label: 'Time', val: `${timeStart} - ${timeEnd}` },
        { key: 'category', icon: Tag, label: 'Category', val: detail?.categoryObj?.name },
        { key: 'total-hours', icon: Clock, label: 'Total Hours', val: computedTotalHours > 0 ? `${computedTotalHours} hrs` : '—' },
        { key: 'instructor', icon: User, label: 'Instructor', val: instructor },
        { key: 'training-type', icon: Tag, label: 'Training Type', val: detail?.courseObj?.courseType },
        { key: 'format', icon: isOnline ? Video : MapPin, label: 'Attendance Type', val: attendanceTypeName, isBadge: true },
    ]

    const targetDepts: string[] = detail?.requiredFor?.length ? detail.requiredFor : []
    const [showAllDepts, setShowAllDepts] = useState(false)
    const [hiddenDeptCount, setHiddenDeptCount] = useState(0)
    const [deptsEl, setDeptsEl] = useState<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!deptsEl || targetDepts.length === 0) {
            setHiddenDeptCount(0)
            return
        }
        const measure = () => {
            const children = Array.from(deptsEl.children) as HTMLElement[]
            if (children.length === 0) {
                setHiddenDeptCount(0)
                return
            }
            const rowTops: number[] = []
            let hidden = 0
            for (const child of children) {
                const top = child.offsetTop
                if (!rowTops.some((t) => Math.abs(t - top) <= 4)) {
                    rowTops.push(top)
                }
                if (rowTops.length > 2) {
                    hidden++
                }
            }
            setHiddenDeptCount(hidden)
        }
        const rafId = requestAnimationFrame(measure)
        const ro = new ResizeObserver(measure)
        ro.observe(deptsEl)
        return () => {
            cancelAnimationFrame(rafId)
            ro.disconnect()
        }
    }, [deptsEl, targetDepts.length])

    const canToggleDepts = hiddenDeptCount > 0 || targetDepts.length > 4 || showAllDepts

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose() }} >
            <DialogContent size='md' hideClose className="w-screen max-w-none h-dvh max-h-dvh rounded-none border-0 sm:w-[calc(100vw-2rem)] sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl sm:border p-0 gap-0 overflow-hidden flex flex-col" >
                <DialogHeader className="shrink-0 px-4 pt-3 pb-3 sm:px-5 sm:pt-5 sm:pb-4 flex flex-row justify-between items-start gap-2 sm:gap-3 space-y-0 text-left border-b border-border sm:border-b-0">
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-1.5">
                        <DialogTitle className="text-sm sm:text-lg font-semibold leading-snug break-words line-clamp-3 sm:line-clamp-none">{s.courseName}</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-medium"
                                        style={{ background: cc.light, color: cc.text }}>{s.courseCode}</span>
                                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border font-medium flex items-center ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                                        {statusName}
                                    </span>
                                </div>
                            </div>
                        </DialogDescription>
                    </div>
                    <div className="flex shrink-0 gap-1 justify-end items-start pt-0.5 sm:pt-0">
                        <PermissionActionGuard menuCode="QA_MONITORING" action="canEdit">
                            <button onClick={onEdit}
                                className="w-7 h-7 sm:w-10 sm:h-auto sm:py-2 text-sm rounded-md sm:rounded-lg border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-transparent">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </PermissionActionGuard>
                        <PermissionActionGuard menuCode="QA_MONITORING" action="canDelete">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="w-7 h-7 sm:w-10 sm:h-auto sm:py-2 text-sm rounded-md sm:rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Training Session</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete this training session? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </PermissionActionGuard>
                        <DialogClose asChild>
                            <button
                                className="w-7 h-7 sm:w-10 sm:h-auto sm:py-2 text-sm rounded-md sm:rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-transparent">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </DialogClose>
                    </div>
                </DialogHeader>
                {/* Scrollable body — 2 column layout */}
                <div className="px-4 py-3 sm:px-5 sm:py-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                        {/* Left column: Info rows + Enrollment */}
                        <div className="min-w-0 space-y-4">
                            {/* Info rows — 2 column grid */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                                {INFO_ROWS.map(({ key, icon: Icon, label, val, isBadge }) => (
                                    <div key={key} className={`flex min-w-0 items-start gap-2.5 ${key === 'date' ? 'col-span-2 md:col-span-1' : ''}`}>
                                        <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                            {isBadge ? (
                                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md mt-0.5 ${isOnline ? 'bg-violet-50 text-violet-600' : 'bg-sky-50 text-sky-600'}`}>
                                                    {String(val)}
                                                </span>
                                            ) : (
                                                <p className="text-sm text-foreground font-medium break-words md:truncate">{val || '—'}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Venue */}
                                <div className="flex min-w-0 items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">Venue</p>
                                        <p className="text-sm text-foreground font-medium truncate">{venue || <span className="text-muted-foreground italic">—</span>}</p>
                                    </div>
                                </div>
                                {/* Link URL */}
                                <div className="flex min-w-0 items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                        <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">Link URL</p>
                                        {linkUrl ? (
                                            <a href={linkUrl} target="_blank" rel="noopener noreferrer"
                                                className="text-sm text-primary font-medium truncate block hover:underline">
                                                {linkUrl.replace(/^https?:\/\//, '').substring(0, 35)}{linkUrl.length > 42 ? '...' : ''}
                                            </a>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">—</p>
                                        )}
                                    </div>
                                </div>
                                {/* Link Materials */}
                                <div className="flex min-w-0 items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">Link Materials</p>
                                        {linkMaterials ? (
                                            <a href={linkMaterials} target="_blank" rel="noopener noreferrer"
                                                className="text-sm text-primary font-medium truncate block hover:underline">
                                                {linkMaterials.replace(/^https?:\/\//, '').substring(0, 35)}{linkMaterials.length > 42 ? '...' : ''}
                                            </a>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">—</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Target Dept. */}
                            <div className="flex min-w-0 items-start gap-2.5">
                                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <p className="text-xs text-muted-foreground">
                                            Target Dept. {targetDepts.length > 0 && <span className="text-muted-foreground/80">({targetDepts.length})</span>}
                                        </p>
                                        {canToggleDepts && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAllDepts((prev) => !prev)}
                                                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
                                            >
                                                {showAllDepts ? (
                                                    <>
                                                        Show less <ChevronUp className="w-3.5 h-3.5" />
                                                    </>
                                                ) : (
                                                    <>
                                                        Show all <ChevronDown className="w-3.5 h-3.5" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    {targetDepts.length > 0 ? (
                                        <div>
                                            <div
                                                ref={setDeptsEl}
                                                style={!showAllDepts ? { maxHeight: '52px', overflow: 'hidden' } : undefined}
                                                className="relative flex flex-wrap gap-1.5 transition-all"
                                            >
                                                {targetDepts.map((dept) => (
                                                    <span key={dept} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
                                                        {dept}
                                                    </span>
                                                ))}
                                            </div>
                                            {canToggleDepts && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAllDepts((prev) => !prev)}
                                                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer border border-border"
                                                >
                                                    {showAllDepts ? (
                                                        <>
                                                            Show less <ChevronUp className="w-3 h-3" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            {hiddenDeptCount > 0 ? `+${hiddenDeptCount} more (Show all)` : `Show all (${targetDepts.length})`} <ChevronDown className="w-3 h-3" />
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">— Not Required</p>
                                    )}
                                </div>
                            </div>


                        </div>

                        {/* Right column: Manage Enrollment + Note + Course Objective + Regulatory Notes */}
                        <div className="min-w-0 space-y-4">

                            {/* Course Objective */}
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Course Objective</h4>
                                <div className="bg-blue-50/50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed border border-blue-100">
                                    {detail?.courseObj?.courseObjective || s.objective
                                        ? <div dangerouslySetInnerHTML={{ __html: detail?.courseObj?.courseObjective || s.objective || '' }} />
                                        : <p className="text-muted-foreground italic">No course objective specified</p>
                                    }
                                </div>
                            </div>

                            {/* Additional Note */}
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Additional Note <span className="normal-case font-normal text-muted-foreground">(optional)</span></h4>
                                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed border border-slate-100 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4">
                                    {note
                                        ? <div dangerouslySetInnerHTML={{ __html: note }} />
                                        : <p className="text-muted-foreground italic">No additional note</p>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="w-full shrink-0 gap-2 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 border-t border-border flex flex-col sm:flex-col">
                    {/* Actions */}
                    {/* Enrollment bar */}
                    <div className="flex w-full justify-between items-center gap-3 sm:gap-8">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground font-medium">Enrollment</p>
                                <p className="text-xs text-foreground font-semibold">{enrolled} / {maxParticipants} <span className="text-muted-foreground font-normal">({pct}%)</span></p>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#f59e0b' : pct >= 80 ? '#3b82f6' : '#10b981' }} />
                            </div>
                            <div className="flex justify-between mt-1">
                                <p className="text-xs text-muted-foreground">{maxParticipants - enrolled} seats left</p>
                                {pct >= 100 && <p className="text-xs text-amber-600 font-medium">Full</p>}
                            </div>
                        </div>
                        <div className="shrink-0">
                            {/* Manage Enrollment button */}
                            <PermissionActionGuard menuCode="QA_MONITORING" action="canEdit">
                                <button onClick={() => window.location.href = `/en/qa/training-scheduler/${s.id}`}
                                    className="px-3 sm:w-30 sm:px-0 py-2 text-sm whitespace-nowrap rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium border-none">
                                    <User className="w-4 h-4" />
                                    Enrollment
                                </button>
                            </PermissionActionGuard>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
