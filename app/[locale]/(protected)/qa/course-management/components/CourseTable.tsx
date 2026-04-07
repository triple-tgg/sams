import { Search } from 'lucide-react'
import { Course, CATEGORY_COLORS } from '../types'

interface CourseTableProps {
    courses: Course[]
    search: string
    onSearchChange: (value: string) => void
    onSelectCourse: (course: Course) => void
    selectedCourseId: number | null
}

export function CourseTable({
    courses,
    search,
    onSearchChange,
    onSelectCourse,
    selectedCourseId,
}: CourseTableProps) {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Search + Count */}
            <div className="flex gap-3 items-center px-4 py-3 border-b border-border">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                    />
                </div>
                <span className="text-sm text-muted-foreground">{courses.length} courses</span>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border bg-muted/50">
                <div className="col-span-1 text-xs font-medium text-muted-foreground">No.</div>
                <div className="col-span-1 text-xs font-medium text-muted-foreground">Code</div>
                <div className="col-span-6 text-xs font-medium text-muted-foreground">Training Course</div>
                <div className="col-span-2 text-xs font-medium text-muted-foreground">Category</div>
                <div className="col-span-2 text-xs font-medium text-muted-foreground">Type</div>
            </div>

            {/* Course Rows */}
            <div className="max-h-[480px] overflow-y-auto">
                {courses.map((course) => {
                    const isSelected = selectedCourseId === course.id
                    return (
                        <div
                            key={course.id}
                            onClick={() => onSelectCourse(isSelected ? null as any : course)}
                            className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 cursor-pointer transition-all ${
                                isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-primary/[0.03]'
                            }`}
                        >
                            <div className="col-span-1 text-sm text-muted-foreground">{course.id}</div>
                            <div className="col-span-1">
                                <span className="text-xs font-medium text-muted-foreground">{course.code}</span>
                            </div>
                            <div className="col-span-6 text-sm text-foreground leading-snug pr-2">{course.name}</div>
                            <div className="col-span-2">
                                <span className={`text-xs px-2 py-0.5 rounded-md ${CATEGORY_COLORS[course.category] || 'bg-muted text-muted-foreground'}`}>
                                    {course.category}
                                </span>
                            </div>
                            <div className="col-span-2 flex items-center gap-1.5">
                                {course.recurrent ? (
                                    <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        {course.recurrentYears}yr
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Initial
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}

                {courses.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                        No courses match your filter
                    </div>
                )}
            </div>
        </div>
    )
}
