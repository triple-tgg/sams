'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Session, CAT_COLOR, MONTHS, DAYS_SHORT, daysInMonth, toYMD } from '../types'

interface GanttViewProps {
    sessions: Session[]
    calYear: number
    calMonth: number
    prevMonth: () => void
    nextMonth: () => void
    today: Date
    onSelect: (s: Session) => void
}

export function GanttView({ sessions, calYear, calMonth, prevMonth, nextMonth, today, onSelect }: GanttViewProps) {
    const numDays = daysInMonth(calYear, calMonth)
    const todayStr = toYMD(today)
    const currentYM = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`

    const monthSessions = sessions.filter(s => {
        const sm = s.dateStart.slice(0, 7)
        const em = s.dateEnd.slice(0, 7)
        return sm <= currentYM && em >= currentYM
    })

    function dayOffset(dateStr: string) {
        const clipped = dateStr < currentYM + '-01' ? currentYM + '-01' : dateStr
        return parseInt(clipped.slice(8)) - 1
    }
    function daySpan(s: Session) {
        const start = s.dateStart < currentYM + '-01' ? currentYM + '-01' : s.dateStart
        const endYM = s.dateEnd.slice(0, 7)
        const endDay = endYM > currentYM
            ? `${currentYM}-${String(numDays).padStart(2, '0')}`
            : s.dateEnd
        return parseInt(endDay.slice(8)) - parseInt(start.slice(8)) + 1
    }

    const todayCol = todayStr.slice(0, 7) === currentYM ? parseInt(todayStr.slice(8)) - 1 : null

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">{MONTHS[calMonth]} {calYear}</h2>
                <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer border-none bg-transparent">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer border-none bg-transparent">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-auto">
                {/* Day header */}
                <div className="flex border-b border-border sticky top-0 bg-card z-10">
                    <div className="w-56 shrink-0 border-r border-border px-4 py-2 text-xs text-muted-foreground font-medium">Course</div>
                    <div className="flex-1 flex">
                        {Array.from({ length: numDays }, (_, i) => {
                            const d = i + 1
                            const dateStr = `${currentYM}-${String(d).padStart(2, '0')}`
                            const dow = new Date(calYear, calMonth, d).getDay()
                            const isWeekend = dow === 0 || dow === 6
                            const isToday = dateStr === todayStr
                            return (
                                <div key={d} className={`flex-1 text-center py-2 border-r border-border/50 last:border-r-0 ${isWeekend ? 'bg-muted/30' : ''} ${isToday ? 'bg-primary/5' : ''}`}
                                    style={{ minWidth: 28 }}>
                                    <p className={`text-[10px] ${isToday ? 'text-primary font-semibold' : isWeekend ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>{d}</p>
                                    <p className={`text-[9px] ${isWeekend ? 'text-muted-foreground/30' : 'text-muted-foreground/50'}`}>{DAYS_SHORT[dow].slice(0, 1)}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Rows */}
                {monthSessions.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">No sessions this month</div>
                ) : (
                    monthSessions.map(s => {
                        const cc = CAT_COLOR[s.category] || { bar: '#94a3b8', light: '#f8fafc', text: '#475569' }
                        const offset = dayOffset(s.dateStart)
                        const span = daySpan(s)

                        return (
                            <div key={s.id} className="flex border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors group" style={{ minHeight: 44 }}>
                                <div className="w-56 shrink-0 border-r border-border px-4 py-2 flex items-center gap-2">
                                    <div className="w-1 h-8 rounded-full shrink-0" style={{ background: cc.bar }} />
                                    <div className="min-w-0">
                                        <p className="text-xs text-foreground font-medium truncate">{s.courseCode}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{s.courseName.slice(0, 28)}{s.courseName.length > 28 ? '…' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex-1 relative" style={{ minHeight: 44 }}>
                                    {/* Weekend shading */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {Array.from({ length: numDays }, (_, i) => {
                                            const dow = new Date(calYear, calMonth, i + 1).getDay()
                                            return <div key={i} className="flex-1" style={{ background: dow === 0 || dow === 6 ? 'hsl(var(--muted) / 0.3)' : 'transparent', minWidth: 28 }} />
                                        })}
                                    </div>
                                    {/* Today line */}
                                    {todayCol !== null && (
                                        <div className="absolute top-0 bottom-0 w-px bg-primary/50 pointer-events-none z-10"
                                            style={{ left: `calc(${((todayCol + 0.5) / numDays) * 100}%)` }} />
                                    )}
                                    {/* Bar */}
                                    <button
                                        onClick={() => onSelect(s)}
                                        className="absolute top-1/2 -translate-y-1/2 rounded-md flex items-center px-2 text-xs hover:opacity-90 transition-all group-hover:shadow-sm cursor-pointer border-none"
                                        style={{
                                            left: `calc(${(offset / numDays) * 100}% + 2px)`,
                                            width: `calc(${(span / numDays) * 100}% - 4px)`,
                                            background: cc.bar, color: '#fff',
                                            height: 26, minWidth: 24,
                                        }}>
                                        <span className="truncate font-medium" style={{ fontSize: 11 }}>{span > 2 ? s.courseName.slice(0, 22) : ''}</span>
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
