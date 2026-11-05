'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, FileText, FileBadge, RotateCw, MoreVertical, User, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQAStaffList } from '@/lib/api/hooks/useQAStaffManagement'
import { useStaffDepartments, useStaffDepartmentPositions } from '@/lib/api/master/organization.hooks'
import { useStaffsTypesAll } from '@/lib/api/hooks/useStaffsTypes'
import { QAStaffItem } from '@/lib/api/qa/staff-management'
import { CertifyingStaffPreview } from './components/CertifyingStaffPreview'
import { WorkExperiencePreview } from './components/WorkExperiencePreview'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'
import { Pagination } from '../employee-history-training/components/Pagination'

/** Staff types available in this filter, in display order. "All" = every one of these. */
const ALLOWED_STAFF_TYPE_CODES = ['CS', 'MECH', 'CS&MECH']
const normalizeTypeCode = (code?: string | null) => (code || '').replace(/\s+/g, '').toUpperCase()
/** Same colours as the HR staff list. */
const STAFF_TYPE_COLORS: Record<string, string> = { 'CS': '#2563eb', 'MECH': '#7c3aed', 'CS&MECH': '#0284c7' }

export default function WorkExperienceRecordsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [departmentId, setDepartmentId] = useState('all')
  const [positionId, setPositionId] = useState('all')
  /** null = All (every allowed staff type). */
  const [selectedStaffTypeIds, setSelectedStaffTypeIds] = useState<number[] | null>(null)
  const [previewStaffId, setPreviewStaffId] = useState<number | null>(null)
  const [previewType, setPreviewType] = useState<'Certifying Staff' | 'Work Experience' | null>(null)

  const [page, setPage] = useState(1)
  const perPage = 10

  // Fetch dropdown options
  const { data: deptRes, isLoading: deptLoading } = useStaffDepartments()
  const { data: posRes, isLoading: posLoading } = useStaffDepartmentPositions()
  const { staffTypes, isLoading: staffTypesLoading } = useStaffsTypesAll()

  // Only CS, MECH and CS&MECH are offered
  const staffTypeOptions = useMemo(() => {
    return ALLOWED_STAFF_TYPE_CODES
      .map(code => staffTypes.find(t => normalizeTypeCode(t.code) === normalizeTypeCode(code)))
      .filter((t): t is NonNullable<typeof t> => !!t)
  }, [staffTypes])
  const allStaffTypeIds = useMemo(() => staffTypeOptions.map(t => t.id), [staffTypeOptions])

  const isAllStaffTypes = selectedStaffTypeIds === null || selectedStaffTypeIds.length === allStaffTypeIds.length
  const effectiveStaffTypeIds = isAllStaffTypes ? allStaffTypeIds : selectedStaffTypeIds!

  const toggleAllStaffTypes = () => {
    setSelectedStaffTypeIds(null)
    setPage(1)
  }

  const toggleStaffType = (id: number) => {
    const current = selectedStaffTypeIds ?? allStaffTypeIds
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    // Unchecking the last one (or checking every one) falls back to All
    setSelectedStaffTypeIds(next.length === 0 || next.length === allStaffTypeIds.length ? null : next)
    setPage(1)
  }

  const staffTypeLabel = isAllStaffTypes
    ? 'All Staff Types'
    : staffTypeOptions.filter(t => effectiveStaffTypeIds.includes(t.id)).map(t => t.code).join(', ')

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
    staffstypeId: effectiveStaffTypeIds,
    sortBy: '',
    sortDirection: '',
    isActive: true,
    page,
    perPage
  }, allStaffTypeIds.length > 0)

  const staffList = listRes?.responseData || []
  const totalItems = listRes?.total || 0
  const totalPages = Math.ceil(totalItems / perPage)

  // ── Filter helpers ──
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount =
    (departmentId !== 'all' ? 1 : 0) + (positionId !== 'all' ? 1 : 0) + (isAllStaffTypes ? 0 : 1)
  const hasAnyFilter = searchTerm !== '' || activeFilterCount > 0

  const resetDropdownFilters = () => {
    setDepartmentId('all')
    setPositionId('all')
    setSelectedStaffTypeIds(null)
    setPage(1)
  }

  const filterTriggerCls =
    'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-xs text-slate-600'

  const renderDepartmentSelect = () => (
    <Select value={departmentId} onValueChange={(val) => {
      setDepartmentId(val)
      setPositionId('all')
      setPage(1)
    }}>
      <SelectTrigger className="h-10 w-full">
        <div className="flex items-center gap-2 text-slate-600 min-w-0">
          <Filter className="h-3.5 w-3.5 shrink-0" />
          <SelectValue placeholder={deptLoading ? "Loading..." : "All Departments"} />
        </div>
      </SelectTrigger>
      <SelectContent className="z-[1000]">
        <SelectItem value="all">All Departments</SelectItem>
        {departments.map(d => (
          <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const renderPositionSelect = () => (
    <Select value={positionId} onValueChange={(val) => { setPositionId(val); setPage(1) }}>
      <SelectTrigger className="h-10 w-full">
        <div className="flex items-center gap-2 text-slate-600 min-w-0">
          <Filter className="h-3.5 w-3.5 shrink-0" />
          <SelectValue placeholder={posLoading ? "Loading..." : "All Positions"} />
        </div>
      </SelectTrigger>
      <SelectContent className="z-[1000]">
        <SelectItem value="all">All Positions</SelectItem>
        {filteredPositions.map(p => (
          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const renderStaffTypeOptions = () => (
    <>
      <label className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-100">
        <Checkbox checked={isAllStaffTypes} onCheckedChange={toggleAllStaffTypes} />
        <span>All Staff Types</span>
      </label>
      <div className="my-1 h-px bg-slate-100" />
      {staffTypeOptions.map(t => (
        <label key={t.id} className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-100">
          <Checkbox
            checked={effectiveStaffTypeIds.includes(t.id)}
            onCheckedChange={() => toggleStaffType(t.id)}
          />
          <span>{t.code}</span>
        </label>
      ))}
    </>
  )

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
            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1 min-w-0 xl:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                <Input
                  placeholder="Search by Employee Name..."
                  className="pl-9 h-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              {/* Desktop (xl+): filters inline */}
              <div className="hidden xl:flex items-center gap-2">
                <div className="w-[200px]">{renderDepartmentSelect()}</div>
                <div className="w-[200px]">{renderPositionSelect()}</div>
                <div className="w-[200px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className={filterTriggerCls}>
                        <span className="flex items-center gap-2 min-w-0">
                          <Filter className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{staffTypesLoading ? 'Loading...' : staffTypeLabel}</span>
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-600" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-1">
                      {renderStaffTypeOptions()}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Compact (< xl): Filters button opens a dropdown panel */}
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`xl:hidden inline-flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${activeFilterCount > 0
                      ? 'border-blue-500 bg-blue-50/60 text-blue-600'
                      : 'border-input bg-background text-slate-600 hover:bg-slate-50'
                      }`}
                    aria-label="Filters"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[min(340px,calc(100vw-2rem))] p-0 shadow-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-800">Filters</span>
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={resetDropdownFilters}
                        className="text-xs font-medium text-slate-500 hover:text-red-600"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Department</label>
                      {renderDepartmentSelect()}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Position</label>
                      {renderPositionSelect()}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Staff Type</label>
                      <div className="rounded-md border border-input p-1">
                        {renderStaffTypeOptions()}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end px-4 py-3 border-t border-slate-100 bg-slate-50/60">
                    <Button size="sm" className="h-8" onClick={() => setFiltersOpen(false)}>
                      Done
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {hasAnyFilter && (
                <Button
                  color="secondary"
                  size="sm"
                  className="h-10 shrink-0"
                  onClick={() => {
                    setSearchTerm('')
                    resetDropdownFilters()
                  }}
                  aria-label="Reset Filter"
                >
                  <RotateCw className="h-3.5 w-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">Reset Filter</span>
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-2 w-full">Employee Name</th>
                      <th className="px-6 py-2 whitespace-nowrap">Staff Type</th>
                      <th className="px-6 py-2 whitespace-nowrap">Department</th>
                      <th className="px-6 py-2 whitespace-nowrap">Position</th>
                      <th className="px-6 py-2 text-right whitespace-nowrap">Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex justify-center mb-2">
                            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          </div>
                          Loading records...
                        </td>
                      </tr>
                    ) : staffList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          No staff records found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      staffList.map((staff) => (
                        <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{staff.title} {staff.name}</div>
                                <div className="text-xs text-slate-500">{staff.employeeId || 'No ID'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            {staff.staffstypeObj?.code ? (() => {
                              const color = STAFF_TYPE_COLORS[normalizeTypeCode(staff.staffstypeObj.code)] || '#475569'
                              return (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold"
                                  style={{ color, borderColor: `${color}40`, backgroundColor: `${color}0d` }}
                                >
                                  {staff.staffstypeObj.code}
                                </span>
                              )
                            })() : <span className="text-slate-400">-</span>}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                              {staff.departmentObj?.name || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-slate-600">
                            {staff.positionObj?.name || '-'}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4 text-slate-500" />
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
