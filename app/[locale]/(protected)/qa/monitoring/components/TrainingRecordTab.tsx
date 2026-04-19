'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { CourseRef, Employee, getStatus, STATUS_META, SortField, SortDir } from '../types'
import { EMPLOYEES, MANDATORY, TYPE_COURSES, ALL_COURSES } from '../data'
import { AlertBanner } from './AlertBanner'
import { StatusMatrix } from './StatusMatrix'
import { EmployeeDetailDrawer } from './EmployeeDetailDrawer'
import { CourseEnrollmentModal } from './CourseEnrollmentModal'

const POS_FILTERS = ['All', 'CS', 'AM', 'MGR/QA'] as const
const STATUS_FILTERS = ['All', 'expired', 'warning', 'valid'] as const
const MONTH_FILTERS = [
    { value: 'All', label: 'All Months' },
    { value: '0', label: 'Jan' }, { value: '1', label: 'Feb' }, { value: '2', label: 'Mar' },
    { value: '3', label: 'Apr' }, { value: '4', label: 'May' }, { value: '5', label: 'Jun' },
    { value: '6', label: 'Jul' }, { value: '7', label: 'Aug' }, { value: '8', label: 'Sep' },
    { value: '9', label: 'Oct' }, { value: '10', label: 'Nov' }, { value: '11', label: 'Dec' }
]

