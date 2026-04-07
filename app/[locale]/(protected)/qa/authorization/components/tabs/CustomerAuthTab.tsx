'use client'

import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { LayoutList, LayoutGrid, ChevronDown, ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { STAFF, AIRLINES } from '../../data-v2'
import { AIRLINE_KEYS, SAMS_STATUS_META, CUST_STATUS_META } from '../../types-v2'
import type { CustomerAuthValue, AirlineKey, Staff } from '../../types-v2'
import { getSamsStatus } from '../../utils'
import { cn } from '@/lib/utils'

// ─── Hover Tooltip for Matrix Cell ──────────────────────────────────────────

interface TooltipInfo {
  staff: Staff
  airlineCode: AirlineKey
  status: CustomerAuthValue
  x: number
  y: number       // cell bottom
  cellTop: number  // cell top
}

function CellTooltip({ info }: { info: TooltipInfo }) {
  const { staff, airlineCode, status } = info
  const meta = CUST_STATUS_META[status]
  const airline = AIRLINES[airlineCode]
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
          <span className="font-bold" style={{ color: airline.color }}>{airlineCode} — {airline.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date of Initial Issue</span>
          <span className="font-semibold text-foreground">{staff.initDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date of Current Issue</span>
          <span className="font-semibold text-foreground">{staff.currDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date of Expire</span>
          <span className="font-semibold text-foreground">{staff.samsExp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Aircraft</span>
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

type ViewMode = 'list' | 'matrix'

export function CustomerAuthTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  return (
    <div className="space-y-4">
      {/* ── View Toggle ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Customer Authorization</h3>
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${viewMode === 'list' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            List View
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${viewMode === 'matrix' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Matrix View
          </button>
        </div>
      </div>

      {viewMode === 'list' ? <ListView /> : <MatrixView />}
    </div>
  )
}

// ─── List View ──────────────────────────────────────────────────────────────

function ListView() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerAuthValue | 'all'>('all')

  // Pagination states
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 15

  // Reset to first page when filters change
  useEffect(() => setPageIndex(0), [search, statusFilter])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Pre-calculate visible staff
  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase().trim()
    return STAFF.filter(s => {
      // Search matching (Staff Name or ID)
      if (q) {
        const staffMatch = s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
        if (!staffMatch) return false
      }

      // Check if staff has any airline with the selected status
      if (statusFilter !== 'all') {
        const hasStatus = AIRLINE_KEYS.some(code => s.cust[code] === statusFilter)
        if (!hasStatus) return false
      }

      // Staff must have at least one customer auth
      const hasAnyAuth = AIRLINE_KEYS.some(code => !!s.cust[code])
      if (!hasAnyAuth) return false

      return true
    })
  }, [search, statusFilter])

  const totalItems = filteredStaff.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedStaff = filteredStaff.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const getPageNumbers = () => {
    const maxVisible = 5
    const pages: number[] = []
    
    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) pages.push(i)
    } else {
      if (pageIndex <= 2) {
        for (let i = 0; i < 4; i++) pages.push(i)
        pages.push(-1)
        pages.push(totalPages - 1)
      } else if (pageIndex >= totalPages - 3) {
        pages.push(0)
        pages.push(-1)
        for (let i = totalPages - 4; i < totalPages; i++) pages.push(i)
      } else {
        pages.push(0)
        pages.push(-1)
        pages.push(pageIndex - 1)
        pages.push(pageIndex)
        pages.push(pageIndex + 1)
        pages.push(-1)
        pages.push(totalPages - 1)
      }
    }
    return pages
  }

  const expandAll = () => setExpandedIds(new Set(paginatedStaff.map(s => s.id)))
  const collapseAll = () => setExpandedIds(new Set())

  // Get filtered airlines for a specific staff member
  const getFilteredAirlinesForStaff = useCallback((s: Staff) => {
    return AIRLINE_KEYS.map(code => ({ code, status: s.cust[code] }))
      .filter((item): item is { code: AirlineKey; status: CustomerAuthValue } => {
        if (!item.status) return false
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        return true
      })
  }, [statusFilter])

  const statusOptions: { value: CustomerAuthValue | 'all'; label: string; dot?: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'valid', label: 'Valid', dot: CUST_STATUS_META.valid.dot },
    { value: 'not_approve', label: 'Not Approved', dot: CUST_STATUS_META.not_approve.dot },
    { value: 'not_complete', label: 'Not Complete', dot: CUST_STATUS_META.not_complete.dot },
    { value: 'suspended', label: 'Suspended', dot: CUST_STATUS_META.suspended.dot },
    { value: 'pending', label: 'Pending', dot: CUST_STATUS_META.pending.dot },
  ]

  return (
    <div className="space-y-2">
      {/* Filter Bar */}
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
        {/* Expand/Collapse */}
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={expandAll} className="text-[11px] text-primary hover:underline font-medium">Expand All</button>
          <span className="text-muted-foreground/40">|</span>
          <button onClick={collapseAll} className="text-[11px] text-primary hover:underline font-medium">Collapse All</button>
        </div>
      </div>

      {/* Results List */}
      {paginatedStaff.map(s => {
        const staffAirlines = getFilteredAirlinesForStaff(s)
        if (staffAirlines.length === 0) return null // Hide if no matching airlines after status filter

        const validCount = staffAirlines.filter(a => a.status === 'valid').length
        const totalCount = staffAirlines.length
        const isExpanded = expandedIds.has(s.id)

        return (
          <div key={s.id} className="rounded-xl border border-border bg-white overflow-hidden">
            {/* Staff Header — clickable */}
            <button
              onClick={() => toggleExpand(s.id)}
              className="w-full flex items-center lg:items-start gap-4 px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 bg-slate-200 text-xs font-bold shrink-0 mt-0.5"
              >
                {s.name.split(' ').pop()?.[0] || ''}
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <div className="min-w-[200px]">
                  <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                  <p className="text-xs font-bold text-slate-400">{s.id}</p>
                </div>
                
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] mt-1 md:mt-0">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/60 font-semibold uppercase tracking-wider text-[9px]">License</span>
                    <span className="font-semibold">{s.license}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/60 font-semibold uppercase tracking-wider text-[9px]">Aircraft</span>
                    <AutoTooltip
                      label={s.rating.replace(/\n/g, ', ')}
                      content={s.rating.replace(/\n/g, ', ')}
                      className="font-medium text-slate-600 truncate max-w-[150px] inline-block"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/60 font-semibold uppercase tracking-wider text-[9px]">SAMS Expire</span>
                    <span className="font-medium text-slate-600">{s.samsExp}</span>
                  </div>
                </div>
              </div>

              {/* Summary Badge */}
              <div className="flex items-center gap-6 shrink-0 ml-auto self-center md:self-auto mt-2 md:mt-0">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-slate-800 leading-none">
                    {validCount}/{totalCount}
                  </span>
                  <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        validCount === totalCount
                          ? 'bg-emerald-500'
                          : (validCount / totalCount) >= 0.75
                          ? 'bg-[#e27b14]' // Orange color from reference
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${totalCount > 0 ? (validCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Airline List — collapsible */}
            <div
              className="overflow-hidden transition-all duration-200 ease-in-out"
              style={{ maxHeight: isExpanded ? `${totalCount * 60 + 40}px` : '0', opacity: isExpanded ? 1 : 0 }}
            >
              <div className="border-t border-border">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-2 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Airline Customer</span>
                  <span className="text-right">Status</span>
                </div>
                {/* Airline Rows */}
                {staffAirlines.map(({ code, status }) => {
                  const airline = AIRLINES[code]
                  const meta = CUST_STATUS_META[status]
                  return (
                    <div
                      key={code}
                      className="grid grid-cols-[1fr_auto] gap-4 px-6 py-2.5 border-t border-border/50 items-center hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                         <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-slate-100 border border-border shadow-sm"
                            style={{ background: airline.color }}
                          >
                           {code.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{airline.name}</p>
                            <p className="text-[10px] font-bold" style={{ color: airline.color }}>{code}</p>
                          </div>
                      </div>
                      {/* Status Badge */}
                      <span
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold justify-self-end w-[110px] justify-center"
                            style={{ background: meta.bg, color: meta.text }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                            {meta.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      {filteredStaff.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm border-t border-border bg-white rounded-xl">
          ไม่พบข้อมูลที่ตรงกับเงื่อนไข
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border border-border px-4 py-3 bg-white rounded-xl mt-2">
          <div className="text-xs font-medium text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredStaff.length === 0 ? 0 : pageIndex * pageSize + 1}</span> to <span className="font-semibold text-foreground">{Math.min((pageIndex + 1) * pageSize, filteredStaff.length)}</span> of <span className="font-semibold text-foreground">{filteredStaff.length}</span> staff
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
  )
}

// ─── Matrix View — Dot Style (matches AuthMatrix) ───────────────────────────

function MatrixView() {
  const custStatusOrder: CustomerAuthValue[] = ['valid', 'not_approve', 'not_complete', 'suspended', 'pending']
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerAuthValue | 'all'>('all')
  const [airlineFilter, setAirlineFilter] = useState<Set<AirlineKey>>(new Set(AIRLINE_KEYS))
  const [showAirlineDropdown, setShowAirlineDropdown] = useState(false)
  const airlineDropdownRef = useRef<HTMLDivElement>(null)

  // Close airline dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (airlineDropdownRef.current && !airlineDropdownRef.current.contains(e.target as Node)) {
        setShowAirlineDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCellEnter = useCallback((e: React.MouseEvent, staff: Staff, airlineCode: AirlineKey, status: CustomerAuthValue) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ staff, airlineCode, status, x: rect.left + rect.width / 2, y: rect.bottom, cellTop: rect.top })
  }, [])

  const handleCellLeave = useCallback(() => setTooltip(null), [])

  const toggleAirline = (code: AirlineKey) => {
    setAirlineFilter(prev => {
      const next = new Set(prev)
      if (next.has(code)) { if (next.size > 1) next.delete(code) } // keep at least 1
      else next.add(code)
      return next
    })
  }
  const selectAllAirlines = () => setAirlineFilter(new Set(AIRLINE_KEYS))
  const deselectAllAirlines = () => setAirlineFilter(new Set([AIRLINE_KEYS[0]]))

  // Visible airline columns
  const visibleAirlines = useMemo(() =>
    AIRLINE_KEYS.filter(code => airlineFilter.has(code))
  , [airlineFilter])

  // Filtered staff
  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase().trim()
    return STAFF.filter(s => {
      // Search match
      if (q) {
        const nameMatch = s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
        if (!nameMatch) return false
      }
      // Status match — staff must have at least one visible airline cell matching
      if (statusFilter !== 'all') {
        const hasStatus = visibleAirlines.some(code => s.cust[code] === statusFilter)
        if (!hasStatus) return false
      }
      return true
    })
  }, [search, statusFilter, visibleAirlines])

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
    { value: 'not_complete', label: 'Not Complete', dot: CUST_STATUS_META.not_complete.dot },
    { value: 'suspended', label: 'Suspended', dot: CUST_STATUS_META.suspended.dot },
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
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              airlineFilter.size !== AIRLINE_KEYS.length
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
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-[11px] ${
                      airlineFilter.has(code)
                        ? 'bg-primary/10 text-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded border-2 flex items-center justify-center transition-all ${
                        airlineFilter.has(code)
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
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: AIRLINES[code].color }} />
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
          Showing {filteredStaff.length} of {STAFF.length} staff · {visibleAirlines.length} of {AIRLINE_KEYS.length} airlines
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs" style={{ minWidth: '100%' }}>
            <thead>
              <tr className="bg-muted/50 border-b-2 border-border">
                <th className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap sticky left-0 bg-muted/50 z-10 border-r border-border" style={{ minWidth: 200 }}>
                  Staff
                </th>
                {visibleAirlines.map(code => (
                  <th
                    key={code}
                    className="px-1 py-2 text-center font-bold border-l border-border"
                    style={{ minWidth: 50 }}
                    title={AIRLINES[code].name}
                  >
                    <div className="text-[10px] leading-snug font-bold" style={{ color: AIRLINES[code].color }}>{code}</div>
                    <div className="text-[9px] text-muted-foreground/60 font-medium">Auth</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s, ri) => {
                const samsStatus = getSamsStatus(s)
                const samsMeta = SAMS_STATUS_META[samsStatus]
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-border/50 transition-colors hover:bg-muted/40 ${ri % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                      }`}
                  >
                    {/* Sticky Staff Column */}
                    <td className={`px-3 py-1.5 sticky left-0 z-10 border-r border-border ${ri % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                          style={{ background: s.color }}
                        >
                          {s.name.split(' ').pop()?.[0] || ''}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground leading-tight truncate" style={{ maxWidth: 160 }}>{s.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{s.id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Customer Auth Cells — dot style */}
                    {visibleAirlines.map(code => {
                      const val = s.cust[code]
                      if (!val) {
                        return (
                          <td key={code} className="text-center border-l border-border/50" style={{ padding: '6px 4px', minWidth: 45 }}>
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                            </div>
                          </td>
                        )
                      }
                      const meta = CUST_STATUS_META[val]
                      return (
                        <td
                          key={code}
                          className="text-center border-l border-border/50 cursor-pointer transition-all duration-150 group/cell"
                          style={{ padding: '6px 4px', minWidth: 45, position: 'relative' }}
                          onMouseEnter={(e) => handleCellEnter(e, s, code, val)}
                          onMouseLeave={handleCellLeave}
                        >
                          {/* Background layer with opacity */}
                          <div className="absolute inset-0 transition-opacity duration-150 opacity-40 group-hover/cell:opacity-70" style={{ background: meta.bg }} />
                          <div className="relative z-1 flex flex-col items-center gap-0.5">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                background: meta.dot,
                                boxShadow: val === 'not_approve' ? `0 0 0 3px ${meta.dot}33` :
                                  val === 'not_complete' ? `0 0 0 2px ${meta.dot}33` :
                                    val === 'suspended' ? `0 0 0 2px ${meta.dot}33` : 'none'
                              }}
                            />
                          </div>
                          {val === 'suspended' && (
                            <div className="relative z-1 text-[9px] font-bold mt-0.5 leading-none" style={{ color: meta.text }}>SUS</div>
                          )}
                          {val === 'not_complete' && (
                            <div className="relative z-1 text-[9px] font-bold mt-0.5 leading-none" style={{ color: meta.text }}>INC</div>
                          )}
                          {val === 'not_approve' && (
                            <div className="relative z-1 text-[9px] font-bold mt-0.5 leading-none" style={{ color: meta.text }}>REJ</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Tooltip */}
      {tooltip && <CellTooltip info={tooltip} />}

      {/* Legend — dot style */}
      <div className="flex items-center gap-5 px-4 py-2.5 bg-white rounded-xl border border-border">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Legend:</span>
        {custStatusOrder.map(key => {
          const meta = CUST_STATUS_META[key]
          const abbr = key === 'not_approve' ? 'REJ' : key === 'not_complete' ? 'INC' : key === 'suspended' ? 'SUS' : key === 'pending' ? 'PND' : null
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
    </div>
  )
}
