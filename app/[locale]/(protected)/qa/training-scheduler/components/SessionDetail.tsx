'use client'

import { Calendar, Clock, MapPin, User, Tag, Building2, Pencil, Trash2, X, Video, Link as LinkIcon } from 'lucide-react'
import { Session, STATUS_CONFIG, CAT_COLOR, formatDate, sessionDays } from '../types'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard"
import { useQuery } from '@tanstack/react-query'
import { getSchedulerById } from '@/lib/api/qa/scheduler'

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

    // Merge API data over session prop
    const enrolled = detail?.enrolledCount ?? s.enrolled
    const maxParticipants = detail?.maxParticipants ?? s.maxParticipants
    const instructor = detail?.instructor ?? s.instructor
    const venue = detail?.venue ?? s.venue
    const format = detail?.format ?? s.format ?? 'Onsite'
    const link = detail?.link ?? s.link ?? ''
    const note = detail?.note ?? null
    const isOnline = format === 'Online'

    const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.Scheduled
    const cc = CAT_COLOR[s.category] || { bar: '#94a3b8', light: '#f8fafc', text: '#475569' }
    const pct = maxParticipants > 0 ? Math.round((enrolled / maxParticipants) * 100) : 0
    const days = sessionDays(s)

    // UTC → local helpers (force UTC parse in case API omits timezone suffix)
    const pad = (n: number) => String(n).padStart(2, '0')
    const parseUTC = (iso: string) => new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z')
    const toLocalDate = (iso: string) => { const d = parseUTC(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
    const toLocalTime = (iso: string) => { const d = parseUTC(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

    // Use detail dates (converted UTC→local) when available, fallback to session prop
    const dateStart = detail?.startDate ? toLocalDate(detail.startDate) : s.dateStart
    const dateEnd = detail?.endDate ? toLocalDate(detail.endDate) : s.dateEnd
    const timeStart = detail?.startDate ? toLocalTime(detail.startDate) : s.timeStart
    const timeEnd = detail?.endDate ? toLocalTime(detail.endDate) : s.timeEnd

    const INFO_ROWS = [
        { key: 'start', icon: Calendar, label: 'Start', val: formatDate(dateStart) },
        { key: 'start-time', icon: Clock, label: 'Time', val: timeStart },
        { key: 'end', icon: Calendar, label: 'End', val: formatDate(dateEnd) },
        { key: 'end-time', icon: Clock, label: 'Time', val: timeEnd },
        { key: 'category', icon: Tag, label: 'Category', val: detail?.categoryObj?.name },
        { key: 'instructor', icon: User, label: 'Instructor', val: instructor },
        { key: 'training-type', icon: Tag, label: 'Training Type', val: detail?.courseObj?.courseType },
        { key: 'format', icon: isOnline ? Video : MapPin, label: 'Format', val: isOnline ? 'Online' : 'Onsite', isBadge: true },
    ]

    const targetDepts: string[] = detail?.requiredFor?.length ? detail.requiredFor : []

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose() }} >
            <DialogContent size='md' hideClose className="max-w-2xl w-full p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]" >
                <DialogHeader className=" px-5 pt-5 pb-4 flex flex-row justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <DialogTitle className="">{s.courseName}</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                                        style={{ background: cc.light, color: cc.text }}>{s.courseCode}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                                        {s.status}
                                    </span>
                                </div>
                            </div>
                        </DialogDescription>
                    </div>
                    <div className="flex gap-1 justify-end items-start">
                        <PermissionActionGuard menuCode="QA_MONITORING" action="canEdit">
                            <button onClick={onEdit}
                                className="w-10 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-transparent">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </PermissionActionGuard>
                        <PermissionActionGuard menuCode="QA_MONITORING" action="canDelete">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="w-10 py-2 text-sm rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
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
                                className="w-10 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-transparent">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </DialogClose>
                    </div>
                </DialogHeader>
                {/* Scrollable body — 2 column layout */}
                <div className="px-5 py-4 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left column: Info rows + Enrollment */}
                        <div className="space-y-4">
                            {/* Info rows — 2 column grid */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                                {INFO_ROWS.map(({ key, icon: Icon, label, val, isBadge }) => (
                                    <div key={key} className="flex items-start gap-2.5">
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
                                                <p className="text-sm text-foreground font-medium truncate">{val}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Location / Meeting Link — continues in the same grid */}
                                <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                        {isOnline ? <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" /> : <MapPin className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">{isOnline ? 'Meeting Link' : 'Location'}</p>
                                        {isOnline && link ? (
                                            <a href={link} target="_blank" rel="noopener noreferrer"
                                                className="text-sm text-primary font-medium truncate block hover:underline">
                                                {link.replace(/^https?:\/\//, '').substring(0, 35)}{link.length > 42 ? '...' : ''}
                                            </a>
                                        ) : (
                                            <p className="text-sm text-foreground font-medium truncate">{venue || <span className="text-muted-foreground italic">—</span>}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Target Dept. */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Target Dept.</p>
                                </div>
                                {targetDepts.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 ml-8">
                                        {targetDepts.map((dept) => (
                                            <span key={dept} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
                                                {dept}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic ml-8">— Not Required</p>
                                )}
                            </div>


                        </div>

                        {/* Right column: Manage Enrollment + Note + Course Objective + Regulatory Notes */}
                        <div className="space-y-4">

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

                <DialogFooter className="flex-1 gap-2 justify-end px-5 pb-5 pt-3 border-t border-border flex flex-col">
                    {/* Actions */}
                    {/* Enrollment bar */}
                    <div className="flex-1 flex justify-between items-center gap-8">
                        <div className="flex-1 ">
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
                        <div className="">
                            {/* Manage Enrollment button */}
                            <PermissionActionGuard menuCode="QA_MONITORING" action="canEdit">
                                <button onClick={() => window.location.href = `/en/qa/training-scheduler/${s.id}`}
                                    className="w-30 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium border-none">
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
