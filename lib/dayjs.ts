import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

// ─── Plugin Registration ────────────────────────────────────────────────────
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(buddhistEra);

// dayjs.locale('th');

// ─── Timezone Strategy (Project Standard) ──────────────────────────────────
// Display  → ใช้ local timezone ของ browser (dayjs default)
// API Send → แปลงเป็น ISO 8601 UTC (YYYY-MM-DDTHH:mm:ssZ) ก่อนส่งทุกครั้ง
// ไม่ set default timezone เพื่อให้ dayjs ใช้ local timezone ของ user

export const UTC_ISO_FORMAT = 'YYYY-MM-DDTHH:mm:ss[Z]'

// ─── Utility Functions ──────────────────────────────────────────────────────
export const dateTimeUtils = {
  // ─── Display (Local Timezone ของ User) ──────────────────────────
  /** วันนี้ใน local timezone (YYYY-MM-DD) — สำหรับ default form values, display */
  todayLocal: () => dayjs().format('YYYY-MM-DD'),
  /** เวลาปัจจุบัน local (HH:mm) */
  nowTimeLocal: () => dayjs().format('HH:mm'),
  /** วันเวลาปัจจุบัน local (YYYY-MM-DD HH:mm) */
  nowLocal: () => dayjs().format('YYYY-MM-DD HH:mm'),

  /** แสดง date ใน local timezone */
  displayDate: (date: string | Date) => dayjs(date).format('YYYY-MM-DD'),
  /** แสดง time ใน local timezone */
  displayTime: (time: string | Date) => dayjs(time).format('HH:mm'),
  /** แสดง datetime ใน local timezone */
  displayDateTime: (dateTime: string | Date) => dayjs(dateTime).format('YYYY-MM-DD HH:mm'),

  // ─── API Submission (ISO 8601 UTC: YYYY-MM-DDTHH:mm:ssZ) ────────
  /** แปลง local date/time → ISO 8601 UTC (YYYY-MM-DDTHH:mm:ssZ) สำหรับส่ง API */
  toUtcIso: (date: string | Date) => dayjs(date).utc().format(UTC_ISO_FORMAT),
  /** แปลง local start of day → ISO 8601 UTC (เช่น "2026-11-01T17:00:00Z") สำหรับ filter dateStart / startDate */
  toUtcStartOfDay: (date: string | Date) =>
    date ? dayjs(date).startOf('day').utc().format(UTC_ISO_FORMAT) : '',
  /** แปลง local end of day → ISO 8601 UTC (เช่น "2026-11-04T16:59:59Z") สำหรับ filter dateEnd / endDate */
  toUtcEndOfDay: (date: string | Date) =>
    date ? dayjs(date).endOf('day').utc().format(UTC_ISO_FORMAT) : '',
  /** แปลง local date → UTC date (YYYY-MM-DD) */
  toUtcDate: (date: string | Date) => dayjs(date).utc().format('YYYY-MM-DD'),

  /** Get today as YYYY-MM-DD (local date — safe for date-only API fields) */
  todayForApi: () => dayjs().format('YYYY-MM-DD'),

  /** Convert any date to YYYY-MM-DD (local — safe for date-only API fields) */
  dateForApi: (date: string | Date) => dayjs(date).format('YYYY-MM-DD'),

  // ─── Parse (UTC from API → Local for Display) ─────────────────
  /** แปลง UTC date จาก API → dayjs instance ใน local timezone */
  fromApi: (utcDate: string) => dayjs.utc(utcDate).local(),
  /** แปลง UTC date จาก API → formatted string ใน local timezone */
  fromApiFormat: (utcDate: string, format: string) =>
    dayjs.utc(utcDate).local().format(format),

  // ─── Validation ───────────────────────────────────────────────
  isValidDate: (date: string) => dayjs(date).isValid(),
  isValidTime: (time: string) => dayjs(`2000-01-01 ${time}`).isValid(),

  // ─── Date Arithmetic (Local) ──────────────────────────────────
  addDays: (date: string, days: number) => dayjs(date).add(days, 'day').format('YYYY-MM-DD'),
  subtractDays: (date: string, days: number) => dayjs(date).subtract(days, 'day').format('YYYY-MM-DD'),

  // ─── Comparison ───────────────────────────────────────────────
  isSameDay: (date1: string, date2: string) => dayjs(date1).isSame(dayjs(date2), 'day'),
  isAfter: (date1: string, date2: string) => dayjs(date1).isAfter(dayjs(date2)),
  isBefore: (date1: string, date2: string) => dayjs(date1).isBefore(dayjs(date2)),

  // ─── Legacy Aliases (backward compatibility) ──────────────────
  /** @deprecated Use todayLocal() instead */
  getCurrentDate: () => dayjs().format('YYYY-MM-DD'),
  /** @deprecated Use nowTimeLocal() instead */
  getCurrentTime: () => dayjs().format('HH:mm'),
  /** @deprecated Use nowLocal() instead */
  getCurrentDateTime: () => dayjs().format('YYYY-MM-DD HH:mm'),
}