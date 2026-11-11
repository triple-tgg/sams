'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { CourseRef, Employee, STATUS_META, SortField, SortDir, computeStatusAndDaysLeft } from '../types'
import { StatusMatrix } from './StatusMatrix'
import { EmployeeDetailDrawer } from './EmployeeDetailDrawer'
import { CourseEnrollmentModal } from './CourseEnrollmentModal'
import { TrainingDetailModal, type EditedTrainingData } from './TrainingDetailModal'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCourseList } from '@/lib/api/qa/course'
import { getTrainingMonitoring, upsertTrainingMonitoringExpiry, type TrainingMonitoringStaffCourse } from '@/lib/api/qa/dashboardSummary'
import { createTrainingHistory } from '@/lib/api/qa/staff-management'
import { toast } from 'sonner'

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

    const { data: courseListResp } = useQuery({
        queryKey: ['course-list-filter'],
        queryFn: () => getCourseList({ categoryId: null, courseName: '', courseDepartmentRequirementId: null, page: 1, perPage: 999 })
    })
    const apiCourses = courseListResp?.responseData || []

    const [search, setSearch] = useState('')
    const [courseSelect, setCourseSelect] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')
    const [monthFilter, setMonthFilter] = useState('All')

    // Fetch training monitoring data from API
    const {
        data: monitoringResp,
        isLoading: isLoadingMonitoring,
        isError: isMonitoringError,
        refetch: refetchMonitoring,
    } = useQuery({
        queryKey: ['training-monitoring', search, monthFilter, statusFilter],
        queryFn: () => getTrainingMonitoring({
            searchText: search,
            month: monthFilter === 'All' ? 0 : parseInt(monthFilter) + 1, // API months are 1-based
            status: statusFilter === 'All' ? '' : statusFilter,
        }),
    })
    const monitoringData = monitoringResp?.responseData

    // Course type + recurrence interval come from the course list API (the monitoring API doesn't carry them)
    const courseMetaById = useMemo(() => {
        const map = new Map<number, { courseType: string; interval: number }>()
        apiCourses.forEach(c => map.set(c.id, {
            courseType: c.courseType,
            interval: c.recurrenceIntervalYears ? c.recurrenceIntervalYears * 12 : 0,
        }))
        return map
    }, [apiCourses])

    // Build tabs from API courseCategories
    const AVAILABLE_TABS = useMemo(() => {
        if (monitoringData?.courseCategories?.length) {
            return monitoringData.courseCategories.map(cat => ({
                key: cat.categoryId.toString(),
                label: `${cat.categoryName} (${cat.courses.length})`,
                data: cat.courses.map(c => ({
                    id: c.courseId.toString(),
                    short: c.courseCode,
                    label: c.courseName,
                    interval: courseMetaById.get(c.courseId)?.interval ?? 0,
                    courseType: courseMetaById.get(c.courseId)?.courseType,
                    code: c.courseCode,
                } as CourseRef)),
                staffList: cat.staffList,
            }))
        }
        return []
    }, [monitoringData, courseMetaById])

    const queryClient = useQueryClient()
    const [tab, setTab] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [selectedCell, setSelectedCell] = useState<{ emp: Employee, course: CourseRef } | null>(null)
    const [editedRecords, setEditedRecords] = useState<Record<string, EditedTrainingData>>({})
    const [enrollingCourse, setEnrollingCourse] = useState<{ emp: Employee, course: CourseRef } | null>(null)
    const [enrollments, setEnrollments] = useState<Record<string, string>>({})
    const [sortField, setSortField] = useState<SortField>('no')
    const [sortDir, setSortDir] = useState<SortDir>('asc')
    const [courseHeaderMode, setCourseHeaderMode] = useState<'code' | 'name'>('code')
    const [courseHeaderOrientation, setCourseHeaderOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
    const tabsContainerRef = useRef<HTMLDivElement>(null)
    const tabsMeasureRef = useRef<HTMLDivElement>(null)
    const [visibleTabCount, setVisibleTabCount] = useState(AVAILABLE_TABS.length)

    useEffect(() => {
        if (AVAILABLE_TABS.length === 0) return
        const courseTab = courseFilter
            ? AVAILABLE_TABS.find(item => item.data.some(course => course.id === courseFilter))
            : null
        if (courseTab) {
            setTab(courseTab.key)
            setCourseSelect(courseFilter as string)
            return
        }
        if (!AVAILABLE_TABS.some(item => item.key === tab)) {
            setTab(AVAILABLE_TABS[0].key)
        }
    }, [AVAILABLE_TABS, courseFilter, tab])

    const activeTabObj = AVAILABLE_TABS.find(t => t.key === tab)
    const visibleTabs = AVAILABLE_TABS.slice(0, visibleTabCount)
    const overflowTabs = AVAILABLE_TABS.slice(visibleTabCount)
    let courses = activeTabObj?.data || []

    useLayoutEffect(() => {
        const container = tabsContainerRef.current
        const measure = tabsMeasureRef.current
        if (!container || !measure) return

        const updateVisibleTabs = () => {
            const tabWidths = Array.from(measure.children).map(child =>
                (child as HTMLElement).getBoundingClientRect().width
            )
            const gap = 2
            const availableWidth = container.clientWidth
            const totalWidth = tabWidths.reduce((sum, width) => sum + width, 0)
                + Math.max(0, tabWidths.length - 1) * gap

            if (totalWidth <= availableWidth) {
                setVisibleTabCount(AVAILABLE_TABS.length)
                return
            }

            const overflowButtonWidth = 38
            const availableForTabs = Math.max(0, availableWidth - overflowButtonWidth - gap)
            let usedWidth = 0
            let nextVisibleCount = 0

            for (const width of tabWidths) {
                const nextWidth = usedWidth + (nextVisibleCount > 0 ? gap : 0) + width
                if (nextWidth > availableForTabs) break
                usedWidth = nextWidth
                nextVisibleCount += 1
            }

            setVisibleTabCount(Math.max(1, nextVisibleCount))
        }

        updateVisibleTabs()
        const observer = new ResizeObserver(updateVisibleTabs)
        observer.observe(container)
        return () => observer.disconnect()
    }, [AVAILABLE_TABS])

    if (courseSelect !== 'All') {
        const selectedApi = apiCourses.find(c => c.id.toString() === courseSelect)
        if (selectedApi) {
            courses = [{
                id: selectedApi.id.toString(),
                short: selectedApi.courseCode,
                label: selectedApi.courseName,
                interval: selectedApi.recurrenceIntervalYears ? selectedApi.recurrenceIntervalYears * 12 : 0,
                courseType: selectedApi.courseType,
                code: selectedApi.courseCode,
            }]
        }
    }

    // Build employee list exclusively from the monitoring API, merged with local edits.
    const filtered = useMemo(() => {
        if (activeTabObj?.staffList?.length) {
            // Map API staff to Employee-like objects for StatusMatrix
            return activeTabObj.staffList.map((staff, idx) => {
                const coursesMap: Record<string, string> = {}
                const courseStatuses: Employee['courseStatuses'] = {}
                const courseDaysLeft: Employee['courseDaysLeft'] = {}
                const courseIssueDates: Employee['courseIssueDates'] = {}
                const staffCourseDataMap: Record<string, TrainingMonitoringStaffCourse> = {}

                staff.courses.forEach(c => {
                    const cId = c.courseId.toString()
                    const override = editedRecords[`${staff.employeeId}-${cId}`]
                        || (staff.staffId ? editedRecords[`${staff.staffId}-${cId}`] : undefined)

                    if (override) {
                        coursesMap[cId] = override.validUntil || '-'
                        const comp = computeStatusAndDaysLeft(override.validUntil)
                        courseStatuses[cId] = comp.status
                        courseDaysLeft[cId] = comp.daysLeft
                        courseIssueDates[cId] = override.dateFrom || null
                        staffCourseDataMap[cId] = {
                            courseId: c.courseId,
                            courseCode: c.courseCode,
                            courseName: c.courseName,
                            issueDate: override.dateFrom || null,
                            expiryDate: override.validUntil || null,
                            daysLeft: comp.daysLeft,
                            status: comp.status === 'valid' ? 'Valid' : comp.status === 'warning' ? 'Expiring Soon' : comp.status === 'expired' ? 'Expired' : comp.status,
                        }
                    } else {
                        const normalizedStatus = c.status.trim().toLowerCase()
                        // Trained (issue date) but no expiry and no status from the API → never expires
                        const neverExpires = !normalizedStatus && !!c.issueDate && !c.expiryDate
                        coursesMap[cId] = neverExpires ? 'Never' : c.expiryDate || c.status || '-'
                        courseStatuses[cId] =
                            neverExpires ? 'valid'
                            : normalizedStatus === 'valid' || normalizedStatus === 'permanent' || normalizedStatus === 'never' ? 'valid'
                                : normalizedStatus === 'warning' || normalizedStatus === 'expiring' ? 'warning'
                                    : normalizedStatus === 'expired' ? 'expired'
                                        : normalizedStatus === 'not assigned' ? 'Not Assigned'
                                            : 'missing'
                        courseDaysLeft[cId] = c.daysLeft
                        courseIssueDates[cId] = c.issueDate
                        // expiryDate stays null so the detail modal falls back to the cell value ('Never')
                        staffCourseDataMap[cId] = neverExpires ? { ...c, status: 'Never' } : c
                    }
                })
                return {
                    staffId: staff.staffId,
                    no: idx + 1,
                    id: staff.employeeId,
                    name: staff.staffName,
                    pos: staff.positionName,
                    posGroup: 'CS' as const, // Default group
                    courses: coursesMap,
                    courseStatuses,
                    courseDaysLeft,
                    courseIssueDates,
                    staffCourseData: staffCourseDataMap,
                } as Employee
            }).filter(emp => {
                if (!search) return true
                return emp.name.toLowerCase().includes(search.toLowerCase()) || emp.id.includes(search)
            })
        }
        return []
    }, [activeTabObj?.staffList, search, editedRecords])

    // Use API stats if available, updated dynamically if edits occurred
    const stats = useMemo(() => {
        if (Object.keys(editedRecords).length > 0 && filtered.length > 0) {
            let expired = 0, warning = 0, valid = 0
            filtered.forEach(emp => {
                courses.forEach(c => {
                    const s = emp.courseStatuses?.[c.id]
                    if (s === 'expired') expired++
                    else if (s === 'warning') warning++
                    else if (s === 'valid') valid++
                })
            })
            return {
                total: filtered.length,
                expired,
                warning,
                valid,
            }
        }
        if (monitoringData?.summary) {
            return {
                total: monitoringData.summary.totalStaff,
                expired: monitoringData.summary.totalExpired,
                warning: monitoringData.summary.totalWarning,
                valid: monitoringData.summary.totalValid,
            }
        }
        return { expired: 0, warning: 0, valid: 0, total: 0 }
    }, [monitoringData, editedRecords, filtered, courses])

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

    const selEmp = selectedId ? sorted.find(e => e.id === selectedId) || null : null

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDir('asc')
        }
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-50" />
        return sortDir === 'asc'
            ? <ChevronUp className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                <div>
                    <h3 className="text-base sm:text-lg font-bold">Training Monitoring</h3>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-3">
                    {[
                        { label: 'Staff', val: stats.total, color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
                        { label: 'Expired', val: stats.expired, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                        { label: 'Warning', val: stats.warning, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                        { label: 'Valid', val: stats.valid, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                    ].map(k => (
                        <div key={k.label} className="rounded-xl px-2 sm:px-4 py-2 text-center sm:min-w-[72px]"
                            style={{ background: k.bg, border: `1px solid ${k.border}` }}>
                            <div className="text-lg sm:text-xl font-extrabold leading-tight" style={{ color: k.color }}>{k.val}</div>
                            <div className="text-[10px] font-semibold mt-0.5" style={{ color: k.color + 'aa' }}>{k.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:flex-wrap bg-card rounded-xl border border-border p-3">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search name or ID…"
                            className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 w-full sm:w-48" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-1 sm:ml-auto">
                        <select
                            value={courseSelect}
                            onChange={e => {
                                const nextCourseId = e.target.value
                                setCourseSelect(nextCourseId)
                                if (nextCourseId === 'All') return
                                const category = AVAILABLE_TABS.find(item =>
                                    item.data.some(course => course.id === nextCourseId)
                                )
                                if (category) setTab(category.key)
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-card text-foreground focus:outline-none border-border hover:border-border/80 sm:mr-2 min-w-0 flex-1 sm:flex-none max-w-full sm:max-w-[200px]"
                        >
                            <option value="All">All Courses</option>
                            {apiCourses.map(c => (
                                <option key={c.id} value={c.id.toString()}>{c.courseCode} - {c.courseName}</option>
                            ))}
                        </select>
                        <select
                            value={monthFilter}
                            onChange={e => setMonthFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-card text-foreground focus:outline-none border-border hover:border-border/80 sm:mr-2 shrink-0"
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
                    {/* Tabs + course header display toggle */}
                    <div className="flex items-end gap-2">
                    <div ref={tabsContainerRef} className="flex flex-1 min-w-0 gap-0.5 relative z-10">
                        {visibleTabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`min-w-0 truncate px-3 sm:px-5 py-2 rounded-t-xl text-xs font-bold border cursor-pointer transition-all ${tab === t.key
                                    ? 'bg-muted text-foreground border-border z-10 relative'
                                    : 'bg-card text-muted-foreground border-border/50 hover:text-foreground'
                                    }`}>
                                {t.label}
                            </button>
                        ))}
                        {overflowTabs.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button aria-label="More course categories" className={`px-2 py-2 rounded-t-xl text-xs font-bold border cursor-pointer transition-all ${overflowTabs.some(t => t.key === tab)
                                        ? 'bg-muted text-foreground border-border z-10 relative'
                                        : 'bg-card text-muted-foreground border-border/50 hover:text-foreground'
                                        }`}>
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    {overflowTabs.map(t => (
                                        <DropdownMenuItem key={t.key} onClick={() => setTab(t.key)}
                                            className={`cursor-pointer ${tab === t.key ? 'bg-primary/10 text-primary font-bold' : ''}`}>
                                            {t.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <div
                            ref={tabsMeasureRef}
                            aria-hidden="true"
                            className="invisible absolute left-0 top-0 flex w-max gap-0.5 pointer-events-none"
                        >
                            {AVAILABLE_TABS.map(t => (
                                <span key={t.key} className="px-5 py-2 rounded-t-xl text-xs font-bold border whitespace-nowrap">
                                    {t.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pb-1.5">
                        <span className="hidden sm:inline text-[11px] font-semibold text-muted-foreground">Show course as</span>
                        <div role="group" aria-label="Course header display" className="inline-flex rounded-lg border border-border bg-card p-0.5">
                            {(['code', 'name'] as const).map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    aria-pressed={courseHeaderMode === mode}
                                    onClick={() => setCourseHeaderMode(mode)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${courseHeaderMode === mode
                                        ? 'bg-primary text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {mode === 'code' ? 'Code' : 'Name'}
                                </button>
                            ))}
                        </div>
                        <div role="group" aria-label="Course header orientation" className="inline-flex rounded-lg border border-border bg-card p-0.5">
                            {(['horizontal', 'vertical'] as const).map(o => (
                                <button
                                    key={o}
                                    type="button"
                                    aria-pressed={courseHeaderOrientation === o}
                                    onClick={() => setCourseHeaderOrientation(o)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${courseHeaderOrientation === o
                                        ? 'bg-primary text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {o === 'horizontal' ? 'Horizontal' : 'Vertical'}
                                </button>
                            ))}
                        </div>
                    </div>
                    </div>

                    {/* Matrix */}
                    <div className="bg-card rounded-b-xl rounded-tr-xl border border-border overflow-clip -mt-[1px] relative z-[1]">
                        {isLoadingMonitoring ? (
                            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                                Loading training monitoring data…
                            </div>
                        ) : isMonitoringError ? (
                            <div className="py-20 text-center text-sm text-destructive">
                                Unable to load training monitoring data.
                                <button
                                    type="button"
                                    onClick={() => refetchMonitoring()}
                                    className="ml-2 font-semibold text-primary underline"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : AVAILABLE_TABS.length === 0 ? (
                            <div className="py-20 text-center text-sm text-muted-foreground">
                                No course categories found.
                            </div>
                        ) : (
                            <StatusMatrix
                                employees={sorted}
                                courses={courses}
                                courseHeaderMode={courseHeaderMode}
                                courseHeaderOrientation={courseHeaderOrientation}
                                enrollments={enrollments}
                                selectedId={selectedId}
                                onSelect={setSelectedId}
                                sortField={sortField}
                                sortDir={sortDir}
                                onSort={handleSort}
                                SortIcon={SortIcon}
                                onCellClick={(emp, course) => setSelectedCell({ emp, course })}
                                onEnroll={(empId, courseId) => {
                                    const emp = sorted.find(e => e.id === empId)
                                    const crs = courses.find(c => c.id === courseId)
                                    if (emp && crs) setEnrollingCourse({ emp, course: crs })
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap">
                    {/* Only statuses the matrix can actually render, labelled by what the cell shows */}
                    {([
                        ['valid', 'Valid (>90 days or Never)'],
                        ['warning', 'Warning (≤90 days)'],
                        ['expired', 'Expired'],
                        ['Not Assigned', 'Not assigned (–)'],
                        ['missing', 'No record'],
                    ] as const).map(([k, label]) => (
                        <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_META[k].dot }} />
                            {label}
                        </div>
                    ))}
                    <span className="w-full sm:w-auto sm:ml-auto text-[10px] text-muted-foreground">
                        Showing {sorted.length} of {stats.total} staff · Click row to expand
                    </span>
                </div>
            </div>

            {/* Employee Detail Drawer */}
            <EmployeeDetailDrawer
                employee={selEmp}
                courses={courses}
                onClose={() => setSelectedId(null)}
            />

            {/* Training Detail & Edit Modal */}
            <TrainingDetailModal
                isOpen={!!selectedCell}
                onClose={() => setSelectedCell(null)}
                employee={selectedCell?.emp || null}
                course={selectedCell?.course || null}
                initialData={
                    selectedCell
                        ? editedRecords[`${selectedCell.emp.id}-${selectedCell.course.id}`]
                            || (selectedCell.emp.staffId ? editedRecords[`${selectedCell.emp.staffId}-${selectedCell.course.id}`] : undefined)
                        : undefined
                }
                onSave={async (data) => {
                    if (!selectedCell) return
                    const { emp, course } = selectedCell
                    const key = `${emp.id}-${course.id}`
                    setEditedRecords(prev => ({
                        ...prev,
                        [key]: data,
                        ...(emp.staffId ? { [`${emp.staffId}-${course.id}`]: data } : {})
                    }))

                    try {
                        let localExpiryDate: string
                        if (data.validUntil.toLowerCase() === 'permanent' || data.validUntil.toLowerCase() === 'never') {
                            localExpiryDate = '9999-12-31T00:00:00'
                        } else if (/^\d{4}-\d{2}-\d{2}$/.test(data.validUntil)) {
                            localExpiryDate = `${data.validUntil}T00:00:00`
                        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data.validUntil)) {
                            localExpiryDate = data.validUntil.slice(0, 19)
                        } else {
                            const parsed = new Date(data.validUntil)
                            if (!isNaN(parsed.getTime())) {
                                const yyyy = parsed.getFullYear()
                                const mm = String(parsed.getMonth() + 1).padStart(2, '0')
                                const dd = String(parsed.getDate()).padStart(2, '0')
                                const hh = String(parsed.getHours()).padStart(2, '0')
                                const min = String(parsed.getMinutes()).padStart(2, '0')
                                const ss = String(parsed.getSeconds()).padStart(2, '0')
                                localExpiryDate = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`
                            } else {
                                localExpiryDate = '9999-12-31T00:00:00'
                            }
                        }

                        const staffCourse = emp.staffCourseData?.[course.id]
                        const courseAssignmentId = Number((staffCourse as any)?.courseAssignmentId) || 0

                        const res = await upsertTrainingMonitoringExpiry({
                            staffId: emp.staffId ?? 0,
                            courseId: Number(course.id) || Number(staffCourse?.courseId) || 0,
                            courseAssignmentId,
                            expiryDate: localExpiryDate,
                        })

                        // Also record training history if staffId exists
                        if (emp.staffId && (data.dateFrom || data.provider)) {
                            createTrainingHistory(emp.staffId, {
                                courseName: course.label,
                                academyName: data.provider || '-',
                                dateFrom: data.dateFrom,
                                dateTo: data.dateTo,
                            }).catch(() => {})
                        }

                        // Invalidate cache to sync with backend
                        queryClient.invalidateQueries({ queryKey: ['training-monitoring'] })
                        if (emp.staffId) {
                            queryClient.invalidateQueries({ queryKey: ['qa-staff-training-dashboard', emp.staffId] })
                        }

                        const successMsg = typeof res.responseData === 'string' && res.responseData.trim()
                            ? res.responseData
                            : (res.message || 'Training expiry updated successfully')
                        toast.success(successMsg)
                    } catch (err: any) {
                        console.error('Failed to update training monitoring expiry:', err)
                        toast.error(err.message || 'Failed to update training expiry')
                    }
                }}
                onEnroll={(empId, courseId) => {
                    const emp = sorted.find(e => e.id === empId)
                    const crs = courses.find(c => c.id === courseId)
                    if (emp && crs) {
                        setSelectedCell(null)
                        setEnrollingCourse({ emp, course: crs })
                    }
                }}
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
