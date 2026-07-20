export type CustomerAuthUiStatus =
  | 'valid'
  | 'not_approve'
  | 'not_complete'
  | 'suspended'
  | 'pending'

interface CustomerAuthAircraft {
  id?: number
  aircraftTypeLicensId?: number
  code?: string | null
  name?: string | null
}

export interface CustomerAuthCellSource {
  status?: string | null
  aircrafts?: CustomerAuthAircraft[] | null
  initialIssueDate?: string | null
  currentIssueDate?: string | null
  expiryDate?: string | null
}

export interface CustomerAuthRecordIdentity {
  authorizationCustomerId: number
  staffId: number
  airlineId: number
}

export interface CustomerAuthRecordSource extends CustomerAuthRecordIdentity {
  authorizationStatus?: { code?: string | null } | null
  initialIssueDate?: string | null
  currentIssueDate?: string | null
  expiryDate?: string | null
}

interface CustomerAuthAircraftLicenseRef {
  id: number
  aircraftTypeLicensId: number
  isdelete?: boolean
}

interface CustomerAuthAircraftOption {
  id: number
  code: string
  name: string
}

export function getCustomerAuthCellKey(staffId: number, airlineId: number) {
  return `${staffId}:${airlineId}`
}

export function getCustomerAuthDateValue(value: string | null | undefined) {
  if (!value) return ''
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : ''
}

export function formatCustomerAuthDate(value: string | null | undefined) {
  const dateValue = getCustomerAuthDateValue(value)
  if (!dateValue) return value || '—'
  const [year, month, day] = dateValue.split('-')
  return `${day}/${month}/${year.slice(-2)}`
}

export function buildCustomerAuthRecordIdMap(records: CustomerAuthRecordIdentity[]) {
  return new Map(records.map(record => [
    getCustomerAuthCellKey(record.staffId, record.airlineId),
    record.authorizationCustomerId,
  ]))
}

export function buildCustomerAuthRecordMap<T extends CustomerAuthRecordIdentity>(records: T[]) {
  return new Map(records.map(record => [
    getCustomerAuthCellKey(record.staffId, record.airlineId),
    record,
  ]))
}

export function resolveCustomerAuthCell(
  cell: CustomerAuthCellSource,
  record?: CustomerAuthRecordSource,
) {
  if (record) {
    return {
      status: record.authorizationStatus?.code?.trim() || '',
      initialIssueDate: record.initialIssueDate || '',
      currentIssueDate: record.currentIssueDate || '',
      expiryDate: record.expiryDate || '',
    }
  }
  return {
    status: cell.status?.trim() || '',
    initialIssueDate: cell.initialIssueDate || '',
    currentIssueDate: cell.currentIssueDate || '',
    expiryDate: cell.expiryDate || '',
  }
}

export function resolveCustomerAuthAircrafts(
  listAircrafts: CustomerAuthAircraft[],
  recordLicenses: CustomerAuthAircraftLicenseRef[] | undefined,
  aircraftOptions: CustomerAuthAircraftOption[],
) {
  if (!recordLicenses) return listAircrafts
  return recordLicenses
    .filter(license => !license.isdelete)
    .map(license => {
      const option = aircraftOptions.find(item => item.id === license.aircraftTypeLicensId)
      if (!option) return null
      return {
        id: license.id,
        aircraftTypeLicensId: license.aircraftTypeLicensId,
        code: option.code,
        name: option.name,
      }
    })
    .filter((aircraft): aircraft is NonNullable<typeof aircraft> => aircraft !== null)
}

export function shouldShowCustomerAuthDates(
  status: CustomerAuthUiStatus,
  cell: Pick<CustomerAuthCellSource, 'currentIssueDate' | 'expiryDate'>,
) {
  if (status === 'valid') return true
  return status === 'pending' && Boolean(cell.currentIssueDate || cell.expiryDate)
}

export function getCustomerAuthPageItems<T>(items: T[], page: number, perPage: number) {
  if (items.length <= perPage) return items
  const start = Math.max(0, page - 1) * perPage
  return items.slice(start, start + perPage)
}

export function mapCustomerAuthStatus(statusCode: string | null | undefined): CustomerAuthUiStatus {
  switch ((statusCode || '').trim().toUpperCase()) {
    case 'VAL': return 'valid'
    case 'NAP': return 'not_approve'
    case 'NCP': return 'not_complete'
    case 'SUS': return 'suspended'
    case 'PEN':
    default: return 'pending'
  }
}

export function getCustomerAuthCellData(source: CustomerAuthCellSource | null | undefined) {
  const aircraftLabels = Array.from(new Set(
    (source?.aircrafts || [])
      .map(aircraft => aircraft.code?.trim() || aircraft.name?.trim() || '')
      .filter(Boolean),
  ))

  return {
    status: mapCustomerAuthStatus(source?.status),
    aircraftLabels,
    initialIssueDate: source?.initialIssueDate || '',
    currentIssueDate: source?.currentIssueDate || '',
    expiryDate: source?.expiryDate || '',
  }
}
