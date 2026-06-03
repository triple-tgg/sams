'use client'

import { useState, useMemo } from 'react'
import { Plus, Building2, Briefcase, Wrench, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Course, CATEGORIES, CATEGORY_DOT } from './types'
import { COURSES, DEPARTMENTS } from './data'
import { CourseTable } from './components/CourseTable'
import { TrainingNeedsMatrix } from './components/TrainingNeedsMatrix'
import { CourseDetailPanel } from './components/CourseDetailModal'
import { AddCourseModal } from './components/AddCourseModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourseList, getCourseCategories, getCourseDepartments, getCourseSummary, deleteCourse, DeleteCourseRequest, DeleteCourseResponse } from '@/lib/api/qa/course'
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard"
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'
import { toast } from 'sonner'

export default function CourseManagementPage() {
    const [activeTab, setActiveTab] = useState<'courses' | 'matrix'>('courses')
    const [selectedDept, setSelectedDept] = useState('all')
    const [selectedSubDept, setSelectedSubDept] = useState<number | null>(null)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [search, setSearch] = useState('')
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingCourse, setEditingCourse] = useState<Course | null>(null)
    const [expandedDept, setExpandedDept] = useState<string | null>(null)

    const { getUserName } = useReduxAuth()
    const queryClient = useQueryClient()

    const deleteCourseMutation = useMutation<DeleteCourseResponse, Error, DeleteCourseRequest>({
        mutationFn: (data) => deleteCourse(data),
        mutationKey: ['courseDelete'],
        onSuccess: (response) => {
            if (response.message === 'success') {
                toast.success('Course deleted successfully!')
                queryClient.invalidateQueries({ queryKey: ['course-list-management'] })
                queryClient.invalidateQueries({ queryKey: ['course-summary'] })
                queryClient.invalidateQueries({ queryKey: ['course-detail'] })
                setSelectedCourse(null)
            } else {
                toast.error(response.error || 'Failed to delete course')
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to delete course')
        },
    })

    const { data: courseListResp, isLoading } = useQuery({
        queryKey: ['course-list-management', selectedSubDept],
        queryFn: () => getCourseList({
            categoryId: null,
            courseName: '',
            courseDepartmentRequirementId: selectedSubDept ?? null,
            page: 1,
            perPage: 999
        })
    })

    const { data: categoryListResp } = useQuery({
        queryKey: ['course-categories'],
        queryFn: getCourseCategories
    })
    const apiCategories = useMemo(() => categoryListResp?.responseData || [], [categoryListResp])

    const { data: deptListResp } = useQuery({
        queryKey: ['course-departments'],
        queryFn: getCourseDepartments
    })

    const { data: courseSummaryResp } = useQuery({
        queryKey: ['course-summary'],
        queryFn: getCourseSummary
    })

    const apiDepartments = useMemo(() => {
        const defaultAll = { id: 'all', name: 'All Departments', icon: <Building2 className="w-4 h-4" />, roles: [] };
        if (!deptListResp?.responseData) return [defaultAll];

        const mappedDepts = deptListResp.responseData.map(item => {
            let icon = <Building2 className="w-4 h-4" />;
            if (item.courseDepartment.name === 'Executive') icon = <Briefcase className="w-4 h-4" />;
            else if (item.courseDepartment.name === 'Maintenance') icon = <Wrench className="w-4 h-4" />;
            else if (item.courseDepartment.name === 'Compliance Monitoring') icon = <ShieldCheck className="w-4 h-4" />;

            return {
                id: item.courseDepartment.id.toString(),
                name: item.courseDepartment.name,
                icon,
                roles: item.courseDepartmentSubs.map(sub => ({ id: sub.id, name: sub.name }))
            };
        });

        return [defaultAll, ...mappedDepts];
    }, [deptListResp])

    const apiCourses = useMemo<Course[]>(() => {
        if (!courseListResp?.responseData) return []
        return courseListResp.responseData.map(c => ({
            id: c.id,
            code: c.courseCode,
            name: c.courseName,
            category: c.courseCategory?.name || 'Core', // default fallback
            recurrent: c.courseType === 'Recurrent',
            recurrentYears: c.recurrenceIntervalYears || undefined,
            note: c.additionalNote || undefined
        }))
    }, [courseListResp])

    const filtered = useMemo(() => {
        return apiCourses.filter(c => {
            const matchCat = selectedCategory === 'All' || c.category === selectedCategory
            const matchSearch = !search ||
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.code.toLowerCase().includes(search.toLowerCase())
            return matchCat && matchSearch
        })
    }, [selectedCategory, search, apiCourses])

    const stats = useMemo(() => {
        if (courseSummaryResp?.responseData) {
            return {
                total: courseSummaryResp.responseData.totalCourses,
                recurrent: courseSummaryResp.responseData.recurrentCount,
                initial: courseSummaryResp.responseData.initialOnlyCount,
                categories: courseSummaryResp.responseData.categoriesCount
            }
        }
        return { total: 0, recurrent: 0, initial: 0, categories: 0 }
    }, [courseSummaryResp])

    return (
        <>
            <div>
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle>Course Management</CardTitle>
                        <CardDescription>
                            Manage training courses and requirements · SAMS-FM-CM-014 Rev.03
                        </CardDescription>
                        <div className="flex items-center gap-2 ml-auto">
                            <PermissionActionGuard menuCode="QA_MONITORING" action="canCreate">
                                <Button onClick={() => setShowAddModal(true)} color="primary">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Course
                                </Button>
                            </PermissionActionGuard>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-6">
                            {/* ── Sidebar ── */}
                            <aside className="w-52 shrink-0 space-y-4">
                                {/* Tab Toggle */}
                                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                                    {(['courses', 'matrix'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all cursor-pointer ${activeTab === tab
                                                    ? 'bg-card text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {tab === 'courses' ? 'Courses' : 'Matrix'}
                                        </button>
                                    ))}
                                </div>

                                {/* Department Filter */}
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Departments</p>
                                    <div className="space-y-0.5">
                                        {apiDepartments.map(dept => {
                                            const isSelected = selectedDept === dept.id
                                            const isExpanded = expandedDept === dept.id
                                            const hasRoles = dept.roles.length > 0
                                            return (
                                                <div key={dept.id}>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDept(dept.id)
                                                            setSelectedSubDept(null)
                                                            setExpandedDept(isExpanded ? null : dept.id)
                                                        }}
                                                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-sm cursor-pointer border-none bg-transparent ${isSelected ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted'
                                                            }`}
                                                    >
                                                        <span className="text-sm leading-none">{dept.icon}</span>
                                                        <span className={`truncate flex-1 text-xs ${isSelected ? 'font-medium' : ''}`}>{dept.name}</span>
                                                        {hasRoles && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                                                }`}>
                                                                {dept.roles.length}
                                                            </span>
                                                        )}
                                                        {hasRoles && (
                                                            <svg
                                                                className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        )}
                                                    </button>

                                                    {/* Roles sub-list */}
                                                    {isExpanded && hasRoles && (
                                                        <div className="ml-3 mt-0.5 mb-1 border-l-2 border-primary/20 pl-3 space-y-0.5">
                                                            {dept.roles.map((role) => {
                                                                const isSubSelected = selectedSubDept === role.id
                                                                return (
                                                                    <div
                                                                        key={role.id}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setSelectedSubDept(isSubSelected ? null : role.id)
                                                                        }}
                                                                        className={`flex items-center gap-2 py-1 px-2 rounded-md text-[11px] cursor-pointer transition-colors ${
                                                                            isSubSelected
                                                                                ? 'bg-primary/10 text-primary font-medium'
                                                                                : 'text-foreground/60 hover:bg-primary/5 hover:text-primary'
                                                                        }`}
                                                                    >
                                                                        <div className={`w-1 h-1 rounded-full shrink-0 ${isSubSelected ? 'bg-primary' : 'bg-primary/30'}`} />
                                                                        <span className="leading-snug">{role.name}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div className="pt-3 border-t border-border">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</p>
                                    <div className="space-y-0.5">
                                        {['All', ...apiCategories.map(c => c.name)].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all text-xs cursor-pointer border-none bg-transparent ${selectedCategory === cat
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-foreground/70 hover:bg-muted'
                                                    }`}
                                            >
                                                {cat !== 'All' && (
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[cat] || 'bg-muted-foreground'}`} />
                                                )}
                                                <span>{cat}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </aside>

                            {/* ── Main Content ── */}
                            <div className="flex-1 min-w-0 flex gap-4">
                                <div className="flex-1 min-w-0 space-y-4">
                                    {activeTab === 'courses' ? (
                                        <>
                                            {/* Stats Row */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <StatCard label="Total Courses" value={stats.total} color="hsl(var(--primary))" />
                                                <StatCard label="Recurrent (2yr)" value={stats.recurrent} color="#0ea5e9" />
                                                <StatCard label="Initial Only" value={stats.initial} color="#6366f1" />
                                                <StatCard label="Categories" value={stats.categories} color="#f59e0b" />
                                            </div>




                                            {/* Course Table */}
                                            {isLoading ? (
                                                <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                                    Loading courses...
                                                </div>
                                            ) : (
                                                <CourseTable
                                                    courses={filtered}
                                                    search={search}
                                                    onSearchChange={setSearch}
                                                    onSelectCourse={setSelectedCourse}
                                                    selectedCourseId={selectedCourse?.id ?? null}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <TrainingNeedsMatrix />
                                    )}
                                </div>

                                {/* ── Right Detail Panel ── */}
                                {selectedCourse && activeTab === 'courses' && (
                                    <CourseDetailPanel
                                        course={selectedCourse}
                                        onClose={() => setSelectedCourse(null)}
                                        onDelete={() => {
                                            deleteCourseMutation.mutate({
                                                id: selectedCourse.id,
                                                userName: getUserName() || 'system',
                                            })
                                        }}
                                        onEdit={() => setEditingCourse(selectedCourse)}
                                    />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Course Modal */}
            {(showAddModal || editingCourse) && (
                <AddCourseModal
                    course={editingCourse || undefined}
                    onClose={() => {
                        setShowAddModal(false)
                        setEditingCourse(null)
                    }}
                />
            )}
        </>
    )
}

// ── Stat Card ──
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            </div>
            <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
        </div>
    )
}