'use client'

import { useMemo } from 'react'
import { Users, ShieldCheck, AlertTriangle, ShieldX, FileCheck, Plane, Clock } from 'lucide-react'
import { STAFF, AIRLINES } from '../../data-v2'
import { AIRLINE_KEYS, SAMS_STATUS_META } from '../../types-v2'
import type { SamsAuthStatus } from '../../types-v2'
import { buildStats, getSamsStatus, daysLeft, fmtDate, getAircraftFamilies } from '../../utils'

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = { valid: '#16a34a', expiring: '#f59e0b', expired: '#dc2626' }

export function OverviewTab() {
  const stats = useMemo(() => buildStats(STAFF), [])

  // Donut data
  const donutSegments = useMemo(() => {
    const total = stats.valid + stats.expiring + stats.expired
    if (total === 0) return []
    const items = [
      { key: 'valid' as SamsAuthStatus, value: stats.valid, color: C.valid },
      { key: 'expiring' as SamsAuthStatus, value: stats.expiring, color: C.expiring },
      { key: 'expired' as SamsAuthStatus, value: stats.expired, color: C.expired },
    ].filter(d => d.value > 0)

    let offset = 0
    const circumference = 2 * Math.PI * 36
    return items.map(item => {
      const pct = item.value / total
      const dashArray = pct * circumference
      const dashOffset = -offset * circumference
      offset += pct
      return { ...item, dashArray, dashOffset, circumference, pct }
    })
  }, [stats])

  // Expiry timeline
  const expiryTimeline = useMemo(() =>
    STAFF
      .filter(s => {
        const st = getSamsStatus(s)
        return st === 'expired' || st === 'expiring'
      })
      .sort((a, b) => daysLeft(a.samsExp) - daysLeft(b.samsExp))
  , [])

  // Airline coverage
  const airlineCoverage = useMemo(() =>
    AIRLINE_KEYS.map(code => {
      const airline = AIRLINES[code]
      const total = STAFF.filter(s => s.cust[code] !== undefined).length
      const valid = STAFF.filter(s => s.cust[code] === 'valid').length
      const pct = total > 0 ? Math.round(valid / total * 100) : 0
      return { code, name: airline.name, color: airline.color, valid, total, pct }
    }).sort((a, b) => b.pct - a.pct)
  , [])

  // Aircraft type distribution
  const aircraftDist = useMemo(() => {
    const counts: Record<string, number> = {}
    STAFF.forEach(s => {
      getAircraftFamilies(s.rating).forEach(f => {
        counts[f] = (counts[f] || 0) + 1
      })
    })
    const max = Math.max(...Object.values(counts), 1)
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count, pct: Math.round(count / max * 100) }))
  }, [])


  return (
    <div className="space-y-5">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { icon: Users, label: 'Certifying Staff', val: stats.total, color: '#475569', bg: '#f1f5f9' },
          { icon: ShieldCheck, label: 'SAMS Valid', val: stats.valid, color: '#16a34a', bg: '#f0fdf4' },
          { icon: AlertTriangle, label: 'Expiring Soon', val: stats.expiring, color: '#d97706', bg: '#fffbeb' },
          { icon: ShieldX, label: 'SAMS Expired', val: stats.expired, color: '#dc2626', bg: '#fef2f2' },
          { icon: FileCheck, label: 'CRS Ready', val: stats.crsReady, color: '#2563eb', bg: '#eff6ff' },
        ].map(({ icon: Icon, label, val, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-border p-4 flex items-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ background: bg }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: color + '18' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold" style={{ color }}>{val}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2×2 Grid ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Panel 1 — SAMS Donut */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
            SAMS Authorization Status
          </h3>
          <div className="flex items-center gap-6">
            {/* SVG Donut */}
            <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle cx="50" cy="50" r="36" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                {/* Arcs */}
                {donutSegments.map(seg => (
                  <circle
                    key={seg.key}
                    cx="50" cy="50" r="36"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="10"
                    strokeDasharray={`${seg.dashArray} ${seg.circumference - seg.dashArray}`}
                    strokeDashoffset={seg.dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-800">{stats.total}</span>
                <span className="text-[9px] font-semibold text-muted-foreground">พนักงาน</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-2.5">
              {([
                { key: 'valid' as SamsAuthStatus, val: stats.valid, color: C.valid },
                { key: 'expiring' as SamsAuthStatus, val: stats.expiring, color: C.expiring },
                { key: 'expired' as SamsAuthStatus, val: stats.expired, color: C.expired },
              ]).map(item => {
                const meta = SAMS_STATUS_META[item.key]
                return (
                  <div key={item.key} className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded" style={{ background: item.color }} />
                    <span className="text-xs text-muted-foreground">{meta.label}</span>
                    <span className="text-sm font-extrabold ml-auto" style={{ color: item.color }}>{item.val}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Panel 2 — Expiry Timeline */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Expiry Timeline
          </h3>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {expiryTimeline.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">ไม่มีรายการหมดอายุ</p>
            ) : expiryTimeline.map(s => {
              const d = daysLeft(s.samsExp)
              const st = getSamsStatus(s)
              const isExpired = st === 'expired'
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs"
                  style={{ background: isExpired ? '#fef2f2' : '#fffbeb' }}
                >
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white shrink-0"
                    style={{ background: isExpired ? '#dc2626' : '#d97706' }}
                  >
                    {isExpired ? 'หมดอายุ' : 'เร่งด่วน'}
                  </span>
                  <span className="font-semibold text-foreground truncate flex-1">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{s.authNo}</span>
                  <span className="font-extrabold shrink-0" style={{ color: isExpired ? '#dc2626' : '#d97706' }}>
                    {d < 0 ? `${Math.abs(d)}d overdue` : `${d}d left`}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{fmtDate(s.samsExp)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel 3 — Airline Coverage */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5" />
            Airline Coverage
          </h3>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {airlineCoverage.map(a => (
              <div key={a.code} className="flex items-center gap-2 text-xs">
                <span className="font-extrabold text-[11px] w-14 shrink-0 truncate" style={{ color: a.color }}>{a.code}</span>
                <span className="text-muted-foreground truncate w-32 shrink-0 text-[10px]">{a.name}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${a.pct}%`,
                      background: a.pct >= 80 ? '#16a34a' : a.pct >= 50 ? '#d97706' : '#dc2626',
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground w-10 text-right shrink-0">
                  {a.valid}/{a.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 4 — Aircraft Type */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Aircraft Type Distribution
          </h3>
          <div className="space-y-3">
            {aircraftDist.map(a => (
              <div key={a.name} className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-foreground w-24 shrink-0">{a.name}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg flex items-center pl-2 text-[10px] font-bold text-white transition-all duration-700"
                    style={{ width: `${a.pct}%`, background: '#3b82f6', minWidth: 30 }}
                  >
                    {a.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  )
}
