'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    AlertTriangle,
    CalendarDays,
    ChevronRight,
    FileCheck2,
    Loader2,
    Plane,
    ShieldCheck,
    X,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useMonitoringCrsDetail } from '@/lib/api/qa/authorization/monitoring-crs.hooks'
import type {
    MonitoringCrsAirlineEligibility,
    MonitoringCrsAircraftType,
} from '@/lib/api/qa/authorization/monitoring-crs'
import {
    computeEffectiveValidTo,
    formatMonitoringAsOf,
    formatMonitoringDate,
    resolveMonitoringAuthStatus,
    type BindingSide,
} from '@/lib/api/qa/authorization/monitoring-crs.utils'
import type { CustomerAirline, StaffAuthorization } from '../types'
import { cn } from '@/lib/utils'

const EXPIRY_WARNING_DAYS = 90

type DetailTone = 'valid' | 'expiring' | 'blocked' | 'pending'
type CustomerDisplayStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'EXPIRED'

interface DetailCustomer {
    id: string
    name: string
    code: string
    status: CustomerDisplayStatus
    customerValidTo: string | null
    effectiveValidTo: string | null
    bindingSide: BindingSide | null
    rejectionReason: string | null
    collapsedCount?: number
}

interface DetailTypeGroup {
    id: string
    name: string
    engines: string[]
    customers: DetailCustomer[]
    eligible: boolean
    soonestEffectiveValidTo: string | null
    daysToExpiry: number | null
    tone: Exclude<DetailTone, 'pending'>
}

interface StaffAuthDialogProps {
    staff: StaffAuthorization | null
    customers: CustomerAirline[]
    open: boolean
    onClose: () => void
}

const toneClasses: Record<DetailTone, { pill: string; dot: string; row: string; text: string }> = {
    valid: {
        pill: 'bg-success/10 text-success',
        dot: 'bg-success',
        row: 'border-border bg-card hover:bg-muted/40',
        text: 'text-success',
    },
    expiring: {
        pill: 'bg-warning/10 text-warning',
        dot: 'bg-warning',
        row: 'border-warning/40 bg-warning/10 hover:bg-warning/15',
        text: 'text-warning',
    },
    blocked: {
        pill: 'bg-destructive/10 text-destructive',
        dot: 'bg-destructive',
        row: 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10',
        text: 'text-destructive',
    },
    pending: {
        pill: 'bg-muted text-muted-foreground',
        dot: 'bg-muted-foreground',
        row: 'border-border bg-muted/30 hover:bg-muted/50',
        text: 'text-muted-foreground',
    },
}

function customerStatus(cell: MonitoringCrsAirlineEligibility): CustomerDisplayStatus {
    const status = resolveMonitoringAuthStatus(
        cell.customerStatusCode,
        cell.customerStatusName,
        cell.daysToExpiry,
        EXPIRY_WARNING_DAYS,
    )
    const code = cell.customerStatusCode.trim().toUpperCase()
    if (code === 'NAP' || code === 'REJ' || code === 'REJECTED') return 'REJECTED'
    if (status === 'expired' || status === 'suspended') return 'EXPIRED'
    if (status === 'active' || status === 'expiring') return 'APPROVED'
    return 'PENDING'
}

function customerTone(status: CustomerDisplayStatus): DetailTone {
    if (status === 'APPROVED') return 'valid'
    if (status === 'PENDING') return 'pending'
    return 'blocked'
}

function statusLabel(tone: DetailTone): string {
    if (tone === 'valid') return 'Valid'
    if (tone === 'expiring') return 'Expiring'
    if (tone === 'blocked') return 'Not eligible'
    return 'Pending'
}

function differenceInDays(validTo: string | null, evaluatedAtUtc: string): number | null {
    if (!validTo) return null
    const validTimestamp = Date.parse(validTo)
    const evaluatedTimestamp = Date.parse(evaluatedAtUtc)
    if (Number.isNaN(validTimestamp) || Number.isNaN(evaluatedTimestamp)) return null
    return Math.ceil((validTimestamp - evaluatedTimestamp) / 86_400_000)
}

function matchesTypeGroup(
    customer: MonitoringCrsAirlineEligibility,
    group: MonitoringCrsAircraftType,
): boolean {
    return customer.eligibleAircraftTypes.some(type =>
        type.id === group.id || type.code === group.code
    )
}

