import { AttachFileFormInputs, getDefaultAttachFileValues, mapApiDataToAttachFileForm } from './types'
import { AttachFileOtherData } from '@/lib/api/lineMaintenances/attachfile-other/putAttachfileOther'
import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'

/**
 * Get default values for the attach file form
 */
export const getDefaultValues = (): AttachFileFormInputs => {
  return getDefaultAttachFileValues()
}

/**
 * Map THF data to attach file form data
 * @param data - THF response data
 * @returns Transformed form data
 */
export const mapDataThfToAttachFileStep = (
  data?: LineMaintenanceThfResponse | null
): AttachFileFormInputs => {
  if (!data?.responseData?.attachFilesOthers || data.responseData.attachFilesOthers.length === 0) {
    return getDefaultValues()
  }

  // Transform AttachFile to AttachFileOtherData format
  const attachFileOtherData: AttachFileOtherData[] = data?.responseData?.attachFilesOthers.map(file => ({
    id: file.id || "",
    storagePath: file.storagePath || "",
    realName: file.realName || "",
    fileType: file.fileType || "",
    isDelete: file.isDelete || false
  }))
  console.log("mapApiDataToAttachFileForm(attachFileOtherData)", mapApiDataToAttachFileForm(attachFileOtherData))
  return mapApiDataToAttachFileForm(attachFileOtherData)
}

/**
 * Prepare form data for API submission
 * @param formData - Form data from React Hook Form
 * @returns Array of attach file data for API
 */
export const prepareAttachFileDataForApi = (
  formData: AttachFileFormInputs
): AttachFileOtherData[] => {
  // Handle case where attachFiles might be undefined
  if (!formData.attachFiles || formData.attachFiles.length === 0) {
    return []
  }

  return formData.attachFiles
    .filter(file => file.status === 'completed' && file.storagePath && file.realName)
    .map(file => ({
      id: file.id && !String(file.id).startsWith('uploaded-') ? file.id : null,
      storagePath: file.storagePath!,
      realName: file.realName!,
      fileType: file.fileType,
      isDelete: file.isDelete || false
    }))
}

/**
 * Generate a unique ID for file entries
 */
export const generateFileId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 * @param filename - File name
 * @returns File extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Check if file is an image
 * @param file - File object
 * @returns Boolean indicating if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

/**
 * Sanitize filename for display
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * THF modal step (0-based index, same order as `steps` in CreateThfModal) that a
 * thf-validate-for-done error message most likely belongs to, so the user can jump there to fix it.
 * Matching is keyword based because the API returns plain text messages.
 * Order matters: more specific keywords (parts/tools) are checked before broader ones (equipment).
 */
const VALIDATION_STEP_RULES: { step: number; label: string; keywords: RegExp }[] = [
  { step: 3, label: 'Parts & Tools', keywords: /\b(parts?|tools?|p\/n|part ?no|serial)\b/i },
  { step: 2, label: 'Equipment', keywords: /\bequipment|gse\b/i },
  { step: 1, label: 'Services', keywords: /\b(services?|check ?types?|checks?|personnel|staff|mech|engineer|cs|lae|defects?|fluid|oil|hydraulic|fuel|uplift|flight ?deck)\b/i },
  { step: 0, label: 'Flight Info', keywords: /\b(flight|sta|std|ata|atd|eta|arrival|departure|station|airline|a\/?c ?(reg|type)|aircraft|registration|bay|towing|route)\b/i },
  { step: 5, label: 'Attach File', keywords: /\b(attach(ment|ed)?|files?|documents?)\b/i },
]

export const getStepForValidationError = (message: string): { step: number; label: string } | null => {
  const rule = VALIDATION_STEP_RULES.find(r => r.keywords.test(message))
  return rule ? { step: rule.step, label: rule.label } : null
}

/**
 * Backend field path (e.g. `flights.acReg`) → UI label + step.
 * Keys are matched on the last path segment, so `flights.acReg` and `acReg` both hit `acReg`.
 * `formField` = field name in that step's form (used by "Fix" to highlight + focus it).
 * Unknown fields fall back to a humanized name (e.g. `checkSubType` → "Check Sub Type").
 */
const FIELD_LABELS: Record<string, { label: string; step: number; formField?: string }> = {
  // Flight Info
  airlineObj: { label: 'Customer / Airlines', step: 0, formField: 'customer' },
  airlineId: { label: 'Customer / Airlines', step: 0, formField: 'customer' },
  airlinesId: { label: 'Customer / Airlines', step: 0, formField: 'customer' },
  flightDate: { label: 'Flight Date', step: 0, formField: 'arrivalDate' },
  // Record links (no input field): "Fix" opens Flight Info so the user can re-save it
  lineMaintenances: { label: 'THF Record', step: 0 },
  flights: { label: 'Flight Record', step: 0 },
  flightsId: { label: 'Flight Link', step: 0 },
  flightInfosId: { label: 'Flight Info Link', step: 0 },
  stationObj: { label: 'Station', step: 0, formField: 'station' },
  stationId: { label: 'Station', step: 0, formField: 'station' },
  acReg: { label: 'A/C Reg', step: 0, formField: 'acReg' },
  acTypeObj: { label: 'A/C Type', step: 0, formField: 'acTypeCode' },
  acTypeId: { label: 'A/C Type', step: 0, formField: 'acTypeCode' },
  routeFrom: { label: 'Route From', step: 0, formField: 'routeFrom' },
  routeTo: { label: 'Route To', step: 0, formField: 'routeTo' },
  arrivalFlightNo: { label: 'Arrival Flight No', step: 0, formField: 'flightArrival' },
  arrivalStaDate: { label: 'STA (UTC)', step: 0, formField: 'sta' },
  arrivalAtaDate: { label: 'ATA (UTC)', step: 0, formField: 'ata' },
  arrivalDate: { label: 'Arrival Date', step: 0, formField: 'arrivalDate' },
  departureFlightNo: { label: 'Departure Flight No', step: 0, formField: 'flightDeparture' },
  departureDate: { label: 'Departure Date', step: 0, formField: 'departureDate' },
  departureStdDate: { label: 'STD (UTC)', step: 0, formField: 'std' },
  departureAtdDate: { label: 'ATD (UTC)', step: 0, formField: 'atd' },
  thfNumber: { label: 'THF Number', step: 0, formField: 'thfNumber' },
  bayNo: { label: 'Bay', step: 0, formField: 'bay' },
  statusObj: { label: 'Status', step: 0, formField: 'status' },
  note: { label: 'Note', step: 0, formField: 'note' },
  // Services
  checkType: { label: 'Check Type', step: 1 },
  checkSubType: { label: 'Check Sub Type', step: 1 },
  csList: { label: 'CS', step: 1 },
  mechList: { label: 'Mech', step: 1 },
}

