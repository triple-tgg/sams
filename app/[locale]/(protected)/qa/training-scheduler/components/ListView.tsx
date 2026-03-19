'use client'

import { useMemo } from 'react'
import { Clock, MapPin, User } from 'lucide-react'
import { Session, STATUS_CONFIG, CAT_COLOR, MONTHS, formatDate, sessionDays } from '../types'

interface ListViewProps {
    sessions: Session[]
    onSelect: (s: Session | null) => void
    selectedSession: Session | null
}

export function ListView({ sessions, onSelect, selectedSession }: ListViewProps) {
    const grouped = useMemo(() => {
        const map: Record<string, Session[]> = {}
        const sorted = [...sessions].sort((a, b) => a.dateStart.localeCompare(b.dateStart))
        sorted.forEach(s => {
            const month = s.dateStart.slice(0, 7)
            if (!map[month]) map[month] = []
            map[month].push(s)
        })
        return Object.entries(map)
    }, [sessions])

    if (sessions.length === 0) return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No sessions match your filter</p>
        </div>
    )

    return (
        <div className="space-y-6">
            {grouped.map(([month, monthSessions]) => {
                const [y, m] = month.split('-')
                return (
                    <div key={month}>
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-sm font-semibold text-foreground">{MONTHS[parseInt(m) - 1]} {y}</h3>
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">{monthSessions.length} session{monthSessions.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-2">
                            {monthSessions.map(s => (
                                <SessionCard
                                    key={s.id}
                                    session={s}
                                    onSelect={onSelect}
                                    isSelected={selectedSession?.id === s.id}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function SessionCard({ session: s, onSelect, isSelected }: { session: Session; onSelect: (s: Session | null) => void; isSelected: boolean }) {
    const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.Scheduled
    const cc = CAT_COLOR[s.category] || { bar: '#94a3b8', light: '#f8fafc', text: '#475569' }
    const pct = Math.round((s.enrolled / s.maxParticipants) * 100)
    const days = sessionDays(s)

    return (
        <div onClick={() => onSelect(isSelected ? null : s)}
            className={`bg-card rounded-xl border cursor-pointer transition-all hover:shadow-sm ${isSelected ? 'border-primary/40 shadow-sm ring-1 ring-primary/20' : 'border-border hover:border-border/80'}`}>
            <div className="flex items-stretch">
                {/* Color bar */}
                <div className="w-1 rounded-l-xl shrink-0" style={{ background: cc.bar }} />

                <div className="flex-1 px-4 py-3 flex items-center gap-4">
                    {/* Date block */}
                    <div className="shrink-0 text-center w-14">
                        <p className="text-xs text-muted-foreground">{formatDate(s.dateStart).slice(3, 6)}</p>
                        <p className="text-2xl text-foreground leading-none font-semibold">{s.dateStart.slice(8)}</p>
                        {days > 1 && <p className="text-xs text-muted-foreground mt-0.5">{days}d</p>}
                    </div>

                    <div className="w-px h-10 bg-border shrink-0" />

                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs px-1.5 py-0.5 rounded font-mono font-medium"
                                style={{ background: cc.light, color: cc.text }}>{s.courseCode}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                                {s.status}
                            </span>
                            {s.type === 'Recurrent' && (
                                <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">↺ Recurrent</span>
                            )}
                        </div>
                        <p className="text-sm text-foreground font-medium truncate">{s.courseName}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {s.timeStart}–{s.timeEnd}
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {s.venue}
                            </span>
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {s.instructor}
                            </span>
                        </div>
                    </div>

                    {/* Enrollment */}
                    <div className="shrink-0 text-right w-24">
                        <p className="text-sm text-foreground font-semibold">{s.enrolled}<span className="text-xs text-muted-foreground font-normal">/{s.maxParticipants}</span></p>
                        <p className="text-xs text-muted-foreground mb-1">enrolled</p>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: pct >= 100 ? '#f59e0b' : pct >= 80 ? '#3b82f6' : '#10b981' }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{pct}%</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
