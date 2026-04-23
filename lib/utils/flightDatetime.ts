import dayjs from 'dayjs'
import '@/lib/dayjs' // ensure UTC + timezone plugins loaded

// ═══════════════════════════════════════════════════════════
// Flight DateTime Utilities
// ═══════════════════════════════════════════════════════════
// API ใหม่ส่ง datetime รวมเป็น "YYYY-MM-DD HH:mm" ใน UTC
// ฟังก์ชันเหล่านี้ช่วยแยก/รวม/แปลง timezone

// === API → Display (UTC → Local) ===

/**
 * แยก UTC datetime string → { date, time } เป็น Local timezone
 * สำหรับแสดงผลในตาราง (FlightTable, columns)
 * @example splitUtcDateTimeToLocal("2026-02-15 13:45") → { date: "2026-02-15", time: "20:45" } (TH +7)
 */
export const splitUtcDateTimeToLocal = (utcDatetime: string | null | undefined): { date: string; time: string } => {
  if (!utcDatetime) return { date: '', time: '' }
  const local = dayjs.utc(utcDatetime).local()
  if (!local.isValid()) return { date: '', time: '' }
  return {
    date: local.format('YYYY-MM-DD'),
    time: local.format('HH:mm'),
  }
}

/**
 * แยก UTC datetime string → { date, time } คง UTC ไว้
 * สำหรับ Form fields ที่ user กรอกเป็น UTC (label: "UTC Time")
 * @example splitUtcDateTime("2026-02-15 13:45") → { date: "2026-02-15", time: "13:45" }
 */
export const splitUtcDateTime = (utcDatetime: string | null | undefined): { date: string; time: string } => {
  if (!utcDatetime) return { date: '', time: '' }
  const d = dayjs.utc(utcDatetime)
  if (!d.isValid()) return { date: '', time: '' }
  return {
    date: d.format('YYYY-MM-DD'),
    time: d.format('HH:mm'),
  }
}

/**
 * UTC datetime → Local datetime formatted for table display
 * @example formatUtcToLocalDisplay("2026-02-15 13:45") → "15-Feb-2026 20:45" (TH +7)
 */
export const formatUtcToLocalDisplay = (utcDatetime: string | null | undefined): string => {
  if (!utcDatetime) return ''
  const local = dayjs.utc(utcDatetime).local()
  return local.isValid() ? local.format('DD-MMM-YYYY HH:mm') : ''
}

/**
 * UTC datetime → Local time only (HH:mm) for compact table display
 * @example formatUtcToLocalTime("2026-02-15 13:45") → "20:45" (TH +7)
 */
export const formatUtcToLocalTime = (utcDatetime: string | null | undefined): string => {
  if (!utcDatetime) return ''
  const local = dayjs.utc(utcDatetime).local()
  return local.isValid() ? local.format('HH:mm') : ''
}

/**
 * UTC datetime → Local dayjs instance for comparison/manipulation
 */
export const utcToLocalDayjs = (utcDatetime: string | null | undefined) => {
  if (!utcDatetime) return null
  const local = dayjs.utc(utcDatetime).local()
  return local.isValid() ? local : null
}

// === Form → API (UTC string) ===

/**
 * รวม date (YYYY-MM-DD) + time (HH:mm) เป็น "YYYY-MM-DD HH:mm" สำหรับส่ง API
 * ค่าจาก Form เป็น UTC อยู่แล้ว (user กรอก UTC ตาม label)
 * @example combineToUtcDatetime("2026-02-15", "13:45") → "2026-02-15 13:45"
 */
export const combineToUtcDatetime = (date: string, time?: string): string => {
  if (!date) return ''
  return `${date} ${time || '00:00'}`
}

/**
 * รวม date (DD/MM/YYYY form format) + time (HH:mm) → "YYYY-MM-DD HH:mm" (UTC) สำหรับส่ง API
 * Form แสดง Local Time ดังนั้นต้องแปลง Local → UTC ก่อนส่ง
 * @example combineFormToUtcDatetime("15/02/2026", "20:45") → "2026-02-15 13:45" (TH -7h)
 */
export const combineFormToUtcDatetime = (formDate: string, time?: string): string => {
  if (!formDate) return ''
  // Convert DD/MM/YYYY → YYYY-MM-DD
  const parts = formDate.split('/')
  if (parts.length !== 3) return ''
  const [day, month, year] = parts
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  // Use ISO T-separator so dayjs parses reliably as LOCAL time (no customParseFormat needed)
  const localIso = `${isoDate}T${time || '00:00'}`
  // Parse as local time → convert to UTC
  const utc = dayjs(localIso).utc()
  if (!utc.isValid()) return ''
  return utc.format('YYYY-MM-DD HH:mm')
}

/**
 * แยก UTC datetime → DD/MM/YYYY (Local form date) สำหรับ populate form date field
 * แปลงเป็น Local timezone เพราะ form แสดง Local Time
 * @example utcDatetimeToFormDate("2026-02-15 13:45") → "15/02/2026" (Local, TH อาจเป็น "16/02/2026" ถ้าข้ามวัน)
 */
export const utcDatetimeToFormDate = (utcDatetime: string | null | undefined): string => {
  if (!utcDatetime) return ''
  const local = dayjs.utc(utcDatetime).local()
  if (!local.isValid()) return ''
  return local.format('DD/MM/YYYY')
}

/**
 * แยก UTC datetime → HH:mm (Local time only) สำหรับ populate form time field
 * แปลงเป็น Local timezone เพราะ form แสดง Local Time
 * @example utcDatetimeToFormTime("2026-02-15 13:45") → "20:45" (TH +7)
 */
export const utcDatetimeToFormTime = (utcDatetime: string | null | undefined): string => {
  if (!utcDatetime) return ''
  const local = dayjs.utc(utcDatetime).local()
  if (!local.isValid()) return ''
  return local.format('HH:mm')
}

