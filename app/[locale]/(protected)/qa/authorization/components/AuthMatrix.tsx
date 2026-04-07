'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    StaffAuthorization, CustomerAirline, AuthStatus,
    getAuthStatus, getDaysUntilExpiry, isCrsEligible,
    AUTH_STATUS_META, fmtDate,
} from '../types'
import { StaffAuthDrawer } from './StaffAuthDrawer'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface AuthMatrixProps {
    staff: StaffAuthorization[]
    customers: CustomerAirline[]
}

function StatusDot({ status }: { status: AuthStatus }) {
    const m = AUTH_STATUS_META[status]
    return (
        <div className="flex flex-col items-center gap-0.5">
            <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                    background: m.dot,
                    boxShadow: status === 'expired' ? `0 0 0 3px ${m.ringColor}` :
                               status === 'expiring' ? `0 0 0 2px ${m.ringColor}` :
                               status === 'suspended' ? `0 0 0 2px ${m.ringColor}` : 'none'
                }}
            />
        </div>
    )
}

function AuthCell({ status, days }: { status: AuthStatus; days: number | null }) {
    const m = AUTH_STATUS_META[status]
    return (
        <td className="text-center border-l border-border/50 transition-opacity" style={{ background: m.bg, padding: '6px 4px', minWidth: 45 }}>
            <StatusDot status={status} />
            {status === 'expiring' && days !== null && (
                <div className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: m.text }}>{days}d</div>
            )}
            {status === 'expired' && (
                <div className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: m.text }}>EXP</div>
            )}
            {status === 'suspended' && (
                <div className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: m.text }}>SUS</div>
            )}
        </td>
    )
}

type SortField = 'no' | 'name' | 'sams' | 'crs'
type SortDir = 'asc' | 'desc'

