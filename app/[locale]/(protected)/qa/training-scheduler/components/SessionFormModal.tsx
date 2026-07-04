'use client'

import { useState, useEffect, useMemo } from 'react'
import { SessionFormData, STATUS_CONFIG } from '../types'
import { INSTRUCTORS, VENUES } from '../data'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useQuery } from '@tanstack/react-query'
import { getCourseList, type CourseData } from '@/lib/api/qa/course'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

interface SessionFormModalProps {
    form: SessionFormData
    setForm: React.Dispatch<React.SetStateAction<SessionFormData>>
    isEdit: boolean
    onSave: () => void
    onClose: () => void
    onCourseSelect: (courseId: string) => void
}

export function SessionFormModal({ form, setForm, isEdit, onSave, onClose, onCourseSelect }: SessionFormModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [courseOpen, setCourseOpen] = useState(false)

    useEffect(() => {
        // Trigger smooth entry animation after conditional mounting
        const timer = setTimeout(() => setIsOpen(true), 10)
        return () => clearTimeout(timer)
    }, [])

    const handleClose = () => {
        setIsOpen(false)
        // Wait for Radix Drawer slide-out animation to finish before unmounting
        setTimeout(onClose, 300)
    }

    const handleSaveAndClose = () => {
        onSave()
        handleClose()
    }

    const { data: courseListResp, isLoading: courseLoading } = useQuery({
        queryKey: ['course-list-scheduler-form'],
        queryFn: () => getCourseList({ categoryId: null, courseName: '', courseDepartmentRequirementId: null, page: 1, perPage: 999 })
    })

    // Group courses by category
    const coursesByCategory = useMemo((): Record<string, CourseData[]> => {
        const data = courseListResp?.responseData as CourseData[] | undefined
        if (!data) return {}
        return data.reduce<Record<string, CourseData[]>>((acc, c) => {
            const cat = c.courseCategory?.name || 'Other'
            if (!acc[cat]) acc[cat] = []
            acc[cat].push(c)
            return acc
        }, {})
    }, [courseListResp])

    // Find selected course label
    const allCourses = (courseListResp?.responseData as CourseData[] | undefined) || []
    const selectedCourse = allCourses.find(c => String(c.id) === String(form.courseId))
    const selectedLabel = selectedCourse ? `${selectedCourse.courseCode} — ${selectedCourse.courseName}` : ''

    const f = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }))

    return (
        <Drawer open={isOpen} onOpenChange={(val) => !val && handleClose()} direction="right">
            <DrawerContent className="fixed inset-y-0 right-0 left-auto mt-0 h-full w-[450px] sm:max-w-[540px] p-0 flex flex-col bg-card border-l border-border rounded-none rounded-l-[10px] [&>div:first-child]:hidden outline-none">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border flex flex-col gap-1 sticky top-0 bg-card z-10 shrink-0">
                    <DrawerHeader className="p-0 text-left">
                        <DrawerTitle className="text-lg font-semibold text-foreground text-left">
                            {isEdit ? 'Edit Training Session' : 'Schedule New Training Session'}
                        </DrawerTitle>
                    </DrawerHeader>
                    <p className="text-xs text-muted-foreground mt-0.5">Fill in the session details below</p>
                </div>

                {/* Form Body - scrollable */}
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                    {/* Course combobox */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                            Training Course <span className="text-red-400">*</span>
                        </label>
                        <Popover open={courseOpen} onOpenChange={setCourseOpen} modal={true}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    role="combobox"
                                    aria-expanded={courseOpen}
                                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer flex items-center justify-between gap-2"
                                >
                                    <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
                                        {courseLoading ? 'Loading courses...' : selectedLabel || 'Select a course...'}
                                    </span>
                                    <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[460px]" align="start">
                                <Command>
                                    <CommandInput placeholder="Search course..." />
                                    <CommandList className="max-h-[320px] overflow-y-auto" data-vaul-no-drag>
                                        <CommandEmpty>No course found.</CommandEmpty>
                                        {(Object.entries(coursesByCategory) as [string, CourseData[]][]).map(([cat, courses]) => (
                                            <CommandGroup key={cat} heading={cat}>
                                                {courses.map(c => (
                                                    <CommandItem
                                                        key={c.id}
                                                        value={`${c.courseCode} ${c.courseName}`}
                                                        onSelect={() => {
                                                            onCourseSelect(String(c.id))
                                                            setCourseOpen(false)
                                                        }}
                                                    >
                                                        <Check className={cn('mr-2 w-4 h-4 shrink-0', String(form.courseId) === String(c.id) ? 'opacity-100' : 'opacity-0')} />
                                                        <span className="font-medium mr-1.5 text-xs text-muted-foreground">{c.courseCode}</span>
                                                        {c.courseName}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        ))}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Dates + Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                                Start Date <span className="text-red-400">*</span>
                            </label>
                            <input type="date" value={form.dateStart} onChange={e => f('dateStart', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">End Date</label>
                            <input type="date" value={form.dateEnd} onChange={e => f('dateEnd', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Start Time</label>
                            <input type="time" lang="en-GB" value={form.timeStart} onChange={e => f('timeStart', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">End Time</label>
                            <input type="time" lang="en-GB" value={form.timeEnd} onChange={e => f('timeEnd', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                    </div>

                    {/* Instructor + Format */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Instructor</label>
                            <input type="text" value={form.instructor} onChange={e => f('instructor', e.target.value)} placeholder="e.g. Captain Aphisit"
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Course Format</label>
                            <select value={form.format || 'Onsite'} onChange={e => f('format', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                <option value="Onsite">Onsite</option>
                                <option value="Online">Online</option>
                            </select>
                        </div>
                    </div>

                    {/* Venue or Link */}
                    <div>
                        {form.format === 'Online' ? (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Meeting Link</label>
                                <input type="text" value={form.link || ''} onChange={e => f('link', e.target.value)} placeholder="e.g. https://zoom.us/..."
                                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Location (Venue)</label>
                                <input type="text" value={form.venue} onChange={e => f('venue', e.target.value)} placeholder="e.g. BKK Base Room 1"
                                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>
                        )}
                    </div>

                    {/* Status + Max participants */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status</label>
                            <select value={form.status} onChange={e => f('status', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Max Participants</label>
                            <input type="number" min={1} max={200} value={form.maxParticipants} onChange={e => f('maxParticipants', parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                    </div>

                    {/* Note */}
                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Note (Optional)</label>
                        <div className="border border-border rounded-lg bg-card text-foreground [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-border [&_.ql-container]:border-none [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-editor.ql-blank::before]:text-muted-foreground [&_.ql-stroke]:stroke-foreground [&_.ql-fill]:fill-foreground">
                            <ReactQuill
                                theme="snow"
                                placeholder="Add any additional details or remarks..."
                                value={form.note || ''}
                                onChange={val => f('note', val)}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex gap-3 bg-card shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10 sticky bottom-0">
                    <button onClick={handleClose} className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors cursor-pointer bg-transparent">
                        Cancel
                    </button>
                    <button onClick={handleSaveAndClose}
                        className="flex-1 py-2.5 text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 transition-all cursor-pointer border-none shadow-sm shadow-primary/20">
                        {isEdit ? 'Save Changes' : 'Confirm Schedule'}
                    </button>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

