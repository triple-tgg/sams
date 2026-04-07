'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Info, ShieldCheck, AlertTriangle, ShieldX, Filter, X, Search } from 'lucide-react'
import { STAFF, AIRLINES } from '../../data-v2'
import { AIRLINE_KEYS, SAMS_STATUS_META, CRS_STATUS_META, CUST_STATUS_META } from '../../types-v2'
import type { CrsStatus, AirlineKey, CustomerAuthValue } from '../../types-v2'
import { getSamsStatus, getCrsStatus, countValidAirlines, countTotalAirlines } from '../../utils'

type FilterCrs = 'all' | 'full' | 'partial' | 'none'

export function CrsTab() {
  const [filter, setFilter] = useState<FilterCrs>('all')
  const [search, setSearch] = useState('')
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

  const toggleAirline = (code: AirlineKey) => {
    setAirlineFilter(prev => {
      const next = new Set(prev)
      if (next.has(code)) { if (next.size > 1) next.delete(code) }
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

  const counts = useMemo(() => ({
    all: STAFF.length,
    full: STAFF.filter(s => getCrsStatus(s) === 'full').length,
    partial: STAFF.filter(s => getCrsStatus(s) === 'partial').length,
    none: STAFF.filter(s => getCrsStatus(s) === 'none').length,
  }), [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return STAFF.filter(s => {
      // CRS status filter
      if (filter !== 'all' && getCrsStatus(s) !== filter) return false
      // Search
      if (q) {
        const nameMatch = s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
        if (!nameMatch) return false
      }
      return true
    })
  }, [filter, search])

  const isFiltering = search !== '' || filter !== 'all' || airlineFilter.size !== AIRLINE_KEYS.length

  const clearFilters = () => {
    setSearch('')
    setFilter('all')
    setAirlineFilter(new Set(AIRLINE_KEYS))
  }

  // Determine per-airline CRS eligibility for a staff
  const getAirlineCrs = (s: typeof STAFF[0], code: AirlineKey): 'eligible' | 'not_eligible' | 'no_auth' => {
    const custVal = s.cust[code]
    if (!custVal) return 'no_auth'
    const samsStatus = getSamsStatus(s)
    if (samsStatus === 'expired') return 'not_eligible'
    if (custVal === 'valid') return 'eligible'
    return 'not_eligible'
  }

  const AIRLINE_CRS_META = {
    eligible: { bg: '#dcfce7', dot: '#16a34a', text: '#15803d', label: 'CRS ✓' },
    not_eligible: { bg: '#fee2e2', dot: '#dc2626', text: '#991b1b', label: 'CRS ✕' },
    no_auth: { bg: '#f8fafc', dot: '#cbd5e1', text: '#94a3b8', label: '—' },
  }

  return (
    <div className="space-y-4">
      {/* ── Info Banner ── */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 leading-relaxed">
          <p className="font-bold mb-1">Part-145 Dual-Authorization Rule</p>
          <p>
            เพื่อออก Certificate of Release to Service (CRS) ได้ พนักงานต้องมี <strong>SAMS Authorization ที่ยังไม่หมดอายุ</strong> และ{' '}
            <strong>Customer Authorization จากทุกสายการบินที่ valid</strong>
          </p>
          <ul className="mt-1.5 space-y-0.5 text-[11px]">
            <li>✅ <strong>Full CRS</strong> — SAMS valid + ทุก customer auth = valid</li>
            <li>⚠️ <strong>Partial CRS</strong> — SAMS valid/expiring แต่ customer auth ไม่ครบ</li>
            <li>⛔ <strong>No CRS</strong> — SAMS expired → ไม่สามารถออก CRS ได้ทุกกรณี</li>
          </ul>
        </div>
      </div>

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

        {/* CRS Filter Chips */}
        <div className="flex items-center gap-1">
          {([
            { key: 'all' as FilterCrs, label: 'ทั้งหมด', color: '#475569' },
            { key: 'full' as FilterCrs, label: 'Full CRS', color: '#16a34a' },
            { key: 'partial' as FilterCrs, label: 'Partial', color: '#d97706' },
            { key: 'none' as FilterCrs, label: 'No CRS', color: '#dc2626' },
          ]).map(chip => (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                filter === chip.key
                  ? 'text-white shadow-sm border-transparent'
                  : 'bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }`}
              style={filter === chip.key ? { background: chip.color, borderColor: chip.color } : {}}
            >
              {chip.label} ({counts[chip.key]})
            </button>
          ))}
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
          Showing {filtered.length} of {STAFF.length} staff · {visibleAirlines.length} of {AIRLINE_KEYS.length} airlines
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl border border-border overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-border">
                <th className="px-3 py-2.5 text-left text-muted-foreground font-bold text-[10px] uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r border-border" style={{ minWidth: 200 }}>พนักงาน</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider border-l border-border" style={{ minWidth: 100 }}>SAMS</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider border-l border-border" style={{ minWidth: 100 }}>CRS Status</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider border-l border-border" style={{ minWidth: 80 }}>Summary</th>
                {/* Airline Columns */}
                {visibleAirlines.map(code => (
                  <th
                    key={code}
                    className="px-1 py-2.5 text-center font-bold border-l border-border"
                    style={{ minWidth: 48 }}
                    title={AIRLINES[code].name}
                  >
                    <div className="text-[10px] leading-snug font-bold" style={{ color: AIRLINES[code].color }}>{code}</div>
                    <div className="text-[8px] text-muted-foreground/60 font-medium">CRS</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, ri) => {
                const samsStatus = getSamsStatus(s)
                const samsMeta = SAMS_STATUS_META[samsStatus]
                const crsStatus = getCrsStatus(s)
                const crsMeta = CRS_STATUS_META[crsStatus]
                const validCount = countValidAirlines(s)
                const totalCount = countTotalAirlines(s)
                const pct = totalCount > 0 ? Math.round(validCount / totalCount * 100) : 0

                return (
                  <tr
                    key={s.id}
                    className={`border-b border-border/50 transition-colors hover:bg-blue-50/30 ${
                      ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    {/* Staff */}
                    <td className={`px-3 py-2 sticky left-0 z-10 border-r border-border ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ background: s.color }}
                        >
                          {s.name.split(' ').pop()?.[0] || s.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-tight truncate" style={{ maxWidth: 150 }}>{s.name}</p>
                          <p className="text-[10px] text-primary font-bold">{s.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* SAMS Status */}
                    <td className="px-2 py-2 text-center border-l border-border/50">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: samsMeta.bg, color: samsMeta.text }}
                      >
                        {samsStatus === 'valid' && <ShieldCheck className="w-3 h-3" />}
                        {samsStatus === 'expiring' && <AlertTriangle className="w-3 h-3" />}
                        {samsStatus === 'expired' && <ShieldX className="w-3 h-3" />}
                        {samsMeta.label}
                      </span>
                    </td>

                    {/* CRS Badge */}
                    <td className="px-2 py-2 text-center border-l border-border/50">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: crsMeta.bg, color: crsMeta.text }}
                      >
                        <span>{crsMeta.icon}</span>
                        {crsMeta.label}
                      </span>
                    </td>

                    {/* Customer Summary */}
                    <td className="px-2 py-2 text-center border-l border-border/50">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-bold text-foreground">{validCount}/{totalCount}</span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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

                    {/* Per-Airline CRS Cells */}
                    {visibleAirlines.map(code => {
                      const airlineCrs = getAirlineCrs(s, code)
                      const meta = AIRLINE_CRS_META[airlineCrs]
                      return (
                        <td
                          key={code}
                          className="text-center border-l border-border/50 group/cell"
                          style={{ padding: '6px 4px', minWidth: 45, position: 'relative' }}
                          title={`${s.name} → ${code}: ${meta.label}`}
                        >
                          {/* Background layer */}
                          <div
                            className="absolute inset-0 transition-opacity duration-150 opacity-30 group-hover/cell:opacity-60"
                            style={{ background: meta.bg }}
                          />
                          <div className="relative z-[1] flex flex-col items-center gap-0.5">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                background: meta.dot,
                                boxShadow: airlineCrs === 'not_eligible' ? `0 0 0 2px ${meta.dot}33` : 'none'
                              }}
                            />
                            {airlineCrs === 'eligible' && (
                              <div className="text-[8px] font-bold leading-none" style={{ color: meta.text }}>✓</div>
                            )}
                            {airlineCrs === 'not_eligible' && (
                              <div className="text-[8px] font-bold leading-none" style={{ color: meta.text }}>✕</div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4 + visibleAirlines.length} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-5 px-4 py-2.5 bg-white rounded-xl border border-border">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Legend:</span>
        {(['eligible', 'not_eligible', 'no_auth'] as const).map(key => {
          const meta = AIRLINE_CRS_META[key]
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.dot }} />
              <span className="text-muted-foreground font-medium">{meta.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
