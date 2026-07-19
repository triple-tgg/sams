'use client'

import { useMemo, useState, useEffect } from 'react'
import { Search, RotateCw, CalendarClock, Filter, ChevronLeft, ChevronRight, MoreHorizontal, Edit2, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SAMS_STATUS_META } from '../../types-v2'
import type { SamsAuthStatus } from '../../types-v2'
import { fmtDate } from '../../utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useStaffAuthorizationAirlineStatuses } from "@/lib/api/master/staff-authorization/staff-authorization-airline-statuses.hooks"
import type { StaffAuthorizationAirlineStatus } from "@/lib/api/master/staff-authorization/staff-authorization-airline-statuses"
import { useSamsAuthList, useSamsAuthById, useUpsertSamsAuth } from "@/lib/api/qa/sams-auth.hooks"
import type { SamsAuthItem, SamsAuthDetail } from "@/lib/api/qa/sams-auth"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "sonner"
import { useAircraftTypeLicenses } from "@/lib/api/master/aircraft-type-licenses.hooks"

type FilterStatus = string

const toUtcIsoDate = (date: string): string | null =>
  date ? new Date(`${date}T00:00:00.000Z`).toISOString() : null

export function SamsAuthTab() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [filter, setFilter] = useState<FilterStatus>('all')
  
  const { data: aircraftOptions = [] } = useAircraftTypeLicenses()
  const { data: statusOptions = [] } = useStaffAuthorizationAirlineStatuses()

  // Pagination states
  const [pageIndex, setPageIndex] = useState(0) // UI uses 0-index internally
  const pageSize = 20

  // Server API call
  const { data: samsData, isFetching } = useSamsAuthList({
    searchKeyword: debouncedSearch,
    status: filter === 'all' ? '' : filter,
    page: pageIndex + 1,
    perPage: pageSize
  })

  // Edit Modal States
  const [targetStaff, setTargetStaff] = useState<SamsAuthItem | null>(null)
  const editAuthId = targetStaff?.authorizationSamsId ?? null
  
  const { data: detailResp, isPending: isDetailPending, isFetching: isDetailFetching, isError: isDetailError } = useSamsAuthById(editAuthId)
  const detailData: SamsAuthDetail | null = detailResp?.responseData ?? null
  const authorizationDetail = detailData?.authorizationSamses ?? null
  const detailStaff = detailData?.staff ?? null
  const isDetailLoading = editAuthId !== null && (isDetailPending || isDetailFetching)
  
  const upsertMutation = useUpsertSamsAuth()

  const [editAuthNo, setEditAuthNo] = useState('')
  const [editRating, setEditRating] = useState<Set<number>>(new Set())
  const [editAmelExp, setEditAmelExp] = useState('')
  const [editInitDate, setEditInitDate] = useState('')
  const [editCurrDate, setEditCurrDate] = useState('')
  const [editSamsExp, setEditSamsExp] = useState('')

  // Populate form when detail data arrives or reset if add mode
  useEffect(() => {
    if (detailData && authorizationDetail && editAuthId !== null) {
      setEditAuthNo(authorizationDetail.authNo || '')
      setEditRating(new Set(
        detailData.authorizationSamsAircraftTypeLicens
          .filter((item) => !item.isdelete)
          .map((item) => item.aircraftTypeId),
      ))
      setEditAmelExp(targetStaff?.amelExpiryDate?.split('T')[0] || '')
      setEditInitDate(authorizationDetail.initialIssueDate?.split('T')[0] || '')
      setEditCurrDate(authorizationDetail.currentIssueDate?.split('T')[0] || '')
      setEditSamsExp(authorizationDetail.expiryDate?.split('T')[0] || '')
    } else if (targetStaff && editAuthId === null) {
      setEditAuthNo('')
      setEditRating(new Set())
      setEditAmelExp(targetStaff.amelExpiryDate?.split('T')[0] || '')
      setEditInitDate('')
      setEditCurrDate('')
      setEditSamsExp('')
    }
  }, [detailData, authorizationDetail, targetStaff, editAuthId])

  const handleEditClick = (staff: SamsAuthItem) => {
    setTargetStaff(staff)
  }

  const handleCloseEdit = () => {
    setTargetStaff(null)
    setEditAuthNo('')
    setEditRating(new Set())
    setEditAmelExp('')
    setEditInitDate('')
    setEditCurrDate('')
    setEditSamsExp('')
  }

  const handleSave = async () => {
    if (!targetStaff) return
    try {
      const nowUtc = new Date().toISOString()
      await upsertMutation.mutateAsync({
        authorizationSamses: {
          id: targetStaff.authorizationSamsId ?? 0,
          staffId: targetStaff.staffId,
          authNo: editAuthNo,
          initialIssueDate: toUtcIsoDate(editInitDate),
          currentIssueDate: toUtcIsoDate(editCurrDate),
          expiryDate: toUtcIsoDate(editSamsExp),
          staffAmelLicenseId: authorizationDetail?.staffAmelLicenseId ?? 0,
          isCrs: authorizationDetail?.isCrs ?? true,
          isdelete: false,
          createddate: authorizationDetail?.createddate ?? nowUtc,
          createdby: authorizationDetail?.createdby ?? '',
          updateddate: nowUtc,
          updatedby: authorizationDetail?.updatedby ?? '',
        },
        authorizationSamsAircraftTypeLicenId: Array.from(editRating),
      })
      toast.success(editAuthId === null ? "Added successfully" : "Updated successfully")
      handleCloseEdit()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save")
    }
  }

  // Reset page to 0 when filters change
  useEffect(() => {
    setPageIndex(0)
  }, [debouncedSearch, filter])

  const totalPages = samsData ? Math.ceil(samsData.total / pageSize) : 0
  const paginatedStaff = samsData?.responseData || []
  const totalAll = samsData?.totalAll || 0
  const totalFiltered = samsData?.total || 0

  const getPageNumbers = () => {
    const pages = []
    for (let i = 0; i < totalPages; i++) {
        if (i === 0 || i === totalPages - 1 || (i >= pageIndex - 1 && i <= pageIndex + 1)) {
            pages.push(i)
        } else if (i === pageIndex - 2 || i === pageIndex + 2) {
            pages.push(-1)
        }
    }
    return pages.filter((p, index, arr) => p !== -1 || arr[index - 1] !== -1)
  }

  // Status mapping adapter for UI styling
  const getUiStatus = (apiStatus: string): SamsAuthStatus | 'not_issued' => {
    const s = (apiStatus || '').toLowerCase()
    if (s === 'valid') return 'valid'
    if (s === 'not issued') return 'not_issued'
    if (s === 'expired') return 'expired'
    if (s === 'expiring') return 'expiring'
    return 'valid' // default fallback
  }

  // Extended meta including not_issued
  const EXTENDED_SAMS_STATUS_META: Record<string, { bg: string; dot: string; text: string; label: string; labelTh: string }> = {
    ...SAMS_STATUS_META,
    not_issued: { bg: '#f1f5f9', dot: '#94a3b8', text: '#64748b', label: 'Not Issued', labelTh: 'ยังไม่ออกบัตร' }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-foreground">SAMs Authorization</h2>

        {/* ── Filter Bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Name, ID, Auth No..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
          />
        </div>

        <div className="w-[180px]">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
            <SelectTrigger className="bg-white border-border h-[38px] text-xs font-semibold px-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue placeholder="Select Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({totalAll})</SelectItem>
              {statusOptions.map((opt: StaffAuthorizationAirlineStatus) => {
                return (
                  <SelectItem key={opt.code} value={opt.code}>
                    {opt.name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <span className="ml-auto text-[10px] text-muted-foreground hidden">
          Showing {totalFiltered} of {totalAll} items
        </span>
      </div>
      </div>

      {/* ── Table ── */}
      <div className={cn("rounded-xl border border-border overflow-hidden bg-white transition-opacity", isFetching ? "opacity-60" : "opacity-100")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-border">
                <th className="px-3 py-2.5 text-left text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 220 }}>Employee Name</th>
                <th className="px-3 py-2.5 text-left text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 150 }}>Auth No.</th>
                <th className="px-3 py-2.5 text-left text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 180 }}>Aircraft License</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 90 }}>AMEL Exp.</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 90 }}>Initial Issue</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 90 }}>Current Issue</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 100 }}>Expiry Date</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 110 }}>Status</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider w-16 sticky right-0 bg-slate-50 shadow-[-1px_0_0_0_#e2e8f0] z-10">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStaff.map((s: SamsAuthItem, ri: number) => {
                const uiStatus = getUiStatus(s.samsAuthStatus)
                const meta = EXTENDED_SAMS_STATUS_META[uiStatus] || EXTENDED_SAMS_STATUS_META.valid
                const aircraftLicenseNames = (s.staffAircraftLicenseList || [])
                  .map((license) => license.aircraftTypeLicensObj?.name)
                  .filter((name): name is string => Boolean(name))

                return (
                  <tr
                    key={s.staffId}
                    className={`border-b border-border/50 transition-colors hover:bg-blue-50 group ${
                      ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    {/* Staff */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {s.profileImagePath ? (
                          <img
                            src={s.profileImagePath}
                            alt={s.employeeName || ''}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground leading-tight">{s.employeeName}</p>
                          <p className="text-[10px] text-primary font-bold">{s.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    {/* Auth No */}
                    <td className="px-3 py-2.5 font-bold text-[11px] text-slate-700">{s.authorizationNo || '-'}</td>
                    {/* Rating */}
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <div className="whitespace-pre-line text-[10px] leading-relaxed">{aircraftLicenseNames.join(',\n') || '-'}</div>
                    </td>
                    {/* AMEL Exp */}
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{fmtDate(s.amelExpiryDate) || '-'}</td>
                    {/* Initial Issue */}
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{fmtDate(s.initialIssueDate) || '-'}</td>
                    {/* Current Issue */}
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{fmtDate(s.currentIssueDate) || '-'}</td>
                    {/* SAMS Exp */}
                    <td className="px-3 py-2.5 text-center font-semibold" style={{ color: meta.text }}>
                      {fmtDate(s.samsExpiryDate) || '-'}
                    </td>
                    {/* Status */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: meta.bg, color: meta.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                        {s.samsAuthStatus || meta.label}
                        {uiStatus === 'expiring' && <span className="text-[9px] opacity-80">({s.daysToExpiry}d)</span>}
                        {uiStatus === 'expired' && <span className="text-[9px] opacity-80">({Math.abs(s.daysToExpiry || 0)}d)</span>}
                      </div>
                    </td>
                    {/* Action */}
                    <td className={`px-3 py-2.5 text-center sticky right-0 shadow-[-1px_0_0_0_#f1f5f9] transition-colors ${
                      ri % 2 === 0 ? 'bg-white group-hover:bg-blue-50' : 'bg-slate-50 group-hover:bg-blue-50'
                    }`}>
                      <PermissionActionGuard menuCode="QA_AUTHORIZATION" action="canEdit">
                        <button
                          onClick={() => handleEditClick(s)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-slate-200 mx-auto block"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </PermissionActionGuard>
                    </td>
                  </tr>
                )
              })}
              {paginatedStaff.length === 0 && !isFetching && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-white">
            <div className="text-xs font-medium text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{paginatedStaff.length === 0 ? 0 : pageIndex * pageSize + 1}</span> to <span className="font-semibold text-foreground">{Math.min((pageIndex + 1) * pageSize, totalFiltered)}</span> of <span className="font-semibold text-foreground">{totalFiltered}</span> entries
            </div>
            
            {totalPages > 1 && (
                <Pagination className="w-auto mx-0">
                    <PaginationContent className="gap-1.5">
                        <PaginationItem>
                            <PaginationLink 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setPageIndex(p => Math.max(0, p - 1)) }}
                                className={cn("w-8 h-8 p-0 rounded-md transition-all flex items-center justify-center", 
                                    pageIndex === 0 
                                        ? "pointer-events-none opacity-50 border border-slate-200 text-slate-400 bg-slate-50" 
                                        : "border border-slate-300 text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </PaginationLink>
                        </PaginationItem>
                        
                        {getPageNumbers().map((p, idx) => (
                            <PaginationItem key={idx} className="hidden sm:inline-block">
                                {p === -1 ? (
                                    <PaginationEllipsis className="w-8 h-8" />
                                ) : (
                                    <PaginationLink 
                                        href="#" 
                                        isActive={pageIndex === p}
                                        onClick={(e) => { e.preventDefault(); setPageIndex(p) }}
                                        className={cn("w-8 h-8 p-0 rounded-md transition-all font-semibold text-xs flex items-center justify-center", 
                                            pageIndex === p 
                                                ? "bg-primary text-white border border-primary shadow-md hover:bg-primary/90 hover:text-white" 
                                                : "bg-white text-slate-700 border border-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                        )}
                                    >
                                        {p + 1}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationLink 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setPageIndex(p => Math.min(totalPages - 1, p + 1)) }}
                                className={cn("w-8 h-8 p-0 rounded-md transition-all flex items-center justify-center", 
                                    pageIndex >= totalPages - 1 
                                        ? "pointer-events-none opacity-50 border border-slate-200 text-slate-400 bg-slate-50" 
                                        : "border border-slate-700 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </PaginationLink>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={targetStaff !== null} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="max-w-[650px] p-0 overflow-hidden border-border/60 shadow-2xl bg-white">
          {isDetailLoading ? (
            <div className="flex items-center justify-center py-20">
              <DialogTitle className="sr-only">Loading</DialogTitle>
              <RotateCw className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : isDetailError || (!detailData && editAuthId !== null) ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <DialogTitle className="sr-only">Error</DialogTitle>
              <p className="text-sm text-muted-foreground">Failed to load data</p>
              <Button variant="outline" size="sm" onClick={handleCloseEdit}>Close</Button>
            </div>
          ) : (detailData || targetStaff) ? (
            <>
              <div className="px-5 pt-5 pb-4 border-b border-border/60 bg-slate-50">
                <div className="flex items-center gap-3 mb-1">
                  {(detailStaff ? detailStaff.profileImagePath : targetStaff?.profileImagePath) ? (
                    <img
                      src={detailStaff ? detailStaff.profileImagePath! : targetStaff!.profileImagePath!}
                      alt={(detailStaff ? detailStaff.name : targetStaff?.employeeName) || ''}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-800">
                      {detailStaff ? detailStaff.name : targetStaff?.employeeName}
                    </DialogTitle>
                    <p className="text-xs font-semibold text-slate-500">
                      {detailStaff ? detailStaff.employeeId : targetStaff?.employeeId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column: Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Auth No.</label>
                      <input type="text" value={editAuthNo} onChange={e => setEditAuthNo(e.target.value)} className="w-full bg-white font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">AMEL Expire</label>
                      <input type="date" value={editAmelExp} disabled className="w-full bg-slate-100 text-slate-500 font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Date of Initial Issue</label>
                      <input type="date" value={editInitDate} onChange={e => setEditInitDate(e.target.value)} disabled={editAuthId !== null} className={`w-full font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 ${editAuthId !== null ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:outline-none focus:border-blue-500'}`} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Date of Current Issue</label>
                      <input type="date" value={editCurrDate} onChange={e => setEditCurrDate(e.target.value)} className="w-full bg-white font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Date of Expire (SAMS)</label>
                      <input type="date" value={editSamsExp} onChange={e => setEditSamsExp(e.target.value)} className="w-full bg-white font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  {/* Right Column: Aircraft checkboxes */}
                  <div className="flex flex-col h-[340px]">
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Aircraft License</label>
                    <div className="flex-1 bg-white border border-border/60 rounded-md p-1.5 overflow-y-auto">
                      <div className="space-y-0.5 pr-1">
                        {aircraftOptions.map(opt => {
                          const isSelected = editRating.has(opt.id)
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setEditRating(prev => {
                                  const next = new Set(prev)
                                  if (next.has(opt.id)) next.delete(opt.id)
                                  else next.add(opt.id)
                                  return next
                                })
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all text-sm ${
                                isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                              }`}>
                                {isSelected && (
                                  <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-white">
                                    <path d="M3 7.5L5.5 10L11 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              {opt.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-5 py-4 border-t border-border/60 bg-slate-50">
                <Button variant="outline" onClick={handleCloseEdit} className="font-bold">
                  Cancel
                </Button>
                <PermissionActionGuard menuCode="QA_AUTHORIZATION" action="canEdit">
                  <Button 
                    onClick={handleSave}
                    disabled={upsertMutation.isPending}
                    className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {upsertMutation.isPending ? "Saving..." : editAuthId === null ? "Add" : "Save Changes"}
                  </Button>
                </PermissionActionGuard>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
