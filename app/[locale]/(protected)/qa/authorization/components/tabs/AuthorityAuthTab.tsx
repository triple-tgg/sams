'use client'

import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { CalendarDays, Edit2, FileText, Filter, Globe2, Loader2, Plane, Search, User, X } from 'lucide-react'
import { TransferBox } from '@/components/ui/transfer-box'
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
import { useCombinations } from "@/lib/api/master/aircraft-engine/aircraftEngine.hooks"
import { groupCombinationDisplayLabels } from "@/lib/utils/aircraftEngineDisplay"
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
import { useSamsAuthList, useSamsAuthById, useUpsertSamsAuth } from '@/lib/api/qa/sams-auth.hooks'
import type { SamsAuthItem } from '@/lib/api/qa/sams-auth'
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
  aircraftOptions: { id: number; code: string; name: string; groupKey: string }[]
  x: number
  y: number       // cell bottom
  cellTop: number  // cell top
}

function CellTooltip({ info, combinations }: { info: TooltipInfo, combinations: any[] }) {
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
    if (!licenseItem?.aviationAuthorityLicenseAircrafts || licenseItem.aviationAuthorityLicenseAircrafts.length === 0) return '—';
    const engineIds = licenseItem.aviationAuthorityLicenseAircrafts
      .map(a => a.aircraftEngineId)
      .filter((id): id is number => typeof id === 'number' && id > 0);
    if (combinations && combinations.length > 0) {
      return groupCombinationDisplayLabels(engineIds, combinations)
    }
    return engineIds.map(String)
  }, [licenseItem, combinations])

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
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">Authority</span>
          <span className="font-bold" style={{ color: authorityColor }}>{authCode} — {authorityName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Authorization No.</span>
          <span className="font-semibold text-foreground">{licenseItem?.licenseNo || licenseItem?.aviationAuthorityLicense?.licenseNo || '—'}</span>
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
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Aircraft License</span>
          <div className="font-semibold text-foreground break-words space-y-0.5">
            {typeof mappedAircrafts === 'string' ? (
              mappedAircrafts
            ) : mappedAircrafts.length > 0 ? (
              mappedAircrafts.map((lic, i) => <div key={i}>- {lic}</div>)
            ) : '—'}
          </div>
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

  // Fetch SAMS auth data for AUTHORIZATION columns
  const samsAuthRequest = useMemo(() => ({
    searchKeyword: '',
    status: '',
    page: 1,
    perPage: 9999,
  }), [])
  const { data: samsAuthData } = useSamsAuthList(samsAuthRequest)
  const samsAuthByStaffId = useMemo(() => {
    const map = new Map<number, SamsAuthItem>()
    if (samsAuthData?.responseData) {
      samsAuthData.responseData.forEach(item => {
        map.set(item.staffId, item)
      })
    }
    return map
  }, [samsAuthData])

  // ── SAMS Auth Edit state ──
  const [samsEditTarget, setSamsEditTarget] = useState<SamsAuthItem | null>(null)
  const samsEditAuthId = samsEditTarget?.authorizationSamsId ?? null
  const { data: samsDetailResp, isPending: isSamsDetailPending, isFetching: isSamsDetailFetching } = useSamsAuthById(samsEditAuthId)
  const samsDetailData = samsDetailResp?.responseData ?? null
  const samsAuthorizationDetail = samsDetailData?.authorizationSamses ?? null
  const isSamsDetailLoading = samsEditAuthId !== null && (isSamsDetailPending || isSamsDetailFetching)
  const upsertSamsMutation = useUpsertSamsAuth()

  const [samsEditAuthNo, setSamsEditAuthNo] = useState('')
  const [samsEditInitDate, setSamsEditInitDate] = useState('')
  const [samsEditCurrDate, setSamsEditCurrDate] = useState('')
  const [samsEditExpDate, setSamsEditExpDate] = useState('')

  const toUtcIsoDate = (date: string): string | null =>
    date ? new Date(`${date}T00:00:00.000Z`).toISOString() : null

  useEffect(() => {
    if (samsDetailData && samsAuthorizationDetail && samsEditAuthId !== null) {
      setSamsEditAuthNo(samsAuthorizationDetail.authNo || '')
      setSamsEditInitDate(samsAuthorizationDetail.initialIssueDate?.split('T')[0] || '')
      setSamsEditCurrDate(samsAuthorizationDetail.currentIssueDate?.split('T')[0] || '')
      setSamsEditExpDate(samsAuthorizationDetail.expiryDate?.split('T')[0] || '')
    } else if (samsEditTarget && samsEditAuthId === null) {
      setSamsEditAuthNo(samsEditTarget.authorizationNo || '')
      setSamsEditInitDate(samsEditTarget.initialIssueDate?.split('T')[0] || '')
      setSamsEditCurrDate(samsEditTarget.currentIssueDate?.split('T')[0] || '')
      setSamsEditExpDate(samsEditTarget.samsExpiryDate?.split('T')[0] || '')
    }
  }, [samsDetailData, samsAuthorizationDetail, samsEditTarget, samsEditAuthId])

  const handleSamsEditClick = (staffId: number) => {
    const samsItem = samsAuthByStaffId.get(staffId)
    if (samsItem) setSamsEditTarget(samsItem)
  }

  const handleSamsEditClose = () => {
    setSamsEditTarget(null)
    setSamsEditAuthNo('')
    setSamsEditInitDate('')
    setSamsEditCurrDate('')
    setSamsEditExpDate('')
  }

  const handleSamsEditSave = async () => {
    if (!samsEditTarget) return
    try {
      const nowUtc = new Date().toISOString()
      await upsertSamsMutation.mutateAsync({
        authorizationSamses: {
          id: samsEditTarget.authorizationSamsId ?? 0,
          staffId: samsEditTarget.staffId,
          authNo: samsEditAuthNo,
          initialIssueDate: toUtcIsoDate(samsEditInitDate),
          currentIssueDate: toUtcIsoDate(samsEditCurrDate),
          expiryDate: toUtcIsoDate(samsEditExpDate),
          staffAmelLicenseId: samsAuthorizationDetail?.staffAmelLicenseId ?? 0,
          isCrs: samsAuthorizationDetail?.isCrs ?? true,
          isdelete: false,
          createddate: samsAuthorizationDetail?.createddate ?? nowUtc,
          createdby: samsAuthorizationDetail?.createdby ?? '',
          updateddate: nowUtc,
          updatedby: samsAuthorizationDetail?.updatedby ?? '',
        },
        aircraftEngineIds: samsEditTarget.staffAircraftLicenseList
          ?.filter(a => !a.isdelete)
          .map(a => a.aircraftEngineId || (a as any).aircraftTypeId)
          .filter((id): id is number => typeof id === 'number' && id > 0) || [],
      })
      toast.success('Authorization updated successfully')
      handleSamsEditClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update authorization')
    }
  }
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

  const { data: combinations = [] } = useCombinations()
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
    // Only overwrite form fields when the detail API returns actual values.
    // The handleCellClick already populates from matrix data; don't clear
    // those with null from the detail endpoint.
    if (detail.initialIssueDate) setEditInitDate(detail.initialIssueDate.split('T')[0])
    if (detail.currentIssueDate) setEditCurrDate(detail.currentIssueDate.split('T')[0])
    if (detail.expireDate) setEditSamsExp(detail.expireDate.split('T')[0])
    if (detail.aircrafts?.length > 0) {
      // Map aircraftEngineId → displayLabel from combinations (same logic as handleCellClick)
      const ratings = detail.aircrafts.map(aircraft => {
        const found = combinations.find(c => c.id === aircraft.aircraftEngineId)
        return found ? found.displayLabel : String(aircraft.aircraftEngineId)
      })
      setEditRating(new Set(ratings))
    }
  }, [detailQuery.data, selectedLicenseId, combinations])

  const aircraftOptions = useMemo(() => {
    return combinations.map(combo => ({
      id: combo.id,
      code: combo.displayLabel,
      name: combo.displayLabel,
      groupKey: combo.familyCode
    }))
  }, [combinations])

  const groupedAircraftOptions = useMemo(() => {
    const keyword = aircraftLicenseSearch.trim().toLowerCase()
    const options = keyword
      ? aircraftOptions.filter(opt => opt.name.toLowerCase().includes(keyword) || opt.code.toLowerCase().includes(keyword))
      : aircraftOptions

    const grouped = new Map<string, typeof aircraftOptions[0][]>()
    options.forEach(opt => {
      if (!grouped.has(opt.groupKey)) {
        grouped.set(opt.groupKey, [])
      }
      grouped.get(opt.groupKey)!.push(opt)
    })
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))
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
      const found = aircraftOptions.find(o => o.id === a.aircraftEngineId)
      return found ? found.name : String(a.aircraftEngineId)
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
              {/* ── Row 1: Group Headers ── */}
              <tr className="bg-slate-50 border-b border-border">
                <th
                  className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap sticky left-0 bg-slate-50 z-10 border-r border-border"
                  style={{ minWidth: 200 }}
                  rowSpan={2}
                >
                  Employee Name
                </th>
                <th
                  colSpan={4}
                  className="px-2 py-1.5 text-center font-bold text-[10px] uppercase tracking-wider text-white border-l border-r border-border"
                  style={{ background: '#2c5282' }}
                >
                  Authorization
                </th>
                {visibleAuthoritys.length > 0 && (
                  <th
                    colSpan={visibleAuthoritys.length}
                    className="px-2 py-1.5 text-center font-bold text-[10px] uppercase tracking-wider text-white border-l border-border"
                    style={{ background: '#2c5282' }}
                  >
                    Authority
                  </th>
                )}
              </tr>
              {/* ── Row 2: Sub-Headers ── */}
              <tr className="bg-slate-50 border-b-2 border-border">
                <th className="px-2 py-1.5 text-center text-[9px] font-bold text-muted-foreground border-l border-border whitespace-nowrap" style={{ minWidth: 100 }}>
                  Authorization No.
                </th>
                <th className="px-2 py-1.5 text-center text-[9px] font-bold text-muted-foreground border-l border-border whitespace-nowrap" style={{ minWidth: 90 }}>
                  Date<br/>of Initial Issue
                </th>
                <th className="px-2 py-1.5 text-center text-[9px] font-bold text-muted-foreground border-l border-border whitespace-nowrap" style={{ minWidth: 90 }}>
                  Date<br/>of Current Issue
                </th>
                <th className="px-2 py-1.5 text-center text-[9px] font-bold text-muted-foreground border-l border-r border-border whitespace-nowrap" style={{ minWidth: 90 }}>
                  Date<br/>of Expire
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
                // Resolve SAMS auth data for AUTHORIZATION columns
                const samsAuth = samsAuthByStaffId.get(s.staffId)
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
                    {/* AUTHORIZATION — Authorization No. + Edit Button */}
                    <td className="px-2 py-1.5 text-center text-[10px] font-semibold text-slate-700 border-l border-border/50 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <span>{samsAuth?.authorizationNo || '—'}</span>
                        {samsAuth && (
                          <PermissionActionGuard menuCode="QA_AUTHORIZATION" action="canEdit">
                            <button
                              onClick={() => handleSamsEditClick(s.staffId)}
                              className="inline-flex items-center justify-center w-5 h-5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Authorization"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </PermissionActionGuard>
                        )}
                      </div>
                    </td>
                    {/* AUTHORIZATION — Date of Initial Issue */}
                    <td className="px-2 py-1.5 text-center text-[10px] text-muted-foreground border-l border-border/50 whitespace-nowrap">
                      {formatShortDate(samsAuth?.initialIssueDate)}
                    </td>
                    {/* AUTHORIZATION — Date of Current Issue */}
                    <td className="px-2 py-1.5 text-center text-[10px] text-muted-foreground border-l border-border/50 whitespace-nowrap">
                      {formatShortDate(samsAuth?.currentIssueDate)}
                    </td>
                    {/* AUTHORIZATION — Date of Expire */}
                    <td className="px-2 py-1.5 text-center text-[10px] font-semibold border-l border-r border-border/50 whitespace-nowrap" style={{
                      color: (() => {
                        const days = getDaysRemaining(samsAuth?.samsExpiryDate)
                        if (days === null) return undefined
                        if (days < 0) return '#dc2626'
                        if (days <= 90) return '#ea580c'
                        return '#059669'
                      })()
                    }}>
                      {formatShortDate(samsAuth?.samsExpiryDate)}
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
      {tooltip && <CellTooltip info={tooltip} combinations={combinations} />}

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

                    {/* Right Column: Aircraft Transfer Box */}
                    <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 lg:col-span-8">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Plane className="h-4 w-4" />
                        </span>
                        <h3 className="text-xs font-bold text-slate-700">Aircraft License</h3>
                      </div>
                      <TransferBox
                        items={aircraftOptions}
                        selected={editRating}
                        onSelectedChange={setEditRating}
                        emptyIcon={<Plane className="h-8 w-8 mb-2 opacity-30" />}
                        emptyLabel="No items selected"
                        hasError={showAircraftValidation && !!aircraftValidationError}
                        height={260}
                        renderSelectedGroupLabel={(_groupKey, groupItems) => {
                          // Group by familyCode + engineCode and merge series
                          const subGroups = new Map<string, { familyCode: string; engineCode: string; seriesList: string[] }>()
                          for (const item of groupItems) {
                            const combo = combinations.find(c => c.displayLabel === item.name)
                            if (!combo) continue
                            const key = `${combo.familyCode}|${combo.engineCode}`
                            const existing = subGroups.get(key)
                            if (existing) {
                              if (combo.series && !existing.seriesList.includes(combo.series)) existing.seriesList.push(combo.series)
                            } else {
                              subGroups.set(key, { familyCode: combo.familyCode, engineCode: combo.engineCode, seriesList: combo.series ? [combo.series] : [] })
                            }
                          }
                          return Array.from(subGroups.values())
                            .map(g => {
                              const seriesPart = g.seriesList.length > 0 ? ` - ${g.seriesList.join('/')}` : ''
                              return `${g.familyCode}${seriesPart} (${g.engineCode})`
                            })
                            .join(', ')
                        }}
                      />
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
                          const aircraftEngineIds = Array.from(editRating)
                            .map(rating => aircraftOptions.find(option => option.name === rating || option.code === rating)?.id ?? 0)
                            .filter(id => id > 0)
                          try {
                            const todayStr = new Date().toISOString()
                            await upsertMutation.mutateAsync({
                              authorizationAuthorityId: license?.authorizationAuthorityId ?? license?.aviationAuthorityId ?? license?.aviationAuthorityLicense?.id ?? 0,
                              staffId: selectedCell.staff.staffId,
                              authorizationAuthorityMasterId: selectedCell.masterId ?? 0,
                              licenseNo: detailQuery.data?.responseData.licenseNo ?? license?.licenseNo ?? null,
                              licenseLevel: detailQuery.data?.responseData.licenseLevel ?? license?.licenseLevel ?? null,
                              initialIssueDate: editInitDate || todayStr,
                              currentIssueDate: editCurrDate || todayStr,
                              expireDate: editSamsExp || todayStr,
                              aircraftEngineIds,
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
                          const aircraftEngineIds = Array.from(editRating)
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
                              aircraftEngineIds,
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

      {/* SAMS Auth Edit Dialog */}
      <Dialog open={!!samsEditTarget} onOpenChange={(open) => !open && handleSamsEditClose()}>
        <DialogContent
          size="sm"
          className="max-w-[420px] gap-0 overflow-hidden border-border/60 p-0 shadow-2xl [&>button]:right-3 [&>button]:top-3 [&>button]:rounded-md [&>button]:border [&>button]:border-slate-200 [&>button]:bg-white [&>button]:p-1.5"
        >
          {isSamsDetailLoading ? (
            <div className="flex items-center justify-center py-16">
              <DialogTitle className="sr-only">Loading</DialogTitle>
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : samsEditTarget ? (
            <>
              <DialogTitle className="sr-only">Edit Authorization</DialogTitle>
              <div className="px-5 pt-5 pb-4 space-y-4">
                {/* Staff Info */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{samsEditTarget.employeeName}</p>
                    <p className="text-[10px] font-semibold text-slate-400">{samsEditTarget.employeeId}</p>
                  </div>
                </div>

                {/* Authorization No. */}
                <div>
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5">Authorization No.</span>
                  <input
                    type="text"
                    value={samsEditAuthNo}
                    onChange={e => setSamsEditAuthNo(e.target.value)}
                    placeholder="Enter authorization number"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition-colors placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Date Fields — 1 row each */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
                    <span className="text-[11px] font-semibold text-slate-500 w-[130px] shrink-0">Date of Initial Issue</span>
                    <input
                      type="date"
                      value={samsEditInitDate}
                      onChange={e => setSamsEditInitDate(e.target.value)}
                      disabled={samsEditAuthId !== null}
                      className={cn(
                        "w-full bg-transparent text-xs font-bold outline-none",
                        samsEditAuthId !== null ? "cursor-not-allowed text-slate-400" : "text-slate-800",
                      )}
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
                    <span className="text-[11px] font-semibold text-slate-500 w-[130px] shrink-0">Date of Current Issue</span>
                    <input
                      type="date"
                      value={samsEditCurrDate}
                      onChange={e => setSamsEditCurrDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
                    <span className="text-[11px] font-semibold text-slate-500 w-[130px] shrink-0">Date of Expire</span>
                    <input
                      type="date"
                      value={samsEditExpDate}
                      onChange={e => setSamsEditExpDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                    />
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <Button variant="outline" size="sm" onClick={handleSamsEditClose} className="text-xs font-bold">
                  Cancel
                </Button>
                <PermissionActionGuard menuCode="QA_AUTHORIZATION" action="canEdit">
                  <Button
                    size="sm"
                    onClick={handleSamsEditSave}
                    disabled={upsertSamsMutation.isPending}
                    className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {upsertSamsMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </PermissionActionGuard>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
