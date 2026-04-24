'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, Tag, Building2, Pencil, Trash2 } from 'lucide-react'
import { Session, STATUS_CONFIG, CAT_COLOR, formatDate, sessionDays } from '../types'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

interface SessionDetailProps {
    session: Session
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
}

export function SessionDetail({ session: s, onClose, onEdit, onDelete }: SessionDetailProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Ensure initial render is closed, then open to trigger CSS animation
        const timer = setTimeout(() => setIsOpen(true), 100)
        return () => clearTimeout(timer)
    }, [])

    const handleClose = () => {
        setIsOpen(false)
        // Wait for animation duration before unmounting
        setTimeout(onClose, 300)
    }

    const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.Scheduled
    const cc = CAT_COLOR[s.category] || { bar: '#94a3b8', light: '#f8fafc', text: '#475569' }
    const pct = Math.round((s.enrolled / s.maxParticipants) * 100)
    const days = sessionDays(s)

    const INFO_ROWS = [
        { icon: Calendar, label: 'Date', val: formatDate(s.dateStart) + (days > 1 ? ` – ${formatDate(s.dateEnd)}` : ''), sub: `${days} day${days > 1 ? 's' : ''}` },
        { icon: Clock, label: 'Time', val: `${s.timeStart} – ${s.timeEnd}` },
        { icon: MapPin, label: 'Venue', val: s.venue },
        { icon: User, label: 'Instructor', val: s.instructor },
        { icon: Building2, label: 'Target Dept.', val: s.dept },
        { icon: Tag, label: 'Training Type', val: s.type },
        { icon: Tag, label: 'Category', val: s.category },
    ]

    return (
        <Drawer open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }} direction="right">
            <DrawerContent className="fixed inset-y-0 right-0 left-auto mt-0 h-full w-[380px] sm:max-w-[420px] p-0 flex flex-col bg-card border-l border-border rounded-none rounded-l-[10px] [&>div:first-child]:hidden outline-none">
                {/* Header */}
                <div className="px-5 pt-6 pb-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-3 pr-6 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{ background: cc.light, color: cc.text }}>{s.courseCode}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                            {s.status}
                        </span>
                    </div>
                    <DrawerHeader className="p-0 text-left">
                        <DrawerTitle className="text-base text-foreground font-semibold leading-snug">
                            {s.courseName}
                        </DrawerTitle>
                    </DrawerHeader>
                </div>

                {/* Info */}
                <div className="px-5 py-4 space-y-3.5 flex-1 overflow-y-auto">
                    {INFO_ROWS.map(({ icon: Icon, label, val, sub }) => (
                        <div key={label} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-sm text-foreground font-medium">{val}</p>
                                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                            </div>
                        </div>
                    ))}

                    {/* Enrollment bar */}
                    <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground font-medium">Enrollment</p>
                            <p className="text-xs text-foreground font-semibold">{s.enrolled} / {s.maxParticipants} <span className="text-muted-foreground font-normal">({pct}%)</span></p>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                                style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#f59e0b' : pct >= 80 ? '#3b82f6' : '#10b981' }} />
                        </div>
                        <div className="flex justify-between mt-1">
                            <p className="text-xs text-muted-foreground">{s.maxParticipants - s.enrolled} seats left</p>
                            {pct >= 100 && <p className="text-xs text-amber-600 font-medium">Full</p>}
                        </div>
                    </div>

                    {/* Course Objective */}
                    <div className="pt-3 border-t border-border">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Course Objective</h4>
                        <div className="bg-blue-50/50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed border border-blue-100">
                            {s.objective
                                ? <p>{s.objective}</p>
                                : <p className="text-muted-foreground italic">No course objective specified</p>
                            }
                        </div>
                    </div>

                    {/* Regulatory Notes */}
                    <div className="pt-3">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Regulatory Notes</h4>
                        <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 border border-slate-100">
                            <div className="flex gap-2 leading-relaxed"><span className="text-slate-400">•</span><p>Training shall be completed within <b className="text-foreground">6 months</b> of joining</p></div>
                            <div className="flex gap-2 leading-relaxed"><span className="text-slate-400">•</span><p>Governed by CAAT MOE Issue 10 Rev.00</p></div>
                            <div className="flex gap-2 leading-relaxed"><span className="text-slate-400">•</span><p>Ref: SAMS-FM-CM-014 Rev.03 (05 AUG 2025)</p></div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 pt-3 border-t border-border flex flex-col gap-2">
                    <button onClick={() => window.location.href = `/en/qa/training-scheduler/${s.id}`}
                        className="w-full py-2.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium border-none">
                        <User className="w-4 h-4" />
                        Manage Enrollment
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onEdit}
                            className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-transparent">
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </button>
                        <button onClick={onDelete}
                            className="flex-1 py-2 text-sm rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