export function TrainingRecordTab() {
    const searchParams = useSearchParams()
    const courseFilter = searchParams.get('course')

    const [search, setSearch] = useState('')
    const [posFilter, setPosFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')
    const [monthFilter, setMonthFilter] = useState('All')
    const AVAILABLE_TABS = useMemo(() => [
        { key: 'mandatory', label: `Mandatory (${MANDATORY.length})`, data: MANDATORY },
        { key: 'type', label: `Type Courses (${TYPE_COURSES.length})`, data: TYPE_COURSES },
        { key: 'special', label: `Special Ops (0)`, data: [] as CourseRef[] },
        { key: 'other', label: `Other Courses (0)`, data: [] as CourseRef[] },
    ], [])

    const [tab, setTab] = useState<string>(() => {
        // Auto-select tab based on course query param
        if (courseFilter && TYPE_COURSES.some(c => c.id === courseFilter)) return 'type'
        return 'mandatory'
    })
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [enrollingCourse, setEnrollingCourse] = useState<{emp: Employee, course: CourseRef} | null>(null)
    const [enrollments, setEnrollments] = useState<Record<string, string>>({})
    const [sortField, setSortField] = useState<SortField>('no')
    const [sortDir, setSortDir] = useState<SortDir>('asc')

    const activeTabObj = AVAILABLE_TABS.find(t => t.key === tab) || AVAILABLE_TABS[0]
    const courses = activeTabObj.data

    // Aggregate stats
    const stats = useMemo(() => {
        let expired = 0, warning = 0, valid = 0
        EMPLOYEES.forEach(emp => {
            ALL_COURSES.forEach((c: CourseRef) => {
                const s = getStatus(emp.courses[c.id])
                if (s === 'expired') expired++
                else if (s === 'warning') warning++
                else if (s === 'valid') valid++
            })
        })
        return { expired, warning, valid, total: EMPLOYEES.length }
    }, [])

    // Filtered employees
    const filtered = useMemo(() => {
        return EMPLOYEES.filter(emp => {
            const nameMatch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.id.includes(search)
            const posMatch = posFilter === 'All' ||
                (posFilter === 'CS' && emp.posGroup === 'CS') ||
                (posFilter === 'AM' && emp.posGroup === 'AM') ||
                (posFilter === 'MGR/QA' && (emp.posGroup === 'MGR' || emp.posGroup === 'QA'))
            const statusMatch = statusFilter === 'All' || courses.some(c => {
                const s = getStatus(emp.courses[c.id])
                return statusFilter === s
            })
            const monthMatch = monthFilter === 'All' || courses.some(c => {
                const dueStr = emp.courses[c.id]
                if (!dueStr || dueStr === '-' || dueStr === 'na') return false
                const due = new Date(dueStr)
                return !isNaN(due.getTime()) && due.getMonth().toString() === monthFilter
            })
            return nameMatch && posMatch && statusMatch && monthMatch
        })
    }, [search, posFilter, statusFilter, monthFilter, courses])

    // Sorted employees
    const sorted = useMemo(() => {
        const list = [...filtered]
        list.sort((a, b) => {
            let cmp = 0
            switch (sortField) {
                case 'name': cmp = a.name.localeCompare(b.name); break
                case 'id': cmp = a.id.localeCompare(b.id); break
                case 'pos': cmp = a.pos.localeCompare(b.pos); break
                case 'expiry': {
                    const nearestOf = (emp: typeof a) => {
                        let nearest = Infinity
                        courses.forEach(c => {
                            const dueStr = emp.courses[c.id]
                            if (dueStr && dueStr !== '-' && dueStr !== 'na') {
                                const due = new Date(dueStr)
                                if (!isNaN(due.getTime())) {
                                    nearest = Math.min(nearest, due.getTime())
                                }
                            }
                        })
                        return nearest
                    }
                    cmp = nearestOf(a) - nearestOf(b)
                    break
                }
                default: cmp = a.no - b.no
            }
            return sortDir === 'desc' ? -cmp : cmp
        })
        return list
    }, [filtered, sortField, sortDir, courses])

    const selEmp = selectedId ? EMPLOYEES.find(e => e.id === selectedId) || null : null

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDir('asc')
        }
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-muted-foreground/40" />
        return sortDir === 'asc'
            ? <ChevronUp className="w-3 h-3 text-primary" />
            : <ChevronDown className="w-3 h-3 text-primary" />
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-bold">Training Monitoring</h3>
                </div>
                <div className="flex items-center gap-3">
                    {[
                        { label: 'Staff', val: stats.total, color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
                        { label: 'Expired', val: stats.expired, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                        { label: 'Warning', val: stats.warning, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                        { label: 'Valid', val: stats.valid, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                    ].map(k => (
                        <div key={k.label} className="rounded-xl px-4 py-2 text-center min-w-[72px]"
                            style={{ background: k.bg, border: `1px solid ${k.border}` }}>
                            <div className="text-xl font-extrabold leading-tight" style={{ color: k.color }}>{k.val}</div>
                            <div className="text-[10px] font-semibold mt-0.5" style={{ color: k.color + 'aa' }}>{k.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap bg-card rounded-xl border border-border p-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search name or ID…"
                            className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 w-48" />
                    </div>

                    <div className="flex items-center gap-1 ml-auto">
                        <select
                            value={monthFilter}
                            onChange={e => setMonthFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-card text-foreground focus:outline-none border-border hover:border-border/80 mr-2"
                        >
                            {MONTH_FILTERS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        {STATUS_FILTERS.map(s => {
                            const m = STATUS_META[s as keyof typeof STATUS_META] || {}
                            return (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${statusFilter === s
                                        ? (s === 'All' ? 'bg-primary text-white border-primary' : '')
                                        : 'bg-card text-muted-foreground border-border hover:border-border/80'
                                        }`}
                                    style={statusFilter === s && s !== 'All' ? { background: m.bg, color: m.text, borderColor: m.dot + '66' } : {}}>
                                    {s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            )
                        })}
                    </div>
                </div>
                <div>
                    {/* Tabs */}
                    <div className="flex gap-0.5 relative z-10">
                        {AVAILABLE_TABS.slice(0, 3).map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`px-5 py-2 rounded-t-xl text-xs font-bold border cursor-pointer transition-all ${tab === t.key
                                    ? 'bg-muted text-foreground border-border z-10 relative'
                                    : 'bg-card text-muted-foreground border-border/50 hover:text-foreground'
                                    }`}>
                                {t.label}
                            </button>
                        ))}
                        {AVAILABLE_TABS.length > 3 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={`px-2 py-2 rounded-t-xl text-xs font-bold border cursor-pointer transition-all ${AVAILABLE_TABS.slice(3).some(t => t.key === tab)
                                            ? 'bg-muted text-foreground border-border z-10 relative'
                                            : 'bg-card text-muted-foreground border-border/50 hover:text-foreground'
                                        }`}>
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    {AVAILABLE_TABS.slice(3).map(t => (
                                        <DropdownMenuItem key={t.key} onClick={() => setTab(t.key)}
                                            className={`cursor-pointer ${tab === t.key ? 'bg-primary/10 text-primary font-bold' : ''}`}>
                                            {t.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Matrix */}
                    <div className="bg-card rounded-b-xl rounded-tr-xl border border-border overflow-hidden -mt-[1px] relative z-[1]">
                        <StatusMatrix
                            employees={sorted}
                            courses={courses}
                            enrollments={enrollments}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            sortField={sortField}
                            sortDir={sortDir}
                            onSort={handleSort}
                            SortIcon={SortIcon}
                            onEnroll={(empId, courseId) => {
                                const emp = EMPLOYEES.find(e => e.id === empId)
                                const crs = ALL_COURSES.find(c => c.id === courseId)
                                if (emp && crs) setEnrollingCourse({ emp, course: crs })
                            }}
                        />
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 flex-wrap">
                    {Object.entries(STATUS_META).map(([k, m]) => (
                        <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.dot }} />
                            {k === 'valid' ? 'Valid (>90 days)' : k === 'warning' ? 'Warning (≤90 days)' :
                                k === 'expired' ? 'Expired' : k === 'na' ? 'N/A' : 'No data'}
                        </div>
                    ))}
                    <span className="ml-auto text-[10px] text-muted-foreground">
                        Showing {sorted.length} of {EMPLOYEES.length} staff · Click row to expand
                    </span>
                </div>
            </div>

            {/* Employee Detail Drawer */}
            <EmployeeDetailDrawer
                employee={selEmp}
                onClose={() => setSelectedId(null)}
            />

            <CourseEnrollmentModal
                isOpen={!!enrollingCourse}
                onClose={() => setEnrollingCourse(null)}
                employee={enrollingCourse?.emp || null}
                course={enrollingCourse?.course || null}
                enrolledSessionId={enrollingCourse ? enrollments[`${enrollingCourse.emp.id}-${enrollingCourse.course.id}`] : null}
                onEnroll={(sessionId) => {
                    if (enrollingCourse) {
                        setEnrollments(prev => ({
                            ...prev,
                            [`${enrollingCourse.emp.id}-${enrollingCourse.course.id}`]: sessionId
                        }))
                    }
                }}
            />
        </div>
    )
}
