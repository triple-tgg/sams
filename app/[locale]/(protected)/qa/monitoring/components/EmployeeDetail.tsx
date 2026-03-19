'use client'

import { Employee, CourseRef, getStatus, getDaysLeft, STATUS_META, fmtDate } from '../types'
import { ALL_COURSES } from '../data'
import { X as XIcon } from 'lucide-react'

interface EmployeeDetailProps {
    employee: Employee
    onClose: () => void
}

export function EmployeeDetail({ employee: emp, onClose }: EmployeeDetailProps) {
    return (
        <div className="border-t-2 border-primary bg-primary/5 px-5 py-4">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="font-bold text-base text-foreground">{emp.name}</p>
                    <p className="text-xs text-primary font-semibold">
                        ID: {emp.id} · {emp.pos}
                    </p>
                </div>
                <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted cursor-pointer transition-colors border-none bg-transparent">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-1.5">
                {ALL_COURSES.map((c: CourseRef) => {
                    const due = emp.courses[c.id]
                    const s = getStatus(due)
                    const m = STATUS_META[s]
                    const d = getDaysLeft(due)
                    return (
                        <div key={c.id} className="rounded-lg py-1.5 px-2.5" style={{ background: m.bg, border: `1px solid ${m.dot}44` }}>
                            <p className="text-[10px] font-bold text-muted-foreground mb-0.5">{c.label}</p>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.dot }} />
                                <span className="text-xs font-bold" style={{ color: m.text }}>
                                    {s === 'na' ? 'N/A' : s === 'missing' ? 'No data' : s === 'expired' ? 'Expired' : fmtDate(due)}
                                </span>
                            </div>
                            {d !== null && s !== 'valid' && s !== 'na' && s !== 'missing' && (
                                <p className="text-[10px] font-semibold mt-0.5" style={{ color: m.text }}>
                                    {d < 0 ? `${Math.abs(d)} days ago` : `${d} days left`}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
