'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShieldCheck, AlertTriangle, Clock, Users, BookOpen } from 'lucide-react'
import { getStatus } from './types'
import { EMPLOYEES, ALL_COURSES, MANDATORY, TYPE_COURSES } from './data'

export default function MonitoringPage() {
    const router = useRouter()

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
        return { expired, warning, valid, missing, total: EMPLOYEES.length }
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

    return (
        <div>
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle>Monitoring</CardTitle>
                    <CardDescription>Quality assurance monitoring and compliance tracking</CardDescription>
                    <div className="ml-auto">
                        <Button onClick={() => router.push('/en/qa/monitoring/training-records')} color="primary">
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Training Record Monitoring
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-5 gap-3">
                        {[
                            { icon: Users, label: 'Total Staff', val: stats.total, color: '#1a56db', bg: '#eff6ff' },
                            { icon: ShieldCheck, label: 'Valid', val: stats.valid, color: '#16a34a', bg: '#f0fdf4' },
                            { icon: Clock, label: 'Warning (≤90d)', val: stats.warning, color: '#d97706', bg: '#fffbeb' },
                            { icon: AlertTriangle, label: 'Expired', val: stats.expired, color: '#dc2626', bg: '#fef2f2' },
                            { icon: BookOpen, label: 'Courses', val: ALL_COURSES.length, color: '#7c3aed', bg: '#f5f3ff' },
                        ].map(({ icon: Icon, label, val, color, bg }) => (
                            <div key={label} className="rounded-xl border border-border p-4 flex items-center gap-3" style={{ background: bg }}>
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

                    {/* Mandatory Courses */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Mandatory Courses ({MANDATORY.length})</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {mandatoryCourses.map(c => (
                                <CourseCard key={c.id} course={c} />
                            ))}
                        </div>
                    </div>

                    {/* Type Courses */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Type Courses ({TYPE_COURSES.length})</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {typeCourses.map(c => (
                                <CourseCard key={c.id} course={c} />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function CourseCard({ course: c }: { course: { id: string; short: string; label: string; interval: number; valid: number; warning: number; expired: number; na: number; compliance: number } }) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{c.short}</span>
                <span className="text-xs text-muted-foreground">{c.interval}m cycle</span>
            </div>
            <p className="text-sm font-medium text-foreground mb-3">{c.label}</p>
            <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">{c.valid}</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">{c.warning}</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">{c.expired}</span>
                </span>
                <span className="ml-auto font-bold" style={{
                    color: c.compliance === 100 ? '#16a34a' : c.compliance >= 70 ? '#d97706' : '#dc2626'
                }}>{c.compliance}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                    width: `${c.compliance}%`,
                    background: c.compliance === 100 ? '#16a34a' : c.compliance >= 70 ? '#f59e0b' : '#dc2626'
                }} />
            </div>
        </div>
    )
}
