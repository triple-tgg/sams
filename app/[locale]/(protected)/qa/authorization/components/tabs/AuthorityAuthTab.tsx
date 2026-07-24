'use client'

import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { CalendarDays, FileText, Filter, Globe2, Loader2, Plane, Search, User, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AUTHORITIES } from '../../data-v2'
import { CUST_STATUS_META } from '../../types-v2'
import type { CustomerAuthValue } from '../../types-v2'
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard"
import { AircraftEngineRefPanel } from "@/components/aircraft-engine/AircraftEngineRefPanel"
import { useAircraftTypeLicenses } from "@/lib/api/master/aircraft-type-licenses.hooks"
import type { AircraftTypeLicense } from "@/lib/api/master/aircraft-type-licenses"
import { useStaffAuthorizationAirlineStatuses } from "@/lib/api/master/staff-authorization/staff-authorization-airline-statuses.hooks"
import {
  useAuthorityAuthList,
  useAuthorityLicenseDetail,
  useUpsertAuthorityLicense,
} from "@/lib/api/qa/authorization/authority-auth.hooks"
import { useAuthorityAll } from "@/lib/api/qa/authorization.hooks"
import type {
  AuthorityAuthListRequest,
  AuthorityColumnHeader,
  AuthorityLicenseCell,
  AuthorityStaffRow,
} from "@/lib/api/qa/authorization/authority-auth"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  validateAuthorityAircraftSelection,
  validateAuthorityLicenseDates,
} from '@/lib/api/qa/authorization/authority-auth.validation'
import {
  buildAuthorityAuthRecordMap,
  getAuthorityAuthCellKey,
  mapAuthorityApiStatus,
  resolveAuthorityLicenseCell,
} from '@/lib/api/qa/authorization/authority-auth.status'

