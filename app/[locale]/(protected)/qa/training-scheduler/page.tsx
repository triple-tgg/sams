'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, List, BarChart3, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Session, SessionFormData, STATUS_CONFIG, STATUSES, BLANK_FORM, toYMD } from './types'
import { INITIAL_SESSIONS, COURSES_REF, DEPTS, CATEGORIES } from './data'
import { CalendarView } from './components/CalendarView'
import { ListView } from './components/ListView'
import { GanttView } from './components/GanttView'
import { SessionDetail } from './components/SessionDetail'
import { SessionFormModal } from './components/SessionFormModal'

const VIEW_OPTIONS = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'list', label: 'List', icon: List },
    { id: 'gantt', label: 'Timeline', icon: BarChart3 },
] as const

type ViewType = typeof VIEW_OPTIONS[number]['id']

export default function TrainingSchedulerPage() {
    const router = useRouter()
    const today = new Date(2026, 2, 19) // March 19, 2026
    const [view, setView] = useState<ViewType>('calendar')
    const [calYear, setCalYear] = useState(2026)
    const [calMonth, setCalMonth] = useState(2)
    const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS)
    const [filterStatus, setFilterStatus] = useState('All')
    const [filterDept, setFilterDept] = useState('All Departments')
    const [filterCat, setFilterCat] = useState('All')
    const [search, setSearch] = useState('')
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editSession, setEditSession] = useState<Session | null>(null)
    const [form, setForm] = useState<SessionFormData>(BLANK_FORM)

    // Filtered
    const filtered = useMemo(() => sessions.filter(s => {
        if (filterStatus !== 'All' && s.status !== filterStatus) return false
        if (filterDept !== 'All Departments' && s.dept !== filterDept && s.dept !== 'All Departments') return false
        if (filterCat !== 'All' && s.category !== filterCat) return false
        if (search && !s.courseName.toLowerCase().includes(search.toLowerCase()) && !s.courseCode.toLowerCase().includes(search.toLowerCase())) return false
        return true
    }), [sessions, filterStatus, filterDept, filterCat, search])

    // Stats
    const stats = useMemo(() => ({
        total: sessions.length,
        scheduled: sessions.filter(s => s.status === 'Scheduled').length,
        completed: sessions.filter(s => s.status === 'Completed').length,
        full: sessions.filter(s => s.status === 'Full').length,
        upcoming: sessions.filter(s => s.dateStart >= toYMD(today) && s.status === 'Scheduled').length,
    }), [sessions, today])

    // Handlers
    function openAdd() { setEditSession(null); setForm(BLANK_FORM); setShowForm(true) }
    function openEdit(s: Session) { setEditSession(s); setForm({ ...s }); setShowForm(true); setSelectedSession(null) }
    function handleSave() {
        if (!form.dateStart || !form.courseName) return
        if (editSession) {
            setSessions(prev => prev.map(s => s.id === editSession.id ? { ...form, id: s.id } as Session : s))
            setShowForm(false)
        } else {
            const newId = Math.max(...sessions.map(s => s.id)) + 1
            setSessions(prev => [...prev, { ...form, id: newId } as Session])
            setShowForm(false)
            router.push(`/en/qa/training-scheduler/${newId}`)
        }
    }
    function handleDelete(id: number) { setSessions(prev => prev.filter(s => s.id !== id)); setSelectedSession(null) }
    function handleCourseSelect(cid: string) {
        const c = COURSES_REF.find(x => x.id === parseInt(cid))
        if (c) setForm(f => ({ ...f, courseId: c.id as number | string, courseName: c.name, courseCode: c.code, category: c.category, type: c.recurrent ? 'Recurrent' : 'Initial' }))
        else setForm(f => ({ ...f, courseId: cid as number | string }))
    }
    const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }
    const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }

    return (
        <>
            <div>
                <Card>
                    <CardHeader className="pb-4 flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                        <div>
                            <CardTitle>Training Scheduler</CardTitle>
                            <CardDescription>Schedule and manage training sessions</CardDescription>

                            {/* Stat Strip */}
                            <div className="flex items-center gap-6 overflow-x-auto mt-5">
                                {[
                                    { label: 'Total Sessions', val: stats.total, color: '#1a56db' },
                                    { label: 'Scheduled', val: stats.scheduled, color: '#3b82f6' },
                                    { label: 'Upcoming (30d)', val: stats.upcoming, color: '#8b5cf6' },
                                    { label: 'Completed', val: stats.completed, color: '#10b981' },
                                    { label: 'Full', val: stats.full, color: '#f59e0b' },
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
                        </div>


                    </CardHeader>

                    <CardContent className="space-y-4 ">
                        <div className="flex items-center justify-between gap-2 xl:ml-auto shrink-0 border-t border-border pt-4" >
                            {/* View Switcher */}
                            <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
                                {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => (
                                    <button key={id} onClick={() => setView(id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer border-none ${view === id ? 'bg-card text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground bg-transparent'
                                            }`}>
                                        <Icon className="w-3.5 h-3.5" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <Button onClick={openAdd} color="primary">
                                <Plus className="h-4 w-4 mr-2" />
                                New Session
                            </Button>
                        </div>
                        {/* Filter Bar */}
                        {view === 'list' && (
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <input type="text" placeholder="Search course..." value={search} onChange={e => setSearch(e.target.value)}
                                        className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 w-44" />
                                </div>

                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                    {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
                                </select>

                                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                                    className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                                </select>

                                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                                    className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                    {DEPTS.map(d => <option key={d}>{d}</option>)}
                                </select>

                                <span className="ml-auto text-xs text-muted-foreground">{filtered.length} session{filtered.length !== 1 ? 's' : ''}</span>
                            </div>
                        )}

                        {/* Main Content */}
                        <div className="flex gap-4">
                            <div className="flex-1 min-w-0">
                                {view === 'calendar' && (
                                    <CalendarView
                                        calYear={calYear} calMonth={calMonth}
                                        prevMonth={prevMonth} nextMonth={nextMonth}
                                        sessions={sessions}
                                        today={today}
                                        onSelect={setSelectedSession}
                                        selectedSession={selectedSession}
                                    />
                                )}
                                {view === 'list' && (
                                    <ListView sessions={filtered} onSelect={setSelectedSession} selectedSession={selectedSession} />
                                )}
                                {view === 'gantt' && (
                                    <GanttView sessions={filtered} calYear={calYear} calMonth={calMonth}
                                        setCalYear={setCalYear} setCalMonth={setCalMonth}
                                        prevMonth={prevMonth} nextMonth={nextMonth} today={today} onSelect={setSelectedSession} />
                                )}
                            </div>

                            {/* Detail Panel */}
                            {selectedSession && (
                                <SessionDetail
                                    session={selectedSession}
                                    onClose={() => setSelectedSession(null)}
                                    onEdit={() => openEdit(selectedSession)}
                                    onDelete={() => handleDelete(selectedSession.id)}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Session Form Modal */}
            {showForm && (
                <SessionFormModal
                    form={form} setForm={setForm}
                    isEdit={!!editSession}
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                    onCourseSelect={handleCourseSelect}
                />
            )}
        </>
    )
}
