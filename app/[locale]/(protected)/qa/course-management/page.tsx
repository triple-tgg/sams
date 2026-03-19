'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Course, CATEGORIES, CATEGORY_DOT } from './types'
import { COURSES, DEPARTMENTS } from './data'
import { CourseTable } from './components/CourseTable'
import { TrainingNeedsMatrix } from './components/TrainingNeedsMatrix'
import { CourseDetailPanel } from './components/CourseDetailModal'
import { AddCourseModal } from './components/AddCourseModal'

export default function CourseManagementPage() {
    const [activeTab, setActiveTab] = useState<'courses' | 'matrix'>('courses')
    const [selectedDept, setSelectedDept] = useState('all')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [search, setSearch] = useState('')
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [expandedDept, setExpandedDept] = useState<string | null>(null)

    const filtered = useMemo(() => {
        return COURSES.filter(c => {
            const matchCat = selectedCategory === 'All' || c.category === selectedCategory
            const matchSearch = !search ||
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.code.toLowerCase().includes(search.toLowerCase())
            return matchCat && matchSearch
        })
    }, [selectedCategory, search])

    const stats = useMemo(() => ({
        total: COURSES.length,
        recurrent: COURSES.filter(c => c.recurrent).length,
        initial: COURSES.filter(c => !c.recurrent).length,
        byCategory: (CATEGORIES as readonly string[]).slice(1).map(cat => ({
            name: cat,
            count: COURSES.filter(c => c.category === cat).length,
        })),
    }), [])

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
                            <Button onClick={() => setShowAddModal(true)} color="primary">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Course
                            </Button>
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
                                            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                                                activeTab === tab
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
                                        {DEPARTMENTS.map(dept => {
                                            const isSelected = selectedDept === dept.id
                                            const isExpanded = expandedDept === dept.id
                                            const hasRoles = dept.roles.length > 0
                                            return (
                                                <div key={dept.id}>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDept(dept.id)
                                                            setExpandedDept(isExpanded ? null : dept.id)
                                                        }}
                                                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-sm cursor-pointer border-none bg-transparent ${
                                                            isSelected ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted'
                                                        }`}
                                                    >
                                                        <span className="text-sm leading-none">{dept.icon}</span>
                                                        <span className={`truncate flex-1 text-xs ${isSelected ? 'font-medium' : ''}`}>{dept.name}</span>
                                                        {hasRoles && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                                                isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
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
                                                            {dept.roles.map((role, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-center gap-2 py-1 px-2 rounded-md text-[11px] text-foreground/60 hover:bg-primary/5 hover:text-primary cursor-default transition-colors"
                                                                >
                                                                    <div className="w-1 h-1 rounded-full bg-primary/30 shrink-0" />
                                                                    <span className="leading-snug">{role}</span>
                                                                </div>
                                                            ))}
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
                                        {(CATEGORIES as readonly string[]).map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all text-xs cursor-pointer border-none bg-transparent ${
                                                    selectedCategory === cat
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
                                                <StatCard label="Categories" value={5} color="#f59e0b" />
                                            </div>

                                            {/* Category Breakdown */}
                                            <div className="bg-muted/30 rounded-xl border border-border p-3">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">Course distribution by category</p>
                                                <div className="flex gap-2 flex-wrap">
                                                    {stats.byCategory.map(({ name, count }) => (
                                                        <button
                                                            key={name}
                                                            onClick={() => setSelectedCategory(name)}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${
                                                                selectedCategory === name
                                                                    ? 'border-primary bg-primary/5 text-primary font-semibold'
                                                                    : 'border-border hover:border-primary/30 text-muted-foreground'
                                                            }`}
                                                        >
                                                            <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT[name]}`} />
                                                            {name}
                                                            <span className="font-semibold ml-0.5">{count}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Course Table */}
                                            <CourseTable
                                                courses={filtered}
                                                search={search}
                                                onSearchChange={setSearch}
                                                onSelectCourse={setSelectedCourse}
                                                selectedCourseId={selectedCourse?.id ?? null}
                                            />
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
                                        onViewMatrix={() => { setSelectedCourse(null); setActiveTab('matrix') }}
                                    />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Course Modal */}
            {showAddModal && <AddCourseModal onClose={() => setShowAddModal(false)} />}
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