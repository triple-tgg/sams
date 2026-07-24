'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Filter, Loader2, Search } from 'lucide-react'
import { useMonitoringCrsList } from '@/lib/api/qa/authorization/monitoring-crs.hooks'
import type {
    MonitoringCrsAirlineEligibility,
    MonitoringCrsListRequest,
    MonitoringCrsStaffRow,
} from '@/lib/api/qa/authorization/monitoring-crs'
import {
    AuthRecord,
    CustomerAirline,
    StaffAuthorization,
    getAuthStatus,
    isCrsEligible,
} from '../../types'
import { AuthMatrix } from '../AuthMatrix'
import { useStaffAuthorizationAirlineStatuses } from '@/lib/api/master/staff-authorization/staff-authorization-airline-statuses.hooks'
import type { StaffAuthorizationAirlineStatus } from '@/lib/api/master/staff-authorization/staff-authorization-airline-statuses'
import { mapCustomerAuthStatus } from '@/lib/api/qa/authorization/customer-auth.utils'
import { CUST_STATUS_META } from '../../types-v2'
import { resolveMonitoringAuthStatus } from '@/lib/api/qa/authorization/monitoring-crs.utils'

const EXPIRY_WARNING_DAYS = 90

function toCustomerAuthRecord(cell: MonitoringCrsAirlineEligibility): AuthRecord | null {
    if (cell.customerAuthorizationId === null) return null

    return {
        status: resolveMonitoringAuthStatus(cell.customerStatusCode, cell.customerStatusName, cell.daysToExpiry, EXPIRY_WARNING_DAYS),
        resolvedStatus: resolveMonitoringAuthStatus(cell.customerStatusCode, cell.customerStatusName, cell.daysToExpiry, EXPIRY_WARNING_DAYS),
        resolvedDaysUntilExpiry: cell.daysToExpiry,
        authNumber: '—',
        initialIssueDate: cell.initialIssueDate || undefined,
        issueDate: cell.currentIssueDate || '',
        expiryDate: cell.expiryDate || '',
        scope: cell.eligibleAircraftTypes.map(type => type.code || type.name),
        issuedBy: cell.airlineCode,
        remarks: cell.reasonCodes.length > 0 ? cell.reasonCodes.join(', ') : undefined,
    }
}

function toStaffAuthorization(row: MonitoringCrsStaffRow, index: number): StaffAuthorization {
    const sams = row.samsAuthorization
    return {
        sourceStaffId: row.staffId,
        staffId: row.employeeId || String(row.staffId),
        staffNo: index + 1,
        name: row.staffName,
        position: row.jobTitle || '—',
        posGroup: 'CS',
        samsAuth: sams ? {
            status: resolveMonitoringAuthStatus(sams.statusCode, sams.statusName, sams.daysToExpiry, EXPIRY_WARNING_DAYS),
            resolvedStatus: resolveMonitoringAuthStatus(sams.statusCode, sams.statusName, sams.daysToExpiry, EXPIRY_WARNING_DAYS),
            resolvedDaysUntilExpiry: sams.daysToExpiry,
            authNumber: sams.authNo || '—',
            initialIssueDate: sams.initialIssueDate || undefined,
            issueDate: sams.currentIssueDate || '',
            expiryDate: sams.expiryDate || '',
            scope: sams.aircraftTypes.map(type => type.code || type.name),
            issuedBy: 'SAMS',
            remarks: row.blockingReasonCodes.length > 0 ? row.blockingReasonCodes.join(', ') : undefined,
        } : null,
        customerAuths: Object.fromEntries(
            row.airlineEligibilities.map(cell => [String(cell.airlineId), toCustomerAuthRecord(cell)])
        ),
        crsEligible: row.hasAnyCrsEligibility,
    }
}

