// ─── Authorization Types — FM-CM-063 Rev.08 ─────────────────────────────────

export const AIRLINE_KEYS = [
  'MNA', 'NIN', 'SEJ', 'FFM', 'NOK', 'RLH', 'INDIGO', 'AIXL', 'HLF',
  'PAL', 'QDO', 'CEBU', 'AI', 'AKASA', 'ASA', 'TGW', 'MH', 'ZE',
] as const

export const AUTHORITY_KEYS = [
  'CAAT', 'CAAM', 'CAAP', 'CAAS', 'DGCA_India', 'DGCA_Indonesia',
  'CAASL', 'GCAA', 'MOLIT', 'FAA', 'EASA', 'GACA', 'DGCA_Kuwait'
] as const

export type AirlineKey = (typeof AIRLINE_KEYS)[number]
export type AuthorityKey = (typeof AUTHORITY_KEYS)[number]

export type CustomerAuthValue =
  | 'valid'          // authorized
  | 'not_approve'    // customer rejected
  | 'not_complete'   // training/docs incomplete
  | 'suspended'      // temporarily revoked
  | 'pending'        // awaiting submission

export type SamsAuthStatus = 'valid' | 'expiring' | 'expired'

export type CrsStatus = 'full' | 'partial' | 'none'

export interface Staff {
  no: number
  id: string                // e.g. "0012"
  name: string              // e.g. "Mr. Sanmanas Ruangsri"
  rating: string            // AMEL aircraft type ratings (multiline)
  amelExp: string           // AMEL license expiry (ISO date)
  authNo: string            // e.g. "SAMS/CM/AUT-L002"
  initDate: string          // initial issue date (ISO date)
  currDate: string          // current issue date (ISO date)
  samsExp: string           // SAMS authorization expiry (ISO date)
  color: string             // avatar color hex
  license: string           // e.g. "B1", "B2", "B1/B2"
  note?: string             // optional remark
  cust: Partial<Record<AirlineKey, CustomerAuthValue>>
  auth: Partial<Record<AuthorityKey, CustomerAuthValue>>
}

export interface Airline {
  code: AirlineKey
  name: string
  color: string             // brand color
}

export interface Authority {
  code: AuthorityKey
  name: string
  color: string
}

// ─── Export Types ────────────────────────────────────────────────────────────

export type ReportType = 'full' | 'sams' | 'customer' | 'crs' | 'expiring' | 'matrix'

export type ExportFormat = 'xlsx' | 'pdf' | 'csv'

export interface ExportOptions {
  filterExpiring: boolean       // กรองเฉพาะหมดอายุ/ใกล้หมดอายุ
  includeCustomer: boolean      // รวม Customer Authorization
  showRating: boolean           // แสดง Rating (AMEL)
  headerFooter: boolean         // Header/Footer (PDF only)
}

export interface ReportData {
  headers: string[]
  rows: (string | number)[][]
}

// ─── Status Visual Config ───────────────────────────────────────────────────

export const SAMS_STATUS_META: Record<SamsAuthStatus, { bg: string; dot: string; text: string; label: string; labelTh: string }> = {
  valid:    { bg: '#dcfce7', dot: '#16a34a', text: '#15803d', label: 'Valid',    labelTh: 'ปกติ' },
  expiring: { bg: '#fef3c7', dot: '#d97706', text: '#92400e', label: 'Expiring', labelTh: 'ใกล้หมดอายุ' },
  expired:  { bg: '#fee2e2', dot: '#dc2626', text: '#991b1b', label: 'Expired',  labelTh: 'หมดอายุ' },
}

export const CUST_STATUS_META: Record<CustomerAuthValue, { bg: string; dot: string; text: string; label: string; labelTh: string; icon: string }> = {
  valid:        { bg: '#dcfce7', dot: '#16a34a', text: '#15803d', label: 'Valid',        labelTh: 'อนุมัติ',    icon: '✓' },
  not_approve:  { bg: '#fee2e2', dot: '#dc2626', text: '#991b1b', label: 'Not Approved', labelTh: 'ไม่อนุมัติ', icon: '✕' },
  not_complete: { bg: '#fef3c7', dot: '#d97706', text: '#92400e', label: 'Not Complete', labelTh: 'ไม่ครบ',     icon: '…' },
  suspended:    { bg: '#fce7f3', dot: '#be185d', text: '#9d174d', label: 'Suspended',    labelTh: 'ระงับ',      icon: 'S' },
  pending:      { bg: '#f1f5f9', dot: '#64748b', text: '#475569', label: 'Pending',      labelTh: 'รอดำเนินการ', icon: '—' },
}

export const CRS_STATUS_META: Record<CrsStatus, { bg: string; dot: string; text: string; label: string; labelTh: string; icon: string }> = {
  full:    { bg: '#dcfce7', dot: '#16a34a', text: '#15803d', label: 'Full CRS',    labelTh: 'CRS เต็ม',     icon: '✅' },
  partial: { bg: '#fef3c7', dot: '#d97706', text: '#92400e', label: 'Partial CRS', labelTh: 'CRS บางส่วน',  icon: '⚠️' },
  none:    { bg: '#fee2e2', dot: '#dc2626', text: '#991b1b', label: 'No CRS',      labelTh: 'ไม่สามารถออก', icon: '⛔' },
}
