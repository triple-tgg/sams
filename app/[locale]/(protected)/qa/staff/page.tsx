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
    ChevronLeft, ChevronRight, Plus, MoreHorizontal, Eye, Search, Users, Upload, RefreshCw, AlertCircle,
} from 'lucide-react'
import { useQAStaffList } from '@/lib/api/hooks/useQAStaffManagement'
import type { QAStaffItem } from '@/lib/api/qa/staff-management'
import './hr-staff.css'

// ── Avatar gradient palette (deterministic by staff id) ──
const avatarGradients = [
    'linear-gradient(135deg,#7c3aed,#a855f7)',
    'linear-gradient(135deg,#dc2626,#ef4444)',
    'linear-gradient(135deg,#0369a1,#3b82f6)',
    'linear-gradient(135deg,#b45309,#f59e0b)',
    'linear-gradient(135deg,#065f46,#22c55e)',
    'linear-gradient(135deg,#1e40af,#60a5fa)',
    'linear-gradient(135deg,#9333ea,#c084fc)',
    'linear-gradient(135deg,#475569,#94a3b8)',
    'linear-gradient(135deg,#0f766e,#2dd4bf)',
    'linear-gradient(135deg,#be185d,#f472b6)',
    'linear-gradient(135deg,#ea580c,#fb923c)',
    'linear-gradient(135deg,#4338ca,#818cf8)',
]

const staffTypeColors: Record<string, string> = {
    'CS': '#2563eb',
    'MECH': '#7c3aed',
    'Back Office': '#0891b2',
    'INSP': '#059669',
    'Trainee': '#d97706',
    'Operational Staff': '#dc2626',
}

/** Get initials from a name string */
function getInitials(name: string): string {
    if (!name) return '?'
    const words = name.trim().split(/\s+/)
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** Get deterministic avatar gradient based on staff id */
function getAvatarBg(id: number): string {
    return avatarGradients[id % avatarGradients.length]
}

export default function HRStaffListPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const perPage = 20

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
            positionId: 0,
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
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="hr-btn-import"
                        >
                            <Upload className="h-4 w-4 mr-1.5" />
                            Import
                        </Button>
                        <Button
                            size="sm"
                            className="hr-btn-add"
                            onClick={() => router.push('/en/qa/staff/new')}
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            New Staff
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Search bar */}
                    <div className="px-5 py-3 border-b bg-muted/30">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9 h-9"
                            />
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
                                        <TableHead className="w-[50px]">No.</TableHead>
                                        <TableHead className="whitespace-nowrap min-w-[220px]">Employee Name</TableHead>
                                        <TableHead className="w-[200px]">Position</TableHead>
                                        <TableHead className="w-[160px]">Department</TableHead>
                                        <TableHead className="w-[220px]">Email</TableHead>
                                        <TableHead className="w-[100px]">Status</TableHead>
                                        <TableHead className="w-[60px] text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        // ── Skeleton loading state ──
                                        Array.from({ length: perPage > 10 ? 10 : perPage }).map((_, index) => (
                                            <TableRow key={`skeleton-${index}`}>
                                                <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Skeleton className="h-[34px] w-[34px] rounded-[10px]" />
                                                        <div>
                                                            <Skeleton className="h-4 w-32 mb-1" />
                                                            <Skeleton className="h-3 w-16" />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-8 rounded mx-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : staffList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                {debouncedSearch ? 'No staff matching your search' : 'No staff found'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        staffList.map((staff: QAStaffItem, index: number) => (
                                            <TableRow
                                                key={staff.id}
                                                className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                                                onClick={() => router.push(`/en/qa/staff/${staff.id}`)}
                                            >
                                                <TableCell className="text-muted-foreground">
                                                    {(page - 1) * perPage + index + 1}
                                                </TableCell>

                                                {/* Employee Name + Code */}
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="hr-staff-avatar"
                                                            style={{ background: getAvatarBg(staff.id) }}
                                                        >
                                                            {getInitials(staff.name)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">
                                                                {staff.title ? `${staff.title} ` : ''}{staff.name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">{staff.code}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Position */}
                                                <TableCell className="text-sm">
                                                    {staff.jobTitle || staff.positionObj?.name || '—'}
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

                                                {/* Email */}
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {staff.email || '—'}
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
                                                            <DropdownMenuItem onClick={() => router.push(`/en/qa/staff/${staff.id}`)}>
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
