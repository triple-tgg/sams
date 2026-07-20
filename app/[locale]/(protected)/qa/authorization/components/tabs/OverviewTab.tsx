'use client'

import { useMemo } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Globe2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSamsAuthList } from '@/lib/api/qa/sams-auth.hooks'
import type { SamsAuthItem } from '@/lib/api/qa/sams-auth'
import { useCustomerAuthList } from '@/lib/api/qa/authorization/customer-auth.hooks'
import { useAuthorityAuthList } from '@/lib/api/qa/authorization/authority-auth.hooks'
import { cn } from '@/lib/utils'
import { fmtDate } from '../../utils'

type DashboardTarget = 'monitoring' | 'sams' | 'customer' | 'authority'

interface OverviewTabProps {
  onNavigate: (tab: DashboardTarget) => void
}

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

const toneClasses: Record<StatusTone, { card: string; icon: string; text: string; bar: string }> = {
  success: { card: 'border-emerald-200 bg-emerald-50/70', icon: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  warning: { card: 'border-amber-200 bg-amber-50/70', icon: 'bg-amber-100 text-amber-700', text: 'text-amber-700', bar: 'bg-amber-500' },
  danger: { card: 'border-red-200 bg-red-50/70', icon: 'bg-red-100 text-red-700', text: 'text-red-700', bar: 'bg-red-500' },
  neutral: { card: 'border-slate-200 bg-slate-50/70', icon: 'bg-slate-200/70 text-slate-700', text: 'text-slate-700', bar: 'bg-slate-500' },
}

function normalizeStatus(value: string | null | undefined) {
  return (value || '').trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function isValidStatus(value: string | null | undefined) {
  return ['valid', 'val', 'active'].includes(normalizeStatus(value))
}

function getSamsStatus(item: SamsAuthItem): 'valid' | 'expiring' | 'expired' | 'not-issued' {
  const status = normalizeStatus(item.samsAuthStatus)
  if (status === 'expired') return 'expired'
  if (status === 'expiring') return 'expiring'
  if (status === 'notissued' || !item.authorizationSamsId) return 'not-issued'
  return 'valid'
}

function getDaysToExpiry(item: SamsAuthItem): number | null {
  if (typeof item.daysToExpiry === 'number' && item.samsExpiryDate) return item.daysToExpiry
  if (!item.samsExpiryDate) return null
  const expiry = new Date(item.samsExpiryDate)
  if (Number.isNaN(expiry.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
}

function percentage(valid: number, total: number) {
  return total > 0 ? Math.round((valid / total) * 100) : 0
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
  onClick,
}: {
  icon: typeof Users
  label: string
  value: string | number
  detail: string
  tone: StatusTone
  onClick?: () => void
}) {
  const colors = toneClasses[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group min-w-0 rounded-xl border p-4 text-left transition-all',
        colors.card,
        onClick && 'hover:-translate-y-0.5 hover:shadow-sm',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        {onClick && <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />}
      </div>
      <p className={cn('mt-3 text-2xl font-extrabold tracking-tight', colors.text)}>{value}</p>
      <p className="mt-0.5 text-xs font-bold text-slate-800">{label}</p>
      <p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p>
    </button>
  )
}

function CoverageRow({ label, detail, valid, total, icon: Icon, onClick }: {
  label: string
  detail: string
  valid: number
  total: number
  icon: typeof Building2
  onClick: () => void
}) {
  const pct = percentage(valid, total)
  const tone: StatusTone = pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger'
  return (
    <button type="button" onClick={onClick} className="group w-full rounded-lg p-2.5 text-left hover:bg-slate-50">
      <div className="mb-2 flex items-center gap-2">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', toneClasses[tone].icon)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-bold text-slate-800">{label}</p>
            <span className={cn('text-xs font-extrabold', toneClasses[tone].text)}>{pct}%</span>
          </div>
          <p className="truncate text-[10px] text-slate-500">{detail}</p>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all', toneClasses[tone].bar)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-right text-[10px] text-slate-500">{valid.toLocaleString()} valid of {total.toLocaleString()}</p>
    </button>
  )
}

export function OverviewTab({ onNavigate }: OverviewTabProps) {
  const samsQuery = useSamsAuthList({ searchKeyword: '', status: '', page: 1, perPage: 10000 })
  const customerQuery = useCustomerAuthList({ searchKeyword: '', status: null, airlineId: null, page: 1, perPage: 10000 })
  const authorityQuery = useAuthorityAuthList()

  const samsRows = useMemo(() => samsQuery.data?.responseData ?? [], [samsQuery.data])
  const customerRows = useMemo(() => customerQuery.data?.responseData ?? [], [customerQuery.data])
  const authorityRows = useMemo(() => authorityQuery.data?.responseData?.staffRows ?? [], [authorityQuery.data])

  const dashboard = useMemo(() => {
    const samsCounts = { valid: 0, expiring: 0, expired: 0, notIssued: 0 }
    samsRows.forEach(item => {
      const status = getSamsStatus(item)
      if (status === 'not-issued') samsCounts.notIssued += 1
      else samsCounts[status] += 1
    })

    const validSamsStaff = new Set(samsRows.filter(item => getSamsStatus(item) === 'valid').map(item => item.staffId))
    const customerStaffWithValidAuth = new Set<number>()
    let customerTotal = 0
    let customerValid = 0
    customerRows.forEach(staff => {
      staff.airlineStatuses?.forEach(item => {
        customerTotal += 1
        if (isValidStatus(item.status)) {
          customerValid += 1
          customerStaffWithValidAuth.add(staff.staffId)
        }
      })
    })

    let authorityTotal = 0
    let authorityValid = 0
    authorityRows.forEach(staff => {
      staff.licenses?.forEach(license => {
        authorityTotal += 1
        if (isValidStatus(license.status)) authorityValid += 1
      })
    })

    const crsReady = Array.from(validSamsStaff).filter(staffId => customerStaffWithValidAuth.has(staffId)).length
    const priority = samsRows
      .filter(item => getSamsStatus(item) !== 'valid')
      .sort((a, b) => {
        const order = { expired: 0, expiring: 1, 'not-issued': 2, valid: 3 }
        const statusDiff = order[getSamsStatus(a)] - order[getSamsStatus(b)]
        if (statusDiff !== 0) return statusDiff
        return (getDaysToExpiry(a) ?? Number.MAX_SAFE_INTEGER) - (getDaysToExpiry(b) ?? Number.MAX_SAFE_INTEGER)
      })

    const expiryWindows = [
      { label: 'Overdue', count: 0, tone: 'danger' as StatusTone },
      { label: '0–30 days', count: 0, tone: 'danger' as StatusTone },
      { label: '31–60 days', count: 0, tone: 'warning' as StatusTone },
      { label: '61–90 days', count: 0, tone: 'warning' as StatusTone },
    ]
    samsRows.forEach(item => {
      const days = getDaysToExpiry(item)
      if (days === null) return
      if (days < 0) expiryWindows[0].count += 1
      else if (days <= 30) expiryWindows[1].count += 1
      else if (days <= 60) expiryWindows[2].count += 1
      else if (days <= 90) expiryWindows[3].count += 1
    })

    return {
      samsCounts,
      customerTotal,
      customerValid,
      authorityTotal,
      authorityValid,
      crsReady,
      priority,
      expiryWindows,
    }
  }, [authorityRows, customerRows, samsRows])

  const isLoading = samsQuery.isLoading || customerQuery.isLoading || authorityQuery.isLoading
  const isRefreshing = samsQuery.isFetching || customerQuery.isFetching || authorityQuery.isFetching
  const hasError = samsQuery.isError || customerQuery.isError || authorityQuery.isError
  const totalStaff = samsQuery.data?.totalAll ?? samsRows.length
  const attentionTotal = dashboard.samsCounts.expired + dashboard.samsCounts.expiring + dashboard.samsCounts.notIssued
  const maxExpiryWindow = Math.max(...dashboard.expiryWindows.map(item => item.count), 1)

  const refresh = () => {
    void Promise.all([samsQuery.refetch(), customerQuery.refetch(), authorityQuery.refetch()])
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
        <div className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
          <p className="mt-2 text-xs font-medium text-slate-500">Loading authorization overview…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">Authorization compliance overview</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">Live summary of SAMs, customer and authority authorizations</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={isRefreshing} className="bg-white">
          <RefreshCw className={cn('mr-2 h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
          Refresh data
        </Button>
      </div>

      {hasError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Some authorization sources could not be loaded. The dashboard is showing the data currently available.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Staff monitored" value={totalStaff} detail="Certifying staff in SAMs authorization" tone="neutral" onClick={() => onNavigate('sams')} />
        <MetricCard icon={BadgeCheck} label="Valid SAMs" value={dashboard.samsCounts.valid} detail={`${percentage(dashboard.samsCounts.valid, samsRows.length)}% of loaded staff`} tone="success" onClick={() => onNavigate('sams')} />
        <MetricCard icon={CircleAlert} label="Action required" value={attentionTotal} detail={`${dashboard.samsCounts.expired} expired · ${dashboard.samsCounts.expiring} expiring · ${dashboard.samsCounts.notIssued} not issued`} tone={attentionTotal > 0 ? 'danger' : 'success'} onClick={() => onNavigate('sams')} />
        <MetricCard icon={UserRoundCheck} label="CRS ready" value={dashboard.crsReady} detail="Valid SAMs and at least 1 valid customer auth" tone={dashboard.crsReady > 0 ? 'success' : 'warning'} onClick={() => onNavigate('monitoring')} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Priority actions
              </h3>
              <p className="mt-0.5 text-[10px] text-slate-500">Expired, expiring and not-issued SAMs records ordered by urgency</p>
            </div>
            <button type="button" onClick={() => onNavigate('sams')} className="text-[11px] font-bold text-blue-600 hover:text-blue-700">
              View all <ArrowRight className="ml-1 inline h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.priority.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-xs font-bold text-slate-700">No urgent SAMs issues</p>
                <p className="mt-1 text-[10px] text-slate-500">All loaded records are currently valid.</p>
              </div>
            ) : dashboard.priority.slice(0, 6).map(item => {
              const status = getSamsStatus(item)
              const days = getDaysToExpiry(item)
              const tone: StatusTone = status === 'expired' ? 'danger' : status === 'expiring' ? 'warning' : 'neutral'
              const label = status === 'not-issued' ? 'Not issued' : status === 'expired' ? 'Expired' : 'Expiring'
              const remaining = status === 'not-issued'
                ? 'Authorization required'
                : days !== null && days < 0
                  ? `${Math.abs(days)} days overdue`
                  : `${days ?? '—'} days left`
              return (
                <button key={item.staffId} type="button" onClick={() => onNavigate('sams')} className="flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', toneClasses[tone].icon)}>
                    {status === 'not-issued' ? <ShieldCheck className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-xs font-bold text-slate-800">{item.employeeName || 'Unnamed staff'}</p>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold', toneClasses[tone].icon)}>{label}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">{item.employeeId || '—'} · {item.authorizationNo || 'No authorization number'}</p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className={cn('text-[11px] font-extrabold', toneClasses[tone].text)}>{remaining}</p>
                    <p className="mt-0.5 text-[9px] text-slate-400">{fmtDate(item.samsExpiryDate)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">Authorization health</h3>
            <p className="mt-0.5 text-[10px] text-slate-500">Valid records across each authorization source</p>
          </div>
          <div className="space-y-1">
            <CoverageRow label="SAMs authorization" detail="Valid staff authorization" valid={dashboard.samsCounts.valid} total={samsRows.length} icon={ShieldCheck} onClick={() => onNavigate('sams')} />
            <CoverageRow label="Customer authorization" detail="Valid airline authorization cells" valid={dashboard.customerValid} total={dashboard.customerTotal} icon={Building2} onClick={() => onNavigate('customer')} />
            <CoverageRow label="Authority license" detail="Valid aviation authority licenses" valid={dashboard.authorityValid} total={dashboard.authorityTotal} icon={Globe2} onClick={() => onNavigate('authority')} />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CalendarClock className="h-4 w-4 text-blue-600" />
              90-day SAMs expiry outlook
            </h3>
            <p className="mt-0.5 text-[10px] text-slate-500">Workload forecast for renewal planning</p>
          </div>
          <p className="text-[10px] text-slate-400">Based on the current expiry date</p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dashboard.expiryWindows.map(item => (
            <button key={item.label} type="button" onClick={() => onNavigate('sams')} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-left hover:border-slate-200 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{item.label}</span>
                <span className={cn('text-lg font-extrabold', toneClasses[item.tone].text)}>{item.count}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className={cn('h-full rounded-full', toneClasses[item.tone].bar)} style={{ width: `${Math.max(item.count > 0 ? 8 : 0, (item.count / maxExpiryWindow) * 100)}%` }} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
