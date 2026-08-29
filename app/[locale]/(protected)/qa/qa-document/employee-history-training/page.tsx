'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { RotateCw, FileText, Paperclip, ChevronsUpDown, Check } from 'lucide-react'
import { useLogbookRecordsList } from '@/lib/api/qa/logbook-records.hooks'
import { useQAStaffList } from '@/lib/api/hooks/useQAStaffManagement'
import { useDebounce } from '@/hooks/useDebounce'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "./components/Pagination"
import DateRangeFilter from "./components/DateRange"
import { DateRange } from "react-day-picker"
import dayjs from "dayjs"
import { cn } from '@/lib/utils'

export default function EmployeeHistoryTrainingPage() {
  const [selectedStaffId, setSelectedStaffId] = useState<number>(0)
  const [staffOpen, setStaffOpen] = useState(false)
  const [staffSearch, setStaffSearch] = useState('')
  const debouncedStaffSearch = useDebounce(staffSearch, 300)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [similarTechnology, setSimilarTechnology] = useState('all')
  const [page, setPage] = useState(1)
  const perPage = 10

  // Fetch staff list for dropdown
  const { data: staffRes, isLoading: staffLoading } = useQAStaffList({
    name: debouncedStaffSearch,
    employeeId: '',
    positionId: 0,
    departmentId: 0,
    staffstypeId: 0,
    page: 1,
    perPage: 50
  })
  const staffOptions = useMemo(() =>
    (staffRes?.responseData || []).map(s => ({
      id: s.id,
      label: `${s.fullNameEn || s.name} (${s.code || s.employeeId || ''})`,
      name: s.fullNameEn || s.name,
    })),
    [staffRes]
  )
  const selectedStaffLabel = staffOptions.find(s => s.id === selectedStaffId)?.label || ''

  const { data: logbookData, isLoading } = useLogbookRecordsList({
    staffId: selectedStaffId,
    startDate: dateRange?.from ? dayjs(dateRange.from).format('YYYY-MM-DD') : undefined,
    endDate: dateRange?.to ? dayjs(dateRange.to).format('YYYY-MM-DD') : undefined,
    similarTechnology: similarTechnology !== 'all' ? similarTechnology : undefined,
    page,
    perPage
  })

  const records = logbookData?.responseData || []
  const totalItems = logbookData?.total || logbookData?.totalAll || 0
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FileText className="h-4 w-4" />
            </span>
            Maintenance Experiences Logbook Records
          </CardTitle>
          <CardDescription>
            QA Document — View maintenance experiences logbook records
          </CardDescription>
        </CardHeader>

        {/* Filters */}
        <div className="px-6 pb-4">
          <div className="flex flex-col md:flex-row gap-4 mb-2 items-end">
            <div className="space-y-1.5 flex-1 max-w-[280px]">
              <Label className="text-sm font-semibold text-slate-700">Name</Label>
              <Popover open={staffOpen} onOpenChange={setStaffOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={staffOpen}
                    className="h-9 w-full justify-between font-normal text-sm"
                  >
                    <span className="truncate">
                      {selectedStaffId ? selectedStaffLabel : 'Select staff...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search staff name..."
                      value={staffSearch}
                      onValueChange={setStaffSearch}
                    />
                    <CommandList>
                      <CommandEmpty>{staffLoading ? 'Loading...' : 'No staff found.'}</CommandEmpty>
                      <CommandGroup>
                        {staffOptions.map((staff) => (
                          <CommandItem
                            key={staff.id}
                            value={String(staff.id)}
                            onSelect={() => {
                              setSelectedStaffId(staff.id === selectedStaffId ? 0 : staff.id)
                              setStaffOpen(false)
                              setPage(1)
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', selectedStaffId === staff.id ? 'opacity-100' : 'opacity-0')} />
                            {staff.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 max-w-md">
              <DateRangeFilter
                value={dateRange}
                onChange={(range) => {
                  setDateRange(range);
                  setPage(1);
                }}
                placeholder="DD/MM/YYYY"
                labels={{ from: 'Start Date', to: 'End Date' }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Similar Technology</Label>
              <Select value={similarTechnology} onValueChange={(val) => { setSimilarTechnology(val); setPage(1) }}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Group 1">Group 1</SelectItem>
                  <SelectItem value="Group 2">Group 2</SelectItem>
                  <SelectItem value="Group 3">Group 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {(selectedStaffId > 0 || dateRange || similarTechnology !== 'all') && (
                <Button
                  color="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedStaffId(0)
                    setStaffSearch('')
                    setDateRange(undefined)
                    setSimilarTechnology('all')
                    setPage(1)
                  }}
                  className="mb-0.5"
                >
                  <RotateCw className="h-3.5 w-3.5 mr-2" />
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <CardContent className="p-0 overflow-x-auto">
          <Table className="relative min-w-[2000px]">
            <TableHeader className="bg-slate-100/80">
              <TableRow className="border-b border-slate-200">
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">NAME - SURNAME</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">EMPLOYEE ID</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">LICENSE CATEGORY</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">DATE TO PERFORM TASK</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">LOCATION</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">AIRCRAFT TYPE</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">AIRCRAFT REGISTRATION</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">PRIVILEGED USED</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">ATA Chapter</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">TYPE OF MAINTENANCE (RATING)</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">TYPE OF TASK</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">TYPE OF ACTIVITY</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">MAINTENANCE REFERENCES</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">PERFORMED DURATION</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">AUTHORIZED STAMP NO.</TableHead>
                <TableHead className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap">ATTACHMENT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={16} className="h-24 text-center text-slate-400">
                    <div className="flex justify-center mb-2">
                      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="h-24 text-center text-slate-500">
                    No Results.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record, index) => (
                  <TableRow key={record.id} className={`text-sm hover:bg-slate-100/50 transition-colors ${index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}>
                    <TableCell className="text-left font-medium text-slate-800 whitespace-nowrap">{record.nameSurname}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{record.employeeId}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{record.licenseCategory}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{record.dateToPerformTask}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{record.location}</TableCell>
                    <TableCell className="text-left text-slate-600 whitespace-nowrap">{record.aircraftType}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap text-center">{record.aircraftRegistration}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap text-center">{record.privilegedUsed}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap text-center">{record.ataChapter}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{record.typeOfMaintenanceRating}</TableCell>
                    <TableCell className="text-left text-slate-600 whitespace-nowrap">{record.typeOfTask}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap text-center">{record.typeOfActivity}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{record.maintenanceReferences}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap text-center">{record.performedDuration}</TableCell>
                    <TableCell className="font-medium text-slate-700 whitespace-nowrap text-center">{record.authorizedStampNo}</TableCell>
                    <TableCell className="text-center whitespace-nowrap flex justify-center items-center">
                      {record.fileAttachmentUrl ? (
                        <a href={record.fileAttachmentUrl} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

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
        </CardContent>
      </Card>
    </div>
  )
}
