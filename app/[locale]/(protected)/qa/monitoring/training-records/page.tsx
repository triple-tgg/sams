'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Employee, CourseRef, getStatus, STATUS_META } from '../types'
import { EMPLOYEES, MANDATORY, TYPE_COURSES, ALL_COURSES } from '../data'
import { AlertBanner } from '../components/AlertBanner'
import { StatusMatrix } from '../components/StatusMatrix'
import { EmployeeDetail } from '../components/EmployeeDetail'

const POS_FILTERS = ['All', 'CS', 'AM', 'MGR/QA'] as const
const STATUS_FILTERS = ['All', 'expired', 'warning', 'valid'] as const

export default function TrainingRecordsPage() {
    const [search, setSearch] = useState('')
    const [posFilter, setPosFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')
    const [tab, setTab] = useState<'mandatory' | 'type'>('mandatory')
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const courses = tab === 'mandatory' ? MANDATORY : TYPE_COURSES

    // Aggregate stats
    const stats = useMemo(() => {
        let expired = 0, warning = 0, valid = 0
        EMPLOYEES.forEach(emp => {
            ALL_COURSES.forEach((c: CourseRef) => {
                const s = getStatus(emp.courses[c.id])
                if (s === 'expired') expired++
                else if (s === 'warning') warning++
                else if (s === 'valid') valid++
            })
        })
        return { expired, warning, valid, total: EMPLOYEES.length }
    }, [])

    // Filtered employees
    const filtered = useMemo(() => {
        return EMPLOYEES.filter(emp => {
            const nameMatch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.id.includes(search)
            const posMatch = posFilter === 'All' ||
                (posFilter === 'CS' && emp.posGroup === 'CS') ||
                (posFilter === 'AM' && emp.posGroup === 'AM') ||
                (posFilter === 'MGR/QA' && (emp.posGroup === 'MGR' || emp.posGroup === 'QA'))
            const statusMatch = statusFilter === 'All' || courses.some(c => {
                const s = getStatus(emp.courses[c.id])
                return statusFilter === s
            })
            return nameMatch && posMatch && statusMatch
        })
    }, [search, posFilter, statusFilter, courses])

    const selEmp = selectedId ? EMPLOYEES.find(e => e.id === selectedId) || null : null

    return (
        <div>
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle>Training Record Monitoring</CardTitle>
                    <CardDescription>SAMS-FM-CM-072 · Rev.01 · As of 19 Mar 2026</CardDescription>
                    <div className="flex items-center gap-3 ml-auto">
                        {[
                            { label: 'Staff', val: stats.total, color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
                            { label: 'Expired', val: stats.expired, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                            { label: 'Warning', val: stats.warning, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                            { label: 'Valid', val: stats.valid, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                        ].map(k => (
                            <div key={k.label} className="rounded-xl px-4 py-2 text-center min-w-[72px]"
                                style={{ background: k.bg, border: `1px solid ${k.border}` }}>
                                <div className="text-xl font-extrabold leading-tight" style={{ color: k.color }}>{k.val}</div>
                                <div className="text-[10px] font-semibold mt-0.5" style={{ color: k.color + 'aa' }}>{k.label}</div>
                            </div>
                        ))}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Alerts */}
                    <AlertBanner onSelect={setSelectedId} />

                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap bg-card rounded-xl border border-border p-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search name or ID…"
                                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 w-48" />
                        </div>
                        <div className="flex items-center gap-1">
                            {POS_FILTERS.map(p => (
                                <button key={p} onClick={() => setPosFilter(p)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                                        posFilter === p ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-border/80'
                                    }`}>
                                    {p === 'All' ? 'All Positions' : p === 'CS' ? 'Certifying Staff' : p === 'AM' ? 'Aircraft Mechanic' : 'Manager/QA'}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                            {STATUS_FILTERS.map(s => {
                                const m = STATUS_META[s] || {}
                                return (
                                    <button key={s} onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                                            statusFilter === s
                                                ? (s === 'All' ? 'bg-primary text-white border-primary' : '')
                                                : 'bg-card text-muted-foreground border-border hover:border-border/80'
                                        }`}
                                        style={statusFilter === s && s !== 'All' ? { background: m.bg, color: m.text, borderColor: m.dot + '66' } : {}}>
                                        {s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-0.5">
                        {[
                            { key: 'mandatory' as const, label: `Mandatory (${MANDATORY.length})` },
                            { key: 'type' as const, label: `Type Courses (${TYPE_COURSES.length})` },
                        ].map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`px-5 py-2 rounded-t-xl text-xs font-bold border cursor-pointer transition-all ${
                                    tab === t.key
                                        ? 'bg-card text-primary border-border border-b-card z-10 relative'
                                        : 'bg-muted text-muted-foreground border-border/50 hover:text-foreground'
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Matrix */}
                    <div className="bg-card rounded-b-xl rounded-tr-xl border border-border overflow-hidden -mt-[1px] relative z-[1]">
                        <StatusMatrix
                            employees={filtered}
                            courses={courses}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />

                        {/* Detail panel */}
                        {selEmp && (
                            <EmployeeDetail employee={selEmp} onClose={() => setSelectedId(null)} />
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 flex-wrap">
                        {Object.entries(STATUS_META).map(([k, m]) => (
                            <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.dot }} />
                                {k === 'valid' ? 'Valid (>90 days)' : k === 'warning' ? 'Warning (≤90 days)' :
                                 k === 'expired' ? 'Expired' : k === 'na' ? 'N/A' : 'No data'}
                            </div>
                        ))}
                        <span className="ml-auto text-[10px] text-muted-foreground">
                            Showing {filtered.length} of {EMPLOYEES.length} staff · Click row to expand
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
