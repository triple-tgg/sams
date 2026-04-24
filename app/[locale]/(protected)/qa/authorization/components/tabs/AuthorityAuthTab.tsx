'use client'

import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react'
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
import { Button } from "@/components/ui/button"
import { STAFF, AUTHORITIES } from '../../data-v2'
import { AUTHORITY_KEYS, SAMS_STATUS_META, CUST_STATUS_META } from '../../types-v2'
import type { CustomerAuthValue, AuthorityKey, Staff } from '../../types-v2'
import { getSamsStatus } from '../../utils'
import { cn } from '@/lib/utils'

const AIRCRAFT_OPTIONS = [
  'A318/A319/A320/A321',
  'A320 Family (CEO/NEO)',
  'A330-200/300',
  'A330-200/300/800/900',
  'A340-500/600',
  'A350-900/1000',
  'B737-300/400/500',
  'B737-600/700/800/900',
  'B737-600/700/800/900 (CFM56)',
  'B737-7/8/9',
  'B737 MAX',
  'B767-200/300',
  'B777-200/300',
  'B777-200/300/300ER',
  'B777-200ER/300ER',
  'B787',
  'B787-8/9/10',
  'ERJ-190'
]

// ─── Hover Tooltip for Matrix Cell ──────────────────────────────────────────

interface TooltipInfo {
  staff: Staff
  authCode: AuthorityKey
  status: CustomerAuthValue
  x: number
  y: number       // cell bottom
  cellTop: number  // cell top
}

function CellTooltip({ info }: { info: TooltipInfo }) {
  const { staff, authCode, status } = info
  const meta = CUST_STATUS_META[status]
  const authority = AUTHORITIES[authCode]
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
          <span className="text-muted-foreground">Authority</span>
          <span className="font-bold" style={{ color: authority.color }}>{authCode} — {authority.name}</span>
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

export function AuthorityAuthTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Authority Authorization</h3>
      </div>
      <MatrixView />
    </div>
  )
}


// ─── Matrix View — Dot Style (matches AuthMatrix) ───────────────────────────

