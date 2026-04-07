'use client'

import { CourseRef, StatusType, STATUS_META } from '../types'

interface CourseSummary extends CourseRef {
    valid: number
    warning: number
    expired: number
    na: number
    compliance: number
}

interface CourseCardProps {
    course: CourseSummary
    onClick?: () => void
}

export function CourseCard({ course: c, onClick }: CourseCardProps) {
    const hasIssue = c.expired > 0 || c.warning > 0

    return (
        <div
            onClick={onClick}
            className={`rounded-xl border border-border bg-card p-4 transition-all ${
                onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5' : ''
            } ${hasIssue ? 'ring-1 ring-amber-200/60' : ''}`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{c.short}</span>
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