// ─── Date Formatting Helper ─────────────────────────────────────────────────

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  if (iso.includes('/')) return iso
  const parts = iso.split('T')[0].split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${d}/${m}/${y.slice(2)}`
}

function getDaysRemaining(expDateIso: string | null | undefined): number | null {
  if (!expDateIso) return null
  let exp: Date
  if (expDateIso.includes('/')) {
    const parts = expDateIso.split('/')
    if (parts.length === 3) {
      exp = new Date(`20${parts[2]}-${parts[1]}-${parts[0]}`)
    } else {
      return null
    }
  } else {
    exp = new Date(expDateIso)
  }
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  exp.setHours(0, 0, 0, 0)
  const diff = exp.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Hover Tooltip for Matrix Cell ──────────────────────────────────────────

interface TooltipInfo {
  staff: AuthorityStaffRow
  authCode: string
  authorityName: string
  authorityColor: string
  status: CustomerAuthValue
  licenseItem: AuthorityLicenseCell | undefined
  aircraftOptions: AircraftTypeLicense[]
  x: number
  y: number       // cell bottom
  cellTop: number  // cell top
}

function CellTooltip({ info }: { info: TooltipInfo }) {
  const { staff, authCode, authorityName, authorityColor, status, licenseItem, aircraftOptions } = info
  const meta = CUST_STATUS_META[status] || CUST_STATUS_META.pending
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

    let top = info.y + 8
    if (top + tooltipH > viewH - 8) {
      top = info.cellTop - tooltipH - 8
    }
    if (top < 8) top = 8

    let left = info.x - tooltipW / 2
    if (left < 8) left = 8
    if (left + tooltipW > viewW - 8) left = viewW - tooltipW - 8

    setPos({ left, top })
  }, [info.x, info.y, info.cellTop])
  
  const mappedAircrafts = useMemo(() => {
    if (!licenseItem?.aviationAuthorityLicenseAircrafts) return '—';
    const names = licenseItem.aviationAuthorityLicenseAircrafts.map(a => {
      const found = aircraftOptions.find(o => o.id === a.aircraftTypeLicenseId)
      return found ? found.name : a.aircraftTypeLicenseId
    })
    return names.length > 0 ? names.join(', ') : '—'
  }, [licenseItem, aircraftOptions])

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-border rounded-lg shadow-xl p-3 text-xs pointer-events-none"
      style={{ left: pos.left, top: pos.top, minWidth: 240, maxWidth: 300 }}
    >
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
        <span className="font-bold text-foreground text-[11px]">{staff.staffName}</span>
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
          <span className="font-bold" style={{ color: authorityColor }}>{authCode} — {authorityName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date of Initial Issue</span>
          <span className="font-semibold text-foreground">{formatShortDate(licenseItem?.initialIssueDate || licenseItem?.aviationAuthorityLicense?.initialIssueDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date of Current Issue</span>
          <span className="font-semibold text-foreground">{formatShortDate(licenseItem?.currentIssueDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date of Expire</span>
          <span className="font-semibold text-foreground">{formatShortDate(licenseItem?.expireDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Aircraft</span>
          <span className="font-semibold text-foreground text-right" style={{ maxWidth: 160 }}>
            {mappedAircrafts}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">License</span>
          <span className="font-semibold text-foreground">{licenseItem?.licenseNo || licenseItem?.aviationAuthorityLicense?.licenseNo || '—'}</span>
        </div>
      </div>
    </div>
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

// ─── Matrix View — Dot Style ───────────────────────────

function MatrixView() {
  const custStatusOrder: CustomerAuthValue[] = ['valid', 'not_approve', 'not_complete', 'suspended', 'pending']

  const listRequest = useMemo<AuthorityAuthListRequest>(() => ({
    searchKeyword: '',
    authorityId: null,
    status: '',
    page: 1,
    perPage: 200,
  }), [])
  const { data: authData, isLoading } = useAuthorityAuthList(listRequest)
  const { data: authorityRecordsData, isLoading: authorityRecordsLoading } = useAuthorityAll()
  const authorityRecordByCell = useMemo(
    () => buildAuthorityAuthRecordMap(authorityRecordsData?.responseData || []),
    [authorityRecordsData],
  )
  const apiStaffRows = useMemo(() => {
    return (authData?.responseData?.staffRows || []).map(staff => ({
      ...staff,
      licenses: staff.licenses.map(matrixCell => {
        const authorityMasterId =
          matrixCell.authorizationAuthorityMasterId || matrixCell.aviationAuthorityId || 0
        const record = authorityRecordByCell.get(
          getAuthorityAuthCellKey(staff.staffId, authorityMasterId),
        )
        return resolveAuthorityLicenseCell(matrixCell, record) || matrixCell
      }),
    }))
  }, [authData, authorityRecordByCell])
  const apiAuthorities = useMemo(() => {
    const raw = authData?.responseData?.authorities || []
    return raw.map((a: any, i: number) => ({
      ...a,
      _key: a.authorizationAuthorityMasterId || a.aviationAuthorityId || a.id || `${a.code}-${i}`
    }))
  }, [authData])

  // Build authority lookup from the listdata response (not from /authority/list which now returns licenses)
  const MAPPED_AUTHORITIES = useMemo(() => {
    const map: Record<string, { code: string; name: string; color: string }> = {}
    apiAuthorities.forEach((a: any) => {
      const fallbackColor = AUTHORITIES[a.code as keyof typeof AUTHORITIES]?.color || '#333'
      map[a.code] = {
        code: a.code,
        name: a.name || AUTHORITIES[a.code as keyof typeof AUTHORITIES]?.name || a.code,
        color: a.colorCode || a.color || fallbackColor
      }
    })
    return map
  }, [apiAuthorities])

  // Authority IDs are the identity because the API can return duplicate codes (for example DGCA).
  const AUTHORITY_KEYS = useMemo(() => {
    return apiAuthorities.map(authority => authority._key)
  }, [apiAuthorities])

  const { data: aircraftOptions = [] } = useAircraftTypeLicenses()
  const { data: authorizationStatuses = [] } = useStaffAuthorizationAirlineStatuses()
  const [selectedCell, setSelectedCell] = useState<{
    staff: AuthorityStaffRow
    authCode: string
    authorityName: string
    masterId: number
    status: CustomerAuthValue
    licenseItem: AuthorityLicenseCell | undefined
  } | null>(null)
  const selectedLicenseId = selectedCell?.licenseItem?.authorizationAuthorityId ?? selectedCell?.licenseItem?.aviationAuthorityLicense?.id ?? null
  const detailQuery = useAuthorityLicenseDetail(selectedLicenseId)
  const upsertMutation = useUpsertAuthorityLicense()
  const validStatusId = useMemo(() =>
    authorizationStatuses.find(status =>
      status.code?.toUpperCase() === 'VAL' || status.name?.toLowerCase() === 'valid'
    )?.id ?? null,
  [authorizationStatuses])
  const notApprovedStatusId = useMemo(() =>
    authorizationStatuses.find(status => status.code?.toUpperCase() === 'NAP')?.id ?? null,
  [authorizationStatuses])

  const [editInitDate, setEditInitDate] = useState('')
  const [editCurrDate, setEditCurrDate] = useState('')
  const [editSamsExp, setEditSamsExp] = useState('')
  const [editRating, setEditRating] = useState<Set<string>>(new Set())
  const [aircraftLicenseSearch, setAircraftLicenseSearch] = useState('')
  const [showDateValidation, setShowDateValidation] = useState(false)
  const [showAircraftValidation, setShowAircraftValidation] = useState(false)

  const licenseDateErrors = useMemo(
    () => validateAuthorityLicenseDates(editInitDate, editCurrDate, editSamsExp),
    [editCurrDate, editInitDate, editSamsExp],
  )
  const hasLicenseDateErrors = Object.keys(licenseDateErrors).length > 0
  const aircraftValidationError = validateAuthorityAircraftSelection(editRating.size)

  useEffect(() => {
    const detail = detailQuery.data?.responseData
    if (!detail || detail.id !== selectedLicenseId) return
    setEditInitDate((detail.initialIssueDate || '').split('T')[0])
    setEditCurrDate((detail.currentIssueDate || '').split('T')[0])
    setEditSamsExp((detail.expireDate || '').split('T')[0])
    setEditRating(new Set(detail.aircrafts.map(aircraft => aircraft.name || aircraft.code || String(aircraft.aircraftTypeLicenseId))))
  }, [detailQuery.data, selectedLicenseId])

  const filteredAircraftOptions = useMemo(() => {
    const keyword = aircraftLicenseSearch.trim().toLowerCase()
    if (!keyword) return aircraftOptions
    return aircraftOptions.filter(option =>
      option.name.toLowerCase().includes(keyword) || option.code.toLowerCase().includes(keyword)
    )
  }, [aircraftLicenseSearch, aircraftOptions])

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerAuthValue | 'all'>('all')
  const [authFilter, setAuthorityFilter] = useState<Set<number | string>>(new Set())
  const [authFilterInit, setAuthFilterInit] = useState(false)
  const [showAuthorityDropdown, setShowAuthorityDropdown] = useState(false)
  const authDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (AUTHORITY_KEYS.length > 0 && !authFilterInit) {
      setAuthorityFilter(new Set(AUTHORITY_KEYS))
      setAuthFilterInit(true)
    }
  }, [AUTHORITY_KEYS, authFilterInit])

  // Close authority dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (authDropdownRef.current && !authDropdownRef.current.contains(e.target as Node)) {
        setShowAuthorityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCellEnter = useCallback((e: React.MouseEvent, staff: AuthorityStaffRow, authCode: string, authorityName: string, authorityColor: string, status: CustomerAuthValue, licenseItem: AuthorityLicenseCell | undefined) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ staff, authCode, authorityName, authorityColor, status, licenseItem, aircraftOptions, x: rect.left + rect.width / 2, y: rect.bottom, cellTop: rect.top })
  }, [aircraftOptions])

  const handleCellLeave = useCallback(() => setTooltip(null), [])

  const handleCellClick = (staff: AuthorityStaffRow, authCode: string, authorityName: string, masterId: number, status: CustomerAuthValue, licenseItem: AuthorityLicenseCell | undefined) => {
    setAircraftLicenseSearch('')
    setShowDateValidation(false)
    setShowAircraftValidation(false)
    setSelectedCell({ staff, authCode, authorityName, masterId, status, licenseItem })
    setEditInitDate(licenseItem?.initialIssueDate?.split('T')[0] || licenseItem?.aviationAuthorityLicense?.initialIssueDate?.split('T')[0] || '')
    
    // For date inputs it needs YYYY-MM-DD
    let currIssue = licenseItem?.currentIssueDate || ''
    if(currIssue.includes('/')) {
        const parts = currIssue.split('/')
        currIssue = `20${parts[2]}-${parts[1]}-${parts[0]}`
    } else {
        currIssue = currIssue.split('T')[0]
    }
    
    let expireDate = licenseItem?.expireDate || ''
    if(expireDate.includes('/')) {
        const parts = expireDate.split('/')
        expireDate = `20${parts[2]}-${parts[1]}-${parts[0]}`
    } else {
        expireDate = expireDate.split('T')[0]
    }
    
    setEditCurrDate(currIssue)
    setEditSamsExp(expireDate)
    
    const ratings = licenseItem?.aviationAuthorityLicenseAircrafts?.map(a => {
      const found = aircraftOptions.find(o => o.id === a.aircraftTypeLicenseId)
      return found ? found.name : String(a.aircraftTypeLicenseId)
    }) || []
    setEditRating(new Set(ratings))
    setTooltip(null) // Hide tooltip when opening modal
  }

  const toggleAuthority = (id: string | number) => {
    setAuthorityFilter(prev => {
      const next = new Set(prev)
      if (next.has(id)) { if (next.size > 1) next.delete(id) } // keep at least 1
      else next.add(id)
      return next
    })
  }
  const selectAllAuthoritys = () => setAuthorityFilter(new Set(AUTHORITY_KEYS))
  const deselectAllAuthoritys = () => setAuthorityFilter(new Set([AUTHORITY_KEYS[0]]))

  // Visible authority columns
  const visibleAuthoritys = useMemo(() =>
    apiAuthorities.filter(authority => authFilter.has(authority._key))
  , [authFilter, apiAuthorities])

  // Filtered staff
  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase().trim()
    return apiStaffRows.filter(s => {
      // Search match
      if (q) {
        const nameMatch = s.staffName.toLowerCase().includes(q) || s.employeeId.toLowerCase().includes(q)
        if (!nameMatch) return false
      }
      // Status match — staff must have at least one visible authority cell matching
      if (statusFilter !== 'all') {
        const hasStatus = visibleAuthoritys.some(authority => {
          const lic = s.licenses?.find(l => {
            const lKey = l.authorizationAuthorityMasterId || l.aviationAuthorityId
            return lKey && lKey === authority._key
          })
          if (!lic) return mapAuthorityApiStatus(undefined) === statusFilter
          const licStatus = lic.authorizationStatus?.code || lic.authorizationStatus?.name || lic.status
          return mapAuthorityApiStatus(licStatus) === statusFilter
        })
        if (!hasStatus) return false
      }
      return true
    })
  }, [apiStaffRows, search, statusFilter, visibleAuthoritys])

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
    { value: 'not_complete', label: 'Expiring', dot: CUST_STATUS_META.not_complete.dot },
    { value: 'suspended', label: 'Expired', dot: CUST_STATUS_META.suspended.dot },
    { value: 'pending', label: 'Pending', dot: CUST_STATUS_META.pending.dot },
  ]

  if (isLoading || authorityRecordsLoading) {
    return <div className="flex items-center justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

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
            <div className="absolute top-full left-0 mt-1 w-[320px] bg-white rounded-xl border border-border shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Show Columns</span>
                <div className="flex gap-1.5">
                  <button onClick={selectAllAuthoritys} className="text-[10px] text-primary hover:underline font-medium">All</button>
                  <span className="text-muted-foreground/40">|</span>
                  <button onClick={deselectAllAuthoritys} className="text-[10px] text-primary hover:underline font-medium">Reset</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 max-h-[240px] overflow-y-auto">
                {apiAuthorities.map((authority, idx) => {
                  const localAuth = MAPPED_AUTHORITIES[authority.code] || { color: '#333', name: authority.name || authority.code }
                  return (
                    <button
                      key={authority._key}
                      onClick={() => toggleAuthority(authority._key)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-[11px] ${
                        authFilter.has(authority._key)
                          ? 'bg-primary/10 text-foreground font-semibold'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded border-2 flex items-center justify-center transition-all ${
                          authFilter.has(authority._key)
                            ? 'border-primary bg-primary'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {authFilter.has(authority._key) && (
                          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: localAuth.color }} />
                      <span className="truncate" title={localAuth.name}>
                        {authority.code} {localAuth.name && <span className="text-[9px] font-normal opacity-70">- {localAuth.name}</span>}
                      </span>
                    </button>
                  )
                })}
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
          Showing {filteredStaff.length} of {apiStaffRows.length} staff · {visibleAuthoritys.length} of {AUTHORITY_KEYS.length} authorities
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
              <TooltipProvider>
                {visibleAuthoritys.map((authority, idx) => {
                  const localAuth = MAPPED_AUTHORITIES[authority.code] || { color: '#333', name: authority.name || authority.code }
                  return (
                    <Tooltip key={authority._key}>
                      <TooltipTrigger asChild>
                        <th
                          className="px-1 py-2 text-center font-bold border-l border-border cursor-pointer hover:bg-muted/30 transition-colors"
                          style={{ minWidth: 90 }}
                        >
                          <div className="text-[10px] leading-snug font-bold" style={{ color: localAuth.color }}>{authority.code}</div>
                          <div className="text-[9px] text-muted-foreground/60 font-medium">Auth</div>
                        </th>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs font-semibold bg-white border border-border text-foreground px-2.5 py-1.5 shadow-md">
                        {localAuth.name}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </TooltipProvider>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s, ri) => {
                return (
                  <tr
                    key={s.staffId || `staff-${ri}`}
                    className={`group border-b border-border/50 transition-colors hover:bg-slate-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                  >
                    {/* Sticky Staff Column */}
                    <td className={`px-3 py-1.5 sticky left-0 z-10 border-r border-border transition-colors group-hover:bg-slate-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-500">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground leading-tight truncate" style={{ maxWidth: 160 }}>{s.staffName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{s.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    {/* Customer Auth Cells — dot style */}
                    {visibleAuthoritys.map((authority, idx) => {
                      const licenseItem = s.licenses?.find(l => {
                        const lKey = l.authorizationAuthorityMasterId || l.aviationAuthorityId
                        return lKey && lKey === authority._key
                      })
                      const rawStatus = licenseItem?.authorizationStatus?.code || licenseItem?.authorizationStatus?.name || licenseItem?.status
                      const val = mapAuthorityApiStatus(rawStatus)
                      
                      const meta = CUST_STATUS_META[val] || CUST_STATUS_META.pending
                      return (
                        <td
                          key={authority._key}
                          className="text-center border-l border-border/50 cursor-pointer transition-all duration-150 group/cell hover:bg-muted/60"
                          style={{ padding: '6px 4px', minWidth: 45, position: 'relative' }}
                          onMouseEnter={(e) => {
                            const localAuth = MAPPED_AUTHORITIES[authority.code] || { color: '#333', name: authority.name || authority.code }
                            handleCellEnter(e, s, authority.code, localAuth.name, localAuth.color, val, licenseItem)
                          }}
                          onMouseLeave={handleCellLeave}
                          onClick={() => {
                            const localAuth = MAPPED_AUTHORITIES[authority.code] || { color: '#333', name: authority.name || authority.code }
                            const masterId = typeof authority._key === 'number' ? authority._key : parseInt(String(authority._key).split('-')[1] || '0')
                            handleCellClick(s, authority.code, localAuth.name, authority.authorizationAuthorityMasterId || authority.aviationAuthorityId || authority.id || masterId, val, licenseItem)
                          }}
                        >
                          {/* Background layer with opacity */}
                          <div className="absolute inset-0 transition-opacity duration-150 opacity-40 group-hover/cell:opacity-70" style={{ background: meta.bg }} />
                          <div className="relative z-1 flex flex-col items-center gap-0.5">
                            {val === 'valid' ? (
                              <>
                                <div className="text-[8px] font-semibold leading-tight text-center whitespace-nowrap" style={{ color: meta.text }}>
                                  <div className="flex items-center gap-0.5 justify-center">
                                    <span className="text-muted-foreground/70">Curr:</span>
                                    <span>{formatShortDate(licenseItem?.currentIssueDate)}</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 justify-center mt-px">
                                    <span className="text-muted-foreground/70">Exp:</span>
                                    <span>{formatShortDate(licenseItem?.expireDate)}</span>
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
                            const days = getDaysRemaining(licenseItem?.expireDate)
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
        <DialogContent
          size="md"
          className="max-h-[92vh] w-[94vw] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border-border/60 p-0 shadow-2xl md:max-w-[996px] [&>button]:right-4 [&>button]:top-4 [&>button]:rounded-md [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:p-2"
        >
          {selectedCell && (
            <>
              <div className="border-b border-slate-200 bg-white px-5 py-4 pr-16">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="truncate text-lg font-bold text-slate-800">
                      {selectedCell.staff.staffName}
                    </DialogTitle>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {selectedCell.staff.employeeId} • License {selectedCell.licenseItem?.licenseNo || selectedCell.licenseItem?.aviationAuthorityLicense?.licenseNo || '—'}
                    </p>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold"
                    style={{
                      background: (CUST_STATUS_META[selectedCell.status] || CUST_STATUS_META.pending).bg,
                      color: (CUST_STATUS_META[selectedCell.status] || CUST_STATUS_META.pending).text
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: (CUST_STATUS_META[selectedCell.status] || CUST_STATUS_META.pending).dot }} />
                    {(CUST_STATUS_META[selectedCell.status] || CUST_STATUS_META.pending).label}
                  </span>
                </div>
              </div>

              <div className="min-h-0 space-y-3 overflow-y-auto bg-slate-50/40 px-5 py-4">
                {/* Authority summary */}
                <section className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Globe2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500">Authority</p>
                    <p className="truncate text-lg font-bold text-slate-800">
                      {selectedCell.authCode} — {selectedCell.authorityName}
                    </p>
                  </div>
                </section>

                {/* Edit Form */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    {/* Left Column: Dates */}
                    <section className="rounded-xl bg-slate-100/80 p-3 lg:col-span-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <CalendarDays className="h-4 w-4" />
                        </span>
                        <h3 className="text-xs font-bold text-slate-700">License Dates</h3>
                      </div>
                      <div className="space-y-2">
                        <label className={cn(
                          "block rounded-lg border bg-white px-3 py-2.5 shadow-sm",
                          showDateValidation && licenseDateErrors.initialIssueDate ? "border-red-400 ring-1 ring-red-100" : "border-slate-200",
                        )}>
                          <span className="block text-[10px] font-semibold text-slate-500">Date of Initial Issue</span>
                          <input
                            type="date"
                            required
                            value={editInitDate}
                            onChange={event => setEditInitDate(event.target.value)}
                            aria-invalid={showDateValidation && Boolean(licenseDateErrors.initialIssueDate)}
                            aria-describedby={showDateValidation && licenseDateErrors.initialIssueDate ? 'authority-initial-issue-date-error' : undefined}
                            className={cn(
                              "mt-1 w-full rounded bg-transparent text-sm font-bold text-slate-800 outline-none",
                              showDateValidation && licenseDateErrors.initialIssueDate && "text-red-700",
                            )}
                          />
                          {showDateValidation && licenseDateErrors.initialIssueDate && (
                            <span id="authority-initial-issue-date-error" className="mt-1 block text-[10px] font-medium text-red-600">
                              {licenseDateErrors.initialIssueDate}
                            </span>
                          )}
                        </label>
                        <label className={cn(
                          "block rounded-lg border bg-white px-3 py-2.5 shadow-sm",
                          showDateValidation && licenseDateErrors.currentIssueDate ? "border-red-400 ring-1 ring-red-100" : "border-slate-200",
                        )}>
                          <span className="block text-[10px] font-semibold text-slate-500">Date of Current Issue</span>
                          <input
                            type="date"
                            required
                            value={editCurrDate}
                            onChange={event => setEditCurrDate(event.target.value)}
                            aria-invalid={showDateValidation && Boolean(licenseDateErrors.currentIssueDate)}
                            aria-describedby={showDateValidation && licenseDateErrors.currentIssueDate ? 'authority-current-issue-date-error' : undefined}
                            className={cn(
                              "mt-1 w-full rounded bg-transparent text-sm font-bold text-slate-800 outline-none",
                              showDateValidation && licenseDateErrors.currentIssueDate && "text-red-700",
                            )}
                          />
                          {showDateValidation && licenseDateErrors.currentIssueDate && (
                            <span id="authority-current-issue-date-error" className="mt-1 block text-[10px] font-medium text-red-600">
                              {licenseDateErrors.currentIssueDate}
                            </span>
                          )}
                        </label>
                        <label className={cn(
                          "block rounded-lg border bg-white px-3 py-2.5 shadow-sm",
                          showDateValidation && licenseDateErrors.expiryDate ? "border-red-400 ring-1 ring-red-100" : "border-slate-200",
                        )}>
                          <span className="block text-[10px] font-semibold text-slate-500">Date of Expire</span>
                          <input
                            type="date"
                            required
                            value={editSamsExp}
                            onChange={event => setEditSamsExp(event.target.value)}
                            aria-invalid={showDateValidation && Boolean(licenseDateErrors.expiryDate)}
                            aria-describedby={showDateValidation && licenseDateErrors.expiryDate ? 'authority-expiry-date-error' : undefined}
                            className={cn(
                              "mt-1 w-full rounded bg-transparent text-sm font-bold text-slate-800 outline-none",
                              showDateValidation && licenseDateErrors.expiryDate && "text-red-700",
                            )}
                          />
                          {showDateValidation && licenseDateErrors.expiryDate && (
                            <span id="authority-expiry-date-error" className="mt-1 block text-[10px] font-medium text-red-600">
                              {licenseDateErrors.expiryDate}
                            </span>
                          )}
                        </label>
                      </div>
                    </section>

                    {/* Right Column: Aircraft checkboxes */}
                    <section className="flex min-h-[248px] flex-col rounded-xl border border-slate-200 bg-white p-3 lg:col-span-8">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Plane className="h-4 w-4" />
                          </span>
                          <h3 className="text-xs font-bold text-slate-700">Aircraft License</h3>
                        </div>
                        <div className="relative w-full sm:w-56">
                          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            type="search"
                            value={aircraftLicenseSearch}
                            onChange={event => setAircraftLicenseSearch(event.target.value)}
                            placeholder="Search license..."
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition-colors focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className={cn(
                        "min-h-0 flex-1 overflow-y-auto rounded-lg border p-1.5",
                        showAircraftValidation && aircraftValidationError ? "border-red-400 ring-1 ring-red-100" : "border-slate-200",
                      )}>
                        <div className="space-y-0.5 pr-1">
                          {filteredAircraftOptions.map(opt => {
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
                          {filteredAircraftOptions.length === 0 && (
                            <p className="px-3 py-8 text-center text-xs text-slate-400">No aircraft licenses found</p>
                          )}
                        </div>
                      </div>
                      {showAircraftValidation && aircraftValidationError && (
                        <p className="mt-1.5 text-[10px] font-medium text-red-600">{aircraftValidationError}</p>
                      )}
                    </section>
                </div>
              </div>

              <DialogFooter className="px-5 py-4 border-t border-border/60 bg-slate-50">
                <div className="flex items-center justify-between w-full">
                  {/* Left: Not Approved action — only for Pending & Expired */}
                  {(selectedCell.status === 'pending' || selectedCell.status === 'suspended') ? (
                    <PermissionActionGuard menuCode="QA_AUTHORIZATION" action="canEdit">
                      <Button
                        color="destructive"
                        disabled={upsertMutation.isPending || detailQuery.isFetching}
                        onClick={async () => {
                          if (!notApprovedStatusId) {
                            toast.error('Not Approved status is unavailable')
                            return
                          }
                          const license = selectedCell.licenseItem
                          const aircraftTypeLicenseIds = Array.from(editRating)
                            .map(rating => aircraftOptions.find(option => option.name === rating || option.code === rating)?.id ?? 0)
                            .filter(id => id > 0)
                          try {
                            await upsertMutation.mutateAsync({
                              authorizationAuthorityId: license?.authorizationAuthorityId ?? license?.aviationAuthorityId ?? license?.aviationAuthorityLicense?.id ?? 0,
                              staffId: selectedCell.staff.staffId,
                              authorizationAuthorityMasterId: selectedCell.masterId ?? 0,
                              licenseNo: detailQuery.data?.responseData.licenseNo ?? license?.licenseNo ?? null,
                              licenseLevel: detailQuery.data?.responseData.licenseLevel ?? license?.licenseLevel ?? null,
                              initialIssueDate: editInitDate || null,
                              currentIssueDate: editCurrDate || null,
                              expireDate: editSamsExp || null,
                              aircraftTypeLicenseIds,
                              authorizationStatusId: notApprovedStatusId,
                            })
                            toast.success('Authority authorization rejected successfully')
                            setSelectedCell(null)
                          } catch {
                            toast.error('Failed to reject authority authorization')
                          }
                        }}
                      >
                        Not Approved
                      </Button>
                    </PermissionActionGuard>
                  ) : <div />}

                  {/* Right: Cancel + Save */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setSelectedCell(null)} className="font-bold" disabled={upsertMutation.isPending}>
                      Cancel
                    </Button>
                    <PermissionActionGuard menuCode="QA_AUTHORIZATION" action="canEdit">
                      <Button
                        disabled={upsertMutation.isPending || detailQuery.isFetching}
                        onClick={async () => {
                          setShowDateValidation(true)
                          setShowAircraftValidation(true)
                          if (hasLicenseDateErrors || aircraftValidationError) {
                            toast.error('Please complete the required license information')
                            return
                          }
                          const license = selectedCell.licenseItem
                          const aircraftTypeLicenseIds = Array.from(editRating)
                            .map(rating => aircraftOptions.find(option => option.name === rating || option.code === rating)?.id ?? 0)
                            .filter(id => id > 0)
                          try {
                            await upsertMutation.mutateAsync({
                              authorizationAuthorityId: license?.authorizationAuthorityId ?? license?.aviationAuthorityId ?? license?.aviationAuthorityLicense?.id ?? 0,
                              staffId: selectedCell.staff.staffId,
                              authorizationAuthorityMasterId: selectedCell.masterId ?? 0,
                              licenseNo: detailQuery.data?.responseData.licenseNo ?? license?.licenseNo ?? null,
                              licenseLevel: detailQuery.data?.responseData.licenseLevel ?? license?.licenseLevel ?? null,
                              initialIssueDate: editInitDate || null,
                              currentIssueDate: editCurrDate || null,
                              expireDate: editSamsExp || null,
                              aircraftTypeLicenseIds,
                              authorizationStatusId: license?.authorizationStatusId ?? validStatusId,
                            })
                            toast.success('Authority authorization updated successfully')
                            setSelectedCell(null)
                          } catch {
                            toast.error('Failed to update authority authorization')
                          }
                        }}
                        className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
                      >
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
