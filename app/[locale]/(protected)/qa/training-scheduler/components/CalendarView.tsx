'use client'

import { useMemo, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Session, CAT_COLOR, MONTHS, DAYS_SHORT, daysInMonth, firstDayOfMonth, toYMD, STATUS_CONFIG, formatDate } from '../types'

interface CalendarViewProps {
    calYear: number
    calMonth: number
    prevMonth: () => void
    nextMonth: () => void
    sessions: Session[]
    today: Date
    onSelect: (s: Session | null) => void
    selectedSession: Session | null
}

export function CalendarView({ calYear, calMonth, prevMonth, nextMonth, sessions, today, onSelect, selectedSession }: CalendarViewProps) {
    const numDays = daysInMonth(calYear, calMonth)
    const firstDay = firstDayOfMonth(calYear, calMonth)
    const todayStr = toYMD(today)
    const todayYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const currentYM = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`

    const [hoveredSession, setHoveredSession] = useState<number | null>(null)
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; right?: boolean } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const calSessions = useMemo(() => {
        return sessions.filter(s => {
            const sm = parseInt(s.dateStart.slice(5, 7)) - 1
            const sy = parseInt(s.dateStart.slice(0, 4))
            const em = parseInt(s.dateEnd.slice(5, 7)) - 1
            const ey = parseInt(s.dateEnd.slice(0, 4))
            return (sy < calYear || (sy === calYear && sm <= calMonth)) &&
                (ey > calYear || (ey === calYear && em >= calMonth))
        })
    }, [sessions, calYear, calMonth])

    function sessionsOnDay(day: number) {
        const ymd = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return calSessions.filter(s => s.dateStart <= ymd && s.dateEnd >= ymd)
    }

    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= numDays; d++) cells.push(d)

    const renderTooltip = () => {
        if (hoveredSession === null || !tooltipPos) return null
        const s = sessions.find(x => x.id === hoveredSession)
        if (!s) return null
        const enrolled = s.enrolled
        const pct = s.maxParticipants > 0 ? (enrolled / s.maxParticipants) * 100 : 0
        const statusCfg = STATUS_CONFIG[s.status] || {}
        const cc = CAT_COLOR[s.category] || { bar: '#94a3b8' }
        return (
            <div
                className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                style={{
                    left: tooltipPos.right ? undefined : tooltipPos.x,
                    right: tooltipPos.right ? `calc(100vw - ${tooltipPos.x}px)` : undefined,
                    top: tooltipPos.y,
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                }}
            >
                <div className="bg-white rounded-xl shadow-xl border border-border/60 p-3.5 w-64">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: cc.bar }} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-primary">{s.courseCode}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.text}`}>
                                    {s.status}
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-foreground truncate leading-tight mt-0.5">{s.courseName}</p>
                        </div>
                    </div>

                    <div className="w-full h-px bg-border mb-2" />

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        <div>
                            <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">Start Date</p>
                            <p className="text-[10px] font-semibold text-foreground">{formatDate(s.dateStart)}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{s.timeStart?.slice(0, 5) || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">End Date</p>
                            <p className="text-[10px] font-semibold text-foreground">{formatDate(s.dateEnd)}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{s.timeEnd?.slice(0, 5) || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">Instructor</p>
                            <p className="text-[10px] font-semibold text-foreground truncate">{s.instructor || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">Venue</p>
                            <p className="text-[10px] font-semibold text-foreground truncate">{s.venue || '—'}</p>
                        </div>
                    </div>

                    {/* Capacity */}
                    <div className="mt-2.5 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Capacity</span>
                            <span className={`text-[10px] font-bold ${pct >= 100 ? 'text-red-500' : pct >= 80 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {enrolled}/{s.maxParticipants}
                                <span className="text-muted-foreground font-medium ml-1">({Math.round(pct)}%)</span>
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Click hint */}
                    <p className="text-[8px] text-muted-foreground/60 text-center mt-2 italic">Click to view session details</p>
                </div>
            </div>
        )
    }

    return (
        <div ref={containerRef}>
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground">{MONTHS[calMonth]} {calYear}</h2>
                    {currentYM === todayYM && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">This month</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer border-none bg-transparent">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer border-none bg-transparent">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_SHORT.map(d => (
                    <div key={d} className={`text-center text-xs py-1.5 font-medium ${d === 'Sun' || d === 'Sat' ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>{d}</div>
                ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} />
                    const dayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const isToday = dayStr === todayStr
                    const isSun = (i % 7) === 0
                    const isSat = (i % 7) === 6
                    const daySessions = sessionsOnDay(day)

                    return (
                        <div key={day}
                            className={`min-h-24 rounded-xl border p-2 transition-colors ${isToday ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:border-border/80'} ${isSun || isSat ? 'bg-muted/30' : ''}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white font-semibold' : isSun || isSat ? 'text-muted-foreground/50' : 'text-foreground/70'}`}>
                                    {day}
                                </span>
                                {daySessions.length > 0 && (
                                    <span className="text-xs text-muted-foreground">{daySessions.length}</span>
                                )}
                            </div>
                            <div className="space-y-0.5">
                                {daySessions.slice(0, 3).map(s => {
                                    const cc = CAT_COLOR[s.category] || { bar: '#94a3b8', light: '#f8fafc', text: '#475569' }
                                    const isStart = s.dateStart === dayStr
                                    return (
                                        <button key={s.id}
                                            onClick={() => onSelect(selectedSession?.id === s.id ? null : s)}
                                            onMouseEnter={(e) => {
                                                setHoveredSession(s.id)
                                                const rect = e.currentTarget.getBoundingClientRect()
                                                const containerRect = containerRef.current?.getBoundingClientRect()
                                                const isRightHalf = containerRect
                                                    ? rect.left + rect.width / 2 > containerRect.left + containerRect.width / 2
                                                    : false
                                                setTooltipPos({
                                                    x: isRightHalf ? rect.left - 8 : rect.right + 8,
                                                    y: rect.top + rect.height / 2,
                                                    right: isRightHalf,
                                                })
                                            }}
                                            onMouseLeave={() => { setHoveredSession(null); setTooltipPos(null) }}
                                            className={`w-full text-left px-1.5 py-0.5 rounded text-xs leading-snug transition-all hover:opacity-80 cursor-pointer border-none ${selectedSession?.id === s.id ? 'ring-2 ring-offset-0' : ''}`}
                                            style={{ background: cc.light, color: cc.text, borderLeft: `3px solid ${cc.bar}` }}>
                                            <span className="truncate block">{isStart ? s.courseCode : '↳'}</span>
                                        </button>
                                    )
                                })}
                                {daySessions.length > 3 && (
                                    <p className="text-xs text-muted-foreground pl-1">+{daySessions.length - 3} more</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Hover Tooltip */}
            {renderTooltip()}
        </div>
    )
}
