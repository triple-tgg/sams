'use client'

import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Search, Filter, X, User, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { STAFF } from '../../data-v2'
import { SAMS_STATUS_META, CUST_STATUS_META } from '../../types-v2'
import type { CustomerAuthValue, Staff, AirlineKey } from '../../types-v2'
import { useAirlines } from '@/lib/api/master/airlines/airlines.hooks'
import { useCustomerAuthList, useUpdateCustomerAuth, useCustomerAuthById } from '@/lib/api/qa/authorization/customer-auth.hooks'
import { getSamsStatus } from '../../utils'
import { cn } from '@/lib/utils'
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard"
import { AircraftEngineRefPanel } from "@/components/aircraft-engine/AircraftEngineRefPanel"
import { toast } from "sonner"

import { useDebounce } from '@/hooks/useDebounce'
import { useAircraftTypeLicenses } from "@/lib/api/master/aircraft-type-licenses.hooks"

// ─── Date Formatting Helper ─────────────────────────────────────────────────

function formatShortDate(iso: string): string {
  if (!iso) return '—'
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${d}/${m}/${y.slice(2)}`
}

function getDaysRemaining(expDateIso: string): number | null {
  if (!expDateIso) return null
  const exp = new Date(expDateIso)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  exp.setHours(0, 0, 0, 0)
  const diff = exp.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Hover Tooltip for Matrix Cell ──────────────────────────────────────────

interface TooltipInfo {
  staff: Staff
  airlineCode: string
  airlineName: string
  airlineColor: string
  status: CustomerAuthValue
  x: number
  y: number       // cell bottom
  cellTop: number  // cell top
}

function CellTooltip({ info }: { info: TooltipInfo }) {
  const { staff, airlineCode, airlineName, airlineColor, status } = info
  const meta = CUST_STATUS_META[status]
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: info.x, top: info.y + 8 })

  // Auto-position: measure tooltip, flip above if not enough space below
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const rect = el.getBoundingClientRect()
    const viewH = window.innerHeight
    const viewW = window.innerWidth
    const tooltipH = rect.height
    const tooltipW = rect.width

    // Vertical: show above if not enough space below
    let top = info.y + 8
    if (top + tooltipH > viewH - 8) {
      top = info.cellTop - tooltipH - 8
    }
    // Clamp to viewport top
    if (top < 8) top = 8

    // Horizontal: center on cell, clamp to viewport
    let left = info.x - tooltipW / 2
    if (left < 8) left = 8
    if (left + tooltipW > viewW - 8) left = viewW - tooltipW - 8

    setPos({ left, top })
  }, [info.x, info.y, info.cellTop])

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-border rounded-lg shadow-xl p-3 text-xs pointer-events-none"
      style={{ left: pos.left, top: pos.top, minWidth: 240, maxWidth: 300 }}
    >
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
        <span className="font-bold text-foreground text-[11px]">{staff.name}</span>
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
          style={{ background: meta.bg, color: meta.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
          {meta.label}
        </span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Airline</span>
          <span className="font-bold" style={{ color: airlineColor }}>{airlineCode} — {airlineName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date of Initial Issue</span>
          <span className="font-semibold text-foreground">{formatShortDate(staff.initDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date of Current Issue</span>
          <span className="font-semibold text-foreground">{formatShortDate(staff.currDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date of Expire</span>
          <span className="font-semibold text-foreground">{formatShortDate(staff.samsExp)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Aircraft License</span>
          <span className="font-semibold text-foreground text-right" style={{ maxWidth: 160 }}>{staff.rating.replace(/\n/g, ', ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">License</span>
          <span className="font-semibold text-foreground">{staff.license}</span>
        </div>
        {staff.note && (
          <div className="pt-1.5 mt-1 border-t border-border/50">
            <span className="text-muted-foreground">Note: </span>
            <span className="text-foreground">{staff.note}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Reusable Auto-Position Tooltip ─────────────────────────────────────────

function AutoTooltip({ label, content, className }: { label: string; content: string; className?: string }) {
  const [show, setShow] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, top: 0 })

  useEffect(() => {
    if (!show || !triggerRef.current || !tooltipRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tipRect = tooltipRef.current.getBoundingClientRect()
    const viewH = window.innerHeight
    const viewW = window.innerWidth

    // Vertical: prefer below, flip above if clipped
    let top = triggerRect.bottom + 6
    if (top + tipRect.height > viewH - 8) {
      top = triggerRect.top - tipRect.height - 6
    }
    if (top < 8) top = 8

    // Horizontal: align left edge to trigger, clamp
    let left = triggerRect.left
    if (left + tipRect.width > viewW - 8) left = viewW - tipRect.width - 8
    if (left < 8) left = 8

    setPos({ left, top })
  }, [show])

  return (
    <span
      ref={triggerRef}
      className={`cursor-default ${className || ''}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {label}
      {show && content && content !== '—' && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-slate-800 text-white rounded-lg shadow-xl px-3 py-2 text-[11px] leading-relaxed pointer-events-none"
          style={{ left: pos.left, top: pos.top, maxWidth: 320 }}
        >
          {content}
        </div>
      )}
    </span>
  )
}