const humanizeField = (key: string): string =>
  key
    .replace(/(Obj|Id)$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim()

const lookupField = (path: string) => {
  const key = path.trim().split('.').pop() ?? path
  return FIELD_LABELS[key] ?? null
}

/** Field path → UI label, e.g. `flights.acReg` → `A/C Reg`. */
export const getFieldLabel = (path: string): string => {
  const key = path.trim().split('.').pop() ?? path
  return lookupField(path)?.label ?? humanizeField(key)
}

const MISSING_FIELDS_RE = /^(\s*missing fields?\s*:\s*)(.+)$/i

const splitFieldList = (list: string) => list.split(',').map(f => f.trim()).filter(Boolean)

/** Rewrites "Missing fields: flights.acReg, flights.routeTo" → "Missing fields: A/C Reg, Route To". */
export const formatValidationMessage = (message: string): string => {
  const match = message.match(MISSING_FIELDS_RE)
  if (!match) return message
  return `Missing fields: ${splitFieldList(match[2]).map(getFieldLabel).join(', ')}`
}

const STEP_LABELS: Record<number, string> = {
  0: 'Flight Info',
  1: 'Services',
  2: 'Equipment',
  3: 'Parts & Tools',
  5: 'Attach File',
}

/** Step for a validation message: field map first (for "Missing fields: ..."), then keyword rules. */
export const getStepForValidationMessage = (message: string): { step: number; label: string } | null => {
  const match = message.match(MISSING_FIELDS_RE)
  if (match) {
    const steps = splitFieldList(match[2]).map(f => lookupField(f)?.step).filter((s): s is number => s !== undefined)
    if (steps.length > 0) {
      const step = Math.min(...steps)
      return { step, label: STEP_LABELS[step] }
    }
  }
  return getStepForValidationError(message)
}

/**
 * Form fields to highlight after clicking "Fix" for a message, limited to the target step.
 * e.g. "Missing fields: flights.acReg" → [{ name: 'acReg', message: 'A/C Reg is required' }]
 */
export const getFixTargetsForMessage = (message: string, step: number): { name: string; message: string }[] => {
  const match = message.match(MISSING_FIELDS_RE)
  if (!match) return []
  return splitFieldList(match[2]).flatMap(path => {
    const field = lookupField(path)
    if (!field?.formField || field.step !== step) return []
    return [{ name: field.formField, message: `${field.label} is required` }]
  })
}

type FlightTimeSource = {
  arrivalFlightNo?: string | null
  arrivalStaDate?: string | null
  arrivalAtaDate?: string | null
  departureFlightNo?: string | null
  departureStdDate?: string | null
  departureAtdDate?: string | null
} | null | undefined

/** Splits a UTC datetime ("YYYY-MM-DD HH:mm" or ISO) into its date and time parts. */
const splitDateTime = (value?: string | null): { date: string; time: string } => {
  const [date = '', time = ''] = (value ?? '').trim().split(/[ T]/)
  return { date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '', time: /^\d{1,2}:\d{2}/.test(time) ? time : '' }
}

/**
 * Submit-only check (the API does not validate these): Arrival/Departure Flight No, Date,
 * STA/ATA and STD/ATD must all be filled. Returns a "Missing fields: ..." message
 * (same format as the API, so labels and "Fix" work), or null when complete.
 */
export const getMissingFlightTimeMessage = (flight: FlightTimeSource): string | null => {
  const sta = splitDateTime(flight?.arrivalStaDate)
  const ata = splitDateTime(flight?.arrivalAtaDate)
  const std = splitDateTime(flight?.departureStdDate)
  const atd = splitDateTime(flight?.departureAtdDate)
  const checks: [string, boolean][] = [
    ['flights.arrivalFlightNo', !!flight?.arrivalFlightNo?.trim()],
    ['flights.arrivalDate', !!sta.date],
    ['flights.arrivalStaDate', !!sta.time],
    ['flights.arrivalAtaDate', !!ata.time],
    ['flights.departureFlightNo', !!flight?.departureFlightNo?.trim()],
    ['flights.departureDate', !!std.date],
    ['flights.departureStdDate', !!std.time],
    ['flights.departureAtdDate', !!atd.time],
  ]
  const missing = checks.filter(([, ok]) => !ok).map(([path]) => path)
  return missing.length > 0 ? `Missing fields: ${missing.join(', ')}` : null
}
