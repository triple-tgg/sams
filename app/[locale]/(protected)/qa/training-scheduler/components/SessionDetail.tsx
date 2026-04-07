'use client'

import { X as XIcon, Calendar, Clock, MapPin, User, Tag, Building2, Pencil, Trash2 } from 'lucide-react'
import { Session, STATUS_CONFIG, CAT_COLOR, formatDate, sessionDays } from '../types'

interface SessionDetailProps {
    session: Session
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
}

export function SessionDetail({ session: s, onClose, onEdit, onDelete }: SessionDetailProps) {
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
        <aside className="w-72 bg-card border-l border-border flex flex-col shrink-0 overflow-y-auto">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{ background: cc.light, color: cc.text }}>{s.courseCode}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                            {s.status}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted shrink-0 cursor-pointer transition-colors border-none bg-transparent">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-sm text-foreground font-semibold leading-snug">{s.courseName}</p>
            </div>

            {/* Info */}
            <div className="px-5 py-4 space-y-3.5 flex-1">
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
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 pt-3 border-t border-border flex gap-2">
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
        </aside>
    )
}
