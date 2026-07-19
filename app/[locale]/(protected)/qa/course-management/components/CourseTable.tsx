import { Loader2, Pencil, Search, Trash2 } from 'lucide-react'
import { PermissionActionGuard } from '@/components/partials/auth/PermissionActionGuard'
import { Course, CATEGORY_COLORS } from '../types'
import { Button } from '@/components/ui/button'

interface CourseTableProps {
    courses: Course[]
    search: string
    onSearchChange: (value: string) => void
    onSelectCourse: (course: Course | null) => void
    onEditCourse: (course: Course) => void
    onDeleteCourse: (course: Course) => void
    selectedCourseId: number | null
    deletingCourseId?: number | null
}

export function CourseTable({
    courses,
    search,
    onSearchChange,
    onSelectCourse,
    onEditCourse,
    onDeleteCourse,
    selectedCourseId,
    deletingCourseId,
}: CourseTableProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    />
                </div>
                <span className="text-sm text-muted-foreground sm:ml-auto">
                    {courses.length} {courses.length === 1 ? 'course' : 'courses'}
                </span>
            </div>

            <div className="max-h-[480px] overflow-auto">
                <table className="w-full min-w-[860px] table-fixed border-collapse text-left">
                    <colgroup>
                        <col className="w-[64px]" />
                        <col className="w-[160px]" />
                        <col />
                        <col className="w-[180px]" />
                        <col className="w-[130px]" />
                        <col className="w-[112px]" />
                    </colgroup>
                    <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
                        <tr className="border-b border-border">
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">No.</th>
                            <th className="px-3 py-3 text-xs font-semibold text-muted-foreground">Code</th>
                            <th className="px-3 py-3 text-xs font-semibold text-muted-foreground">Training Course</th>
                            <th className="px-3 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                            <th className="px-3 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                            <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((course, index) => {
                            const isSelected = selectedCourseId === course.id
                            const isDeleting = deletingCourseId === course.id

                            return (
                                <tr
                                    key={course.id}
                                    onClick={() => onSelectCourse(isSelected ? null : course)}
                                    className={`cursor-pointer border-b border-border/60 transition-colors last:border-b-0 ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                                        }`}
                                >
                                    <td className="px-4 py-3 align-top text-sm text-muted-foreground">{index + 1}</td>
                                    <td className="px-3 py-3 align-top">
                                        <span className="break-words font-mono text-xs font-medium text-foreground/70">
                                            {course.code}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 align-top text-sm leading-5 text-foreground">
                                        {course.name}
                                    </td>
                                    <td className="px-3 py-3 align-top">
                                        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${CATEGORY_COLORS[course.category] || 'bg-muted text-muted-foreground'}`}>
                                            {course.category}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 align-top">
                                        {course.recurrent ? (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                {course.recurrentYears}yr
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-primary/5 px-2 py-1 text-xs font-medium text-primary">
                                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Initial
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 align-top">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <PermissionActionGuard menuCode="QA_MONITORING" action="canEdit">
                                                <Button
                                                    size="icon"
                                                    variant="soft"
                                                    color="secondary"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        onEditCourse(course)
                                                    }}
                                                    className="h-8 w-8 "
                                                    aria-label={`Edit ${course.code}`}
                                                    title="Edit course"
                                                    disabled={isDeleting}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </PermissionActionGuard>
                                            <PermissionActionGuard menuCode="QA_MONITORING" action="canDelete">
                                                <Button
                                                    size="icon"
                                                    variant="soft"
                                                    color="destructive"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        onDeleteCourse(course)
                                                    }}
                                                    className="inline-flex h-8 w-8"
                                                    aria-label={`Delete ${course.code}`}
                                                    title="Delete course"
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            </PermissionActionGuard>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}

                        {courses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                    No courses match your filter
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
