// ─── Authorization Types ────────────────────────────────────────────────────

export type AuthStatus = 'active' | 'expiring' | 'expired' | 'suspended' | 'not-issued'

export interface CustomerAirline {
    id: string
    code: string
    name: string
    logo?: string        // placeholder – future use
    color: string        // brand color for charts
}

export interface AuthRecord {
    status: AuthStatus
    authNumber: string   // e.g. "SAMS-AUTH-0012" or "TLA-AUTH-0012"
    license?: string     // e.g. "B1", "B2"
    initialIssueDate?: string // ISO date — first ever issue
    issueDate: string    // ISO date — current issue
    expiryDate: string   // ISO date
    scope: string[]      // aircraft type ratings, e.g. ['B737 NG', 'B737 MAX']
    issuedBy: string     // who signed
    remarks?: string
}

export interface StaffAuthorization {
    staffId: string
    staffNo: number
    name: string
    position: string
    posGroup: string     // 'CS' = Certifying Staff
    license?: string
    samsAuth: AuthRecord | null
    customerAuths: Record<string, AuthRecord | null>  // keyed by customer airline ID
}

// ─── Status Helpers ─────────────────────────────────────────────────────────

const TODAY = new Date('2026-03-19')

export function getAuthStatus(record: AuthRecord | null | undefined): AuthStatus {
    if (!record) return 'not-issued'
    if (record.status === 'suspended') return 'suspended'
    const expiry = new Date(record.expiryDate)
    const diff = Math.floor((expiry.getTime() - TODAY.getTime()) / 86400000)
    if (diff < 0) return 'expired'
    if (diff <= 90) return 'expiring'
    return 'active'
}

export function getDaysUntilExpiry(record: AuthRecord | null | undefined): number | null {
    if (!record || record.status === 'suspended') return null
    const expiry = new Date(record.expiryDate)
    return Math.floor((expiry.getTime() - TODAY.getTime()) / 86400000)
}

export function fmtDate(dateStr: string | undefined): string {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** CRS eligible = SAMS auth active/expiring AND at least ONE customer auth active/expiring */
export function isCrsEligible(staff: StaffAuthorization): boolean {
    const samsOk = staff.samsAuth !== null && ['active', 'expiring'].includes(getAuthStatus(staff.samsAuth))
    if (!samsOk) return false
    return Object.values(staff.customerAuths).some(
        rec => rec !== null && ['active', 'expiring'].includes(getAuthStatus(rec))
    )
}

/** Fully authorized = SAMS active + ALL customer auths active/expiring */
export function isFullyAuthorized(staff: StaffAuthorization): boolean {
    const samsOk = staff.samsAuth !== null && ['active', 'expiring'].includes(getAuthStatus(staff.samsAuth))
    if (!samsOk) return false
    const custs = Object.values(staff.customerAuths)
    if (custs.length === 0) return false
    return custs.every(rec => rec !== null && ['active', 'expiring'].includes(getAuthStatus(rec)))
}

// ─── Status Visual Config ───────────────────────────────────────────────────

export const AUTH_STATUS_META: Record<AuthStatus, { bg: string; dot: string; text: string; label: string; ringColor: string }> = {
    active:      { bg: '#dcfce7', dot: '#16a34a', text: '#15803d', label: 'Active',      ringColor: '#16a34a33' },
    expiring:    { bg: '#fef3c7', dot: '#d97706', text: '#92400e', label: 'Expiring',     ringColor: '#d9770644' },
    expired:     { bg: '#fee2e2', dot: '#dc2626', text: '#991b1b', label: 'Expired',      ringColor: '#dc262633' },
    suspended:   { bg: '#fce7f3', dot: '#be185d', text: '#9d174d', label: 'Suspended',    ringColor: '#be185d33' },
    'not-issued': { bg: '#f1f5f9', dot: '#94a3b8', text: '#64748b', label: 'Not Issued',  ringColor: '#94a3b833' },
}
