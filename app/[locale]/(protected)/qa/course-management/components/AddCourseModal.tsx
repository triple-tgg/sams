'use client'

import { useState, useEffect } from 'react'
import { X as XIcon, Plane } from 'lucide-react'
import { CATEGORIES } from '../types'
import { MATRIX_ROLES, MATRIX_DATA } from '../data'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'
import { Users } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

import { upsertCourse, getCourseCategories, getCourseDepartmentSubList, getCourseById } from '@/lib/api/qa/course'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'

interface AddCourseModalProps {
    course?: import('../types').Course
    onClose: () => void
}

export function AddCourseModal({ course, onClose }: AddCourseModalProps) {
    const isEditing = !!course

    const initialRoles = course && MATRIX_DATA[course.id]
        ? MATRIX_ROLES.map((_, i) => (MATRIX_DATA[course.id][i] === 1 ? i + 1 : -1)).filter(i => i !== -1) // Assuming IDs start from 1
        : []

    const [form, setForm] = useState({
        code: course?.code || '',
        name: course?.name || '',
        category: course?.category || 'Core',
        recurrent: course ? course.recurrent : false,
        recurrentYears: course?.recurrentYears || 2,
        note: course?.note || '',
        requiredRoles: initialRoles as number[],
        aircraftTypeLicense: '',
        courseObjective: '',
    })

    const { data: categoryListResp } = useQuery({
        queryKey: ['course-categories'],
        queryFn: getCourseCategories
    })
    const apiCategories = categoryListResp?.responseData || []

    const { data: deptSubListResp } = useQuery({
        queryKey: ['course-department-sub-list'],
        queryFn: getCourseDepartmentSubList
    })
    const apiRoles = deptSubListResp?.responseData || []

    const { data: courseDetailResp, isLoading: isLoadingCourse } = useQuery({
        queryKey: ['course-detail', course?.id],
        queryFn: () => getCourseById(course!.id),
        enabled: !!course?.id
    })

    useEffect(() => {
        if (courseDetailResp?.responseData) {
            const data = courseDetailResp.responseData
            setForm({
                code: data.course.courseCode || '',
                name: data.course.courseName || '',
                category: apiCategories.find(c => c.id === data.course.courseCategoryId)?.name || 'Core',
                recurrent: data.course.courseType === 'Recurrence',
                recurrentYears: data.course.recurrenceIntervalYears || 2,
                note: data.course.additionalNote || '',
                requiredRoles: data.requirements.filter(r => r.isRequired).map(r => r.courseDepartmentSubId),
                aircraftTypeLicense: data.course.aircraftTypeLicenseId ? 'B737-600/700/800/900' : '', // Mock default mapping since there's no reverse mapping logic yet
                courseObjective: data.course.courseObjective || ''
            })
        }
    }, [courseDetailResp, apiCategories])

    const { user } = useReduxAuth()
    const queryClient = useQueryClient()
    const { mutate: handleSave, isPending } = useMutation({
        mutationFn: upsertCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-list-management'] })
            queryClient.invalidateQueries({ queryKey: ['course-summary'] })
            onClose()
        }
    })

    const onSaveClick = () => {
        const selectedCat = apiCategories.find(c => c.name === form.category)
        const catId = selectedCat?.id || 1

        const requirements = apiRoles.map(role => ({
            courseId: course?.id || 0,
            courseDepartmentSubId: role.id,
            isRequired: form.requiredRoles.includes(role.id),
            userName: user?.username || 'system'
        }))

        handleSave({
            courseId: course?.id || 0,
            courseCode: form.code,
            courseName: form.name,
            courseCategoryId: catId,
            courseType: form.recurrent ? 'Recurrence' : 'Initial',
            recurrenceIntervalYears: form.recurrent ? form.recurrentYears : null,
            additionalNote: form.note || '',
            userName: user?.username || 'system',
            aircraftTypeLicenseId: form.aircraftTypeLicense ? 0 : null, // Assuming 0 as placeholder since no ID mapping is provided yet
            courseObjective: form.courseObjective || '',
            requirements: requirements
        })
    }

    const toggleRole = (index: number) => {
        setForm(prev => {
            const roles = prev.requiredRoles.includes(index)
                ? prev.requiredRoles.filter(r => r !== index)
                : [...prev.requiredRoles, index]
            return { ...prev, requiredRoles: roles }
        })
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent size="md" className="max-w-lg p-6 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 transition-all duration-300">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Course' : 'Add New Course'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {isLoadingCourse ? (
                        <div className="py-12 flex justify-center items-center flex-col gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                            <p className="text-sm text-muted-foreground animate-pulse">Loading course details...</p>
                        </div>
                    ) : (
                        <>
                            {/* Code + Category */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Course Code</label>
                                    <input
                                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                                        placeholder="e.g. CRS-017"
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Category</label>
                                    <select
                                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary cursor-pointer"
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                    >
                                        {apiCategories.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Course Name */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Course Name</label>
                                <textarea
                                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none"
                                    rows={3}
                                    placeholder="Full course name..."
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Type</label>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1 bg-muted p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, recurrent: false })}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border-none ${!form.recurrent
                                                ? 'bg-card text-primary shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground bg-transparent'
                                                }`}
                                        >
                                            Initial
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, recurrent: true })}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border-none ${form.recurrent
                                                ? 'bg-card text-orange-600 shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground bg-transparent'
                                                }`}
                                        >
                                            Recurrent
                                        </button>
                                    </div>
                                    {form.recurrent && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Every</span>
                                            <input
                                                type="number"
                                                className="w-14 px-2 py-1 text-sm border border-border rounded-lg text-center text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary/10"
                                                value={form.recurrentYears}
                                                onChange={e => setForm({ ...form, recurrentYears: parseInt(e.target.value) })}
                                                min={1}
                                                max={5}
                                            />
                                            <span className="text-sm text-muted-foreground">years</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Required For */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground block">Required For</label>
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{form.requiredRoles.length} selected</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-muted/20 border border-border/50 rounded-lg">
                                    <TooltipProvider delayDuration={200}>
                                        {apiRoles.map((role) => {
                                            const isSelected = form.requiredRoles.includes(role.id)
                                            return (
                                                <Tooltip key={role.id}>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRole(role.id)}
                                                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded-md border transition-all cursor-pointer ${isSelected
                                                                ? 'bg-primary/90 border-primary text-white shadow-sm'
                                                                : 'bg-card border-border text-foreground hover:border-primary/40'
                                                                }`}
                                                        >
                                                            <Users className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                                                            {role.code}
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="text-xs font-medium">
                                                        {role.name}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )
                                        })}
                                    </TooltipProvider>
                                </div>
                            </div>

                            {/* Aircraft Type License */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Aircraft Type License</label>
                                <select
                                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary cursor-pointer"
                                    value={form.aircraftTypeLicense}
                                    onChange={e => setForm({ ...form, aircraftTypeLicense: e.target.value })}
                                >
                                    <option value="">Select Aircraft Type</option>
                                    {[
                                        'B737-600/700/800/900',
                                        'B737-7/8/9',
                                        'A318/A319/A320/A321',
                                        'B777-200/300/300ER',
                                        'A330-200/300/800/900',
                                        'B787-8/9/10',
                                        'B767-200/300',
                                        'A350-900/1000',
                                        'ERJ-190',
                                    ].map(acType => (
                                        <option key={acType} value={acType}>{acType}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Course Objective */}
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Course Objective</label>
                                <textarea
                                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none"
                                    rows={3}
                                    placeholder="Describe the objective of this course..."
                                    value={form.courseObjective}
                                    onChange={e => setForm({ ...form, courseObjective: e.target.value })}
                                />
                            </div>

                            {/* Note */}
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Additional Note (optional)</label>
                                <div className="border border-border rounded-lg bg-card text-foreground [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-border [&_.ql-container]:border-none [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-editor.ql-blank::before]:text-muted-foreground [&_.ql-stroke]:stroke-foreground [&_.ql-fill]:fill-foreground">
                                    <ReactQuill
                                        theme="snow"
                                        placeholder="e.g. Applicable with Lead Auditor"
                                        value={form.note}
                                        onChange={val => setForm({ ...form, note: val })}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <DialogFooter className="mt-6 pt-0">
                    <button
                        onClick={onClose}
                        disabled={isLoadingCourse}
                        className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSaveClick}
                        disabled={isPending || isLoadingCourse}
                        className="flex-1 py-2 text-sm rounded-lg text-white bg-primary hover:bg-primary/90 transition-opacity cursor-pointer border-none disabled:opacity-50"
                    >
                        {isPending ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Course')}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
