'use client'

import { useState, useRef, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Session, CAT_COLOR, MONTHS, DAYS_SHORT, daysInMonth, toYMD, STATUS_CONFIG, formatDate } from '../types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface GanttViewProps {
    sessions: Session[]
    calYear: number
    calMonth: number
    setCalYear: React.Dispatch<React.SetStateAction<number>>
    setCalMonth: React.Dispatch<React.SetStateAction<number>>
    prevMonth: () => void
    nextMonth: () => void
    today: Date
    onSelect: (s: Session) => void
}

export function GanttView({ sessions, calYear, calMonth, setCalYear, setCalMonth, prevMonth, nextMonth, today, onSelect }: GanttViewProps) {
    const [hoveredSession, setHoveredSession] = useState<number | null>(null)
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; right?: boolean } | null>(null)
    const gridRef = useRef<HTMLDivElement>(null)

    const numDays = daysInMonth(calYear, calMonth)
    const todayStr = toYMD(today)
    const currentYM = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`

    const monthSessions = useMemo(() =>
        sessions.filter(s => {
            const sm = s.dateStart.slice(0, 7)
            const em = s.dateEnd.slice(0, 7)
            return sm <= currentYM && em >= currentYM
        }).sort((a, b) => a.dateStart.localeCompare(b.dateStart))
    , [sessions, currentYM])

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
                            <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">Date</p>
                            <p className="text-[10px] font-semibold text-foreground">
                                {formatDate(s.dateStart)} — {formatDate(s.dateEnd)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">Time</p>
                            <p className="text-[10px] font-semibold text-foreground">
                                {s.timeStart?.slice(0, 5) || '—'} – {s.timeEnd?.slice(0, 5) || '—'}
                            </p>
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
                            <span className={`text-[10px] font-bold ${
                                pct >= 100 ? 'text-red-500' : pct >= 80 ? 'text-amber-500' : 'text-emerald-600'
                            }`}>
                                {enrolled}/{s.maxParticipants}
                                <span className="text-muted-foreground font-medium ml-1">({Math.round(pct)}%)</span>
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Click hint */}
                    <p className="text-[8px] text-muted-foreground/60 text-center mt-2 italic">Click to manage training session</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Select value={calMonth.toString()} onValueChange={(v) => setCalMonth(parseInt(v))}>
                        <SelectTrigger className="w-[140px] h-8 text-xs font-semibold bg-white border-border">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={calYear.toString()} onValueChange={(v) => setCalYear(parseInt(v))}>
                        <SelectTrigger className="w-[100px] h-8 text-xs font-semibold bg-white border-border">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i).map(y => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer border-none bg-transparent">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer border-none bg-transparent">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div ref={gridRef} className="bg-white rounded-xl border border-border overflow-auto relative">
                {/* Day Header */}
                <div className="flex border-b border-border sticky top-0 bg-white z-10">
                    <div className="w-52 shrink-0 border-r border-border px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Course
                    </div>
                    <div className="flex-1 flex">
                        {Array.from({ length: numDays }, (_, i) => {
                            const d = i + 1
                            const dateStr = `${currentYM}-${String(d).padStart(2, '0')}`
                            const dow = new Date(calYear, calMonth, d).getDay()
                            const isWeekend = dow === 0 || dow === 6
                            const isToday = dateStr === todayStr
                            return (
                                <div key={d} className={`flex-1 text-center py-1.5 border-r border-border/30 last:border-r-0 ${isWeekend ? 'bg-muted/30' : ''} ${isToday ? 'bg-primary/5' : ''}`}
                                    style={{ minWidth: 26 }}>
                                    <p className={`text-[10px] leading-tight ${isToday ? 'text-primary font-bold' : isWeekend ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>{d}</p>
                                    <p className={`text-[8px] leading-tight ${isWeekend ? 'text-muted-foreground/30' : 'text-muted-foreground/50'}`}>{DAYS_SHORT[dow].slice(0, 2)}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Rows */}
                {monthSessions.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground text-xs">No sessions this month</div>
                ) : (
                    monthSessions.map(s => {
                        const cc = CAT_COLOR[s.category] || { bar: '#94a3b8', light: '#f8fafc', text: '#475569' }
                        const offset = dayOffset(s.dateStart)
                        const span = daySpan(s)
                        const enrolled = s.enrolled
                        const pct = s.maxParticipants > 0 ? (enrolled / s.maxParticipants) * 100 : 0
                        const isSelected = false
                        const statusCfg = STATUS_CONFIG[s.status] || {}

                        return (
                            <div
                                key={s.id}
                                className={`flex border-b border-border/50 last:border-b-0 transition-colors cursor-pointer hover:bg-muted/20`}
                                style={{ minHeight: 52 }}
                                onClick={() => onSelect(s)}
                            >
                                {/* Course Info */}
                                <div className={`w-52 shrink-0 border-r border-border px-3 py-2 flex items-center gap-2`}>
                                    <div className="w-1 h-9 rounded-full shrink-0" style={{ background: cc.bar }} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[11px] text-foreground font-bold truncate">{s.courseCode}</p>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.text}`}>
                                                {s.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground truncate leading-tight">{s.courseName.slice(0, 30)}{s.courseName.length > 30 ? '…' : ''}</p>
                                        {/* Capacity mini-bar */}
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] text-muted-foreground font-medium">{enrolled}/{s.maxParticipants}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline Bar Area */}
                                <div className="flex-1 relative" style={{ minHeight: 52 }}>
                                    {/* Weekend shading */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {Array.from({ length: numDays }, (_, i) => {
                                            const dow = new Date(calYear, calMonth, i + 1).getDay()
                                            return <div key={i} className="flex-1" style={{ background: dow === 0 || dow === 6 ? 'hsl(var(--muted) / 0.2)' : 'transparent', minWidth: 26 }} />
                                        })}
                                    </div>
                                    {/* Today line */}
                                    {todayCol !== null && (
                                        <div className="absolute top-0 bottom-0 w-px bg-primary/40 pointer-events-none z-10"
                                            style={{ left: `calc(${((todayCol + 0.5) / numDays) * 100}%)` }} />
                                    )}
                                    {/* Session Bar */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSelect(s) }}
                                        onMouseEnter={(e) => {
                                            setHoveredSession(s.id)
                                            const rect = e.currentTarget.getBoundingClientRect()
                                            const gridRect = gridRef.current?.getBoundingClientRect()
                                            const isRightHalf = gridRect ? rect.left + rect.width / 2 > gridRect.left + gridRect.width / 2 : false
                                            setTooltipPos({
                                                x: isRightHalf ? rect.left - 8 : rect.right + 8,
                                                y: rect.top + rect.height / 2,
                                                right: isRightHalf,
                                            })
                                        }}
                                        onMouseLeave={() => { setHoveredSession(null); setTooltipPos(null) }}
                                        className={`absolute top-1/2 -translate-y-1/2 rounded-md flex items-center px-2 transition-all cursor-pointer border-none hover:opacity-90 hover:shadow-sm`}
                                        style={{
                                            left: `calc(${(offset / numDays) * 100}% + 2px)`,
                                            width: `calc(${(span / numDays) * 100}% - 4px)`,
                                            background: cc.bar, color: '#fff',
                                            height: 28, minWidth: 24,
                                        }}
                                    >
                                        <span className="truncate font-semibold" style={{ fontSize: 10 }}>
                                            {span > 1 ? s.courseName.slice(0, 24) : ''}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Category Legend */}
            <div className="flex items-center gap-4 flex-wrap px-1 pt-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Legend:</span>
                {Object.entries(CAT_COLOR).map(([cat, { bar }]) => (
                    <div key={cat} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded" style={{ background: bar }} />
                        <span className="text-[10px] text-muted-foreground font-medium">{cat}</span>
                    </div>
                ))}
            </div>
            
            {/* Hover Tooltip */}
            {renderTooltip()}
        </div>
    )
}