function CustomerRows({ customers }: { customers: DetailCustomer[] }) {
    if (customers.length === 0) {
        return (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center text-sm text-muted-foreground">
                ยังไม่มีสายการบินยื่นขอ
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {customers.map(customer => {
                const tone = customerTone(customer.status)
                const classes = toneClasses[tone]
                return (
                    <div key={customer.id} className={cn('rounded-xl border p-3', classes.row)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-foreground">
                                    {customer.name}
                                    {customer.collapsedCount ? ` • +${customer.collapsedCount} ราย` : ''}
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">{customer.code}</p>
                            </div>
                            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', classes.pill)}>
                                {customer.status === 'APPROVED' ? 'Approved' :
                                    customer.status === 'PENDING' ? 'รออนุมัติ' :
                                        customer.status === 'REJECTED' ? 'Rejected' : 'Expired'}
                            </span>
                        </div>

                        {customer.status === 'APPROVED' || customer.status === 'EXPIRED' ? (
                            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground">Customer ถึง</p>
                                    <p className="mt-1 text-right font-bold text-foreground">
                                        {formatMonitoringDate(customer.customerValidTo)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground">ใช้ได้ถึงจริง</p>
                                    <p className={cn('mt-1 text-right font-bold', classes.text)}>
                                        {formatMonitoringDate(customer.effectiveValidTo)}
                                    </p>
                                    {customer.bindingSide && (
                                        <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
                                            {customer.bindingSide === 'SAMS' ? 'ตาม SAMS' : 'ตามสายการบิน'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {customer.status === 'REJECTED' && customer.rejectionReason && (
                            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                <p className="font-semibold">เหตุผลที่ไม่อนุมัติ</p>
                                <p className="mt-1 leading-relaxed">{customer.rejectionReason}</p>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function TypeGroupDetail({ group }: { group: DetailTypeGroup }) {
    return (
        <section aria-labelledby={`customer-auth-${group.id}`} className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 id={`customer-auth-${group.id}`} className="text-sm font-bold text-foreground">
                        Customer authorization
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{group.name}</p>
                </div>
                <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', toneClasses[group.tone].pill)}>
                    {statusLabel(group.tone)}
                </span>
            </div>
            <CustomerRows customers={group.customers} />
        </section>
    )
}

export function StaffAuthDialog({ staff, customers, open, onClose }: StaffAuthDialogProps) {
    const detailQuery = useMonitoringCrsDetail(
        open && staff?.sourceStaffId ? staff.sourceStaffId : null,
        EXPIRY_WARNING_DAYS,
    )
    const detail = detailQuery.data?.responseData
    const row = detail?.staffRow
    const sams = row?.samsAuthorization
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

    const customerById = useMemo(
        () => new Map(customers.map(customer => [customer.id, customer])),
        [customers],
    )

    const typeGroups = useMemo<DetailTypeGroup[]>(() => {
        if (!row || !sams || !detail) return []

        const groups = sams.aircraftTypes.map(group => {
            const matchingCells = row.airlineEligibilities.filter(cell =>
                cell.customerAuthorizationId !== null && matchesTypeGroup(cell, group)
            )
            const groupCustomers = matchingCells
                .map<DetailCustomer>(cell => {
                    const fallbackValidity = computeEffectiveValidTo(sams.expiryDate, cell.expiryDate)
                    const customer = customerById.get(String(cell.airlineId))
                    return {
                        id: String(cell.customerAuthorizationId),
                        name: customer?.name || cell.airlineCode,
                        code: cell.airlineCode,
                        status: customerStatus(cell),
                        customerValidTo: cell.expiryDate,
                        effectiveValidTo: cell.effectiveValidTo ?? fallbackValidity.effectiveValidTo,
                        bindingSide: cell.bindingSide ?? fallbackValidity.bindingSide,
                        rejectionReason: cell.rejectionReason || (
                            customerStatus(cell) === 'REJECTED' && cell.reasonCodes.length > 0
                                ? cell.reasonCodes.join(', ')
                                : null
                        ),
                    }
                })

            const pending = groupCustomers.filter(customer => customer.status === 'PENDING')
            const displayedCustomers = [
                ...groupCustomers.filter(customer => customer.status !== 'PENDING'),
                ...(pending.length > 0 ? [{ ...pending[0], collapsedCount: pending.length - 1 }] : []),
            ]
            const effectiveDates = groupCustomers
                .map(customer => customer.effectiveValidTo)
                .filter((value): value is string => Boolean(value))
                .sort((a, b) => Date.parse(a) - Date.parse(b))
            const soonestEffectiveValidTo = effectiveDates[0] || null
            const daysToExpiry = differenceInDays(soonestEffectiveValidTo, detail.evaluatedAtUtc)
            const eligible = matchingCells.some(cell => cell.isEligible)
            const tone: DetailTypeGroup['tone'] = !eligible
                ? 'blocked'
                : daysToExpiry !== null && daysToExpiry <= EXPIRY_WARNING_DAYS
                    ? 'expiring'
                    : 'valid'

            return {
                id: String(group.id),
                name: group.name || group.code,
                engines: group.engines || [],
                customers: displayedCustomers,
                eligible,
                soonestEffectiveValidTo,
                daysToExpiry,
                tone,
            }
        })

        const urgency = { blocked: 0, expiring: 1, valid: 2 }
        return groups.sort((a, b) => {
            const statusDifference = urgency[a.tone] - urgency[b.tone]
            if (statusDifference !== 0) return statusDifference
            const aDate = a.soonestEffectiveValidTo ? Date.parse(a.soonestEffectiveValidTo) : Infinity
            const bDate = b.soonestEffectiveValidTo ? Date.parse(b.soonestEffectiveValidTo) : Infinity
            return aDate - bDate
        })
    }, [customerById, detail, row, sams])

    useEffect(() => {
        if (!open) {
            setSelectedGroupId(null)
            return
        }
        if (typeGroups.length === 0) return
        const closest = [...typeGroups]
            .filter(group => group.soonestEffectiveValidTo)
            .sort((a, b) =>
                Date.parse(a.soonestEffectiveValidTo as string)
                - Date.parse(b.soonestEffectiveValidTo as string)
            )[0]
        setSelectedGroupId(closest?.id || typeGroups[0].id)
    }, [open, typeGroups])

    const selectedGroup = typeGroups.find(group => group.id === selectedGroupId) || typeGroups[0]
    const samsStatus = resolveMonitoringAuthStatus(
        sams?.statusCode,
        sams?.statusName,
        sams?.daysToExpiry ?? null,
        EXPIRY_WARNING_DAYS,
    )
    const headerTone: DetailTone = samsStatus === 'expired' || samsStatus === 'suspended'
        ? 'blocked'
        : typeGroups.length === 0 || typeGroups.every(group => !group.eligible)
            ? 'blocked'
            : typeGroups.some(group => group.tone === 'expiring')
                ? 'expiring'
                : 'valid'
    const headerLabel = samsStatus === 'expired'
        ? 'Expired'
        : headerTone === 'blocked'
            ? 'Not eligible'
            : statusLabel(headerTone)

    return (
        <Dialog open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
            <DialogContent
                size="md"
                hideClose
                className="grid max-h-[92vh] w-[calc(100vw-1rem)] max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-xl border-border bg-card p-0 sm:w-[94vw]"
            >
                <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border px-4 py-4 pr-3 text-left sm:px-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <DialogTitle className="truncate text-lg font-bold text-foreground">
                            {row?.staffName || staff?.name || 'Authorization detail'}
                        </DialogTitle>
                        <DialogDescription className="mt-1 truncate text-xs text-muted-foreground">
                            {row?.employeeId || staff?.staffId || '—'}
                            {' • '}
                            {row?.licenseCategory || staff?.license || '—'}
                            {' • '}
                            {sams?.authNo || staff?.samsAuth?.authNumber || '—'}
                        </DialogDescription>
                    </div>
                    <span className={cn('hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium sm:inline-flex', toneClasses[headerTone].pill)}>
                        <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', toneClasses[headerTone].dot)} />
                        {headerLabel}
                    </span>
                    <button
                        type="button"
                        aria-label="Close authorization detail"
                        onClick={onClose}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <X aria-hidden="true" className="h-4 w-4" />
                    </button>
                </DialogHeader>

                <div className="min-h-0 overflow-y-auto bg-muted/20 px-4 py-4 sm:px-5">
                    {detailQuery.isLoading ? (
                        <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-primary" />
                            Loading authorization detail…
                        </div>
                    ) : detailQuery.isError || !detail || !row ? (
                        <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-5 text-center">
                            <AlertTriangle aria-hidden="true" className="mb-3 h-7 w-7 text-destructive" />
                            <p className="text-sm font-semibold text-foreground">Unable to load authorization detail</p>
                            <button
                                type="button"
                                onClick={() => detailQuery.refetch()}
                                className="mt-3 rounded-md px-3 py-2 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Try again
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <section className="rounded-xl border border-border bg-card p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <FileCheck2 aria-hidden="true" className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-bold text-foreground">SAMS authorization</h2>
                                        <p className="text-[11px] text-muted-foreground">
                                            {[row.formCode, row.formRevision].filter(Boolean).join(' ') || 'Certifying staff authorization'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    {[
                                        ['Date of initial issue', sams?.initialIssueDate],
                                        ['Date of current issue', sams?.currentIssueDate],
                                        ['Date of expire', sams?.expiryDate],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                                            <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                                            <p className="mt-1 text-right text-sm font-bold text-foreground">
                                                {formatMonitoringDate(value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {typeGroups.length === 0 ? (
                                <section className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-5 text-center">
                                    <Plane aria-hidden="true" className="mb-3 h-7 w-7 text-muted-foreground" />
                                    <p className="text-sm font-semibold text-foreground">ยังไม่มี type group ในใบอนุญาตนี้</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        กรุณายื่นคำขอผ่านขั้นตอน Authorization ก่อนออก CRS
                                    </p>
                                </section>
                            ) : (
                                <>
                                    <div className="hidden min-h-0 grid-cols-[minmax(220px,0.8fr)_minmax(0,2fr)] gap-4 sm:grid">
                                        <aside className="max-h-[420px] overflow-y-auto rounded-xl border border-border bg-card p-2" aria-label="Type groups">
                                            <div className="mb-2 flex items-center gap-2 px-2 py-1.5">
                                                <Plane aria-hidden="true" className="h-4 w-4 text-primary" />
                                                <h2 className="text-xs font-bold text-foreground">Type group</h2>
                                            </div>
                                            <div className="space-y-1">
                                                {typeGroups.map(group => {
                                                    const selected = group.id === selectedGroup?.id
                                                    const classes = toneClasses[group.tone]
                                                    return (
                                                        <button
                                                            key={group.id}
                                                            type="button"
                                                            onClick={() => setSelectedGroupId(group.id)}
                                                            className={cn(
                                                                'flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                                selected ? 'border-primary/30 bg-primary/10' : classes.row,
                                                            )}
                                                        >
                                                            <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', classes.dot)} />
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-xs font-bold text-foreground">{group.name}</span>
                                                                <span className={cn('mt-0.5 block text-[10px]', classes.text)}>
                                                                    {group.tone === 'blocked'
                                                                        ? `${group.engines.join(' • ') || '—'} • ยังออก CRS ไม่ได้`
                                                                        : group.tone === 'expiring'
                                                                            ? `${group.engines.join(' • ') || '—'} • เหลือ ${group.daysToExpiry ?? '—'} วัน`
                                                                            : `${group.engines.join(' • ') || '—'} • อนุมัติ ${group.customers.filter(item => item.status === 'APPROVED').length} ราย`}
                                                                </span>
                                                            </span>
                                                            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </aside>
                                        <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border bg-card p-4">
                                            {selectedGroup && <TypeGroupDetail group={selectedGroup} />}
                                        </div>
                                    </div>

                                    <div className="space-y-2 sm:hidden">
                                        {typeGroups.map(group => {
                                            const expanded = group.id === selectedGroup?.id
                                            return (
                                                <div key={group.id} className="overflow-hidden rounded-xl border border-border bg-card">
                                                    <button
                                                        type="button"
                                                        aria-expanded={expanded}
                                                        aria-controls={`mobile-type-group-${group.id}`}
                                                        onClick={() => setSelectedGroupId(expanded ? null : group.id)}
                                                        className="flex w-full items-center gap-2 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                                    >
                                                        <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', toneClasses[group.tone].dot)} />
                                                        <span className="min-w-0 flex-1 truncate text-xs font-bold text-foreground">{group.name}</span>
                                                        <ChevronRight aria-hidden="true" className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
                                                    </button>
                                                    {expanded && (
                                                        <div id={`mobile-type-group-${group.id}`} className="border-t border-border p-3">
                                                            <TypeGroupDetail group={group} />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-4 py-3 text-[10px] text-muted-foreground sm:px-5">
                    <span>as of {formatMonitoringAsOf(detail?.evaluatedAtUtc)}</span>
                    <span>Expiry warning threshold: ≤ {EXPIRY_WARNING_DAYS} days</span>
                </footer>
            </DialogContent>
        </Dialog>
    )
}
