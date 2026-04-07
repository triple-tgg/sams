// ─── Enrollment Types ────────────────────────────────────────────────────────

export type EnrollmentStatus = 'enrolled' | 'attended' | 'no_show' | 'cancelled'

export interface EnrollableStaff {
  id: string
  name: string
  license: string
  dept: string
  rating: string
  color: string
}

export interface EnrollmentRecord {
  staffId: string
  sessionId: number
  status: EnrollmentStatus
  enrolledAt: string       // ISO date
  enrolledBy: string       // Manager name
  note?: string
}

export const ENROLLMENT_STATUS_META: Record<EnrollmentStatus, { bg: string; dot: string; text: string; label: string }> = {
  enrolled:  { bg: '#dbeafe', dot: '#3b82f6', text: '#1e40af', label: 'Enrolled' },
  attended:  { bg: '#dcfce7', dot: '#16a34a', text: '#15803d', label: 'Attended' },
  no_show:   { bg: '#fee2e2', dot: '#dc2626', text: '#991b1b', label: 'No Show' },
  cancelled: { bg: '#f1f5f9', dot: '#64748b', text: '#475569', label: 'Cancelled' },
}
