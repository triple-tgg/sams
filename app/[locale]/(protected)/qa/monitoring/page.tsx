'use client'

import { useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShieldCheck, AlertTriangle, Clock, Users, BookOpen, RefreshCw, CalendarDays } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { getDashboardSummary } from '@/lib/api/qa/dashboardSummary'
import { getStatus } from './types'
import { EMPLOYEES, ALL_COURSES, MANDATORY, TYPE_COURSES } from './data'
import { CourseCard } from './components/CourseCard'
import { TrainingCalendar } from './components/TrainingCalendar'
import { TrainingRecordTab } from './components/TrainingRecordTab'

// ─── Colors ──────────────────────────────────────────────────────────────────
const COLORS = {
    valid: '#639922',
    warning: '#EF9F27',
    expired: '#E24B4A',
    missing: '#B4B2A9',
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

export default function MonitoringPage() {
    const router = useRouter()
    const params = useParams()
    const locale = (params?.locale as string) || 'en'

    const now = useMemo(() => new Date(), [])
    const lastUpdated = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    const { data: summaryResponse, isLoading: isLoadingSummary } = useQuery({
        queryKey: ['qa-dashboard-summary', now.getFullYear()],
        queryFn: () => getDashboardSummary({ year: now.getFullYear() }),
    })
    const summaryData = summaryResponse?.responseData

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

    // ─── Data Preparation ────────────────────────────────────────────────
    const kpiStats = useMemo(() => {
        if (summaryData) {
            const courses = summaryData.mandatoryCourseStatus
            return {
                totalCourses: courses.length,
                valid: courses.reduce((sum, c) => sum + c.validCount, 0),
                warning: courses.reduce((sum, c) => sum + c.warningCount, 0),
                expired: courses.reduce((sum, c) => sum + c.expiredCount, 0),
            }
        }
        return {
            totalCourses: MANDATORY.length,
            valid: stats.valid,
            warning: stats.warning,
            expired: stats.expired,
        }
    }, [summaryData, stats])

    const donutData = useMemo(() => {
        if (summaryData) {
            const oc = summaryData.overallCompliance
            const notTaken = Math.max(0, (kpiStats.totalCourses * stats.total) - (oc.valid + oc.warning + oc.expired))
            return [
                { name: 'Valid', value: oc.valid, color: COLORS.valid },
                { name: 'Warning', value: oc.warning, color: COLORS.warning },
                { name: 'Expired', value: oc.expired, color: COLORS.expired },
                { name: 'Not Taken', value: notTaken, color: COLORS.missing },
            ]
        }
        return [
            { name: 'Valid', value: stats.valid, color: COLORS.valid },
            { name: 'Warning', value: stats.warning, color: COLORS.warning },
            { name: 'Expired', value: stats.expired, color: COLORS.expired },
            { name: 'Not Taken', value: stats.missing, color: COLORS.missing },
        ]
    }, [stats, summaryData, kpiStats.totalCourses])

    const stackedBarData = useMemo(() => {
        const groups: Record<string, { valid: number, warning: number, expired: number, notTaken: number }> = {}
        const courses = summaryData ? summaryData.mandatoryCourseStatus : courseSummary.filter(c => MANDATORY.some(m => m.id === c.id)).map(c => ({ courseCode: c.short, validCount: c.valid, warningCount: c.warning, expiredCount: c.expired }))

        courses.forEach(c => {
            let group = 'Other'
            if (c.courseCode.startsWith('AC-')) group = 'AC-*'
            else if (c.courseCode.startsWith('AT-')) group = 'AT-*'
            else if (c.courseCode.startsWith('SP-')) group = 'SP-*'
            else if (c.courseCode.startsWith('CM-')) group = 'CM-*'
            else if (['SMS-', 'DG-', 'CP-', 'HF-'].some(p => c.courseCode.startsWith(p))) group = 'Core'

            const notTaken = Math.max(0, stats.total - (c.validCount + c.warningCount + c.expiredCount))

            if (!groups[group]) groups[group] = { valid: 0, warning: 0, expired: 0, notTaken: 0 }
            groups[group].valid += c.validCount
            groups[group].warning += c.warningCount
            groups[group].expired += c.expiredCount
            groups[group].notTaken += notTaken
        })

        return Object.entries(groups).map(([name, data]) => ({
            name,
            Valid: data.valid,
            Warning: data.warning,
            Expired: data.expired,
            'Not Taken': data.notTaken
        }))
    }, [summaryData, courseSummary, stats.total])

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

    const overallPct = summaryData ? summaryData.overallCompliance.compliancePercentage : stats.overallCompliance

    return (
        <div>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle>Training Monitoring</CardTitle>
                            <CardDescription>
                                Quality assurance monitoring and compliance tracking
                                <span className="inline-flex items-center gap-1 ml-3 text-xs text-muted-foreground/70">
                                    <RefreshCw className="w-3 h-3" />
                                    As of {lastUpdated}
                                </span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <Tabs defaultValue="calendar">
                        <TabsList className="mb-4 border-b border-border rounded-none p-0 gap-0 w-full justify-start">
                            <TabsTrigger
                                value="calendar"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground"
                            >
                                <CalendarDays className="w-4 h-4" />
                                Monitoring
                            </TabsTrigger>
                            <TabsTrigger
                                value="training-records"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Training
                            </TabsTrigger>
                        </TabsList>

                        {/* ── Tab: Calendar ─────────────────────────────── */}
                        <TabsContent value="calendar" className="mt-0 space-y-6">
                            <TrainingCalendar>
                                <div className="space-y-6">
                                    {/* ─── Layer 1: KPI Cards ─── */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card className="p-4 flex flex-col justify-center">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Total Courses</p>
                                            <p className="text-3xl font-black mt-1">{kpiStats.totalCourses}</p>
                                        </Card>
                                        <Card className="p-4 flex flex-col justify-center">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Valid Count</p>
                                            <p className="text-3xl font-black mt-1" style={{ color: COLORS.valid }}>{kpiStats.valid}</p>
                                        </Card>
                                        <Card className="p-4 flex flex-col justify-center">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Warning Count</p>
                                            <p className="text-3xl font-black mt-1" style={{ color: COLORS.warning }}>{kpiStats.warning}</p>
                                        </Card>
                                        <Card className="p-4 flex flex-col justify-center bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50">
                                            <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Expired Count</p>
                                            <p className="text-3xl font-black mt-1" style={{ color: COLORS.expired }}>{kpiStats.expired}</p>
                                        </Card>
                                    </div>

                                    {/* ─── Layer 2: 2 Columns ─── */}
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        {/* Left: Donut Chart */}
                                        <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center w-full lg:w-[260px] shrink-0">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 text-center">Overall Compliance</p>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={donutData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
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
                                                        style={{ fontSize: '28px', fontWeight: 800, fill: overallPct >= 80 ? COLORS.valid : overallPct >= 60 ? COLORS.warning : COLORS.expired }}>
                                                        {overallPct}%
                                                    </text>
                                                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle"
                                                        style={{ fontSize: '10px', fontWeight: 600, fill: '#94a3b8' }}>
                                                        Compliance
                                                    </text>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2">
                                                {donutData.map(d => (
                                                    <div key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                                        {d.name} ({d.value})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right: Stacked Bar Chart */}
                                        <div className="rounded-xl border border-border bg-card p-5 flex-1 overflow-hidden">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
                                                Course Groups Breakdown
                                            </p>
                                            <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
                                                <div style={{ minWidth: `${stackedBarData.length * 80}px`, height: 230 }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={stackedBarData} barCategoryGap="25%">
                                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                                            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} stroke="var(--muted-foreground)" />
                                                            <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                                                            <Tooltip content={<ChartTooltip />} />
                                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                                                            <Bar dataKey="Valid" stackId="a" fill={COLORS.valid} />
                                                            <Bar dataKey="Warning" stackId="a" fill={COLORS.warning} />
                                                            <Bar dataKey="Expired" stackId="a" fill={COLORS.expired} />
                                                            <Bar dataKey="Not Taken" stackId="a" fill={COLORS.missing} radius={[3, 3, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TrainingCalendar>
                        </TabsContent>

                        {/* ── Tab: Training Record Monitoring ───────────── */}
                        <TabsContent value="training-records" className="mt-0 space-y-6">
                            <TrainingRecordTab />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

        </div>
    )
}
