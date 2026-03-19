import { X as XIcon, Users } from 'lucide-react'
import { Course, CATEGORY_COLORS } from '../types'
import { MATRIX_ROLES, MATRIX_DATA } from '../data'

interface CourseDetailPanelProps {
    course: Course
    onClose: () => void
    onViewMatrix: () => void
}

export function CourseDetailPanel({ course, onClose, onViewMatrix }: CourseDetailPanelProps) {
    // Derive required roles from MATRIX_DATA
    const requirements = MATRIX_DATA[course.id] || []
    const requiredRoles = MATRIX_ROLES.filter((_, i) => requirements[i] === 1)

    return (
        <aside className="w-72 bg-card border-l border-border p-5 flex flex-col gap-4 shrink-0 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <span className="text-xs font-medium text-muted-foreground font-mono">{course.code}</span>
                    <h3 className="text-sm font-semibold text-foreground mt-0.5 leading-snug">{course.name}</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted shrink-0 ml-2 cursor-pointer transition-colors border-none bg-transparent"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Details */}
            <div className="space-y-3">
                <DetailRow label="Category">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${CATEGORY_COLORS[course.category]}`}>
                        {course.category}
                    </span>
                </DetailRow>
                <DetailRow label="Training Type">
                    {course.recurrent ? (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                            Recurrent — every {course.recurrentYears} years
                        </span>
                    ) : (
                        <span className="text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                            Initial training
                        </span>
                    )}
                </DetailRow>
                {course.note && (
                    <DetailRow label="Note">
                        <span className="text-xs text-foreground/70">{course.note}</span>
                    </DetailRow>
                )}
                <DetailRow label="Course ID">
                    <span className="text-xs font-medium text-muted-foreground font-mono">#{course.id}</span>
                </DetailRow>
            </div>

            {/* Required For */}
            {requiredRoles.length > 0 && (
                <div className="pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Required For ({requiredRoles.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {requiredRoles.map(role => (
                            <span
                                key={role.short}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-muted text-foreground"
                            >
                                <Users className="h-3 w-3 text-muted-foreground" /> {role.full}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Regulatory Notes */}
            <div className="pt-3 border-t border-border space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Regulatory Notes</p>
                <div className="text-xs text-foreground/70 leading-relaxed bg-muted/50 rounded-lg p-3 space-y-2">
                    <p>• Training shall be completed within <strong className="text-foreground">6 months</strong> of joining</p>
                    <p>• Governed by CAAT MOE Issue 10 Rev.00</p>
                    <p>• Ref: SAMS-FM-CM-014 Rev.03 (05 AUG 2025)</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto pt-3 border-t border-border">
                <button className="flex-1 text-sm py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors cursor-pointer">
                    Edit
                </button>
                <button
                    onClick={onViewMatrix}
                    className="flex-1 text-sm py-2 rounded-lg text-white bg-primary hover:bg-primary/90 transition-colors cursor-pointer border-none"
                >
                    View Matrix
                </button>
            </div>
        </aside>
    )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-xs text-muted-foreground shrink-0 pt-0.5">{label}</span>
            <div className="text-right">{children}</div>
        </div>
    )
}
