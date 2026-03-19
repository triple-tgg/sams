'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Session, CAT_COLOR, MONTHS, DAYS_SHORT, daysInMonth, firstDayOfMonth, toYMD } from '../types'

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

    return (
        <div>
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
        </div>
    )
}
