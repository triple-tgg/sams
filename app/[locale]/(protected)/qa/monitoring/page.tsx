'use client'

import { useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShieldCheck, AlertTriangle, Clock, Users, BookOpen, RefreshCw } from 'lucide-react'
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { getStatus } from './types'
import { EMPLOYEES, ALL_COURSES, MANDATORY, TYPE_COURSES } from './data'
import { CourseCard } from './components/CourseCard'

// ─── Colors ──────────────────────────────────────────────────────────────────
const COLORS = {
    valid: '#16a34a',
    warning: '#f59e0b',
    expired: '#dc2626',
    missing: '#94a3b8',
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
            {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
                    <span className="text-muted-foreground">{p.name}:</span>
                    <span className="font-bold text-foreground">{p.value}</span>
                </div>
            ))}
        </div>
    )
}

// ─── Custom Donut Label ──────────────────────────────────────────────────────
function DonutCenterLabel({ viewBox, value, label }: any) {
    const { cx, cy } = viewBox
    return (
        <g>
            <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-2xl font-extrabold">
                {value}%
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground text-[10px] font-semibold">
                {label}
            </text>
        </g>
    )
}

export default function MonitoringPage() {
    const router = useRouter()
    const params = useParams()
    const locale = (params?.locale as string) || 'en'

    const now = useMemo(() => new Date(), [])
    const lastUpdated = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    const stats = useMemo(() => {
        let expired = 0, warning = 0, valid = 0, missing = 0
        EMPLOYEES.forEach(emp => {
            ALL_COURSES.forEach(c => {
                const s = getStatus(emp.courses[c.id])
                if (s === 'expired') expired++
                else if (s === 'warning') warning++
                else if (s === 'valid') valid++
                else if (s === 'missing') missing++
            })
        })
        const totalRecords = valid + warning + expired
        const overallCompliance = totalRecords > 0 ? Math.round(valid / totalRecords * 100) : 0
        return { expired, warning, valid, missing, total: EMPLOYEES.length, overallCompliance }
    }, [])

    // Per-course summary
    const courseSummary = useMemo(() =>
        ALL_COURSES.map(c => {
            let valid = 0, warning = 0, expired = 0, na = 0
            EMPLOYEES.forEach(emp => {
                const s = getStatus(emp.courses[c.id])
                if (s === 'valid') valid++
                else if (s === 'warning') warning++
                else if (s === 'expired') expired++
                else na++
            })
            return { ...c, valid, warning, expired, na, compliance: valid + warning > 0 ? Math.round(valid / (valid + warning + expired) * 100) : 0 }
        })
    , [])

    const mandatoryCourses = courseSummary.filter(c => MANDATORY.some(m => m.id === c.id))
    const typeCourses = courseSummary.filter(c => TYPE_COURSES.some(t => t.id === c.id))

    // ─── Chart Data ──────────────────────────────────────────────────────
    const donutData = useMemo(() => [
        { name: 'Valid', value: stats.valid, color: COLORS.valid },
        { name: 'Warning', value: stats.warning, color: COLORS.warning },
        { name: 'Expired', value: stats.expired, color: COLORS.expired },
    ], [stats])

    const barData = useMemo(() =>
        courseSummary
            .filter(c => MANDATORY.some(m => m.id === c.id))
            .map(c => ({
                name: c.short,
                Valid: c.valid,
                Warning: c.warning,
                Expired: c.expired,
            }))
    , [courseSummary])

    // Per position-group compliance
    const radarData = useMemo(() => {
        const groups = ['CS', 'AM', 'MGR', 'QA'] as const
        return MANDATORY.map(c => {
            const entry: Record<string, any> = { course: c.short }
            groups.forEach(g => {
                const emps = EMPLOYEES.filter(e => e.posGroup === g)
                if (emps.length === 0) { entry[g] = 0; return }
                const applicable = emps.filter(e => {
                    const s = getStatus(e.courses[c.id])
                    return s !== 'na' && s !== 'missing'
                })
                const validCount = applicable.filter(e => getStatus(e.courses[c.id]) === 'valid').length
                entry[g] = applicable.length > 0 ? Math.round(validCount / applicable.length * 100) : 0
            })
            return entry
        })
    }, [])

    const handleCourseClick = (courseId: string) => {
        router.push(`/${locale}/qa/monitoring/training-records?course=${courseId}`)
    }

    return (
        <div>
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle>Monitoring</CardTitle>
                    <CardDescription>
                        Quality assurance monitoring and compliance tracking
                        <span className="inline-flex items-center gap-1 ml-3 text-xs text-muted-foreground/70">
                            <RefreshCw className="w-3 h-3" />
                            As of {lastUpdated}
                        </span>
                    </CardDescription>
                    <div className="ml-auto">
                        <Button onClick={() => router.push(`/${locale}/qa/monitoring/training-records`)} color="primary">
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Training Record Monitoring
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* ───── Row 1: Stats + Donut ───── */}
                    <div className="grid grid-cols-[1fr_280px] gap-4">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-5 gap-3">
                            {[
                                { icon: Users, label: 'Total Staff', val: stats.total, color: '#1a56db', bg: '#eff6ff' },
                                { icon: ShieldCheck, label: 'Valid', val: stats.valid, color: '#16a34a', bg: '#f0fdf4' },
                                { icon: Clock, label: 'Warning (≤90d)', val: stats.warning, color: '#d97706', bg: '#fffbeb' },
                                { icon: AlertTriangle, label: 'Expired', val: stats.expired, color: '#dc2626', bg: '#fef2f2' },
                                { icon: BookOpen, label: 'Courses', val: ALL_COURSES.length, color: '#7c3aed', bg: '#f5f3ff' },
                            ].map(({ icon: Icon, label, val, color, bg }) => (
                                <div key={label} className="rounded-xl border border-border p-4 flex items-center gap-3 transition-shadow hover:shadow-sm" style={{ background: bg }}>
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: color + '18' }}>
                                        <Icon className="w-5 h-5" style={{ color }} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold" style={{ color }}>{val}</p>
                                        <p className="text-xs text-muted-foreground">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Overall Donut */}
                        <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Overall Compliance</p>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                        strokeWidth={2}
                                        stroke="var(--card)"
                                    >
                                        {donutData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle"
                                        style={{ fontSize: '22px', fontWeight: 800, fill: stats.overallCompliance >= 80 ? COLORS.valid : stats.overallCompliance >= 60 ? COLORS.warning : COLORS.expired }}>
                                        {stats.overallCompliance}%
                                    </text>
                                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle"
                                        style={{ fontSize: '10px', fontWeight: 600, fill: '#94a3b8' }}>
                                        Compliance
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex items-center gap-3 mt-1">
                                {donutData.map(d => (
                                    <div key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                        {d.name} ({d.value})
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ───── Row 2: Bar Chart + Radar Chart ───── */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Bar Chart — Mandatory Course Breakdown */}
                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
                                Mandatory Course Status
                            </p>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={barData} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} stroke="var(--muted-foreground)" />
                                    <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                                    />
                                    <Bar dataKey="Valid" stackId="a" fill={COLORS.valid} radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Warning" stackId="a" fill={COLORS.warning} />
                                    <Bar dataKey="Expired" stackId="a" fill={COLORS.expired} radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Radar Chart — Compliance by Position Group */}
                        <div className="rounded-xl border border-border bg-card p-5">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
                                Compliance by Position Group
                            </p>
                            <ResponsiveContainer width="100%" height={220}>
                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                                    <PolarGrid stroke="var(--border)" />
                                    <PolarAngleAxis dataKey="course" tick={{ fontSize: 10, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Radar name="Certifying Staff" dataKey="CS" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                                    <Radar name="Aircraft Mechanic" dataKey="AM" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
                                    <Radar name="MGR" dataKey="MGR" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={2} dot />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ───── Row 3: Mandatory Courses ───── */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Mandatory Courses ({MANDATORY.length})</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {mandatoryCourses.map(c => (
                                <CourseCard key={c.id} course={c} onClick={() => handleCourseClick(c.id)} />
                            ))}
                        </div>
                    </div>

                    {/* ───── Row 4: Type Courses ───── */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Type Courses ({TYPE_COURSES.length})</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {typeCourses.map(c => (
                                <CourseCard key={c.id} course={c} onClick={() => handleCourseClick(c.id)} />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
