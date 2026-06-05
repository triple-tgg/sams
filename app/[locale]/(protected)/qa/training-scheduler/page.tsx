'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, List, BarChart3, Search, ChevronsUpDown, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { Session, SessionFormData, STATUS_CONFIG, STATUSES, BLANK_FORM, toYMD } from './types'
import { INITIAL_SESSIONS, COURSES_REF } from './data'
import { CalendarView } from './components/CalendarView'
import { ListView } from './components/ListView'
import { GanttView } from './components/GanttView'
import { SessionDetail } from './components/SessionDetail'
import { SessionFormModal } from './components/SessionFormModal'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSchedulerDashboardCalendar, getSchedulerCalendar, upsertScheduler, deleteScheduler } from '@/lib/api/qa/scheduler'
import { getCourseCategories, getCourseDepartments, getCourseList } from '@/lib/api/qa/course'
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard"
import { useSelector } from 'react-redux'
import { RootState } from '@/store/rootReducer'

const VIEW_OPTIONS = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'list', label: 'List', icon: List },
    { id: 'gantt', label: 'Timeline', icon: BarChart3 },
] as const

type ViewType = typeof VIEW_OPTIONS[number]['id']

export default function TrainingSchedulerPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { users } = useSelector((state: RootState) => state.auth)
    const today = new Date()
    const [view, setView] = useState<ViewType>('calendar')
    const [calYear, setCalYear] = useState(today.getFullYear())
    const [calMonth, setCalMonth] = useState(today.getMonth())
    const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS)
    const [filterStatus, setFilterStatus] = useState('All')
    const [filterDept, setFilterDept] = useState('All Departments')
    const [filterCat, setFilterCat] = useState('All')
    const [search, setSearch] = useState('')
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editSession, setEditSession] = useState<Session | null>(null)
    const [form, setForm] = useState<SessionFormData>(BLANK_FORM)
    const [listYear, setListYear] = useState(today.getFullYear())
    const [deptOpen, setDeptOpen] = useState(false)
    const [courseOpen, setCourseOpen] = useState(false)
    const [filterCourseId, setFilterCourseId] = useState<number | null>(null)

    // Calendar API — monthly, refetch when month/year changes
    const { data: calendarResp } = useQuery({
        queryKey: ['scheduler-calendar', calMonth + 1, calYear],
        queryFn: () => getSchedulerCalendar({ month: calMonth + 1, year: calYear })
    })

    // List API — full year, month: null
    const { data: listResp } = useQuery({
        queryKey: ['scheduler-list', listYear],
        queryFn: () => getSchedulerCalendar({ month: null, year: listYear })
    })

    function mapSessions(data: typeof calendarResp): Session[] {
        if (!data?.responseData) return []
        return data.responseData.map(s => {
            // Force UTC parse (API may return ISO without timezone suffix)
            const parseUTC = (iso: string) => new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z')
            const startLocal = parseUTC(s.startDate)
            const endLocal = parseUTC(s.endDate)

            const pad = (n: number) => String(n).padStart(2, '0')
            const toLocalDate = (d: Date) =>
                `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
            const toLocalTime = (d: Date) =>
                `${pad(d.getHours())}:${pad(d.getMinutes())}`

            return {
                id: s.id,
                courseId: s.courseId,
                courseCode: s.courseCode,
                courseName: s.courseName,
                category: 'Core',
                type: 'Initial',
                dateStart: toLocalDate(startLocal),
                dateEnd: toLocalDate(endLocal),
                timeStart: toLocalTime(startLocal),
                timeEnd: toLocalTime(endLocal),
                instructor: s.instructorName,
                venue: s.venueName,
                status: s.statusName,
                enrolled: s.enrolledCount,
                maxParticipants: s.maxParticipants,
                dept: s.targetDepartmentName
            }
        })
    }

    const apiSessions = useMemo<Session[]>(() => mapSessions(calendarResp), [calendarResp])
    const listSessions = useMemo<Session[]>(() => mapSessions(listResp), [listResp])

    // Calendar/Gantt use monthly data; List uses yearly data
    const activeSessions = view === 'list' ? listSessions : (calendarResp ? apiSessions : sessions)

    // Course list for filter combobox — from /training/course/listdata
    const { data: courseListResp } = useQuery({
        queryKey: ['course-list-all'],
        queryFn: () => getCourseList({ categoryId: null, courseName: '', courseDepartmentRequirementId: null, page: 1, perPage: 9999 })
    })
    const listCourses = useMemo(() => courseListResp?.responseData || [], [courseListResp])

    // Filtered
    const filtered = useMemo(() => activeSessions.filter(s => {
        if (filterStatus !== 'All' && s.status !== filterStatus) return false
        if (filterDept !== 'All Departments' && s.dept !== filterDept && s.dept !== 'All Departments') return false
        if (filterCat !== 'All' && s.category !== filterCat) return false
        if (filterCourseId !== null && s.courseId !== filterCourseId) return false
        if (search && !s.courseName.toLowerCase().includes(search.toLowerCase()) && !s.courseCode.toLowerCase().includes(search.toLowerCase())) return false
        return true
    }), [activeSessions, filterStatus, filterDept, filterCat, filterCourseId, search])

    // Course Categories from API
    const { data: categoriesResp } = useQuery({
        queryKey: ['course-categories-scheduler'],
        queryFn: getCourseCategories
    })
    const apiCategories = useMemo(() => categoriesResp?.responseData || [], [categoriesResp])

    // Course Departments from API
    const { data: deptsResp } = useQuery({
        queryKey: ['course-departments-scheduler'],
        queryFn: getCourseDepartments
    })
    const apiDepts = useMemo(() => deptsResp?.responseData || [], [deptsResp])

    // API Dashboard Stats
    const { data: dashboardResponse } = useQuery({
        queryKey: ['scheduler-dashboard-calendar', today.getFullYear()],
        queryFn: () => getSchedulerDashboardCalendar({ month: null, year: today.getFullYear() })
    })
    const apiStats = dashboardResponse?.responseData

    // Stats
    const stats = useMemo(() => ({
        total: apiStats?.totalSessions ?? activeSessions.length,
        scheduled: apiStats?.scheduled ?? activeSessions.filter(s => s.status === 'Scheduled').length,
        completed: apiStats?.completed ?? activeSessions.filter(s => s.status === 'Completed').length,
        full: apiStats?.full ?? activeSessions.filter(s => s.status === 'Full').length,
        upcoming: apiStats?.upcoming ?? activeSessions.filter(s => s.dateStart >= toYMD(today) && s.status === 'Scheduled').length,
    }), [apiStats, activeSessions, today])

    // Handlers
    function openAdd() { setEditSession(null); setForm(BLANK_FORM); setShowForm(true) }
    function openEdit(s: Session) { setEditSession(s); setForm({ ...s }); setShowForm(true); setSelectedSession(null) }
    async function handleSave() {
        if (!form.dateStart || !form.courseId) return

        try {
            const statusMap: Record<string, number> = {
                'Scheduled': 1, 'Completed': 2, 'Full': 3, 'Cancelled': 4, 'In Progress': 5, 'InProgress': 5
            }

            // Convert local datetime → UTC ISO string
            const toUTC = (dateStr: string, timeStr: string) => {
                const local = new Date(`${dateStr}T${timeStr}:00`)
                return local.toISOString()
            }

            const reqData = {
                trainingScheduleId: editSession ? editSession.id : 0,
                courseId: parseInt(String(form.courseId)),
                startDate: toUTC(form.dateStart, form.timeStart),
                endDate: toUTC(form.dateEnd || form.dateStart, form.timeEnd),
                instructor: form.instructor,
                venue: form.venue,
                targetDepartmentId: 0,
                trainingDataStatusesId: statusMap[form.status] || 1,
                maxParticipants: form.maxParticipants,
                note: form.note || '',
                userName: users?.username || 'system'
            }

            const res = await upsertScheduler(reqData)
            const newId = res.responseData?.[0]?.scheduleId

            await queryClient.invalidateQueries({ queryKey: ['scheduler-list'] })
            await queryClient.invalidateQueries({ queryKey: ['scheduler-calendar'] })
            await queryClient.invalidateQueries({ queryKey: ['scheduler-dashboard-calendar'] })
            if (editSession) {
                await queryClient.invalidateQueries({ queryKey: ['scheduler-session-detail', editSession.id] })
            }

            setShowForm(false)
            // Optional: navigate to the manage enrollment page for new sessions
            // if (!editSession && newId) {
            //     router.push(`/en/qa/training-scheduler/${newId}`)
            // }
        } catch (error) {
            console.error("Failed to save session:", error)
            alert("Failed to save training session")
        }
    }
    const handleDelete = async (id: number) => {
        try {
            await deleteScheduler({ id, userName: users?.username || 'system' });
            await queryClient.invalidateQueries({ queryKey: ['scheduler-list'] })
            await queryClient.invalidateQueries({ queryKey: ['scheduler-calendar'] });
            await queryClient.invalidateQueries({ queryKey: ['scheduler-dashboard-calendar'] });
            setSelectedSession(null);
        } catch (error) {
            console.error("Failed to delete session:", error);
            alert("Failed to delete training session");
        }
    }
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
                            <PermissionActionGuard menuCode="QA_MONITORING" action="canCreate">
                                <Button onClick={openAdd} color="primary">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Session
                                </Button>
                            </PermissionActionGuard>
                        </div>
                        {/* Filter Bar */}
                        {view === 'list' && (
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Course combobox */}
                                <Popover open={courseOpen} onOpenChange={setCourseOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            role="combobox"
                                            aria-expanded={courseOpen}
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer w-[180px] justify-between"
                                        >
                                            <span className={cn('truncate', !filterCourseId && 'text-muted-foreground')}>
                                                {filterCourseId
                                                    ? listCourses.find(c => c.id === filterCourseId)?.courseCode + ' ' + listCourses.find(c => c.id === filterCourseId)?.courseName
                                                    : 'All Courses'}
                                            </span>
                                            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 w-[340px]" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search course..." className="text-xs" />
                                            <CommandList className="max-h-[280px] overflow-y-auto" data-vaul-no-drag>
                                                <CommandEmpty>No course found.</CommandEmpty>
                                                <CommandItem value="All Courses" onSelect={() => { setFilterCourseId(null); setCourseOpen(false) }}>
                                                    <Check className={cn('mr-2 w-3.5 h-3.5', !filterCourseId ? 'opacity-100' : 'opacity-0')} />
                                                    All Courses
                                                </CommandItem>
                                                {listCourses.map(c => (
                                                    <CommandItem
                                                        key={c.id}
                                                        value={`${c.courseCode} ${c.courseName}`}
                                                        onSelect={() => { setFilterCourseId(c.id); setCourseOpen(false) }}
                                                    >
                                                        <Check className={cn('mr-2 w-3.5 h-3.5', filterCourseId === c.id ? 'opacity-100' : 'opacity-0')} />
                                                        <div className="flex flex-col items-start gap-1  w-full">
                                                            <span className="font-medium text-primary text-xs">{c.courseCode}</span>
                                                            <span className="text-sm text-muted-foreground">{c.courseName}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                    {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
                                </select>

                                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                                    className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                    <option value="All">All Categories</option>
                                    {apiCategories.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                {/* Departments filter — searchable combobox */}
                                <Popover open={deptOpen} onOpenChange={setDeptOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            role="combobox"
                                            aria-expanded={deptOpen}
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer min-w-[160px] justify-between"
                                        >
                                            <span className={cn('truncate', filterDept === 'All Departments' && 'text-muted-foreground')}>
                                                {filterDept}
                                            </span>
                                            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 w-[260px]" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search department..." className="text-xs" />
                                            <CommandList className="max-h-[260px] overflow-y-auto" data-vaul-no-drag>
                                                <CommandEmpty>No department found.</CommandEmpty>
                                                <CommandItem
                                                    value="All Departments"
                                                    onSelect={() => { setFilterDept('All Departments'); setDeptOpen(false) }}
                                                >
                                                    <Check className={cn('mr-2 w-3.5 h-3.5', filterDept === 'All Departments' ? 'opacity-100' : 'opacity-0')} />
                                                    All Departments
                                                </CommandItem>
                                                {apiDepts.map(d => (
                                                    <CommandGroup key={d.courseDepartment.id} heading={d.courseDepartment.name}>
                                                        {d.courseDepartmentSubs.map(sub => (
                                                            <CommandItem
                                                                key={sub.id}
                                                                value={`${d.courseDepartment.name} ${sub.name}`}
                                                                onSelect={() => { setFilterDept(sub.name); setDeptOpen(false) }}
                                                            >
                                                                <Check className={cn('mr-2 w-3.5 h-3.5', filterDept === sub.name ? 'opacity-100' : 'opacity-0')} />
                                                                {sub.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                ))}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                {/* Year filter for List tab — styled like Timeline */}
                                <Select value={listYear.toString()} onValueChange={v => setListYear(parseInt(v))}>
                                    <SelectTrigger className="w-[110px] h-8 text-xs font-semibold border-border">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i).map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

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
                                        sessions={activeSessions}
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