export function MonitoringCrsTab() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'issues' | 'crs-eligible' | 'crs-ineligible'>('all')
    const [page, setPage] = useState(1)

    const request = useMemo<MonitoringCrsListRequest>(() => ({
        searchKeyword: '',
        coverageStatus: '',
        samsStatus: '',
        airlineId: null,
        hasIssues: true,
        expiryWarningDays: EXPIRY_WARNING_DAYS,
        page,
        perPage: 20,
    }), [page])
    const listQuery = useMonitoringCrsList(request)
    const {
        data: authorizationStatuses = [],
        isLoading: authorizationStatusesLoading,
    } = useStaffAuthorizationAirlineStatuses()

    const customers = useMemo<CustomerAirline[]>(() =>
        (listQuery.data?.responseData.airlines || []).map(airline => ({
            id: String(airline.airlineId),
            code: airline.code,
            name: airline.name,
            color: airline.colorBackground || '#64748b',
        })),
    [listQuery.data])

    const staff = useMemo<StaffAuthorization[]>(() =>
        (listQuery.data?.responseData.staffRows || []).map(toStaffAuthorization),
    [listQuery.data])

    const filteredStaff = useMemo(() => {
        let list = [...staff]

        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            list = list.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.staffId.toLowerCase().includes(q) ||
                s.position.toLowerCase().includes(q)
            )
        }

        if (filterStatus === 'issues') {
            list = list.filter(s => {
                const ss = getAuthStatus(s.samsAuth)
                if (ss === 'expired' || ss === 'suspended') return true
                return Object.values(s.customerAuths).some(record => {
                    const status = getAuthStatus(record)
                    return status === 'expired' || status === 'suspended'
                })
            })
        } else if (filterStatus === 'crs-eligible') {
            list = list.filter(isCrsEligible)
        } else if (filterStatus === 'crs-ineligible') {
            list = list.filter(s => !isCrsEligible(s))
        }

        return list
    }, [staff, searchTerm, filterStatus])

    return (
        <div className="space-y-4">
            {/* Status Legend */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Status Legend:</span>
                        {authorizationStatusesLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : authorizationStatuses.map((status: StaffAuthorizationAirlineStatus) => {
                            const meta = CUST_STATUS_META[mapCustomerAuthStatus(status.code)]
                            return (
                                <div key={status.id} className="flex items-center gap-1.5 text-[11px]">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.dot }} />
                                    <span className="font-semibold" style={{ color: meta.text }}>{status.name}</span>
                                </div>
                            )
                        })}
                    </div>
                    <div className="text-[10px] text-muted-foreground max-w-sm text-right">
                        <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-500" />
                        CRS requires <strong>both</strong> active SAMS + ≥1 Customer authorization
                    </div>
                </div>
            </div>

            {/* Search + Filter + Matrix Table */}
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                        Authorization Matrix — Certifying Staff ({listQuery.data?.total ?? filteredStaff.length})
                    </h3>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search staff…"
                                value={searchTerm}
                                onChange={event => setSearchTerm(event.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-56"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <select
                                value={filterStatus}
                                onChange={event => setFilterStatus(event.target.value as typeof filterStatus)}
                                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                            >
                                <option value="all">All Staff</option>
                                <option value="issues">⚠ Has Issues</option>
                                <option value="crs-eligible">✓ CRS Eligible</option>
                                <option value="crs-ineligible">✗ CRS Ineligible</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                    {listQuery.isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading authorization data…
                        </div>
                    ) : listQuery.isError ? (
                        <div className="py-20 text-center text-sm font-semibold text-red-600">
                            Unable to load authorization data.
                            <button className="ml-2 text-primary underline" onClick={() => listQuery.refetch()}>Try again</button>
                        </div>
                    ) : (
                        <AuthMatrix
                            staff={filteredStaff}
                            customers={customers}
                            pagination={{
                                page,
                                perPage: listQuery.data?.perPage ?? 20,
                                total: listQuery.data?.total ?? 0,
                                isFetching: listQuery.isFetching,
                                onPageChange: setPage,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
