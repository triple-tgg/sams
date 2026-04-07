import type { EnrollableStaff, EnrollmentRecord } from './types'

// ─── Staff Pool ──────────────────────────────────────────────────────────────
// Re-use staff from Authorization module + add department info

export const ENROLLABLE_STAFF: EnrollableStaff[] = [
  { id: '0012', name: 'Mr. Sanmanas Ruangsri',           license: 'B1',    dept: 'Maintenance',          rating: 'B737-300/400/500, B737-600/700/800/900', color: '#3b82f6' },
  { id: '0013', name: 'Mr. Pissanu Arunbutr',            license: 'B1/B2', dept: 'Maintenance',          rating: 'B737-300/400/500, B737-600/700/800/900', color: '#8b5cf6' },
  { id: '0020', name: 'Mr. Phaisal Sangasang',           license: 'B1',    dept: 'Maintenance',          rating: 'A320 Family (CEO/NEO)',                  color: '#06b6d4' },
  { id: '0022', name: 'Mr. Chalong Siri',                license: 'B1/B2', dept: 'Maintenance',          rating: 'A320 Family (CEO/NEO)',                  color: '#f59e0b' },
  { id: '0028', name: 'Mr. Papoj Imudom',                license: 'B1',    dept: 'Maintenance',          rating: 'B737-600/700/800/900, B737 MAX',         color: '#10b981' },
  { id: '0041', name: 'Mr. Prakarn Sribudh',             license: 'B1',    dept: 'Technical Services',   rating: 'B737-600/700/800/900 (CFM56)',           color: '#ef4444' },
  { id: '0047', name: 'Mr. Trairattana Klinkaewboonvong',license: 'B1/B2', dept: 'Maintenance',          rating: 'B737-300/400/500, B737-600/700/800/900', color: '#a855f7' },
  { id: '0049', name: 'Mr. Thawansak Bharmmano',         license: 'B1',    dept: 'Maintenance',          rating: 'A320 Family (CEO/NEO), B787',            color: '#0ea5e9' },
  { id: '0052', name: 'Mr. Pongsak Wongrak',             license: 'B2',    dept: 'Compliance Monitoring', rating: 'A320 Family (CEO/NEO)',                  color: '#f97316' },
  { id: '0055', name: 'Mr. Chinnapat Kitpaiboon',        license: 'B1',    dept: 'Maintenance',          rating: 'B737-600/700/800/900',                   color: '#14b8a6' },
  { id: '0058', name: 'Mr. Surasak Mongkolkij',          license: 'B1/B2', dept: 'Maintenance',          rating: 'B777-200/300, B777-200ER/300ER',         color: '#6366f1' },
  { id: '0061', name: 'Mr. Wichai Thammasiri',           license: 'B1',    dept: 'Technical Services',   rating: 'A330-200/300, A340-500/600',             color: '#ec4899' },
  { id: '0064', name: 'Mr. Nattapong Keeplong',          license: 'B1',    dept: 'Maintenance',          rating: 'B787-8/9/10',                            color: '#84cc16' },
  { id: '0067', name: 'Mr. Arthit Somjai',               license: 'B1/B2', dept: 'Maintenance',          rating: 'B737-600/700/800/900, A320 Family',      color: '#f43f5e' },
  { id: '0070', name: 'Mr. Kittisak Rungsri',            license: 'B2',    dept: 'Compliance Monitoring', rating: 'A320 Family (CEO/NEO)',                  color: '#d946ef' },
  { id: '0073', name: 'Mr. Thanawat Boonprasert',        license: 'B1',    dept: 'Maintenance',          rating: 'B737-600/700/800/900',                   color: '#0891b2' },
]

// ─── Initial Enrollment Records ─────────────────────────────────────────────
// Pre-populate some enrollments for demo

