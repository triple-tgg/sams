'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    ChevronLeft, ChevronRight, Plus, MoreHorizontal, Eye, Search, Users, Upload,
} from 'lucide-react'
import './hr-staff.css'

// ── Mock Staff Data ──
const mockStaff = [
    { id: 1, empId: 'EMP-0412', name: 'นายสมชาย ชาญชัย', nameEn: 'Somchai Chanchai', position: 'B1 Engineer', department: 'Line Maintenance', status: 'active', startDate: '2021-04-15', initials: 'SC', avatarBg: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
    { id: 2, empId: 'EMP-0287', name: 'นายวิชัย ทองดี', nameEn: 'Wichai Thongdee', position: 'Technician', department: 'Base Maintenance', status: 'active', startDate: '2019-08-01', initials: 'VT', avatarBg: 'linear-gradient(135deg,#dc2626,#ef4444)' },
    { id: 3, empId: 'EMP-0521', name: 'Ms. Sarah Weston', nameEn: 'Sarah Weston', position: 'Avionics', department: 'Line Maintenance', status: 'active', startDate: '2024-01-10', initials: 'SW', avatarBg: 'linear-gradient(135deg,#0369a1,#3b82f6)' },
    { id: 4, empId: 'EMP-0198', name: 'นายกมล มีชัย', nameEn: 'Kamol Meechai', position: 'B2 Engineer', department: 'Workshop', status: 'active', startDate: '2018-06-20', initials: 'KM', avatarBg: 'linear-gradient(135deg,#b45309,#f59e0b)' },
    { id: 5, empId: 'EMP-0367', name: 'นางสาวพิมพ์ อร่ามศรี', nameEn: 'Pim Aramsri', position: 'Structures', department: 'Base Maintenance', status: 'active', startDate: '2022-03-05', initials: 'PA', avatarBg: 'linear-gradient(135deg,#065f46,#22c55e)' },
    { id: 6, empId: 'EMP-0523', name: 'นายธนกฤต สุขสวัสดิ์', nameEn: 'Thanakrit Suksawat', position: 'B1 Engineer', department: 'Line Maintenance', status: 'active', startDate: '2020-11-12', initials: 'TS', avatarBg: 'linear-gradient(135deg,#1e40af,#60a5fa)' },
    { id: 7, empId: 'EMP-0189', name: 'นางสาวนภา แสงทอง', nameEn: 'Napa Saengthong', position: 'Quality Inspector', department: 'Quality Assurance', status: 'active', startDate: '2017-09-25', initials: 'NS', avatarBg: 'linear-gradient(135deg,#9333ea,#c084fc)' },
    { id: 8, empId: 'EMP-0645', name: 'Mr. James Miller', nameEn: 'James Miller', position: 'Avionics', department: 'Workshop', status: 'inactive', startDate: '2023-07-01', initials: 'JM', avatarBg: 'linear-gradient(135deg,#475569,#94a3b8)' },
    { id: 9, empId: 'EMP-0334', name: 'นายประสิทธิ์ เจริญพร', nameEn: 'Prasit Chareonporn', position: 'Technician', department: 'Line Maintenance', status: 'active', startDate: '2019-02-14', initials: 'PC', avatarBg: 'linear-gradient(135deg,#0f766e,#2dd4bf)' },
    { id: 10, empId: 'EMP-0478', name: 'นางสาวรัชนี ศรีสุข', nameEn: 'Ratchanee Srisuk', position: 'Planner', department: 'Planning', status: 'active', startDate: '2021-12-01', initials: 'RS', avatarBg: 'linear-gradient(135deg,#be185d,#f472b6)' },
    { id: 11, empId: 'EMP-0556', name: 'นายอนุชา วิเศษ', nameEn: 'Anucha Wiset', position: 'B2 Engineer', department: 'Base Maintenance', status: 'active', startDate: '2022-05-18', initials: 'AW', avatarBg: 'linear-gradient(135deg,#ea580c,#fb923c)' },
    { id: 12, empId: 'EMP-0601', name: 'Ms. Linda Chen', nameEn: 'Linda Chen', position: 'Structures', department: 'Workshop', status: 'active', startDate: '2023-09-15', initials: 'LC', avatarBg: 'linear-gradient(135deg,#4338ca,#818cf8)' },
]

const positionColors: Record<string, string> = {
    'B1 Engineer': '#2563eb',
    'B2 Engineer': '#7c3aed',
    'Technician': '#0891b2',
    'Avionics': '#059669',
    'Structures': '#d97706',
    'Quality Inspector': '#dc2626',
    'Planner': '#6366f1',
}

export default function HRStaffListPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const perPage = 10

    const filteredStaff = mockStaff.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.position.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalPages = Math.ceil(filteredStaff.length / perPage)
    const paginatedStaff = filteredStaff.slice((page - 1) * perPage, page * perPage)

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
                            <p className="text-sm text-muted-foreground mt-0.5">{filteredStaff.length} staff members</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                                placeholder="Search by name, ID, or position..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="pl-9 h-9"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead className="w-[100px]">Emp. ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead className="w-[80px]">Status</TableHead>
                                <TableHead className="w-[120px]">Start Date</TableHead>
                                <TableHead className="w-[60px] text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedStaff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                        No staff found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedStaff.map((staff, index) => (
                                    <TableRow
                                        key={staff.id}
                                        className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                                        onClick={() => router.push(`/en/qa/staff/${staff.id}`)}
                                    >
                                        <TableCell className="text-muted-foreground">{(page - 1) * perPage + index + 1}</TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs text-muted-foreground">{staff.empId}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="hr-staff-avatar"
                                                    style={{ background: staff.avatarBg }}
                                                >
                                                    {staff.initials}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{staff.name}</div>
                                                    <div className="text-xs text-muted-foreground">{staff.nameEn}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className="hr-position-tag"
                                                style={{
                                                    color: positionColors[staff.position] || '#475569',
                                                    borderColor: `${positionColors[staff.position] || '#475569'}40`,
                                                    backgroundColor: `${positionColors[staff.position] || '#475569'}08`,
                                                }}
                                            >
                                                {staff.position}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">{staff.department}</TableCell>
                                        <TableCell>
                                            <Badge color={staff.status === 'active' ? 'success' : 'default'} className="text-xs">
                                                {staff.status === 'active' ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(staff.startDate).toLocaleDateString('en-GB', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </TableCell>
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
                    <div className="flex items-center justify-between px-5 py-3 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {paginatedStaff.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
                            {Math.min(page * perPage, filteredStaff.length)} of {filteredStaff.length} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <span className="text-sm px-2">Page {page} of {totalPages || 1}</span>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
