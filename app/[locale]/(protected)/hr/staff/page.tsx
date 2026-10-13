'use client'
import React, { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    ChevronLeft, ChevronRight, Plus, MoreHorizontal, Eye, Search, Users, RefreshCw, AlertCircle, User, FileUp,
    ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, Filter, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQAStaffList } from '@/lib/api/hooks/useQAStaffManagement'
import type { QAStaffItem } from '@/lib/api/qa/staff-management'
import { useStaffDepartments, useStaffDepartmentPositions } from '@/lib/api/master/organization.hooks'
import { useStaffsTypesAll } from '@/lib/api/hooks/useStaffsTypes'
import { PermissionActionGuard } from '@/components/partials/auth/PermissionActionGuard'
import { StaffExcelImportModal } from './components/StaffExcelImportModal'
import './hr-staff.css'

const staffTypeColors: Record<string, string> = {
    'CS': '#2563eb',
    'MECH': '#7c3aed',
    'CS&MECH': '#0284c7',
    'CS & MECH': '#0284c7',
    'Back Office': '#0891b2',
    'INSP': '#059669',
    'Trainee': '#d97706',
    'Operational Staff': '#dc2626',
}

export default function HRStaffListPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const perPage = 20

    const [filterStaffType, setFilterStaffType] = useState<string>("0")
    const [filterPosition, setFilterPosition] = useState<string>("0")
    const [filterDepartment, setFilterDepartment] = useState<string>("0")
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [showImportModal, setShowImportModal] = useState(false)
    const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null)
    const importFileInputRef = useRef<HTMLInputElement>(null)

    const handleImportClick = () => {
        importFileInputRef.current?.click()
    }

    const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImportFile(file)
            setShowImportModal(true)
        }
        e.target.value = ''
    }

    const [filterStatus, setFilterStatus] = useState<string>("all")

    const { data: departmentData, isLoading: isLoadingDepartments } = useStaffDepartments()
    const { data: positionData, isLoading: isLoadingPositions } = useStaffDepartmentPositions()
    const { staffTypes: staffTypesList, isLoading: isLoadingStaffTypes } = useStaffsTypesAll()

    const departments = useMemo(
        () => (departmentData?.responseData ?? []).filter((department) => !department.isdelete),
        [departmentData]
    )

    const positions = useMemo(() => {
        const activePositions = (positionData?.responseData ?? []).filter((position) => !position.isdelete)
        if (filterDepartment === '0') return activePositions
        const departmentId = Number(filterDepartment)
        return activePositions.filter((position) => position.staffDepartmentId === departmentId)
    }, [filterDepartment, positionData])

    const extraFilterCount = useMemo(() => {
        let count = 0
        if (filterPosition !== '0') count++
        if (filterStatus !== 'all') count++
        return count
    }, [filterPosition, filterStatus])

    // ── Debounced search – send keyword filter to API for server-side search ──
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const searchTimerRef = React.useRef<NodeJS.Timeout | null>(null)

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(value)
            setPage(1) // reset to first page on search
        }, 400)
    }

    const hasAnyActiveFilter = useMemo(() => {
        return !!(
            debouncedSearch ||
            filterStaffType !== '0' ||
            filterDepartment !== '0' ||
            filterPosition !== '0' ||
            filterStatus !== 'all'
        )
    }, [debouncedSearch, filterStaffType, filterDepartment, filterPosition, filterStatus])

    // ── API Hook — uses the correct endpoint ──
    const { data, isLoading, error, refetch, isFetching } = useQAStaffList(
        {
            sortBy: 'employeeId',
            sortDirection,
            keyword: debouncedSearch,
            name: '',
            employeeId: '',
            staffDepartmentPositionId: Number(filterPosition),
            departmentId: Number(filterDepartment),
            stationId: 0,
            staffstypeId: Number(filterStaffType),
            isActive: filterStatus === 'inactive' ? false : true,
            page,
            perPage,
        },
        true
    )

    const staffList = data?.responseData ?? []
    const totalAll = data?.totalAll ?? 0
    const totalPages = Math.ceil(totalAll / perPage)

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1)
    }

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1)
    }

    return (
        <div className="hr-staff-page">
            <Card className="hr-staff-card">
                <CardHeader className="flex flex-row items-center justify-between border-b">
                    <div className="flex items-center gap-3">
                        <div className="hr-staff-icon-wrap">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Staff List</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {isLoading ? 'Loading...' : `${totalAll} staff members`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            ref={importFileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={handleImportFileSelect}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            className="hr-btn-import"
                            onClick={handleImportClick}
                        >
                            <FileUp className="h-4 w-4 mr-1.5" />
                            Import Excel
                        </Button>
                        <PermissionActionGuard menuCode="HR_STAFF" action="canCreate">
                            <Button
                                size="sm"
                                className="hr-btn-add"
                                onClick={() => router.push('/en/hr/staff/new')}
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                New Staff
                            </Button>
                        </PermissionActionGuard>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Search bar and Filters */}
                    <div className="px-5 py-3 border-b bg-muted/30 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                        <div className="relative flex-1 min-w-[180px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9 pr-8 h-9 w-full bg-white text-xs"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setDebouncedSearch('')
                                        setPage(1)
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    title="Clear search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {/* Staff Type */}
                            <Select
                                value={filterStaffType}
                                onValueChange={(val) => {
                                    setFilterStaffType(val)
                                    setPage(1)
                                }}
                                disabled={isLoadingStaffTypes}
                            >
                                <SelectTrigger className="h-9 w-auto min-w-[120px] max-w-[150px] bg-white text-xs">
                                    <SelectValue placeholder="Staff Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">All Staff Types</SelectItem>
                                    {staffTypesList.map((st) => (
                                        <SelectItem key={st.id} value={st.id.toString()}>
                                            {st.code || st.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Department — visible on lg and up (>= 1024px) */}
                            <div className="hidden lg:block">
                                <Select
                                    value={filterDepartment}
                                    onValueChange={(val) => {
                                        setFilterDepartment(val)
                                        setFilterPosition('0')
                                        setPage(1)
                                    }}
                                    disabled={isLoadingDepartments}
                                >
                                    <SelectTrigger className="h-9 w-auto min-w-[130px] max-w-[160px] bg-white text-xs">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">All Departments</SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem key={department.id} value={department.id.toString()}>
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Position — visible on 2xl only (>= 1536px) */}
                            <div className="hidden 2xl:block">
                                <Select
                                    value={filterPosition}
                                    onValueChange={(val) => { setFilterPosition(val); setPage(1); }}
                                    disabled={isLoadingPositions}
                                >
                                    <SelectTrigger className="h-9 w-auto min-w-[130px] max-w-[160px] bg-white text-xs">
                                        <SelectValue placeholder="Position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">All Positions</SelectItem>
                                        {positions.map((position) => (
                                            <SelectItem key={position.id} value={position.id.toString()}>
                                                {position.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status — visible on 2xl only (>= 1536px) */}
                            <div className="hidden 2xl:block">
                                <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setPage(1); }}>
                                    <SelectTrigger className="h-9 w-auto min-w-[110px] bg-white text-xs">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* More Filters button (hidden on 2xl where all filters are visible) */}
                            <div className="block 2xl:hidden">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "h-9 px-3 text-xs bg-white gap-1.5 transition-colors",
                                                extraFilterCount > 0 && "border-blue-500 text-blue-600 bg-blue-50/50 hover:bg-blue-50 font-medium"
                                            )}
                                        >
                                            <SlidersHorizontal className="h-3.5 w-3.5" />
                                            <span>More Filters</span>
                                            {extraFilterCount > 0 && (
                                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                                                    {extraFilterCount}
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-80 p-4 shadow-xl border bg-white dark:bg-slate-900 z-50">
                                        <div className="flex items-center justify-between pb-3 border-b mb-3">
                                            <div className="flex items-center gap-2">
                                                <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                                                <span className="font-semibold text-sm">More Filters</span>
                                                {extraFilterCount > 0 && (
                                                    <span className="rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-medium">
                                                        {extraFilterCount} active
                                                    </span>
                                                )}
                                            </div>
                                            {extraFilterCount > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setFilterPosition('0')
                                                        setFilterStatus('all')
                                                        setPage(1)
                                                    }}
                                                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                                                >
                                                    Reset
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-3.5">
                                            {/* Department (visible inside Popover on < lg where Department is hidden from main bar) */}
                                            <div className="lg:hidden space-y-1.5">
                                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Department</label>
                                                <Select
                                                    value={filterDepartment}
                                                    onValueChange={(val) => {
                                                        setFilterDepartment(val)
                                                        setFilterPosition('0')
                                                        setPage(1)
                                                    }}
                                                    disabled={isLoadingDepartments}
                                                >
                                                    <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-800 text-xs">
                                                        <SelectValue placeholder="Department" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[9999]">
                                                        <SelectItem value="0">All Departments</SelectItem>
                                                        {departments.map((department) => (
                                                            <SelectItem key={department.id} value={department.id.toString()}>
                                                                {department.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Position */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Position</label>
                                                    {filterDepartment !== '0' && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Filtered by dept
                                                        </span>
                                                    )}
                                                </div>
                                                <Select
                                                    value={filterPosition}
                                                    onValueChange={(val) => {
                                                        setFilterPosition(val)
                                                        setPage(1)
                                                    }}
                                                    disabled={isLoadingPositions}
                                                >
                                                    <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-800 text-xs">
                                                        <SelectValue placeholder="Position" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[9999]">
                                                        <SelectItem value="0">All Positions</SelectItem>
                                                        {positions.map((position) => (
                                                            <SelectItem key={position.id} value={position.id.toString()}>
                                                                {position.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Status */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Status</label>
                                                <Select
                                                    value={filterStatus}
                                                    onValueChange={(val) => {
                                                        setFilterStatus(val)
                                                        setPage(1)
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-800 text-xs">
                                                        <SelectValue placeholder="Status" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[9999]">
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Refresh Button */}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery('')
                                    setDebouncedSearch('')
                                    setFilterStaffType('0')
                                    setFilterPosition('0')
                                    setFilterDepartment('0')
                                    setFilterStatus('all')
                                    setSortDirection('asc')
                                    setPage(1)
                                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                                    setTimeout(() => refetch(), 0)
                                }}
                                disabled={isFetching}
                                className="h-9 px-3 text-xs bg-white shrink-0"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Active filter chips (shown when any filter is active) */}
                    {hasAnyActiveFilter && (
                        <div className="px-5 py-2 bg-slate-50/80 dark:bg-slate-900/40 border-b flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground mr-1 flex items-center gap-1 font-medium">
                                <Filter className="h-3 w-3 text-muted-foreground" />
                                Active filters:
                            </span>

                            {debouncedSearch && (
                                <span className="inline-flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 gap-1.5 font-normal py-0.5 pl-2 pr-1 text-xs text-slate-700 dark:text-slate-200">
                                    <span>Search: <strong className="font-semibold">{debouncedSearch}</strong></span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('')
                                            setDebouncedSearch('')
                                            setPage(1)
                                        }}
                                        className="hover:bg-muted rounded p-0.5 text-muted-foreground hover:text-foreground"
                                        title="Remove search"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}

                            {filterStaffType !== '0' && (
                                <span className="inline-flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 gap-1.5 font-normal py-0.5 pl-2 pr-1 text-xs text-slate-700 dark:text-slate-200">
                                    <span>Type: <strong className="font-semibold">{staffTypesList.find(s => s.id.toString() === filterStaffType)?.code || filterStaffType}</strong></span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterStaffType('0')
                                            setPage(1)
                                        }}
                                        className="hover:bg-muted rounded p-0.5 text-muted-foreground hover:text-foreground"
                                        title="Remove type filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}

                            {filterDepartment !== '0' && (
                                <span className="inline-flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 gap-1.5 font-normal py-0.5 pl-2 pr-1 text-xs text-slate-700 dark:text-slate-200">
                                    <span>Dept: <strong className="font-semibold">{departments.find(d => d.id.toString() === filterDepartment)?.name || filterDepartment}</strong></span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterDepartment('0')
                                            setFilterPosition('0')
                                            setPage(1)
                                        }}
                                        className="hover:bg-muted rounded p-0.5 text-muted-foreground hover:text-foreground"
                                        title="Remove department filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}

                            {filterPosition !== '0' && (
                                <span className="inline-flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 gap-1.5 font-normal py-0.5 pl-2 pr-1 text-xs text-slate-700 dark:text-slate-200">
                                    <span>Position: <strong className="font-semibold">{positions.find(p => p.id.toString() === filterPosition)?.name || filterPosition}</strong></span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterPosition('0')
                                            setPage(1)
                                        }}
                                        className="hover:bg-muted rounded p-0.5 text-muted-foreground hover:text-foreground"
                                        title="Remove position filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}

                            {filterStatus !== 'all' && (
                                <span className="inline-flex items-center rounded-md border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 gap-1.5 font-normal py-0.5 pl-2 pr-1 text-xs text-slate-700 dark:text-slate-200">
                                    <span>Status: <strong className="font-semibold">{filterStatus === 'active' ? 'Active' : 'Inactive'}</strong></span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterStatus('all')
                                            setPage(1)
                                        }}
                                        className="hover:bg-muted rounded p-0.5 text-muted-foreground hover:text-foreground"
                                        title="Remove status filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('')
                                    setDebouncedSearch('')
                                    setFilterStaffType('0')
                                    setFilterDepartment('0')
                                    setFilterPosition('0')
                                    setFilterStatus('all')
                                    setSortDirection('asc')
                                    setPage(1)
                                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                                    setTimeout(() => refetch(), 0)
                                }}
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto"
                            >
                                Clear all
                            </Button>
                        </div>
                    )}


                    {/* Error state */}
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                            <p className="text-sm font-medium text-destructive">Failed to load staff data</p>
                            <p className="text-xs mt-1">{error.message}</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                                <RefreshCw className="h-4 w-4 mr-1.5" />
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <TooltipProvider delayDuration={150}>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="whitespace-nowrap min-w-[220px]">
                                                <button
                                                    className="flex items-center gap-1.5 hover:text-primary transition-colors font-semibold"
                                                    onClick={() => {
                                                        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                                                        setPage(1)
                                                    }}
                                                >
                                                    Employee Name
                                                    {sortDirection === 'asc' ? (
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead className="w-[120px]">Type</TableHead>
                                            <TableHead className="w-[160px]">Department</TableHead>
                                            <TableHead className="w-[200px]">Position</TableHead>
                                            <TableHead className="w-[100px]">Status</TableHead>
                                            <TableHead className="w-[60px] text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            // ── Skeleton loading state ──
                                            Array.from({ length: perPage > 10 ? 10 : perPage }).map((_, index) => (
                                                <TableRow key={`skeleton-${index}`}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Skeleton className="h-10 w-10 rounded-[10px]" />
                                                            <div>
                                                                <Skeleton className="h-4 w-32 mb-1" />
                                                                <Skeleton className="h-3 w-16" />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                                                    <TableCell><Skeleton className="h-8 w-8 rounded mx-auto" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : staffList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                    {debouncedSearch ? 'No staff matching your search' : 'No staff found'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            staffList.map((staff: QAStaffItem) => (
                                                <TableRow
                                                    key={staff.id}
                                                    className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                                                    onClick={() => router.push(`/en/hr/staff/${staff.id}`)}
                                                >
                                                    {/* Employee Name + Code */}
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-[10px] bg-muted flex items-center justify-center shrink-0">
                                                                <User className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-sm">
                                                                    {staff.fullNameEn || (`${staff.title ? `${staff.title} ` : ''}${staff.name}`)}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">{staff.code}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Type */}
                                                    <TableCell>
                                                        {staff.staffstypeObj?.code ? (
                                                            <span
                                                                className="hr-position-tag"
                                                                style={{
                                                                    color: staffTypeColors[staff.staffstypeObj.code] || '#475569',
                                                                    borderColor: `${staffTypeColors[staff.staffstypeObj.code] || '#475569'}40`,
                                                                    backgroundColor: `${staffTypeColors[staff.staffstypeObj.code] || '#475569'}08`,
                                                                }}
                                                            >
                                                                {staff.staffstypeObj.code}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Department */}
                                                    <TableCell className="text-sm max-w-[160px]">
                                                        {staff.departmentObj?.name ? (
                                                            <span className="truncate block" title={staff.departmentObj.name}>
                                                                {staff.departmentObj.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Position */}
                                                    <TableCell className="text-sm max-w-[200px]">
                                                        {staff.jobTitle || staff.positionObj?.name ? (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="block truncate cursor-default">
                                                                        {staff.jobTitle || staff.positionObj?.name}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent
                                                                    side="top"
                                                                    className="z-[9999] max-w-sm text-xs font-normal bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 shadow-md px-2.5 py-1.5 rounded"
                                                                >
                                                                    {staff.jobTitle || staff.positionObj?.name}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell>
                                                        <Badge color={staff.isActive ? 'success' : 'default'} className="text-xs">
                                                            {staff.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>

                                                    {/* Action */}
                                                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => router.push(`/en/hr/staff/${staff.id}`)}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View Profile
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TooltipProvider>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-5 py-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    {isLoading ? (
                                        <Skeleton className="h-4 w-40" />
                                    ) : (
                                        <>
                                            Showing {staffList.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
                                            {Math.min(page * perPage, totalAll)} of {totalAll} entries
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {/* Previous arrow */}
                                    <button
                                        className="hr-page-btn hr-page-arrow"
                                        onClick={handlePrevPage}
                                        disabled={page <= 1 || isFetching}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    {/* Page numbers */}
                                    {(() => {
                                        const pages: (number | string)[] = []
                                        if (totalPages <= 3) {
                                            for (let i = 1; i <= totalPages; i++) pages.push(i)
                                        } else {
                                            let start = page - 1
                                            let end = page + 1
                                            if (start < 1) { start = 1; end = 3 }
                                            if (end > totalPages) { end = totalPages; start = totalPages - 2 }
                                            if (start > 1) pages.push('start...')
                                            for (let i = start; i <= end; i++) pages.push(i)
                                            if (end < totalPages) pages.push('end...')
                                        }
                                        return pages.map((p, idx) =>
                                            typeof p === 'string' ? (
                                                <span key={`ellipsis-${idx}`} className="hr-page-ellipsis">…</span>
                                            ) : (
                                                <button
                                                    key={p}
                                                    className={`hr-page-btn ${page === p ? 'hr-page-active' : 'hr-page-num'}`}
                                                    onClick={() => setPage(p as number)}
                                                    disabled={isFetching}
                                                >
                                                    {p}
                                                </button>
                                            )
                                        )
                                    })()}

                                    {/* Next arrow */}
                                    <button
                                        className="hr-page-btn hr-page-arrow"
                                        onClick={handleNextPage}
                                        disabled={page >= totalPages || isFetching}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Staff Excel Import Modal */}
            <StaffExcelImportModal
                isOpen={showImportModal}
                initialFile={selectedImportFile}
                onClose={() => {
                    setShowImportModal(false)
                    setSelectedImportFile(null)
                }}
                onImportSuccess={() => refetch()}
            />
        </div>
    )
}
