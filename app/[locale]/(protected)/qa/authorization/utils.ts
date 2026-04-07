// ─── Authorization Utils — Pure Functions ───────────────────────────────────
import type { Staff, SamsAuthStatus, CrsStatus, ReportType, ExportOptions, ReportData, AirlineKey } from './types-v2'
import { AIRLINE_KEYS } from './types-v2'
import { AIRLINES } from './data-v2'

const TODAY = new Date('2026-03-19')

/** Days until expiry (negative = overdue) */
export function daysLeft(expStr: string): number {
  return Math.round((new Date(expStr).getTime() - TODAY.getTime()) / 86_400_000)
}

/** Determine SAMS authorization status */
export function getSamsStatus(s: Staff): SamsAuthStatus {
  const d = daysLeft(s.samsExp)
  if (d < 0) return 'expired'
  if (d < 90) return 'expiring'
  return 'valid'
}

/** Determine CRS eligibility status */
export function getCrsStatus(s: Staff): CrsStatus {
  const ss = getSamsStatus(s)
  if (ss === 'expired') return 'none'
  const custValues = Object.values(s.cust)
  const allOk = custValues.length > 0 && custValues.every(v => v === 'valid')
  if (allOk && ss === 'valid') return 'full'
  return 'partial'
}

/** Count airlines with valid customer auth */
export function countValidAirlines(s: Staff): number {
  return Object.values(s.cust).filter(v => v === 'valid').length
}

/** Count total customer auth entries */
export function countTotalAirlines(s: Staff): number {
  return Object.keys(s.cust).length
}

/** Format date to Thai-friendly format */
export function fmtDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Build aggregate stats from staff list */
export function buildStats(staff: Staff[]) {
  const total = staff.length
  let valid = 0, expiring = 0, expired = 0
  staff.forEach(s => {
    const st = getSamsStatus(s)
    if (st === 'valid') valid++
    else if (st === 'expiring') expiring++
    else expired++
  })
  const crsReady = staff.filter(s => getCrsStatus(s) === 'full').length
  return { total, valid, expiring, expired, crsReady }
}

/** Get aircraft type families from rating string */
export function getAircraftFamilies(rating: string): string[] {
  const families: string[] = []
  if (/B737/.test(rating)) families.push('B737')
  if (/A320/.test(rating)) families.push('A320 Family')
  if (/B777/.test(rating)) families.push('B777')
  if (/B787/.test(rating)) families.push('B787')
  if (/A330|A340/.test(rating)) families.push('A330')
  return families
}

/** Build report data for export */
export function buildReportData(staff: Staff[], reportType: ReportType, opts: ExportOptions): ReportData {
  let filtered = [...staff]
  if (opts.filterExpiring) {
    filtered = filtered.filter(s => {
      const st = getSamsStatus(s)
      return st === 'expired' || st === 'expiring'
    })
  }

  switch (reportType) {
    case 'sams':
      return buildSamsReport(filtered, opts)
    case 'customer':
      return buildCustomerReport(filtered)
    case 'crs':
      return buildCrsReport(filtered)
    case 'expiring':
      return buildExpiringReport(filtered)
    case 'matrix':
      return buildMatrixReport(filtered)
    case 'full':
    default:
      return buildSamsReport(filtered, opts)
  }
}

function buildSamsReport(staff: Staff[], opts: ExportOptions): ReportData {
  const headers = ['#', 'ID', 'ชื่อ', 'Auth No.']
  if (opts.showRating) headers.push('Rating (AMEL)', 'AMEL Exp.')
  headers.push('Current Issue', 'SAMS Exp.', 'สถานะ', 'วันคงเหลือ')

  const rows = staff.map(s => {
    const st = getSamsStatus(s)
    const d = daysLeft(s.samsExp)
    const row: (string | number)[] = [s.no, s.id, s.name, s.authNo]
    if (opts.showRating) row.push(s.rating.replace(/\n/g, ', '), fmtDate(s.amelExp))
    row.push(fmtDate(s.currDate), fmtDate(s.samsExp), st === 'valid' ? 'ปกติ' : st === 'expiring' ? 'ใกล้หมดอายุ' : 'หมดอายุ', d)
    return row
  })
  return { headers, rows }
}

function buildCustomerReport(staff: Staff[]): ReportData {
  const headers = ['#', 'ID', 'ชื่อ', ...AIRLINE_KEYS.map(k => k)]
  const rows = staff.map(s => {
    const row: (string | number)[] = [s.no, s.id, s.name]
    AIRLINE_KEYS.forEach(k => {
      row.push(s.cust[k] || '—')
    })
    return row
  })
  return { headers, rows }
}

function buildCrsReport(staff: Staff[]): ReportData {
  const headers = ['#', 'ID', 'ชื่อ', 'SAMS Status', 'Valid Airlines', 'Total Airlines', 'CRS Status']
  const rows = staff.map(s => {
    const ss = getSamsStatus(s)
    const crs = getCrsStatus(s)
    return [
      s.no, s.id, s.name,
      ss === 'valid' ? 'ปกติ' : ss === 'expiring' ? 'ใกล้หมดอายุ' : 'หมดอายุ',
      countValidAirlines(s),
      countTotalAirlines(s),
      crs === 'full' ? 'Full CRS' : crs === 'partial' ? 'Partial' : 'No CRS',
    ] as (string | number)[]
  })
  return { headers, rows }
}

function buildExpiringReport(staff: Staff[]): ReportData {
  const filtered = staff.filter(s => {
    const st = getSamsStatus(s)
    return st === 'expired' || st === 'expiring'
  }).sort((a, b) => daysLeft(a.samsExp) - daysLeft(b.samsExp))

  const headers = ['#', 'ID', 'ชื่อ', 'Auth No.', 'SAMS Exp.', 'วันคงเหลือ', 'สถานะ']
  const rows = filtered.map(s => {
    const d = daysLeft(s.samsExp)
    const st = getSamsStatus(s)
    return [s.no, s.id, s.name, s.authNo, fmtDate(s.samsExp), d, st === 'expired' ? 'หมดอายุ' : 'ใกล้หมดอายุ'] as (string | number)[]
  })
  return { headers, rows }
}

function buildMatrixReport(staff: Staff[]): ReportData {
  const headers = ['#', 'ID', 'ชื่อ', 'SAMS', ...AIRLINE_KEYS.map(k => k)]
  const rows = staff.map(s => {
    const ss = getSamsStatus(s)
    const row: (string | number)[] = [s.no, s.id, s.name, ss]
    AIRLINE_KEYS.forEach(k => {
      const v = s.cust[k]
      if (!v) row.push('—')
      else if (v === 'valid') row.push('✓')
      else if (v === 'not_approve') row.push('✕')
      else if (v === 'not_complete') row.push('…')
      else if (v === 'suspended') row.push('S')
      else row.push('—')
    })
    return row
  })
  return { headers, rows }
}
