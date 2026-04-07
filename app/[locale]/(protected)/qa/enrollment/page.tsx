'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import {
  Search, UserPlus, Users, Calendar, MapPin, Clock,
  BookOpen, ChevronDown, ChevronLeft, ChevronRight,
  Trash2, GraduationCap, AlertCircle, CheckCircle2,
  List, BarChart3, ArrowLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { INITIAL_SESSIONS } from '../training-scheduler/data'
import { STATUS_CONFIG, CAT_COLOR, formatDate, MONTHS, DAYS_SHORT, daysInMonth, toYMD } from '../training-scheduler/types'
import type { Session } from '../training-scheduler/types'
import { ENROLLABLE_STAFF, INITIAL_ENROLLMENTS } from './data'
import { ENROLLMENT_STATUS_META } from './types'
import type { EnrollmentRecord, EnrollmentStatus, EnrollableStaff } from './types'

// ─── Session Info Card ──────────────────────────────────────────────────────

function SessionInfoCard({ session, enrolledCount }: { session: Session; enrolledCount: number }) {
  const statusCfg = STATUS_CONFIG[session.status] || {}
  const pct = session.maxParticipants > 0 ? (enrolledCount / session.maxParticipants) * 100 : 0
  const slotsLeft = session.maxParticipants - enrolledCount
  const isFull = slotsLeft <= 0

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-border p-5 space-y-4">
      {/* Course Title & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {session.courseCode}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusCfg.bg} ${statusCfg.text}`}>
              {session.status}
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground leading-snug">{session.courseName}</h3>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div>
            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Date</span>
            <span className="text-foreground font-medium">
              {formatDate(session.dateStart)}
              {session.dateEnd !== session.dateStart && ` — ${formatDate(session.dateEnd)}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div>
            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Time</span>
            <span className="text-foreground font-medium">{session.timeStart} – {session.timeEnd}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div>
            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Instructor</span>
            <span className="text-foreground font-medium">{session.instructor}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div>
            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Venue</span>
            <span className="text-foreground font-medium">{session.venue}</span>
          </div>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">Enrollment Capacity</span>
          </div>
          <span className={`text-xs font-bold ${isFull ? 'text-red-600' : slotsLeft <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {enrolledCount}/{session.maxParticipants}
            <span className="text-muted-foreground font-medium ml-1">
              ({isFull ? 'Full' : `${slotsLeft} slots left`})
            </span>
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Timeline View ─────────────────────────────────────────────────────────

interface TimelineViewProps {
  sessions: Session[]
  enrollments: EnrollmentRecord[]
  selectedSessionId: number | null
  onSelect: (id: number) => void
}

function TimelineView({ sessions, enrollments, selectedSessionId, onSelect }: TimelineViewProps) {
  const today = new Date()
  const [hoveredSession, setHoveredSession] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; right?: boolean } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

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

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">{MONTHS[calMonth]} {calYear}</h3>
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
            const enrolled = enrollments.filter(e => e.sessionId === s.id && e.status !== 'cancelled').length
            const pct = s.maxParticipants > 0 ? (enrolled / s.maxParticipants) * 100 : 0
            const isSelected = selectedSessionId === s.id
            const statusCfg = STATUS_CONFIG[s.status] || {}

            return (
              <div
                key={s.id}
                className={`flex border-b border-border/50 last:border-b-0 transition-colors cursor-pointer ${
                  isSelected ? 'bg-primary/5' : 'hover:bg-muted/20'
                }`}
                style={{ minHeight: 52 }}
                onClick={() => onSelect(s.id)}
              >
                {/* Course Info */}
                <div className={`w-52 shrink-0 border-r border-border px-3 py-2 flex items-center gap-2 ${isSelected ? 'bg-primary/5' : ''}`}>
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
                    onClick={(e) => { e.stopPropagation(); onSelect(s.id) }}
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
                    className={`absolute top-1/2 -translate-y-1/2 rounded-md flex items-center px-2 transition-all cursor-pointer border-none ${
                      isSelected ? 'ring-2 ring-primary ring-offset-1 shadow-lg' : 'hover:opacity-90 hover:shadow-sm'
                    }`}
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
      <div className="flex items-center gap-4 flex-wrap px-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Legend:</span>
        {Object.entries(CAT_COLOR).map(([cat, { bar }]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded" style={{ background: bar }} />
            <span className="text-[10px] text-muted-foreground font-medium">{cat}</span>
          </div>
        ))}
      </div>

      {/* Hover Tooltip */}
      {hoveredSession !== null && tooltipPos && (() => {
        const s = sessions.find(x => x.id === hoveredSession)
        if (!s) return null
        const enrolled = enrollments.filter(e => e.sessionId === s.id && e.status !== 'cancelled').length
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
              <p className="text-[8px] text-muted-foreground/60 text-center mt-2 italic">Click to manage enrollment</p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

type SelectorMode = 'dropdown' | 'timeline'

export default function EnrollmentPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>(INITIAL_ENROLLMENTS)
  const [staffSearch, setStaffSearch] = useState('')
  const [enrolledSearch, setEnrolledSearch] = useState('')
  const [selectorMode, setSelectorMode] = useState<SelectorMode>('timeline')

  // Available sessions (Scheduled only for enrollment)
  const sessions = useMemo(() =>
    INITIAL_SESSIONS.filter(s => s.status === 'Scheduled' || s.status === 'Full' || s.status === 'Completed')
  , [])

  const selectedSession = useMemo(() =>
    sessions.find(s => s.id === selectedSessionId) ?? null
  , [sessions, selectedSessionId])

  // Enrolled staff for selected session
  const sessionEnrollments = useMemo(() => {
    if (!selectedSessionId) return []
    return enrollments.filter(e => e.sessionId === selectedSessionId && e.status !== 'cancelled')
  }, [enrollments, selectedSessionId])

  const enrolledStaffIds = useMemo(() =>
    new Set(sessionEnrollments.map(e => e.staffId))
  , [sessionEnrollments])

  const enrolledCount = sessionEnrollments.length

  // Enrolled staff with details
  const enrolledStaffList = useMemo(() =>
    sessionEnrollments.map(e => ({
      ...e,
      staff: ENROLLABLE_STAFF.find(s => s.id === e.staffId)!,
    })).filter(e => e.staff)
  , [sessionEnrollments])

  // Filter enrolled list
  const filteredEnrolled = useMemo(() => {
    const q = enrolledSearch.toLowerCase().trim()
    if (!q) return enrolledStaffList
    return enrolledStaffList.filter(e =>
      e.staff.name.toLowerCase().includes(q) || e.staff.id.toLowerCase().includes(q)
    )
  }, [enrolledStaffList, enrolledSearch])

  // Available staff (not yet enrolled)
  const availableStaff = useMemo(() => {
    const q = staffSearch.toLowerCase().trim()
    return ENROLLABLE_STAFF.filter(s => {
      if (enrolledStaffIds.has(s.id)) return false
      if (q && !s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q) && !s.dept.toLowerCase().includes(q)) return false
      return true
    })
  }, [staffSearch, enrolledStaffIds])

  // Handlers
  const handleEnroll = useCallback((staffId: string) => {
    if (!selectedSessionId || !selectedSession) return
    if (enrolledCount >= selectedSession.maxParticipants) return // capacity check

    const newRecord: EnrollmentRecord = {
      staffId,
      sessionId: selectedSessionId,
      status: 'enrolled',
      enrolledAt: new Date().toISOString().slice(0, 10),
      enrolledBy: 'QA Manager',
    }
    setEnrollments(prev => [...prev, newRecord])
  }, [selectedSessionId, selectedSession, enrolledCount])

  const handleRemove = useCallback((staffId: string) => {
    if (!selectedSessionId) return
    setEnrollments(prev =>
      prev.map(e =>
        e.staffId === staffId && e.sessionId === selectedSessionId
          ? { ...e, status: 'cancelled' as EnrollmentStatus }
          : e
      )
    )
  }, [selectedSessionId])

  const handleSelectSession = useCallback((id: number) => {
    setSelectedSessionId(id)
    setStaffSearch('')
    setEnrolledSearch('')
  }, [])

  const handleBackToSessions = useCallback(() => {
    setSelectedSessionId(null)
    setStaffSearch('')
    setEnrolledSearch('')
  }, [])

  const isFull = selectedSession ? enrolledCount >= selectedSession.maxParticipants : false

  // Stats
  const stats = useMemo(() => ({
    totalSessions: sessions.length,
    totalEnrolled: enrollments.filter(e => e.status === 'enrolled').length,
    totalAttended: enrollments.filter(e => e.status === 'attended').length,
    totalCancelled: enrollments.filter(e => e.status === 'cancelled').length,
  }), [sessions, enrollments])

  // ─── Two-step flow: only Timeline uses separate page ──────────

  // STEP 2: Enrollment Management (Timeline mode + session selected)
  if (selectedSession && selectorMode === 'timeline') {
    const statusCfg = STATUS_CONFIG[selectedSession.status] || {}
    return (
      <div>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToSessions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-border bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sessions
              </button>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {selectedSession.courseCode}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusCfg.bg} ${statusCfg.text}`}>
                  {selectedSession.status}
                </span>
              </div>
            </div>
            <CardTitle className="mt-2">{selectedSession.courseName}</CardTitle>
            <CardDescription>Manage staff enrollment for this training session</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5">
              {/* Left — Session Info */}
              <div className="space-y-4">
                <SessionInfoCard session={selectedSession} enrolledCount={enrolledCount} />

                {/* Add Staff Panel */}
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                  <div className="p-3 bg-slate-50/80 border-b border-border flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Add Staff</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {availableStaff.length} available
                    </span>
                  </div>

                  {/* Search */}
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={staffSearch}
                        onChange={e => setStaffSearch(e.target.value)}
                        placeholder="Search by name, ID or department..."
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Full Warning */}
                  {isFull && (
                    <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-[11px] font-semibold text-red-700">Session is full. Remove existing enrollment to add more.</span>
                    </div>
                  )}

                  {/* Staff List */}
                  <div className="max-h-[340px] overflow-y-auto">
                    {availableStaff.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        {staffSearch ? 'No matching staff found' : 'All staff have been enrolled'}
                      </div>
                    ) : (
                      availableStaff.map(s => (
                        <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0">
                            {s.name.split(' ').pop()?.[0] || ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="font-bold">{s.id}</span>
                              <span>·</span>
                              <span>{s.license}</span>
                              <span>·</span>
                              <span className="truncate">{s.dept}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEnroll(s.id)}
                            disabled={isFull}
                            className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              isFull
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-primary/10 text-primary hover:bg-primary hover:text-white cursor-pointer'
                            }`}
                          >
                            <UserPlus className="w-3 h-3" />
                            Enroll
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right — Enrolled Staff List */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="p-4 bg-slate-50/80 border-b border-border flex items-center gap-3">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Enrolled Staff</span>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-1">
                    {enrolledCount}
                  </span>
                  <div className="relative ml-auto w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={enrolledSearch}
                      onChange={e => setEnrolledSearch(e.target.value)}
                      placeholder="Search enrolled..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_100px_100px_110px_80px] gap-3 px-4 py-2.5 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <span>Employee Name</span>
                  <span>License</span>
                  <span>Department</span>
                  <span>Enrolled Date</span>
                  <span className="text-center">Action</span>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  {filteredEnrolled.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {enrolledSearch ? 'No matching enrolled staff' : 'No staff enrolled yet. Add staff from the left panel.'}
                      </p>
                    </div>
                  ) : (
                    filteredEnrolled.map(({ staff: s, ...record }, idx) => {
                      const meta = ENROLLMENT_STATUS_META[record.status]
                      return (
                        <div
                          key={s.id}
                          className={`grid grid-cols-[1fr_100px_100px_110px_80px] gap-3 px-4 py-3 items-center border-b border-border/50 hover:bg-muted/20 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-muted/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0">
                              {s.name.split(' ').pop()?.[0] || ''}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{s.id}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-foreground">{s.license}</span>
                          <span className="text-[11px] text-muted-foreground font-medium truncate">{s.dept}</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-medium text-foreground">{record.enrolledAt}</span>
                            <span
                              className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[9px] font-bold"
                              style={{ background: meta.bg, color: meta.text }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                              {meta.label}
                            </span>
                          </div>
                          <div className="flex justify-center">
                            {record.status === 'enrolled' ? (
                              <button
                                onClick={() => handleRemove(s.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // STEP 1: Session Selection (no session selected)
  return (
    <div>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Training Enrollment</CardTitle>
          <CardDescription>Select a training session to manage staff enrollment</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Stat Strip */}
          <div className="flex items-center gap-6 overflow-x-auto">
            {[
              { label: 'Total Sessions', val: stats.totalSessions, color: '#1a56db' },
              { label: 'Total Enrolled', val: stats.totalEnrolled, color: '#3b82f6' },
              { label: 'Total Attended', val: stats.totalAttended, color: '#10b981' },
              { label: 'Cancelled', val: stats.totalCancelled, color: '#64748b' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center gap-2.5 shrink-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '18' }}>
                  <span className="text-sm font-semibold" style={{ color }}>{val}</span>
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
                <div className="w-px h-5 bg-border ml-3" />
              </div>
            ))}
          </div>

          {/* Session Selector */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Select Training Session</span>
              </div>
              {/* View Toggle */}
              <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setSelectorMode('dropdown')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer border-none ${
                    selectorMode === 'dropdown' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground bg-transparent'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Dropdown
                </button>
                <button
                  onClick={() => setSelectorMode('timeline')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer border-none ${
                    selectorMode === 'timeline' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground bg-transparent'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Timeline
                </button>
              </div>
            </div>

            {selectorMode === 'dropdown' ? (
              <div className="max-w-md">
                <Select
                  value={selectedSessionId?.toString() ?? ''}
                  onValueChange={(v) => handleSelectSession(parseInt(v))}
                >
                  <SelectTrigger className="bg-white border-border h-10 text-xs font-semibold">
                    <SelectValue placeholder="Choose a training session..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => {
                      const enrolled = enrollments.filter(e => e.sessionId === s.id && e.status !== 'cancelled').length
                      return (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">{s.courseCode}</span>
                            <span className="text-xs font-medium truncate">{s.courseName}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                              {formatDate(s.dateStart)} · {enrolled}/{s.maxParticipants}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <TimelineView
                sessions={sessions}
                enrollments={enrollments}
                selectedSessionId={selectedSessionId}
                onSelect={handleSelectSession}
              />
            )}
          </div>

          {/* Dropdown mode: show enrollment panel inline */}
          {selectorMode === 'dropdown' && selectedSession ? (
            <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5">
              {/* Left — Session Info */}
              <div className="space-y-4">
                <SessionInfoCard session={selectedSession} enrolledCount={enrolledCount} />

                {/* Add Staff Panel */}
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                  <div className="p-3 bg-slate-50/80 border-b border-border flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Add Staff</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {availableStaff.length} available
                    </span>
                  </div>

                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={staffSearch}
                        onChange={e => setStaffSearch(e.target.value)}
                        placeholder="Search by name, ID or department..."
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      />
                    </div>
                  </div>

                  {isFull && (
                    <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-[11px] font-semibold text-red-700">Session is full. Remove existing enrollment to add more.</span>
                    </div>
                  )}

                  <div className="max-h-[340px] overflow-y-auto">
                    {availableStaff.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        {staffSearch ? 'No matching staff found' : 'All staff have been enrolled'}
                      </div>
                    ) : (
                      availableStaff.map(s => (
                        <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0">
                            {s.name.split(' ').pop()?.[0] || ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="font-bold">{s.id}</span>
                              <span>·</span>
                              <span>{s.license}</span>
                              <span>·</span>
                              <span className="truncate">{s.dept}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEnroll(s.id)}
                            disabled={isFull}
                            className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              isFull
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-primary/10 text-primary hover:bg-primary hover:text-white cursor-pointer'
                            }`}
                          >
                            <UserPlus className="w-3 h-3" />
                            Enroll
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right — Enrolled Staff List */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="p-4 bg-slate-50/80 border-b border-border flex items-center gap-3">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Enrolled Staff</span>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-1">
                    {enrolledCount}
                  </span>
                  <div className="relative ml-auto w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={enrolledSearch}
                      onChange={e => setEnrolledSearch(e.target.value)}
                      placeholder="Search enrolled..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_100px_100px_110px_80px] gap-3 px-4 py-2.5 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <span>Employee Name</span>
                  <span>License</span>
                  <span>Department</span>
                  <span>Enrolled Date</span>
                  <span className="text-center">Action</span>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  {filteredEnrolled.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {enrolledSearch ? 'No matching enrolled staff' : 'No staff enrolled yet. Add staff from the left panel.'}
                      </p>
                    </div>
                  ) : (
                    filteredEnrolled.map(({ staff: s, ...record }, idx) => {
                      const meta = ENROLLMENT_STATUS_META[record.status]
                      return (
                        <div
                          key={s.id}
                          className={`grid grid-cols-[1fr_100px_100px_110px_80px] gap-3 px-4 py-3 items-center border-b border-border/50 hover:bg-muted/20 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-muted/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0">
                              {s.name.split(' ').pop()?.[0] || ''}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{s.id}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-foreground">{s.license}</span>
                          <span className="text-[11px] text-muted-foreground font-medium truncate">{s.dept}</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-medium text-foreground">{record.enrolledAt}</span>
                            <span
                              className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[9px] font-bold"
                              style={{ background: meta.bg, color: meta.text }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                              {meta.label}
                            </span>
                          </div>
                          <div className="flex justify-center">
                            {record.status === 'enrolled' ? (
                              <button
                                onClick={() => handleRemove(s.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          ) : selectorMode === 'dropdown' ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">Select a Training Session</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Choose a training session from the dropdown above to manage staff enrollment.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

