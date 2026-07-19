'use client'
import React, { useState, useMemo } from 'react'
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
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    ChevronLeft, ChevronRight, Plus, MoreHorizontal, Eye, Search, Users, RefreshCw, AlertCircle, User,
} from 'lucide-react'
import { useQAStaffList } from '@/lib/api/hooks/useQAStaffManagement'
import type { QAStaffItem } from '@/lib/api/qa/staff-management'
import { useStaffDepartments, useStaffDepartmentPositions } from '@/lib/api/master/organization.hooks'
import { PermissionActionGuard } from '@/components/partials/auth/PermissionActionGuard'
import './hr-staff.css'

const staffTypeColors: Record<string, string> = {
    'CS': '#2563eb',
    'MECH': '#7c3aed',
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

    const [filterPosition, setFilterPosition] = useState<string>("0")
    const [filterDepartment, setFilterDepartment] = useState<string>("0")
    const [filterStatus, setFilterStatus] = useState<string>("all")

    const { data: departmentData, isLoading: isLoadingDepartments } = useStaffDepartments()
    const { data: positionData, isLoading: isLoadingPositions } = useStaffDepartmentPositions()

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

    // ── Debounced search – send name filter to API for server-side search ──
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

    // ── API Hook — uses the correct endpoint ──
    const { data, isLoading, error, refetch, isFetching } = useQAStaffList(
        {
            name: debouncedSearch,
            employeeId: '',
            positionId: Number(filterPosition),
            departmentId: Number(filterDepartment),
            staffstypeId: 0,
            page,
            perPage,
        },
        true
    )

    const rawStaffList = data?.responseData ?? []
    const staffList = filterStatus === 'all'
        ? rawStaffList
        : rawStaffList.filter((s) => filterStatus === 'active' ? s.isActive : !s.isActive)
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
                    <div className="px-5 py-3 border-b bg-muted/30 flex flex-col lg:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full lg:max-w-sm shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                            <Select
                                value={filterDepartment}
                                onValueChange={(val) => {
                                    setFilterDepartment(val)
                                    setFilterPosition('0')
                                    setPage(1)
                                }}
                                disabled={isLoadingDepartments}
                            >
                                <SelectTrigger className="h-9 min-w-[150px] bg-white text-xs">
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

                            <Select
                                value={filterPosition}
                                onValueChange={(val) => { setFilterPosition(val); setPage(1); }}
                                disabled={isLoadingPositions}
                            >
                                <SelectTrigger className="h-9 min-w-[150px] bg-white text-xs">
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

                            <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setPage(1); }}>
                                <SelectTrigger className="h-9 min-w-[120px] bg-white text-xs">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery('')
                                    setDebouncedSearch('')
                                    setFilterPosition('0')
                                    setFilterDepartment('0')
                                    setFilterStatus('all')
                                    setPage(1)
                                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                                    setTimeout(() => refetch(), 0)
                                }}
                                disabled={isFetching}
                                className="h-9"
                            >
                                <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>

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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap min-w-[220px]">Employee Name</TableHead>
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
                                                <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-8 rounded mx-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : staffList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
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
                                                                {staff.title ? `${staff.title} ` : ''}{staff.name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">{staff.code}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Department */}
                                                <TableCell>
                                                    {staff.departmentObj?.name || staff.staffstypeObj?.code ? (
                                                        <span
                                                            className="hr-position-tag"
                                                            style={{
                                                                color: staffTypeColors[staff.departmentObj?.name || staff.staffstypeObj?.code || ''] || '#475569',
                                                                borderColor: `${staffTypeColors[staff.departmentObj?.name || staff.staffstypeObj?.code || ''] || '#475569'}40`,
                                                                backgroundColor: `${staffTypeColors[staff.departmentObj?.name || staff.staffstypeObj?.code || ''] || '#475569'}08`,
                                                            }}
                                                        >
                                                            {staff.departmentObj?.name || staff.staffstypeObj?.code}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Position */}
                                                <TableCell className="text-sm">
                                                    {staff.jobTitle || staff.positionObj?.name || '—'}
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
        </div>
    )
}