export const INITIAL_ENROLLMENTS: EnrollmentRecord[] = [
  // Session 4 — DG-001 (38 enrolled)
  { staffId: '0012', sessionId: 4, status: 'enrolled', enrolledAt: '2026-03-25', enrolledBy: 'QA Manager' },
  { staffId: '0013', sessionId: 4, status: 'enrolled', enrolledAt: '2026-03-25', enrolledBy: 'QA Manager' },
  { staffId: '0020', sessionId: 4, status: 'enrolled', enrolledAt: '2026-03-26', enrolledBy: 'QA Manager' },
  { staffId: '0022', sessionId: 4, status: 'enrolled', enrolledAt: '2026-03-26', enrolledBy: 'QA Manager' },
  { staffId: '0028', sessionId: 4, status: 'enrolled', enrolledAt: '2026-03-27', enrolledBy: 'QA Manager' },
  { staffId: '0041', sessionId: 4, status: 'enrolled', enrolledAt: '2026-03-27', enrolledBy: 'QA Manager' },
  { staffId: '0047', sessionId: 4, status: 'enrolled', enrolledAt: '2026-03-28', enrolledBy: 'QA Manager' },
  { staffId: '0049', sessionId: 4, status: 'enrolled', enrolledAt: '2026-03-28', enrolledBy: 'QA Manager' },

  // Session 5 — SP-FTS1 (8 enrolled)
  { staffId: '0012', sessionId: 5, status: 'enrolled', enrolledAt: '2026-03-28', enrolledBy: 'QA Manager' },
  { staffId: '0028', sessionId: 5, status: 'enrolled', enrolledAt: '2026-03-29', enrolledBy: 'QA Manager' },
  { staffId: '0041', sessionId: 5, status: 'enrolled', enrolledAt: '2026-03-29', enrolledBy: 'QA Manager' },
  { staffId: '0055', sessionId: 5, status: 'enrolled', enrolledAt: '2026-03-30', enrolledBy: 'QA Manager' },

  // Session 6 — SP-EWIS (15/15 FULL)
  { staffId: '0012', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-20', enrolledBy: 'QA Manager' },
  { staffId: '0013', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-20', enrolledBy: 'QA Manager' },
  { staffId: '0020', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-21', enrolledBy: 'QA Manager' },
  { staffId: '0028', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-21', enrolledBy: 'QA Manager' },
  { staffId: '0041', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-22', enrolledBy: 'QA Manager' },
  { staffId: '0047', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-22', enrolledBy: 'QA Manager' },
  { staffId: '0049', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-23', enrolledBy: 'QA Manager' },
  { staffId: '0052', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-23', enrolledBy: 'QA Manager' },
  { staffId: '0055', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-24', enrolledBy: 'QA Manager' },
  { staffId: '0058', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-24', enrolledBy: 'QA Manager' },
  { staffId: '0061', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-25', enrolledBy: 'QA Manager' },
  { staffId: '0064', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-25', enrolledBy: 'QA Manager' },
  { staffId: '0067', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-26', enrolledBy: 'QA Manager' },
  { staffId: '0070', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-26', enrolledBy: 'QA Manager' },
  { staffId: '0073', sessionId: 6, status: 'enrolled', enrolledAt: '2026-03-27', enrolledBy: 'QA Manager' },

  // Session 7 — AT-A320 (10 enrolled)
  { staffId: '0020', sessionId: 7, status: 'enrolled', enrolledAt: '2026-04-01', enrolledBy: 'QA Manager' },
  { staffId: '0022', sessionId: 7, status: 'enrolled', enrolledAt: '2026-04-01', enrolledBy: 'QA Manager' },
  { staffId: '0049', sessionId: 7, status: 'enrolled', enrolledAt: '2026-04-02', enrolledBy: 'QA Manager' },
  { staffId: '0052', sessionId: 7, status: 'enrolled', enrolledAt: '2026-04-02', enrolledBy: 'QA Manager' },
  { staffId: '0067', sessionId: 7, status: 'enrolled', enrolledAt: '2026-04-03', enrolledBy: 'QA Manager' },
  { staffId: '0070', sessionId: 7, status: 'enrolled', enrolledAt: '2026-04-03', enrolledBy: 'QA Manager' },

  // Session 1 — HF-001 (Completed, mixed statuses)
  { staffId: '0012', sessionId: 1, status: 'attended',  enrolledAt: '2026-03-01', enrolledBy: 'QA Manager' },
  { staffId: '0013', sessionId: 1, status: 'attended',  enrolledAt: '2026-03-01', enrolledBy: 'QA Manager' },
  { staffId: '0020', sessionId: 1, status: 'attended',  enrolledAt: '2026-03-02', enrolledBy: 'QA Manager' },
  { staffId: '0022', sessionId: 1, status: 'attended',  enrolledAt: '2026-03-02', enrolledBy: 'QA Manager' },
  { staffId: '0028', sessionId: 1, status: 'attended',  enrolledAt: '2026-03-03', enrolledBy: 'QA Manager' },
  { staffId: '0041', sessionId: 1, status: 'no_show',   enrolledAt: '2026-03-03', enrolledBy: 'QA Manager' },
  { staffId: '0047', sessionId: 1, status: 'attended',  enrolledAt: '2026-03-04', enrolledBy: 'QA Manager' },
  { staffId: '0052', sessionId: 1, status: 'cancelled', enrolledAt: '2026-03-04', enrolledBy: 'QA Manager' },
]
