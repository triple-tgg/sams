'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, MoreHorizontal, FileText, FileBadge, RotateCw, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQAStaffList } from '@/lib/api/hooks/useQAStaffManagement'
import { useStaffDepartments, useStaffDepartmentPositions } from '@/lib/api/master/organization.hooks'
import { QAStaffItem } from '@/lib/api/qa/staff-management'
import { CertifyingStaffPreview } from './components/CertifyingStaffPreview'
import { WorkExperiencePreview } from './components/WorkExperiencePreview'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'
import { Pagination } from '../employee-history-training/components/Pagination'

export default function WorkExperienceRecordsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [departmentId, setDepartmentId] = useState('all')
  const [positionId, setPositionId] = useState('all')
  const [previewStaffId, setPreviewStaffId] = useState<number | null>(null)
  const [previewType, setPreviewType] = useState<'Certifying Staff' | 'Work Experience' | null>(null)

  const [page, setPage] = useState(1)
  const perPage = 10

  // Fetch dropdown options
  const { data: deptRes, isLoading: deptLoading } = useStaffDepartments()
  const { data: posRes, isLoading: posLoading } = useStaffDepartmentPositions()

  const departments = deptRes?.responseData || []
  const positions = posRes?.responseData || []

  // Filter positions by selected department if needed, or show all
  const filteredPositions = useMemo(() => {
    if (departmentId === 'all') return positions
    return positions.filter(p => p.staffDepartmentId === Number(departmentId))
  }, [positions, departmentId])

  // Fetch data
  const { data: listRes, isLoading, isFetching } = useQAStaffList({
    name: debouncedSearchTerm,
    employeeId: '',
    positionId: positionId === 'all' ? 0 : Number(positionId),
    departmentId: departmentId === 'all' ? 0 : Number(departmentId),
    staffstypeId: 0,
    page,
    perPage
  })

  const staffList = listRes?.responseData || []
  const totalItems = listRes?.total || 0
  const totalPages = Math.ceil(totalItems / perPage)

  const handleDocumentAction = (staff: QAStaffItem, docType: string) => {
    if (docType === 'Certifying Staff' || docType === 'Work Experience') {
      setPreviewStaffId(staff.id)
      setPreviewType(docType as 'Certifying Staff' | 'Work Experience')
    } else {
      toast.info(`Viewing ${docType} for ${staff.name}`)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FileText className="h-4 w-4" />
              </span>
              Staff Records
            </CardTitle>
            <CardDescription>
              QA Document — View and manage work experience and certifying staff records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by Employee Name..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              <div className="flex flex-wrap flex-1 gap-4 items-center">
                <Select value={departmentId} onValueChange={(val) => {
                  setDepartmentId(val)
                  setPositionId('all')
                  setPage(1)
                }}>
                  <SelectTrigger className="w-[200px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Filter className="h-3.5 w-3.5" />
                      <SelectValue placeholder={deptLoading ? "Loading..." : "All Departments"} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={positionId} onValueChange={(val) => { setPositionId(val); setPage(1) }}>
                  <SelectTrigger className="w-[200px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Filter className="h-3.5 w-3.5" />
                      <SelectValue placeholder={posLoading ? "Loading..." : "All Positions"} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {filteredPositions.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(searchTerm !== '' || departmentId !== 'all' || positionId !== 'all') && (
                  <Button
                    color="secondary"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setDepartmentId('all')
                      setPositionId('all')
                      setPage(1)
                    }}
                  >
                    <RotateCw className="h-3.5 w-3.5 mr-2" />
                    Reset Filter
                  </Button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-full">Employee Name</th>
                      <th className="px-6 py-4 whitespace-nowrap">Department</th>
                      <th className="px-6 py-4 whitespace-nowrap">Position</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex justify-center mb-2">
                            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          </div>
                          Loading records...
                        </td>
                      </tr>
                    ) : staffList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                          No staff records found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      staffList.map((staff) => (
                        <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {staff.profileImagePath ? (
                                <img src={staff.profileImagePath} alt={staff.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-slate-100" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                                  {staff.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-800">{staff.title} {staff.name}</div>
                                <div className="text-xs text-slate-500">{staff.employeeId || 'No ID'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                              {staff.departmentObj?.name || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                            {staff.positionObj?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" color="secondary">
                                  <span className="sr-only">Open menu</span>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleDocumentAction(staff, 'Work Experience')}>
                                  <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                  Work Experience
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDocumentAction(staff, 'Certifying Staff')}>
                                  <FileBadge className="mr-2 h-4 w-4 text-amber-500" />
                                  Certifying Staff
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!isLoading && (
                <Pagination
                  pageIndex={page - 1}
                  pageCount={totalPages}
                  totalItems={totalItems}
                  pageSize={perPage}
                  onPageChange={(pageIndex) => setPage(pageIndex + 1)}
                  onNextPage={() => setPage(p => Math.min(totalPages, p + 1))}
                  onPrevPage={() => setPage(p => Math.max(1, p - 1))}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {previewType === 'Certifying Staff' && (
        <CertifyingStaffPreview 
          isOpen={previewStaffId !== null} 
          onClose={() => {
            setPreviewStaffId(null)
            setPreviewType(null)
          }} 
          staffId={previewStaffId!} 
        />
      )}

      {previewType === 'Work Experience' && (
        <WorkExperiencePreview 
          isOpen={previewStaffId !== null} 
          onClose={() => {
            setPreviewStaffId(null)
            setPreviewType(null)
          }} 
          staffId={previewStaffId!} 
        />
      )}
    </>
  )
}
