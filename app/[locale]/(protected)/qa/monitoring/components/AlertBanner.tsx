'use client'

import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Employee, CourseRef, AlertItem, getStatus, getDaysLeft } from '../types'
import { ALL_COURSES, EMPLOYEES } from '../data'

interface AlertBannerProps {
    onSelect: (empId: string) => void
}

export function AlertBanner({ onSelect }: AlertBannerProps) {
    const alerts = useMemo<AlertItem[]>(() => {
        const list: AlertItem[] = []
        EMPLOYEES.forEach(emp => {
            ALL_COURSES.forEach((c: CourseRef) => {
                const d = getDaysLeft(emp.courses[c.id])
                const s = getStatus(emp.courses[c.id])
                if (s === 'expired' || (s === 'warning' && d !== null && d <= 30)) {
                    list.push({ emp, course: c, daysLeft: d, status: s })
                }
            })
        })
        return list.sort((a, b) => (a.daysLeft ?? -999) - (b.daysLeft ?? -999))
    }, [])

    if (alerts.length === 0) return null

    return (
        <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                    Critical Alerts ({alerts.length})
                </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
                {alerts.map((a, i) => {
                    const isExp = a.status === 'expired'
                    return (
                        <button key={i} onClick={() => onSelect(a.emp.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isExp ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                            }`}>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isExp ? 'bg-red-500' : 'bg-amber-500'}`} />
                            <span className="font-semibold text-foreground">{a.emp.name.split(' ').slice(1).join(' ').split(' ')[0]}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className={`font-semibold ${isExp ? 'text-red-600' : 'text-amber-700'}`}>{a.course.short}</span>
                            <span className={`text-[10px] ${isExp ? 'text-red-500' : 'text-amber-600'}`}>
                                {isExp ? 'EXPIRED' : `${a.daysLeft}d`}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