function MatrixView() {
  const custStatusOrder: CustomerAuthValue[] = ['valid', 'not_approve', 'not_complete', 'suspended', 'pending']
  const [version, setVersion] = useState(0)
  const [selectedCell, setSelectedCell] = useState<{staff: Staff, authCode: AuthorityKey, status: CustomerAuthValue} | null>(null)
  const [editInitDate, setEditInitDate] = useState('')
  const [editCurrDate, setEditCurrDate] = useState('')
  const [editSamsExp, setEditSamsExp] = useState('')
  const [editRating, setEditRating] = useState<Set<string>>(new Set())

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerAuthValue | 'all'>('all')
  const [authFilter, setAuthorityFilter] = useState<Set<AuthorityKey>>(new Set(AUTHORITY_KEYS))
  const [showAuthorityDropdown, setShowAuthorityDropdown] = useState(false)
  const authDropdownRef = useRef<HTMLDivElement>(null)
  
  const [showAircraftDropdown, setShowAircraftDropdown] = useState(false)
  const aircraftDropdownRef = useRef<HTMLDivElement>(null)

  // Close authority dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (authDropdownRef.current && !authDropdownRef.current.contains(e.target as Node)) {
        setShowAuthorityDropdown(false)
      }
      if (aircraftDropdownRef.current && !aircraftDropdownRef.current.contains(e.target as Node)) {
        setShowAircraftDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCellEnter = useCallback((e: React.MouseEvent, staff: Staff, authCode: AuthorityKey, status: CustomerAuthValue) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ staff, authCode, status, x: rect.left + rect.width / 2, y: rect.bottom, cellTop: rect.top })
  }, [])

  const handleCellLeave = useCallback(() => setTooltip(null), [])

  const handleCellClick = (staff: Staff, authCode: AuthorityKey, status: CustomerAuthValue) => {
    setSelectedCell({ staff, authCode, status })
    setEditInitDate(staff.initDate)
    setEditCurrDate(staff.currDate)
    setEditSamsExp(staff.samsExp)
    const ratings = staff.rating ? staff.rating.split(/\n/).map(r => r.trim()).filter(Boolean) : []
    setEditRating(new Set(ratings))
    setTooltip(null) // Hide tooltip when opening modal
  }

  const toggleAuthority = (code: AuthorityKey) => {
    setAuthorityFilter(prev => {
      const next = new Set(prev)
      if (next.has(code)) { if (next.size > 1) next.delete(code) } // keep at least 1
      else next.add(code)
      return next
    })
  }
  const selectAllAuthoritys = () => setAuthorityFilter(new Set(AUTHORITY_KEYS))
  const deselectAllAuthoritys = () => setAuthorityFilter(new Set([AUTHORITY_KEYS[0]]))

  // Visible authority columns
  const visibleAuthoritys = useMemo(() =>
    AUTHORITY_KEYS.filter(code => authFilter.has(code))
  , [authFilter])

  // Filtered staff
  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase().trim()
    return STAFF.filter(s => {
      // Search match
      if (q) {
        const nameMatch = s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
        if (!nameMatch) return false
      }
      // Status match — staff must have at least one visible authority cell matching
      if (statusFilter !== 'all') {
        const hasStatus = visibleAuthoritys.some(code => s.auth[code] === statusFilter)
        if (!hasStatus) return false
      }
      return true
    })
  }, [search, statusFilter, visibleAuthoritys, version])

  const isFiltering = search !== '' || statusFilter !== 'all' || authFilter.size !== AUTHORITY_KEYS.length

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setAuthorityFilter(new Set(AUTHORITY_KEYS))
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
        {/* Authority Column Filter */}
        <div className="relative" ref={authDropdownRef}>
          <button
            onClick={() => setShowAuthorityDropdown(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              authFilter.size !== AUTHORITY_KEYS.length
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <Filter className="w-3 h-3" />
            Authoritys
            {authFilter.size !== AUTHORITY_KEYS.length && (
              <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {authFilter.size}/{AUTHORITY_KEYS.length}
              </span>
            )}
          </button>
          {showAuthorityDropdown && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-border shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Show Columns</span>
                <div className="flex gap-1.5">
                  <button onClick={selectAllAuthoritys} className="text-[10px] text-primary hover:underline font-medium">All</button>
                  <span className="text-muted-foreground/40">|</span>
                  <button onClick={deselectAllAuthoritys} className="text-[10px] text-primary hover:underline font-medium">Reset</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-0.5 max-h-[240px] overflow-y-auto">
                {AUTHORITY_KEYS.map(code => (
                  <button
                    key={code}
                    onClick={() => toggleAuthority(code)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-[11px] ${
                      authFilter.has(code)
                        ? 'bg-primary/10 text-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded border-2 flex items-center justify-center transition-all ${
                        authFilter.has(code)
                          ? 'border-primary bg-primary'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {authFilter.has(code) && (
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: AUTHORITIES[code].color }} />
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
          Showing {filteredStaff.length} of {STAFF.length} staff · {visibleAuthoritys.length} of {AUTHORITY_KEYS.length} authorities
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
                {visibleAuthoritys.map(code => (
                  <th
                    key={code}
                    className="px-1 py-2 text-center font-bold border-l border-border"
                    style={{ minWidth: 50 }}
                    title={AUTHORITIES[code].name}
                  >
                    <div className="text-[10px] leading-snug font-bold" style={{ color: AUTHORITIES[code].color }}>{code}</div>
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
                    {visibleAuthoritys.map(code => {
                      const val = s.auth[code]
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
                          className="text-center border-l border-border/50 cursor-pointer transition-all duration-150 group/cell hover:bg-muted/60"
                          style={{ padding: '6px 4px', minWidth: 45, position: 'relative' }}
                          onMouseEnter={(e) => handleCellEnter(e, s, code, val)}
                          onMouseLeave={handleCellLeave}
                          onClick={() => handleCellClick(s, code, val)}
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

      {/* Edit Modal */}
      <Dialog open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-border/60 shadow-2xl">
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
                    <span className="text-muted-foreground font-bold text-xs">Authority</span>
                    <span className="font-bold text-lg leading-tight" style={{ color: AUTHORITIES[selectedCell.authCode].color }}>
                      {selectedCell.authCode} — {AUTHORITIES[selectedCell.authCode].name}
                    </span>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="pt-2">
                  <div className="grid grid-cols-2 gap-5">
                    {/* Left Column: Dates */}
                    <div className="space-y-4">
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
                    <div className="flex flex-col h-[208px]">
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Aircraft</label>
                      <div className="flex-1 bg-white border border-border/60 rounded-md p-1.5 overflow-y-auto">
                        <div className="space-y-0.5 pr-1">
                          {AIRCRAFT_OPTIONS.map(opt => {
                            const isSelected = editRating.has(opt)
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setEditRating(prev => {
                                    const next = new Set(prev)
                                    if (next.has(opt)) next.delete(opt)
                                    else next.add(opt)
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
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="truncate text-xs font-medium leading-tight">{opt}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-5 py-4 border-t border-border/60 bg-slate-50">
                <Button variant="outline" onClick={() => setSelectedCell(null)} className="font-bold">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    selectedCell.staff.initDate = editInitDate
                    selectedCell.staff.currDate = editCurrDate
                    selectedCell.staff.samsExp = editSamsExp
                    selectedCell.staff.rating = Array.from(editRating).join('\n')
                    setVersion(v => v + 1)
                    setSelectedCell(null)
                  }}
                  className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