export function AuthMatrix({ staff, customers }: AuthMatrixProps) {
    const [sortField, setSortField] = useState<SortField>('no')
    const [sortDir, setSortDir] = useState<SortDir>('asc')
    const [selectedStaff, setSelectedStaff] = useState<StaffAuthorization | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)

    // Pagination
    const [pageIndex, setPageIndex] = useState(0)
    const pageSize = 15

    // ── Tooltip state ────────────────────────────────────────────────────────
    const [hoveredStaff, setHoveredStaff] = useState<StaffAuthorization | null>(null)
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; above: boolean }>({ x: 0, y: 0, above: false })
    const tableContainerRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)

    const handleRowMouseMove = (e: React.MouseEvent<HTMLTableRowElement>, s: StaffAuthorization) => {
        const viewportW = window.innerWidth
        const viewportH = window.innerHeight
        const tooltipW = 320 // w-80 = 20rem = 320px
        const tooltipH = tooltipRef.current?.offsetHeight || 380
        const margin = 12

        // Clamp X: prefer right of cursor, flip left if overflows
        let x = e.clientX + 16
        if (x + tooltipW + margin > viewportW) {
            x = e.clientX - tooltipW - 16
        }
        x = Math.max(margin, Math.min(x, viewportW - tooltipW - margin))

        // Clamp Y: prefer below cursor, flip above if overflows
        const spaceBelow = viewportH - e.clientY
        const above = spaceBelow < tooltipH + 20
        let y: number
        if (above) {
            y = Math.max(margin, e.clientY - tooltipH - 8)
        } else {
            y = Math.min(e.clientY + 8, viewportH - tooltipH - margin)
        }

        setTooltipPos({ x, y, above: false }) // above flag no longer needed, y is absolute
        if (hoveredStaff?.staffId !== s.staffId) {
            setHoveredStaff(s)
        }
    }

    const handleRowMouseLeave = () => {
        setHoveredStaff(null)
    }

    // ── Airline column filter ────────────────────────────────────────────────
    const allIds = useMemo(() => customers.map(c => c.id), [customers])
    const [airlineFilter, setAirlineFilter] = useState<Set<string>>(new Set())
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const toggleAirline = (id: string) => {
        setAirlineFilter(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }
    const selectAll = () => setAirlineFilter(new Set(allIds))
    const deselectAll = () => setAirlineFilter(new Set())

    const visibleCustomers = useMemo(() =>
        customers.filter(c => airlineFilter.has(c.id))
    , [customers, airlineFilter])

    const isColumnFiltered = airlineFilter.size > 0

    // ── Sorting ──────────────────────────────────────────────────────────────
    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortDir('asc') }
        setPageIndex(0)
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <span className="text-muted-foreground/30 text-[10px]">⇅</span>
        return <span className="text-primary text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
    }

    const sorted = [...staff].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        switch (sortField) {
            case 'no': return (a.staffNo - b.staffNo) * dir
            case 'name': return a.name.localeCompare(b.name) * dir
            case 'sams': {
                const order: AuthStatus[] = ['expired', 'suspended', 'expiring', 'not-issued', 'active']
                return (order.indexOf(getAuthStatus(a.samsAuth)) - order.indexOf(getAuthStatus(b.samsAuth))) * dir
            }
            case 'crs': {
                const aOk = isCrsEligible(a) ? 1 : 0
                const bOk = isCrsEligible(b) ? 1 : 0
                return (aOk - bOk) * dir
            }
            default: return 0
        }
    })

    const totalPages = Math.ceil(sorted.length / pageSize)
    const paginatedStaff = sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

    const handleRowClick = (s: StaffAuthorization) => {
        setSelectedStaff(s)
        setDrawerOpen(true)
    }

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

    // ── Tooltip data ─────────────────────────────────────────────────────────
    const tooltipData = useMemo(() => {
        if (!hoveredStaff) return null
        const s = hoveredStaff
        const samsStatus = getAuthStatus(s.samsAuth)
        const samsDays = getDaysUntilExpiry(s.samsAuth)
        const crsOk = isCrsEligible(s)
        const custEntries = Object.entries(s.customerAuths)
        const total = custEntries.length
        const activeCount = custEntries.filter(([, rec]) => {
            const st = getAuthStatus(rec)
            return st === 'active' || st === 'expiring'
        }).length
        const expiringCount = custEntries.filter(([, rec]) => getAuthStatus(rec) === 'expiring').length
        const expiredCount = custEntries.filter(([, rec]) => getAuthStatus(rec) === 'expired').length
        const suspendedCount = custEntries.filter(([, rec]) => getAuthStatus(rec) === 'suspended').length
        const notIssuedCount = custEntries.filter(([, rec]) => getAuthStatus(rec) === 'not-issued').length
        return { s, samsStatus, samsDays, crsOk, total, activeCount, expiringCount, expiredCount, suspendedCount, notIssuedCount }
    }, [hoveredStaff])

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            {/* Airline Column Filter Bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/20">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(v => !v)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                            isColumnFiltered
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                        }`}
                    >
                        <Filter className="w-3 h-3" />
                        Airlines
                        {isColumnFiltered && (
                            <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                {airlineFilter.size}/{allIds.length}
                            </span>
                        )}
                    </button>
                    {showDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-border shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-border">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Show Columns</span>
                                <div className="flex gap-1.5">
                                    <button onClick={selectAll} className="text-[10px] text-primary hover:underline font-medium">All</button>
                                    <span className="text-muted-foreground/40">|</span>
                                    <button onClick={deselectAll} className="text-[10px] text-primary hover:underline font-medium">Reset</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-0.5 max-h-[240px] overflow-y-auto">
                                {customers.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => toggleAirline(c.id)}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-[11px] ${
                                            airlineFilter.has(c.id)
                                                ? 'bg-primary/10 text-foreground font-semibold'
                                                : 'text-muted-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        <div
                                            className={`w-3 h-3 rounded border-2 flex items-center justify-center transition-all ${
                                                airlineFilter.has(c.id)
                                                    ? 'border-primary bg-primary'
                                                    : 'border-slate-300 bg-white'
                                            }`}
                                        >
                                            {airlineFilter.has(c.id) && (
                                                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                                        {c.code}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {isColumnFiltered && (
                    <>
                        <span className="text-[11px] text-muted-foreground">
                            {airlineFilter.size} of {allIds.length} airlines
                        </span>
                        <button
                            onClick={deselectAll}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-all"
                        >
                            <X className="w-3 h-3" />
                            Clear
                        </button>
                    </>
                )}
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto relative" ref={tableContainerRef}>
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-muted/50 border-b-2 border-border">
                            <th className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none" style={{ minWidth: 40 }} onClick={() => handleSort('no')}>
                                <span className="inline-flex items-center gap-1"># <SortIcon field="no" /></span>
                            </th>
                            <th className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none" style={{ minWidth: 220 }} onClick={() => handleSort('name')}>
                                <span className="inline-flex items-center gap-1">Employee Name <SortIcon field="name" /></span>
                            </th>
                            <th className="px-3 py-2 text-left text-muted-foreground font-bold whitespace-nowrap border-l border-border" style={{ minWidth: 130 }}>
                                <div className="text-[10px]">Authorization No.</div>
                            </th>
                            <th className="px-3 py-2 text-center text-muted-foreground font-bold whitespace-nowrap border-l border-border" style={{ minWidth: 90 }}>
                                <div className="text-[10px]">Initial Issue</div>
                            </th>
                            <th className="px-3 py-2 text-center text-muted-foreground font-bold whitespace-nowrap border-l border-border" style={{ minWidth: 90 }}>
                                <div className="text-[10px]">Current Issue</div>
                            </th>
                            <th className="px-3 py-2 text-center text-muted-foreground font-bold border-l border-border" style={{ minWidth: 90 }}>
                                <div className="text-[10px]">SAMS Expiry</div>
                            </th>
                            {/* SAMS Auth status dot */}
                            <th className="px-2 py-2 text-center text-muted-foreground font-bold border-l-2 border-border cursor-pointer hover:text-foreground transition-colors select-none" style={{ minWidth: 55 }} onClick={() => handleSort('sams')}>
                                <div className="text-[10px] leading-snug">SAMS</div>
                                <div className="text-[9px] text-muted-foreground/60 font-medium">Auth</div>
                                <SortIcon field="sams" />
                            </th>
                            {/* Customer columns */}
                            {visibleCustomers.map(c => (
                                <th key={c.id} className="px-1 py-2 text-center text-muted-foreground font-bold border-l border-border" style={{ minWidth: 50 }}>
                                    <div className="text-[10px] leading-snug font-bold" style={{ color: c.color }}>{c.code}</div>
                                    <div className="text-[9px] text-muted-foreground/60 font-medium">Auth</div>
                                </th>
                            ))}
                            {/* Summary */}
                            <th className="px-2 py-2 text-center text-muted-foreground font-bold border-l-2 border-border" style={{ minWidth: 75 }}>
                                <div className="text-[10px] leading-snug">Customer</div>
                                <div className="text-[9px] text-muted-foreground/60 font-medium">Auth</div>
                            </th>
                            {/* CRS */}
                            <th className="px-3 py-2 text-center text-muted-foreground font-bold border-l-2 border-border cursor-pointer hover:text-foreground transition-colors select-none" style={{ minWidth: 70 }} onClick={() => handleSort('crs')}>
                                <span className="inline-flex items-center gap-1">CRS <SortIcon field="crs" /></span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedStaff.map((s, ri) => {
                            const samsStatus = getAuthStatus(s.samsAuth)
                            const samsDays = getDaysUntilExpiry(s.samsAuth)
                            const crsOk = isCrsEligible(s)
                            const hasIssue = samsStatus === 'expired' || samsStatus === 'suspended' ||
                                Object.values(s.customerAuths).some(r => {
                                    const st = getAuthStatus(r)
                                    return st === 'expired' || st === 'suspended'
                                })

                            const custEntries = Object.values(s.customerAuths)
                            const total = custEntries.length
                            const activeCount = custEntries.filter(rec => {
                                const st = getAuthStatus(rec)
                                return st === 'active' || st === 'expiring'
                            }).length
                            const pct = total > 0 ? Math.round(activeCount / total * 100) : 0

                            return (
                                <tr
                                    key={s.staffId}
                                    onClick={() => handleRowClick(s)}
                                    onMouseMove={(e) => handleRowMouseMove(e, s)}
                                    onMouseLeave={handleRowMouseLeave}
                                    className={`border-b border-border/50 cursor-pointer transition-colors ${
                                        hasIssue ? (ri % 2 === 0 ? 'bg-amber-50/50' : 'bg-amber-50/30') :
                                        ri % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                                    } hover:bg-muted/40`}
                                >
                                    <td className="px-3 py-1.5 text-muted-foreground font-semibold">{s.staffNo}</td>
                                    <td className="px-3 py-1.5">
                                        <div className="font-semibold text-foreground whitespace-nowrap">{s.name}</div>
                                        <div className="text-[10px] text-primary font-bold">{s.staffId}</div>
                                    </td>
                                    <td className="px-3 py-1.5 border-l border-border text-[11px] font-bold text-slate-700 whitespace-nowrap">
                                        {s.samsAuth?.authNumber || '—'}
                                    </td>
                                    <td className="px-3 py-1.5 border-l border-border text-center text-[10px] text-muted-foreground whitespace-nowrap">
                                        {s.samsAuth?.initialIssueDate ? fmtDate(s.samsAuth.initialIssueDate) : '—'}
                                    </td>
                                    <td className="px-3 py-1.5 border-l border-border text-center text-[10px] text-muted-foreground whitespace-nowrap">
                                        {s.samsAuth?.issueDate ? fmtDate(s.samsAuth.issueDate) : '—'}
                                    </td>
                                    <td className="px-3 py-1.5 text-center border-l border-border text-[10px] font-semibold whitespace-nowrap" style={{ color: AUTH_STATUS_META[samsStatus].text }}>
                                        {s.samsAuth ? fmtDate(s.samsAuth.expiryDate) : '—'}
                                    </td>
                                    <AuthCell status={samsStatus} days={samsDays} />
                                    {visibleCustomers.map(c => {
                                        const rec = s.customerAuths[c.id]
                                        const st = getAuthStatus(rec)
                                        const d = getDaysUntilExpiry(rec)
                                        return <AuthCell key={c.id} status={st} days={d} />
                                    })}
                                    {/* Summary */}
                                    <td className="px-2 py-1.5 text-center border-l-2 border-border">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[11px] font-bold text-foreground">{activeCount}/{total}</span>
                                            <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${pct}%`,
                                                        background: pct === 100 ? '#16a34a' : pct >= 80 ? '#d97706' : '#dc2626',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    {/* CRS */}
                                    <td className="px-3 py-1.5 text-center border-l-2 border-border">
                                        {crsOk ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-[11px]">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                YES
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-red-600 font-extrabold text-[11px]">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                NO
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination & Footer */}
            <div className="flex items-center justify-between border border-t-0 border-border px-4 py-3 bg-white rounded-b-xl">
                <div className="text-xs font-medium text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{sorted.length === 0 ? 0 : pageIndex * pageSize + 1}</span> to <span className="font-semibold text-foreground">{Math.min((pageIndex + 1) * pageSize, sorted.length)}</span> of <span className="font-semibold text-foreground">{sorted.length}</span> entries
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

            <div className="relative">
                {/* ── Row-hover Tooltip — auto-positioned ── */}
                {tooltipData && hoveredStaff && (
                    <div
                        ref={tooltipRef}
                        className="fixed z-[9999] w-80 p-4 rounded-xl bg-white border border-border shadow-2xl pointer-events-none animate-in fade-in duration-100 max-h-[calc(100vh-24px)] overflow-y-auto"
                        style={{
                            left: tooltipPos.x,
                            top: tooltipPos.y,
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3 pb-2 border-b border-border">
                            <div>
                                <div className="text-[12px] font-bold text-foreground">{tooltipData.s.name}</div>
                                <div className="text-[10px] text-primary font-bold mt-0.5">{tooltipData.s.staffId}</div>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0" style={{
                                background: tooltipData.crsOk ? '#dcfce7' : '#fef2f2',
                                color: tooltipData.crsOk ? '#15803d' : '#991b1b',
                            }}>
                                <span className="w-2 h-2 rounded-full" style={{ background: tooltipData.crsOk ? '#16a34a' : '#dc2626' }} />
                                CRS {tooltipData.crsOk ? 'Eligible' : 'Ineligible'}
                            </div>
                        </div>

                        {/* Staff Info Grid */}
                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[10px] mb-3">
                            <span className="text-muted-foreground">Position</span>
                            <span className="font-semibold text-foreground">{tooltipData.s.position}</span>

                            <span className="text-muted-foreground">Group</span>
                            <span className="font-semibold text-foreground">{tooltipData.s.posGroup}</span>

                            <span className="text-muted-foreground">Auth No.</span>
                            <span className="font-bold text-slate-700">{tooltipData.s.samsAuth?.authNumber || '—'}</span>

                            <span className="text-muted-foreground">Initial Issue</span>
                            <span className="font-semibold text-foreground">{tooltipData.s.samsAuth?.initialIssueDate ? fmtDate(tooltipData.s.samsAuth.initialIssueDate) : '—'}</span>

                            <span className="text-muted-foreground">Current Issue</span>
                            <span className="font-semibold text-foreground">{tooltipData.s.samsAuth?.issueDate ? fmtDate(tooltipData.s.samsAuth.issueDate) : '—'}</span>

                            <span className="text-muted-foreground">SAMS Expiry</span>
                            <span className="font-bold" style={{ color: AUTH_STATUS_META[tooltipData.samsStatus].text }}>
                                {tooltipData.s.samsAuth ? fmtDate(tooltipData.s.samsAuth.expiryDate) : '—'}
                                {tooltipData.samsDays !== null && (
                                    <span className="ml-1 font-medium opacity-80">
                                        ({tooltipData.samsDays > 0 ? `${tooltipData.samsDays}d remaining` : `${Math.abs(tooltipData.samsDays)}d overdue`})
                                    </span>
                                )}
                            </span>

                            <span className="text-muted-foreground">SAMS Status</span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: AUTH_STATUS_META[tooltipData.samsStatus].dot }} />
                                <span className="font-bold" style={{ color: AUTH_STATUS_META[tooltipData.samsStatus].text }}>{AUTH_STATUS_META[tooltipData.samsStatus].label}</span>
                            </span>

                            {tooltipData.s.samsAuth?.scope && tooltipData.s.samsAuth.scope.length > 0 && (
                                <>
                                    <span className="text-muted-foreground">Scope / Rating</span>
                                    <span className="font-semibold text-foreground">{tooltipData.s.samsAuth.scope.join(', ')}</span>
                                </>
                            )}

                            <span className="text-muted-foreground">Issued By</span>
                            <span className="font-semibold text-foreground">{tooltipData.s.samsAuth?.issuedBy || '—'}</span>
                        </div>

                        {/* Customer Auth Summary */}
                        <div className="pt-2 border-t border-border">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Customer Authorization</div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                                <span className="inline-flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="font-semibold text-emerald-700">{tooltipData.activeCount} Active</span>
                                </span>
                                {tooltipData.expiringCount > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="font-semibold text-amber-600">{tooltipData.expiringCount} Expiring</span>
                                    </span>
                                )}
                                {tooltipData.expiredCount > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="font-semibold text-red-600">{tooltipData.expiredCount} Expired</span>
                                    </span>
                                )}
                                {tooltipData.suspendedCount > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span className="font-semibold text-purple-600">{tooltipData.suspendedCount} Suspended</span>
                                    </span>
                                )}
                                {tooltipData.notIssuedCount > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                                        <span className="font-semibold text-slate-500">{tooltipData.notIssuedCount} Not Issued</span>
                                    </span>
                                )}
                                <span className="text-muted-foreground ml-auto">{tooltipData.activeCount}/{tooltipData.total} total</span>
                            </div>
                        </div>

                        {/* Remarks */}
                        {tooltipData.s.samsAuth?.remarks && (
                            <div className="mt-2 pt-2 border-t border-amber-200 bg-amber-50/50 rounded-lg px-2 py-1.5 -mx-1">
                                <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Remarks</div>
                                <div className="text-[10px] font-medium text-amber-800">{tooltipData.s.samsAuth.remarks}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <StaffAuthDrawer
                staff={selectedStaff}
                customers={customers}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            />
        </>
    )
}
