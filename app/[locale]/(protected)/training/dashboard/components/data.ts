import { KpiItem, AuthItem, WorkloadItem, MissingSkill, CriticalAlert, QuickStatItem, C } from './types';

// ── KPI Cards Data ──
export const KPI_ITEMS: KpiItem[] = [
    {
        label: 'TOTAL STAFF', val: '248', sub: '+4 เพิ่มเดือนนี้',
        color: C.primary, dotColor: C.primary, icon: '👥',
        bg: `linear-gradient(135deg,#eff6ff,#dbeafe)`, border: C.primary4,
    },
    {
        label: 'COMPLIANCE RATE', val: '87%', sub: '216/248 พนักงานครบถ้วน',
        color: C.green, dotColor: C.green, icon: '✅',
        bg: `linear-gradient(135deg,#f0fdf4,#dcfce7)`, border: '#86efac',
    },
    {
        label: 'TRAINING IN PROGRESS', val: '34', sub: '7 คอร์ส กำลังดำเนินการ',
        color: C.primary, dotColor: C.primary3, icon: '📚',
        bg: `linear-gradient(135deg,#eff6ff,#dbeafe)`, border: C.primary4,
    },
    {
        label: 'CRITICAL ALERTS', val: '12', sub: 'ใบอนุญาต Expired — ต้องดำเนินการ',
        color: C.red, dotColor: C.red, icon: '🚨',
        bg: `linear-gradient(135deg,#fff1f2,#fee2e2)`, border: '#fca5a5',
    },
];

// ── Authorization Donut Data ──
export const AUTH_DATA: AuthItem[] = [
    { name: 'Valid', value: 179, color: C.green },
    { name: 'Expiring <30d', value: 21, color: C.primary3 },
    { name: 'Expiring 60-90d', value: 14, color: C.primary4 },
    { name: 'Expired', value: 34, color: C.red },
];

// ── Workload Bar Chart Data ──
export const WORKLOAD_DATA: WorkloadItem[] = [
    { month: 'MAR', scheduled: 32, available: 10, overload: 3 },
    { month: 'APR', scheduled: 28, available: 14, overload: 0 },
    { month: 'MAY', scheduled: 25, available: 17, overload: 0 },
    { month: 'JUN', scheduled: 38, available: 5, overload: 5 },
    { month: 'JUL', scheduled: 22, available: 20, overload: 0 },
    { month: 'AUG', scheduled: 30, available: 12, overload: 0 },
];

// ── Missing Skills Data ──
export const MISSING_SKILLS: MissingSkill[] = [
    { rank: 1, name: 'Human Factors', cat: 'REGULATORY · EASA', pct: 68 },
    { rank: 2, name: 'Fuel Tank Safety', cat: 'SAFETY · CASA', pct: 54 },
    { rank: 3, name: 'Engine Run-up', cat: 'TECHNICAL · CAAT', pct: 41 },
    { rank: 4, name: 'SMS Awareness', cat: 'REGULATORY', pct: 35 },
    { rank: 5, name: 'EWIS', cat: 'TECHNICAL · EASA', pct: 28 },
];

// ── Critical Alerts Data ──
export const CRITICAL_ALERTS: CriticalAlert[] = [
    { emp: 'Mr. Phaisal Sangasang', course: 'RVSM/PBN/RNP CAT II/III', since: '18-Feb-2026', days: 16, dept: 'Maintenance' },
    { emp: 'Ms. Siriporn Chaiyut', course: 'Human Factors', since: '01-Feb-2026', days: 33, dept: 'Compliance' },
    { emp: 'Mr. Anon Sombat', course: 'Fuel Tank Safety', since: '15-Jan-2026', days: 50, dept: 'Maintenance' },
    { emp: 'Ms. Wanida Pracha', course: 'SMS Recurrent', since: '10-Jan-2026', days: 55, dept: 'Safety' },
];

// ── Quick Stats Data ──
export const QUICK_STATS: QuickStatItem[] = [
    { label: 'Courses Completed This Month', val: '47', icon: '✅', color: C.green, bg: C.greenL, border: '#86efac' },
    { label: 'Avg. Days to Renew', val: '8.4', icon: '⏱', color: C.primary, bg: C.primary5, border: C.primary4 },
    { label: 'Upcoming Expirations (30d)', val: '21', icon: '📅', color: C.orange, bg: C.orangeL, border: '#fcd34d' },
    { label: 'Certifying Staff Compliant', val: '93%', icon: '🎖', color: C.primary, bg: C.primary5, border: C.primary4 },
];