export function CustomerAuthTab() {
  const { isLoading: airlinesLoading } = useAirlines()

  if (airlinesLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading customer authorization data...
      </div>
    )
  }

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Customer Authorization</h3>
      </div>
      <MatrixView />
    </div>
  )
}


// ─── Matrix View — Dot Style (matches AuthMatrix) ───────────────────────────

function MatrixView() {
  const custStatusOrder: CustomerAuthValue[] = ['valid', 'not_approve', 'not_complete', 'suspended', 'pending']
  const [page, setPage] = useState(1)
  const pageSize = 20
  
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState<CustomerAuthValue | 'all'>('all')

  const { data: airlinesRes, isLoading: airlinesLoading } = useAirlines()
  const apiAirlines = airlinesRes?.responseData || []
  
  const AIRLINE_KEYS = useMemo(() => apiAirlines.map(a => a.code), [apiAirlines])
  const AIRLINES = useMemo(() => {
    const map: Record<string, { code: string; name: string; color: string }> = {}
    apiAirlines.forEach(a => {
      map[a.code] = {
        code: a.code,
        name: a.name || a.code,
        color: a.colorForeground || '#333'
      }
    })
    return map
  }, [apiAirlines])

  const { data: aircraftOptions = [] } = useAircraftTypeLicenses()
  const [selectedCell, setSelectedCell] = useState<{ staff: Staff, airlineCode: string, status: CustomerAuthValue } | null>(null)
  const [editInitDate, setEditInitDate] = useState('')
  const [editCurrDate, setEditCurrDate] = useState('')
  const [editSamsExp, setEditSamsExp] = useState('')
  const [editRating, setEditRating] = useState<Set<string>>(new Set())
  const [, setVersion] = useState(0)
  
  const updateAuthMutation = useUpdateCustomerAuth()

  const currentSelectedStatusObj = selectedCell ? selectedCell.staff.airlineStatuses?.find(a => a.airlineCode === selectedCell.airlineCode) : null
  
  const detailRequest = useMemo(() => {
    if (!selectedCell || !currentSelectedStatusObj?.airlineId || !selectedCell.staff.dbId) return null;
    return {
      staffId: selectedCell.staff.dbId,
      airlineId: currentSelectedStatusObj.airlineId
    };
  }, [selectedCell, currentSelectedStatusObj]);

  const { data: detailRes, isLoading: detailLoading } = useCustomerAuthById(detailRequest)
  useEffect(() => {
    if (detailRes?.responseData && selectedCell) {
      const detail = detailRes.responseData;
      if (detail.initialIssueDate) setEditInitDate(detail.initialIssueDate.split('T')[0]);
      else setEditInitDate('');
      
      if (detail.currentIssueDate) setEditCurrDate(detail.currentIssueDate.split('T')[0]);
      else setEditCurrDate('');
      
      if (detail.expiryDate) setEditSamsExp(detail.expiryDate.split('T')[0]);
      else setEditSamsExp('');
      
      if (detail.aircrafts) {
        const optionNames = detail.aircrafts.map((a: any) => {
          const match = aircraftOptions.find(opt => opt.id === a.aircraftTypeId);
          return match ? match.name : (a.code || a.name);
        });
        setEditRating(new Set(optionNames));
      } else {
        setEditRating(new Set());
      }
    }
  }, [detailRes, selectedCell, aircraftOptions])

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [airlineFilter, setAirlineFilter] = useState<Set<string>>(new Set())
  const airlineFilterInit = useRef(false)
  const [showAirlineDropdown, setShowAirlineDropdown] = useState(false)
  const airlineDropdownRef = useRef<HTMLDivElement>(null)

  const [showAircraftDropdown, setShowAircraftDropdown] = useState(false)
  const aircraftDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (AIRLINE_KEYS.length > 0 && !airlineFilterInit.current) {
      setAirlineFilter(new Set(AIRLINE_KEYS))
      airlineFilterInit.current = true
    }
  }, [AIRLINE_KEYS])

  // Close airline dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (airlineDropdownRef.current && !airlineDropdownRef.current.contains(e.target as Node)) {
        setShowAirlineDropdown(false)
      }
      if (aircraftDropdownRef.current && !aircraftDropdownRef.current.contains(e.target as Node)) {
        setShowAircraftDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCellEnter = useCallback((e: React.MouseEvent, staff: Staff, airlineCode: string, status: CustomerAuthValue) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const airline = AIRLINES[airlineCode]
    setTooltip({ 
      staff, 
      airlineCode, 
      airlineName: airline?.name || airlineCode,
      airlineColor: airline?.color || '#ccc',
      status, 
      x: rect.left + rect.width / 2, 
      y: rect.bottom, 
      cellTop: rect.top 
    })
  }, [AIRLINES])

  const handleCellLeave = useCallback(() => setTooltip(null), [])

  const handleCellClick = (staff: Staff, airlineCode: string, status: CustomerAuthValue) => {
    setSelectedCell({ staff, airlineCode, status })
    setEditInitDate(staff.initDate)
    setEditCurrDate(staff.currDate)
    setEditSamsExp(staff.samsExp)
    const ratings = staff.rating ? staff.rating.split(/\n/).map(r => r.trim()).filter(Boolean) : []
    setEditRating(new Set(ratings))
    setTooltip(null) // Hide tooltip when opening modal
  }

  const toggleAirline = (code: string) => {
    setAirlineFilter(prev => {
      const next = new Set(prev)
      if (next.has(code)) { if (next.size > 1) next.delete(code) } // keep at least 1
      else next.add(code)
      return next
    })
  }
  const selectAllAirlines = () => setAirlineFilter(new Set(AIRLINE_KEYS))
  const deselectAllAirlines = () => setAirlineFilter(new Set([AIRLINE_KEYS[0]]))

  // Convert statusFilter to API format
  const apiStatus = useMemo(() => {
    if (statusFilter === 'all') return null
    if (statusFilter === 'valid') return 'VAL'
    if (statusFilter === 'not_approve') return 'NAP'
    if (statusFilter === 'pending') return 'PEN'
    if (statusFilter === 'not_complete') return 'NCP'
    if (statusFilter === 'suspended') return 'SUS'
    return null
  }, [statusFilter])

  // Fetch from API
  const { data: authRes, isLoading: authLoading, isFetching: authFetching } = useCustomerAuthList({
    page,
    perPage: pageSize,
    searchKeyword: debouncedSearch,
    status: apiStatus,
    airlineId: null // We do column filtering on frontend instead of data filtering
  })

  const totalFiltered = authRes?.total ?? (authRes?.responseData?.length ?? 0)
  const totalPages = Math.ceil(totalFiltered / pageSize)

  const getPageNumbers = () => {
    const pages = []
    // Note: page is 1-indexed here
    const pIndex = page - 1
    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || (i >= pIndex - 1 && i <= pIndex + 1)) {
        pages.push(i)
      } else if (i === pIndex - 2 || i === pIndex + 2) {
        pages.push(-1)
      }
    }
    return pages.filter((p, index, arr) => p !== -1 || arr[index - 1] !== -1)
  }

  // Map API data to `Staff` format
  const mappedStaff: Staff[] = useMemo(() => {
    if (!authRes?.responseData) return []
    return authRes.responseData.map((item, idx) => {
      const custRecord: Partial<Record<AirlineKey, CustomerAuthValue>> = {}
      item.airlineStatuses.forEach(as => {
        let val: CustomerAuthValue = 'pending'
        if (as.status === 'VAL') val = 'valid'
        else if (as.status === 'NAP') val = 'not_approve'
        // Add more mappings if needed
        custRecord[as.airlineCode as AirlineKey] = val
      })

      return {
        no: idx + 1 + (page - 1) * pageSize,
        dbId: item.staffId || item.staff.id,
        staffAuthorizationId: item.staffAuthorizationId,
        id: item.staff.code || item.employeeId,
        name: item.employeeName,
        rating: '', // Missing in API
        amelExp: '',
        authNo: '',
        initDate: item.staff.startDate || '',
        currDate: '',
        samsExp: '',
        color: '#3b82f6',
        license: '',
        cust: custRecord,
        auth: {},
        airlineStatuses: item.airlineStatuses,
      }
    })
  }, [authRes, page, pageSize])

  // Visible airline columns
  const visibleAirlines = useMemo(() =>
    AIRLINE_KEYS.filter(code => airlineFilter.has(code))
    , [airlineFilter])

  // Use mapped data as filteredStaff (since API does pagination and search)
  // But we still apply local filtering if statusFilter requires matching a visible column specifically
  const filteredStaff = useMemo(() => {
    return mappedStaff.filter(s => {
      // API already filtered by search and status globally, 
      // but to strictly match frontend logic: if statusFilter is active, 
      // staff MUST have that status in one of the VISIBLE airline columns.
      if (statusFilter !== 'all') {
        const hasStatus = visibleAirlines.some(code => s.cust[code as AirlineKey] === statusFilter)
        if (!hasStatus) return false
      }
      return true
    })
  }, [mappedStaff, statusFilter, visibleAirlines])

  const isFiltering = search !== '' || statusFilter !== 'all' || airlineFilter.size !== AIRLINE_KEYS.length

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setAirlineFilter(new Set(AIRLINE_KEYS))
  }

  const statusOptions: { value: CustomerAuthValue | 'all'; label: string; dot?: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'valid', label: 'Valid', dot: CUST_STATUS_META.valid.dot },
    { value: 'not_approve', label: 'Not Approved', dot: CUST_STATUS_META.not_approve.dot },
    { value: 'not_complete', label: 'Expiring', dot: CUST_STATUS_META.not_complete.dot },
    { value: 'suspended', label: 'Expired', dot: CUST_STATUS_META.suspended.dot },
    { value: 'pending', label: 'Pending', dot: CUST_STATUS_META.pending.dot },
  ]

  return (
    <div className="space-y-3">
      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search staff name or ID..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>
        {/* Status Filter Dropdown */}
        <div className="w-[180px]">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CustomerAuthValue | 'all')}>
            <SelectTrigger className="bg-white border-border h-[32px] text-[11px] font-bold px-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {opt.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: opt.dot }} />}
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Airline Column Filter */}
        <div className="relative" ref={airlineDropdownRef}>
          <button
            onClick={() => setShowAirlineDropdown(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${airlineFilter.size !== AIRLINE_KEYS.length
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }`}
          >
            <Filter className="w-3 h-3" />
            Airlines
            {airlineFilter.size !== AIRLINE_KEYS.length && (
              <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {airlineFilter.size}/{AIRLINE_KEYS.length}
              </span>
            )}
          </button>
          {showAirlineDropdown && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-border shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Show Columns</span>
                <div className="flex gap-1.5">
                  <button onClick={selectAllAirlines} className="text-[10px] text-primary hover:underline font-medium">All</button>
                  <span className="text-muted-foreground/40">|</span>
                  <button onClick={deselectAllAirlines} className="text-[10px] text-primary hover:underline font-medium">Reset</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-0.5 max-h-[240px] overflow-y-auto">
                {AIRLINE_KEYS.map(code => (
                  <button
                    key={code}
                    onClick={() => toggleAirline(code)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-[11px] ${airlineFilter.has(code)
                      ? 'bg-primary/10 text-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                  >
                    <div
                      className={`w-3 h-3 rounded border-2 flex items-center justify-center transition-all ${airlineFilter.has(code)
                        ? 'border-primary bg-primary'
                        : 'border-slate-300 bg-white'
                        }`}
                    >
                      {airlineFilter.has(code) && (
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: AIRLINES[code]?.color || '#333' }} />
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Clear Filters */}
        {isFiltering && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-all"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      {isFiltering && (
        <div className="text-[11px] text-muted-foreground">
          Showing {filteredStaff.length} staff on this page · {visibleAirlines.length} of {AIRLINE_KEYS.length} airlines
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs" style={{ minWidth: '100%' }}>
            <thead>
              <tr className="bg-slate-50 border-b-2 border-border">
                <th className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap sticky left-0 bg-slate-50 z-10 border-r border-border" style={{ minWidth: 200 }}>
                  Employee Name
                </th>
                {visibleAirlines.map(code => (
                  <th
                    key={code}
                    className="px-1 py-2 text-center font-bold border-l border-border"
                    style={{ minWidth: 90 }}
                    title={AIRLINES[code]?.name || code}
                  >
                    <div className="text-[10px] leading-snug font-bold" style={{ color: AIRLINES[code]?.color || '#333' }}>{code}</div>
                    <div className="text-[9px] text-muted-foreground/60 font-medium">Auth</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {authLoading ? (
                Array.from({ length: pageSize }).map((_, ri) => (
                  <tr key={`skeleton-${ri}`} className={`border-b border-border/50 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className={`px-3 py-1.5 sticky left-0 z-10 border-r border-border ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                        <div className="space-y-1 w-full">
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-2 w-1/2" />
                        </div>
                      </div>
                    </td>
                    {visibleAirlines.map(code => (
                      <td key={`skeleton-cell-${code}`} className="px-1 py-1.5 text-center border-l border-border">
                        <Skeleton className="h-4 w-6 mx-auto rounded-md" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredStaff.map((s, ri) => {
                const samsStatus = getSamsStatus(s)
                const samsMeta = SAMS_STATUS_META[samsStatus]
                return (
                  <tr
                    key={s.id}
                    className={`group border-b border-border/50 transition-colors hover:bg-slate-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                  >
                    {/* Sticky Staff Column */}
                    <td className={`px-3 py-1.5 sticky left-0 z-10 border-r border-border transition-colors group-hover:bg-slate-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        {s.profileImage ? (
                          <img
                            src={s.profileImage}
                            alt={s.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-200 shrink-0">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-foreground leading-tight truncate" style={{ maxWidth: 160 }}>{s.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{s.id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Customer Auth Cells — dot style */}
                    {visibleAirlines.map(code => {
                      const val = s.cust[code as AirlineKey] as CustomerAuthValue
                      if (!val) {
                        return (
                          <td 
                            key={code} 
                            className="text-center border-l border-border/50 cursor-pointer transition-all duration-150 group/cell hover:bg-muted/60" 
                            style={{ padding: '6px 4px', minWidth: 45, position: 'relative' }}
                            onMouseEnter={(e) => handleCellEnter(e, s, code, 'pending')}
                            onMouseLeave={handleCellLeave}
                            onClick={() => handleCellClick(s, code, 'pending')}
                          >
                            <div className="absolute inset-0 transition-opacity duration-150 opacity-0 group-hover/cell:opacity-100 bg-slate-100/50" />
                            <div className="relative z-1 flex flex-col items-center gap-0.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                            </div>
                          </td>
                        )
                      }
                      const meta = CUST_STATUS_META[val]
                      return (
                        <td
                          key={code}
                          className="text-center border-l border-border/50 cursor-pointer transition-all duration-150 group/cell hover:bg-muted/60"
                          style={{ padding: '6px 4px', minWidth: 45, position: 'relative' }}
                          onMouseEnter={(e) => handleCellEnter(e, s, code, val)}
                          onMouseLeave={handleCellLeave}
                          onClick={() => handleCellClick(s, code, val)}
                        >
                          {/* Background layer with opacity */}
                          <div className="absolute inset-0 transition-opacity duration-150 opacity-40 group-hover/cell:opacity-70" style={{ background: meta.bg }} />
                          <div className="relative z-1 flex flex-col items-center gap-0.5">
                            {val === 'valid' ? (
                              <>
                                <div className="text-[8px] font-semibold leading-tight text-center whitespace-nowrap" style={{ color: meta.text }}>
                                  <div className="flex items-center gap-0.5 justify-center">
                                    <span className="text-muted-foreground/70">Curr:</span>
                                    <span>{formatShortDate(s.currDate)}</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 justify-center mt-px">
                                    <span className="text-muted-foreground/70">Exp:</span>
                                    <span>{formatShortDate(s.samsExp)}</span>
                                  </div>
                                </div>
                              </>
                            ) : val !== 'not_complete' ? (
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  background: meta.dot,
                                  boxShadow: val === 'not_approve' ? `0 0 0 3px ${meta.dot}33` :
                                    val === 'suspended' ? `0 0 0 2px ${meta.dot}33` : 'none'
                                }}
                              />
                            ) : null}
                          </div>
                          {val === 'suspended' && (
                            <div className="relative z-1 text-[9px] font-bold mt-0.5 leading-none" style={{ color: meta.text }}>EXP</div>
                          )}
                          {val === 'not_complete' && (() => {
                            const days = getDaysRemaining(s.samsExp)
                            return (
                              <div className="relative z-1 text-[9px] font-bold mt-0.5 leading-none text-center" style={{ color: meta.text }}>
                                {days !== null && (
                                  <div className="text-[10px]">{days}d</div>
                                )}
                                <div className="text-[8px] font-semibold mt-0.5 opacity-80">EXG</div>
                              </div>
                            )
                          })()}
                          {val === 'not_approve' && (
                            <div className="relative z-1 text-[9px] font-bold mt-0.5 leading-none" style={{ color: meta.text }}>REJ</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {!authLoading && filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={visibleAirlines.length + 1} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination & Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-white rounded-b-xl">
        <div className="text-xs font-medium text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{mappedStaff.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * pageSize, totalFiltered)}</span> of <span className="font-semibold text-foreground">{totalFiltered}</span> entries
          {authFetching && <Loader2 className="inline w-3 h-3 ml-2 animate-spin text-muted-foreground" />}
        </div>
        
        {totalPages > 1 && (
          <Pagination className="w-auto mx-0">
            <PaginationContent className="gap-1.5">
              <PaginationItem>
                <PaginationLink 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)) }}
                  className={cn("w-8 h-8 p-0 rounded-md transition-all flex items-center justify-center", 
                    page === 1 
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
                      onClick={(e) => { e.preventDefault(); setPage(p + 1) }}
                      className={cn("w-8 h-8 p-0 rounded-md transition-all font-semibold text-xs flex items-center justify-center", 
                        page === p + 1 
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
                  onClick={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)) }}
                  className={cn("w-8 h-8 p-0 rounded-md transition-all flex items-center justify-center", 
                    page >= totalPages 
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

      {/* Floating Tooltip */}
      {tooltip && <CellTooltip info={tooltip} />}

      {/* Legend — dot style */}
      <div className="flex items-center gap-5 px-4 py-2.5 bg-white rounded-xl border border-border">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Legend:</span>
        {custStatusOrder.map(key => {
          const meta = CUST_STATUS_META[key]
          const abbr = key === 'not_approve' ? 'REJ' : key === 'not_complete' ? 'EXG' : key === 'suspended' ? 'EXP' : key === 'pending' ? 'PND' : null
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: meta.dot,
                  boxShadow: key === 'not_approve' ? `0 0 0 3px ${meta.dot}33` :
                    key === 'not_complete' ? `0 0 0 2px ${meta.dot}33` :
                      key === 'suspended' ? `0 0 0 2px ${meta.dot}33` : 'none'
                }}
              />
              <span className="text-muted-foreground font-medium">
                {meta.label}{abbr && <span className="text-muted-foreground/60"> ({abbr})</span>}
              </span>
            </div>
          )
        })}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <DialogContent size="md" className="max-w-md p-0 overflow-hidden border-border/60 shadow-2xl">
          {selectedCell && (
            <>
              <div className="px-5 pt-5 pb-4 border-b border-border/60 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <DialogTitle className="text-lg font-bold text-slate-800">
                    {selectedCell.staff.name}
                  </DialogTitle>
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold shadow-sm"
                    style={{
                      background: CUST_STATUS_META[selectedCell.status].bg,
                      color: CUST_STATUS_META[selectedCell.status].text
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: CUST_STATUS_META[selectedCell.status].dot }} />
                    {CUST_STATUS_META[selectedCell.status].label}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {selectedCell.staff.id} • License {selectedCell.staff.license}
                </p>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Details List */}
                <div className="space-y-2 text-sm bg-white rounded-lg border border-border/50 p-4 shadow-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground font-bold text-xs">Airline</span>
                    <span className="font-bold text-lg leading-tight" style={{ color: AIRLINES[selectedCell.airlineCode]?.color || '#333' }}>
                      {selectedCell.airlineCode} — {AIRLINES[selectedCell.airlineCode]?.name || selectedCell.airlineCode}
                    </span>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="pt-2">
                  <div className="grid grid-cols-12 gap-5">
                    {/* Left Column: Dates */}
                    <div className="space-y-4 col-span-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1.5 block">Date of Initial Issue</label>
                        <input type="date" value={editInitDate} onChange={e => setEditInitDate(e.target.value)} className="w-full bg-white font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1.5 block">Date of Current Issue</label>
                        <input type="date" value={editCurrDate} onChange={e => setEditCurrDate(e.target.value)} className="w-full bg-white font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1.5 block">Date of Expire</label>
                        <input type="date" value={editSamsExp} onChange={e => setEditSamsExp(e.target.value)} className="w-full bg-white font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>

                    {/* Right Column: Aircraft checkboxes */}
                    <div className="col-span-8 flex flex-col h-[208px]">
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Aircraft License</label>
                      <div className="flex-1 bg-white border border-border/60 rounded-md p-1.5 overflow-y-auto">
                        <div className="space-y-0.5 pr-1">
                          {aircraftOptions.map(opt => {
                            const isSelected = editRating.has(opt.name)
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setEditRating(prev => {
                                    const next = new Set(prev)
                                    if (next.has(opt.name)) next.delete(opt.name)
                                    else next.add(opt.name)
                                    return next
                                  })
                                }}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all text-sm ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                                  }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="truncate text-xs font-medium leading-tight">{opt.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CR-6: read-only reference to the authorization group(s) in scope */}
                {editRating.size > 0 && (
                  <div className="pt-3">
                    <span className="text-xs font-bold text-slate-700 mb-1.5 block">
                      Authorization group reference ({editRating.size})
                    </span>
                    <div className="grid gap-2 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1">
                      {Array.from(editRating).map((scope) => (
                        <AircraftEngineRefPanel key={scope} context="authorization" refId={scope} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="px-5 py-4 border-t border-border/60 bg-slate-50">
                <div className="flex items-center justify-between w-full">
                  {/* Left: Not Approved action — only for Pending & Expired */}
                  {(selectedCell.status === 'pending' || selectedCell.status === 'suspended') ? (
                    <PermissionActionGuard menuCode="QA_AUTHORIZATION" action="canEdit">
                      <Button
                        color="destructive"
                        disabled={updateAuthMutation.isPending}
                        onClick={async () => {
                          try {
                            const currentStatusObj = selectedCell.staff.airlineStatuses?.find(a => a.airlineCode === selectedCell.airlineCode)
                            // We don't have a master list of status IDs, so we send 0 or a known hardcoded ID if available.
                            // Assuming the backend handles 0 or needs to be updated later for "Not Approved".
                            await updateAuthMutation.mutateAsync({
                              id: selectedCell.staff.staffAuthorizationId || 0,
                              staffId: selectedCell.staff.dbId || 0,
                              airlineId: currentStatusObj?.airlineId || apiAirlines.find(a => a.code === selectedCell.airlineCode)?.id || 0,
                              staffAuthorizationAirlineStatusId: 0, // Placeholder for "NAP" status ID
                              initialIssueDate: editInitDate,
                              currentIssueDate: editCurrDate,
                              expiryDate: editSamsExp,
                              aircraftTypeIds: []
                            })
                            toast.success("Authorization rejected successfully")
                            setSelectedCell(null)
                          } catch (err) {
                            toast.error("Failed to reject authorization")
                          }
                        }}
                      >
                        {updateAuthMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Not Approved
                      </Button>
                    </PermissionActionGuard>
                  ) : <div />}

                  {/* Right: Cancel + Save */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setSelectedCell(null)} className="font-bold" disabled={updateAuthMutation.isPending}>
                      Cancel
                    </Button>
                    <PermissionActionGuard menuCode="QA_AUTHORIZATION" action="canEdit">
                      <Button
                        disabled={updateAuthMutation.isPending}
                        onClick={async () => {
                          try {
                            const currentStatusObj = selectedCell.staff.airlineStatuses?.find(a => a.airlineCode === selectedCell.airlineCode)
                            const aircraftIds = Array.from(editRating).map(ratingStr => {
                              const found = aircraftOptions.find(o => o.code === ratingStr || o.name === ratingStr)
                              return found?.id || 0
                            }).filter(id => id > 0)

                            await updateAuthMutation.mutateAsync({
                              id: selectedCell.staff.staffAuthorizationId || 0,
                              staffId: selectedCell.staff.dbId || 0,
                              airlineId: currentStatusObj?.airlineId || apiAirlines.find(a => a.code === selectedCell.airlineCode)?.id || 0,
                              staffAuthorizationAirlineStatusId: currentStatusObj?.airlineStatus?.id || 0,
                              initialIssueDate: editInitDate,
                              currentIssueDate: editCurrDate,
                              expiryDate: editSamsExp,
                              aircraftTypeIds: aircraftIds
                            })
                            toast.success("Customer authorization updated successfully")
                            setSelectedCell(null)
                          } catch (err) {
                            toast.error("Failed to update customer authorization")
                          }
                        }}
                        className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {updateAuthMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Save
                      </Button>
                    </PermissionActionGuard>
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
