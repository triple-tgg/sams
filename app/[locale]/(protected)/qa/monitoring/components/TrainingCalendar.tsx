'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Filter, Search, ArrowUp, ArrowDown, ArrowUpDown, Check, ChevronsUpDown } from 'lucide-react'
import { EMPLOYEES, ALL_COURSES } from '../data'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

// ─── CourseCombobox ──────────────────────────────────────────────────────────

function CourseCombobox({
    courses,
    value,
    onChange,
}: {
    courses: { value: string; label: string }[]
    value: string
    onChange: (v: string) => void
}) {
    const [open, setOpen] = useState(false)
    const selected = courses.find(c => c.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="flex items-center justify-between h-8 w-52 rounded-md border border-border bg-transparent px-3 text-xs cursor-pointer hover:bg-muted transition-colors"
                    role="combobox"
                    aria-expanded={open}
                >
                    <span className="truncate">{selected?.label ?? 'Select Course'}</span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search course..." className="h-9 text-xs" />
                    <CommandList>
                        <CommandEmpty className="py-3 text-xs text-center">No course found.</CommandEmpty>
                        <CommandGroup>
                            {courses.map(c => (
                                <CommandItem
                                    key={c.value}
                                    value={c.label}
                                    onSelect={() => {
                                        onChange(c.value)
                                        setOpen(false)
                                    }}
                                    className="text-xs"
                                >
                                    <Check className={cn('mr-2 h-3.5 w-3.5', value === c.value ? 'opacity-100' : 'opacity-0')} />
                                    {c.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface StaffItem {
    course: string
    exp: Date
    lastTraining: Date
}

interface StaffEntry {
    id: number
    name: string
    role: string
    items: StaffItem[]
}

interface MatchedEntry extends StaffEntry {
    matchedItems: StaffItem[]
}

type CalendarStatus = 'exp' | 'crit' | 'warn' | 'ok'

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_TH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const STATUS_COLORS: Record<CalendarStatus, string> = {
    exp: '#E24B4A',
    crit: '#EF9F27',
    warn: '#BA7517',
    ok: '#639922',
}

const STATUS_ORDER: Record<CalendarStatus, number> = { exp: 0, crit: 1, warn: 2, ok: 3 }

// ─── Build STAFF data from existing EMPLOYEES & ALL_COURSES ──────────────────

function buildStaffData(): StaffEntry[] {
    return EMPLOYEES.map((emp, idx) => {
        const items: StaffItem[] = []
        ALL_COURSES.forEach(c => {
            const dateStr = emp.courses[c.id]
            if (!dateStr || dateStr === '-' || dateStr === 'na') return
            const expDate = new Date(dateStr)
            if (!isNaN(expDate.getTime())) {
                const lastTraining = new Date(expDate)
                lastTraining.setMonth(lastTraining.getMonth() - c.interval)
                items.push({ course: c.label, exp: expDate, lastTraining })
            }
        })
        return { id: idx + 1, name: emp.name, role: emp.pos, items }
    })
}

const ALL_FILTER_COURSES = [
    { value: 'all', label: 'All' },
    ...ALL_COURSES.map(c => ({ value: c.label, label: c.label })),
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCalendarStatus(expDate: Date, today: Date): CalendarStatus {
    const diff = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'exp'
    if (diff < 30) return 'crit'
    if (diff < 90) return 'warn'
    return 'ok'
}

function fmtDate(d: Date): string {
    return `${d.getDate()} ${MONTH_TH[d.getMonth()]} ${d.getFullYear()}`
}

function getMinStatus(items: StaffItem[], today: Date): CalendarStatus {
    return items.reduce<CalendarStatus>((best, it) => {
        const st = getCalendarStatus(it.exp, today)
        return STATUS_ORDER[st] < STATUS_ORDER[best] ? st : best
    }, 'ok')
}

// ─── BarStack ────────────────────────────────────────────────────────────────

function BarStack({ counts }: { counts: { exp: number; crit: number; warn: number; ok: number } }) {
    const total = counts.exp + counts.crit + counts.warn + counts.ok
    if (total === 0) {
        return (
            <div className="flex h-[5px] rounded-[3px] overflow-hidden gap-[1px] mb-2">
                <div className="h-full rounded-[2px]" style={{ flex: 1, background: 'var(--color-border-tertiary, #e2e8f0)' }} />
            </div>
        )
    }
    const segs = ([
        { st: 'exp' as CalendarStatus, n: counts.exp },
        { st: 'crit' as CalendarStatus, n: counts.crit },
        { st: 'warn' as CalendarStatus, n: counts.warn },
    ]).filter(s => s.n > 0)
    return (
        <div className="flex h-[5px] rounded-[3px] overflow-hidden gap-[1px] mb-2">
            {segs.map(s => (
                <div key={s.st} className="h-full rounded-[2px]" style={{ flex: s.n, background: STATUS_COLORS[s.st] }} />
            ))}
        </div>
    )
}

// ─── DetailModal ─────────────────────────────────────────────────────────────

function DetailModal({
    open, month, year, entries, today, onClose,
}: {
    open: boolean
    month: number | null
    year: number
    entries: MatchedEntry[]
    today: Date
    onClose: () => void
}) {
    const [sortCol, setSortCol] = useState<string>('diff')
    const [sortDesc, setSortDesc] = useState<boolean>(false)
    const [filterName, setFilterName] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [filterCourse, setFilterCourse] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')

    if (month === null) return null

    const stLabel: Record<CalendarStatus, string> = { exp: 'Expired', crit: 'Critical', warn: 'Warning', ok: 'Valid' }
    const pillClass: Record<CalendarStatus, string> = { exp: 'bg-[#FCEBEB] text-[#A32D2D]', crit: 'bg-[#FAEEDA] text-[#854F0B]', warn: 'bg-[#FAC775] text-[#633806]', ok: 'bg-[#EAF3DE] text-[#3B6D11]' }
    const dateClass: Record<CalendarStatus, string> = { exp: 'text-[#A32D2D]', crit: 'text-[#854F0B]', warn: 'text-[#633806]', ok: 'text-[#3B6D11]' }

    // Flatten: one row per course item
    let tableRows = entries.flatMap(e =>
        e.matchedItems.map(it => {
            const st = getCalendarStatus(it.exp, today)
            const diff = Math.floor((it.exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            return { e, it, st, diff }
        })
    )

    // Unique options for selects
    const uniqueRoles = [...new Set(tableRows.map(r => r.e.role))].sort()
    const uniqueCourses = [...new Set(tableRows.map(r => r.it.course))].sort()
    const uniqueStatuses = [...new Set(tableRows.map(r => r.st))].sort((a, b) => STATUS_ORDER[a] - STATUS_ORDER[b])

    // Filter
    if (filterName.trim()) {
        const q = filterName.toLowerCase()
        tableRows = tableRows.filter(row => row.e.name.toLowerCase().includes(q))
    }
    if (filterRole !== 'all') tableRows = tableRows.filter(row => row.e.role === filterRole)
    if (filterCourse !== 'all') tableRows = tableRows.filter(row => row.it.course === filterCourse)
    if (filterStatus !== 'all') tableRows = tableRows.filter(row => row.st === filterStatus)

    // Sort
    tableRows.sort((a, b) => {
        let cmp = 0
        if (sortCol === 'name') cmp = a.e.name.localeCompare(b.e.name)
        else if (sortCol === 'role') cmp = a.e.role.localeCompare(b.e.role)
        else if (sortCol === 'course') cmp = a.it.course.localeCompare(b.it.course)
        else if (sortCol === 'lastTraining') cmp = a.it.lastTraining.getTime() - b.it.lastTraining.getTime()
        else if (sortCol === 'exp') cmp = a.it.exp.getTime() - b.it.exp.getTime()
        else if (sortCol === 'diff') cmp = a.diff - b.diff
        else if (sortCol === 'st') cmp = STATUS_ORDER[a.st] - STATUS_ORDER[b.st]

        return sortDesc ? -cmp : cmp
    })

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDesc(!sortDesc)
        else {
            setSortCol(col)
            setSortDesc(false)
        }
    }

    const HEADERS = [
        { id: 'name', label: 'Name' },
        { id: 'role', label: 'Role' },
        { id: 'course', label: 'Course' },
        { id: 'lastTraining', label: 'Last Training' },
        { id: 'exp', label: 'Expiry Date' },
        { id: 'diff', label: 'Remaining' },
        { id: 'st', label: 'Status' }
    ]

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
            <DialogContent size="md" className="max-h-[85vh] sm:max-w-[1000px] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
                    <div className="flex flex-col gap-3">
                        <DialogTitle className="text-base font-semibold flex items-center">
                            Details — {MONTH_FULL[month]} {year}
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0 ml-2">
                                {tableRows.length} Record(s)
                            </span>
                        </DialogTitle>
                        <div className="grid grid-cols-4 gap-2">
                            {/* Name: search select */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search Name..."
                                    className="w-full h-8 pl-8 pr-2 text-xs border border-border rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={filterName}
                                    onChange={e => setFilterName(e.target.value)}
                                />
                            </div>
                            {/* Role: select */}
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="h-8 text-xs rounded-md">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All Roles</SelectItem>
                                    {uniqueRoles.map(r => (
                                        <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Course: select */}
                            <Select value={filterCourse} onValueChange={setFilterCourse}>
                                <SelectTrigger className="h-8 text-xs rounded-md">
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All Courses</SelectItem>
                                    {uniqueCourses.map(c => (
                                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Status: select */}
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="h-8 text-xs rounded-md">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All Status</SelectItem>
                                    {uniqueStatuses.map(s => (
                                        <SelectItem key={s} value={s} className="text-xs">{stLabel[s]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 px-4 py-3">
                    {tableRows.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            No records found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-2 px-3 text-[11px] font-semibold text-muted-foreground uppercase">#</th>
                                        {HEADERS.map(h => (
                                            <th
                                                key={h.id}
                                                className="text-left py-2 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                                                onClick={() => handleSort(h.id)}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {h.label}
                                                    {sortCol === h.id ? (
                                                        sortDesc ? <ArrowDown className="w-3 h-3 text-primary" /> : <ArrowUp className="w-3 h-3 text-primary" />
                                                    ) : (
                                                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableRows.map(({ e, it, st, diff }, rowIdx) => (
                                        <tr
                                            key={`${rowIdx}-${e.name}-${it.course}`}
                                            className="border-b border-border/50 hover:bg-muted/40 transition-colors"
                                        >
                                            <td className="py-2.5 px-3 text-muted-foreground">{rowIdx + 1}</td>
                                            <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap">{e.name}</td>
                                            <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{e.role}</td>
                                            <td className="py-2.5 px-3 font-medium text-foreground">{it.course}</td>
                                            <td className="py-2.5 px-3 font-medium whitespace-nowrap text-muted-foreground">{fmtDate(it.lastTraining)}</td>
                                            <td className={`py-2.5 px-3 font-medium whitespace-nowrap ${dateClass[st]}`}>{fmtDate(it.exp)}</td>
                                            <td className={`py-2.5 px-3 whitespace-nowrap ${diff < 0 ? 'text-[#A32D2D]'
                                                : diff < 30 ? 'text-[#854F0B]'
                                                    : diff < 90 ? 'text-[#633806]'
                                                        : 'text-[#3B6D11]'
                                                }`}>
                                                {diff < 0 ? `${Math.abs(diff)} days ago` : `${diff} days`}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${pillClass[st]}`}>{stLabel[st]}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── MonthCard ───────────────────────────────────────────────────────────────

function MonthCard({
    month, entries, counts, isActive, isTodayMonth, onClick, today,
}: {
    month: number
    entries: MatchedEntry[]
    counts: { exp: number; crit: number; warn: number; ok: number }
    isActive: boolean
    isTodayMonth: boolean
    onClick: () => void
    today: Date
}) {
    const hasExp = counts.exp > 0
    const peopleCnt = entries.length
    const preview = entries.slice(0, 3)
    const more = entries.length - 3

    return (
        <div
            className={`border border-border rounded-xl p-3 cursor-pointer bg-card transition-all duration-150 hover:border-ring hover:shadow-sm ${isActive ? 'border-primary border hover:border-primary' : ''} ${isTodayMonth ? 'border-primary/50' : ''}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-[13px] font-medium text-foreground">{MONTH_FULL[month]}</span>
                {peopleCnt > 0 ? (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground ${hasExp ? '!bg-[#FCEBEB] !text-[#A32D2D]' : ''}`}>{peopleCnt}</span>
                ) : <span />}
            </div>
            <BarStack counts={counts} />
            <div className="flex flex-col gap-[3px]">
                {peopleCnt === 0 ? (
                    <div className="text-[11px] text-muted-foreground/50 py-1">No records</div>
                ) : (
                    <>
                        {preview.map(e => {
                            const minSt = getMinStatus(e.matchedItems, today)
                            return (
                                <div key={e.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground overflow-hidden">
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[minSt] }} />
                                    <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1">{e.name}</span>
                                </div>
                            )
                        })}
                        {more > 0 && <div className="text-[11px] text-muted-foreground/60 mt-0.5">+{more} more</div>}
                    </>
                )}
            </div>
        </div>
    )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TrainingCalendar({
    children,
}: {
    children?: React.ReactNode
}) {
    const today = useMemo(() => new Date(), [])
    const STAFF = useMemo(() => buildStaffData(), [])

    const [selectedYear, setSelectedYear] = useState(today.getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
    const [activeFilter, setActiveFilter] = useState('all')

    const filterItem = useCallback((item: StaffItem) => {
        return activeFilter === 'all' || item.course === activeFilter
    }, [activeFilter])

    const getMonthData = useCallback((month: number): MatchedEntry[] => {
        const results: MatchedEntry[] = []
        STAFF.forEach(s => {
            const relevant = s.items.filter(it => {
                const inYear = it.exp.getFullYear() === selectedYear
                const inMonth = it.exp.getMonth() === month
                const status = getCalendarStatus(it.exp, today)
                return inYear && inMonth && filterItem(it) && status !== 'ok'
            })
            if (relevant.length > 0) results.push({ ...s, matchedItems: relevant })
        })
        return results
    }, [STAFF, selectedYear, filterItem])

    const countsByStatus = useCallback((entries: MatchedEntry[]) => {
        let exp = 0, crit = 0, warn = 0, ok = 0
        entries.forEach(e => {
            e.matchedItems.forEach(it => {
                const st = getCalendarStatus(it.exp, today)
                if (st === 'exp') exp++
                else if (st === 'crit') crit++
                else if (st === 'warn') warn++
                else ok++
            })
        })
        return { exp, crit, warn, ok }
    }, [today])

    // Summary totals
    const totals = useMemo(() => {
        let totExp = 0, totCrit = 0, totWarn = 0, totOk = 0
        for (let m = 0; m < 12; m++) {
            const entries = getMonthData(m)
            entries.forEach(e => {
                e.matchedItems.forEach(it => {
                    const st = getCalendarStatus(it.exp, today)
                    if (st === 'exp') totExp++
                    else if (st === 'crit') totCrit++
                    else if (st === 'warn') totWarn++
                    else totOk++
                })
            })
        }
        return { exp: totExp, crit: totCrit, warn: totWarn, ok: totOk }
    }, [getMonthData, today])

    // All months
    const monthsData = useMemo(() =>
        Array.from({ length: 12 }, (_, m) => {
            const entries = getMonthData(m)
            const counts = countsByStatus(entries)
            return { month: m, entries, counts }
        })
        , [getMonthData, countsByStatus])

    // Modal entries
    const modalEntries = useMemo(() =>
        selectedMonth !== null ? getMonthData(selectedMonth) : []
        , [selectedMonth, getMonthData])

    const handlePrevYear = () => { setSelectedYear(y => y - 1); setSelectedMonth(null) }
    const handleNextYear = () => { setSelectedYear(y => y + 1); setSelectedMonth(null) }
    const handleSelectMonth = (m: number) => { setSelectedMonth(m) }
    const handleCloseModal = () => { setSelectedMonth(null) }
    const handleFilter = (v: string) => { setActiveFilter(v); setSelectedMonth(null) }

    return (
        <div className="py-2">

            {/* ── Top Toolbar (Year Nav) ──────────────────────────────── */}
            <div className="flex items-center justify-end mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevYear} className="bg-transparent border border-[0.5px] border-border rounded-md px-2 py-1 cursor-pointer text-foreground flex items-center hover:bg-muted">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-base font-semibold text-foreground min-w-[48px] text-center">{selectedYear}</span>
                    <button onClick={handleNextYear} className="bg-transparent border border-[0.5px] border-border rounded-md px-2 py-1 cursor-pointer text-foreground flex items-center hover:bg-muted">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Children (Charts Injected) ──────────────────────────── */}
            {children && <div className="mb-6">{children}</div>}

            {/* ── Bottom Toolbar (Course Filter) ──────────────────────── */}
            <div className="flex items-center mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <CourseCombobox
                        courses={ALL_FILTER_COURSES}
                        value={activeFilter}
                        onChange={handleFilter}
                    />
                </div>
            </div>

            {/* ── Summary Row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-5">
                {([
                    { count: totals.exp, label: 'Expired', textColor: 'text-[#E24B4A]' },
                    { count: totals.crit, label: 'Critical <30 Days', textColor: 'text-[#EF9F27]' },
                    { count: totals.warn, label: 'Warning 30–90 Days', textColor: 'text-[#BA7517]' },
                ] as const).map(s => (
                    <div key={s.label} className="bg-muted rounded-xl p-2.5 px-3.5 text-center border border-[0.5px] border-border">
                        <div className={`text-xl font-semibold leading-none ${s.textColor}`}>{s.count}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Calendar Grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {monthsData.map(({ month, entries, counts }) => (
                    <MonthCard
                        key={month}
                        month={month}
                        entries={entries}
                        counts={counts}
                        isActive={selectedMonth === month}
                        isTodayMonth={today.getFullYear() === selectedYear && today.getMonth() === month}
                        onClick={() => handleSelectMonth(month)}
                        today={today}
                    />
                ))}
            </div>

            {/* ── Legend ──────────────────────────────────────────────── */}
            <div className="flex gap-3 flex-wrap justify-start mt-3">
                {([
                    { color: STATUS_COLORS.exp, label: 'Expired' },
                    { color: STATUS_COLORS.crit, label: 'Critical <30 Days' },
                    { color: STATUS_COLORS.warn, label: 'Warning 30–90 Days' },
                ] as const).map(l => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
                        {l.label}
                    </span>
                ))}
            </div>

            {/* ── Detail Modal ─────────────────────────────────────────── */}
            <DetailModal
                open={selectedMonth !== null}
                month={selectedMonth}
                year={selectedYear}
                entries={modalEntries}
                today={today}
                onClose={handleCloseModal}
            />
        </div>
    )
}
