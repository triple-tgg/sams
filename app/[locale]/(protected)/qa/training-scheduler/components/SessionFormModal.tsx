'use client'

import { useState, useEffect, useMemo } from 'react'
import { SessionFormData, STATUS_CONFIG } from '../types'
import type { AttendanceType } from '@/lib/api/master/attendanceTypes'
import { VENUES } from '../data'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useQuery } from '@tanstack/react-query'
import { getCourseList, type CourseData } from '@/lib/api/qa/course'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { Check, ChevronsUpDown, CalendarIcon, Clock, Link2, MapPin, Info } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { format, parse } from 'date-fns'
import dynamic from 'next/dynamic'
import type { TrainingDataStatus } from '@/lib/api/master/trainingDataStatuses'
import 'react-quill-new/dist/quill.snow.css'
import { useInstructorList } from '@/lib/api/qa/instructor.hooks'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

interface SessionFormModalProps {
    form: SessionFormData
    setForm: React.Dispatch<React.SetStateAction<SessionFormData>>
    isEdit: boolean
    onSave: () => void
    onClose: () => void
    onCourseSelect: (courseId: string) => void
    statusOptions?: TrainingDataStatus[]
    attendanceTypes?: AttendanceType[]
}

export function SessionFormModal({ form, setForm, isEdit, onSave, onClose, onCourseSelect, statusOptions = [], attendanceTypes = [] }: SessionFormModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [courseOpen, setCourseOpen] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    // Fetch instructor list from /master/courses-instructors
    const { data: instructors = [] } = useInstructorList()

    // Auto-calculate training days & total hours from date/time fields
    const trainingCalc = useMemo(() => {
        const timeStart = form.timeStart || '09:00'
        const timeEnd = form.timeEnd || '17:00'

        // Parse hours/minutes
        const [sh, sm] = timeStart.split(':').map(Number)
        const [eh, em] = timeEnd.split(':').map(Number)
        const hoursPerDay = Math.max(0, (eh + em / 60) - (sh + sm / 60))

        let days = 1
        if (form.dateStart && form.dateEnd) {
            const start = new Date(form.dateStart)
            const end = new Date(form.dateEnd)
            days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
        } else if (!form.dateStart) {
            days = 0
        }

        const totalHours = Math.round(hoursPerDay * days * 100) / 100 // round to 2 decimals
        return { days, hoursPerDay: Math.round(hoursPerDay * 100) / 100, totalHours }
    }, [form.dateStart, form.dateEnd, form.timeStart, form.timeEnd])

    // Auto-fill totalHours when calculation changes
    useEffect(() => {
        if (trainingCalc.totalHours > 0) {
            setForm(p => ({ ...p, totalHours: trainingCalc.totalHours }))
        }
    }, [trainingCalc.totalHours])

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
        setSubmitted(true)
        if (!form.courseId || !form.dateStart || !form.courseInstructorId) return
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
        <Drawer open={isOpen} onOpenChange={(val) => !val && handleClose()} direction="right" modal={false}>
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
                                    className={cn('w-full px-3 py-2 text-sm border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer flex items-center justify-between gap-2', submitted && !form.courseId ? 'border-red-400' : 'border-border')}
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
                                                            // Auto-fill objective from course data
                                                            setForm(p => ({ ...p, objective: c.courseObjective || '' }))
                                                            setCourseOpen(false)
                                                        }}
                                                        className="flex items-start gap-2"
                                                    >
                                                        <Check className={cn('mr-1 w-4 h-4 shrink-0 mt-0.5', String(form.courseId) === String(c.id) ? 'opacity-100' : 'opacity-0')} />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[11px] font-mono text-muted-foreground">{c.courseCode}</span>
                                                            <span className="text-sm leading-tight">{c.courseName}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        ))}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    {submitted && !form.courseId && <p className="text-[11px] text-red-500 -mt-2">Training course is required</p>}

                    {/* Dates + Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                                Start Date <span className="text-red-400">*</span>
                            </label>
                            <Popover modal={true}>
                                <PopoverTrigger asChild>
                                    <button type="button" className={cn('w-full px-3 py-2 text-sm border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 flex items-center justify-between gap-2 cursor-pointer', submitted && !form.dateStart ? 'border-red-400' : 'border-border', !form.dateStart && 'text-muted-foreground')}>
                                        <span>{form.dateStart ? format(parse(form.dateStart, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : 'Pick a date'}</span>
                                        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={form.dateStart ? parse(form.dateStart, 'yyyy-MM-dd', new Date()) : undefined} onSelect={(d) => { if (d) f('dateStart', format(d, 'yyyy-MM-dd')) }} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">End Date</label>
                            <Popover modal={true}>
                                <PopoverTrigger asChild>
                                    <button type="button" className={cn('w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 flex items-center justify-between gap-2 cursor-pointer', !form.dateEnd && 'text-muted-foreground')}>
                                        <span>{form.dateEnd ? format(parse(form.dateEnd, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : 'Pick a date'}</span>
                                        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={form.dateEnd ? parse(form.dateEnd, 'yyyy-MM-dd', new Date()) : undefined} onSelect={(d) => { if (d) f('dateEnd', format(d, 'yyyy-MM-dd')) }} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Start Time</label>
                            <Popover modal={true}>
                                <PopoverTrigger asChild>
                                    <button type="button" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 flex items-center justify-between gap-2 cursor-pointer">
                                        <span>{form.timeStart || '09:00'}</span>
                                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <div className="flex divide-x divide-border">
                                        <ScrollArea className="h-52">
                                            <div className="flex flex-col p-1">
                                                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                                                    <button key={h} type="button" onClick={() => f('timeStart', `${h}:${(form.timeStart || '09:00').split(':')[1]}`)} className={cn('px-3 py-1.5 text-sm rounded hover:bg-accent cursor-pointer text-center min-w-[48px]', (form.timeStart || '09:00').split(':')[0] === h && 'bg-primary text-primary-foreground hover:bg-primary/90')}>{h}</button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                        <ScrollArea className="h-52">
                                            <div className="flex flex-col p-1">
                                                {['00','15','30','45'].map(m => (
                                                    <button key={m} type="button" onClick={() => f('timeStart', `${(form.timeStart || '09:00').split(':')[0]}:${m}`)} className={cn('px-3 py-1.5 text-sm rounded hover:bg-accent cursor-pointer text-center min-w-[48px]', (form.timeStart || '09:00').split(':')[1] === m && 'bg-primary text-primary-foreground hover:bg-primary/90')}>{m}</button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">End Time</label>
                            <Popover modal={true}>
                                <PopoverTrigger asChild>
                                    <button type="button" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 flex items-center justify-between gap-2 cursor-pointer">
                                        <span>{form.timeEnd || '17:00'}</span>
                                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <div className="flex divide-x divide-border">
                                        <ScrollArea className="h-52">
                                            <div className="flex flex-col p-1">
                                                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                                                    <button key={h} type="button" onClick={() => f('timeEnd', `${h}:${(form.timeEnd || '17:00').split(':')[1]}`)} className={cn('px-3 py-1.5 text-sm rounded hover:bg-accent cursor-pointer text-center min-w-[48px]', (form.timeEnd || '17:00').split(':')[0] === h && 'bg-primary text-primary-foreground hover:bg-primary/90')}>{h}</button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                        <ScrollArea className="h-52">
                                            <div className="flex flex-col p-1">
                                                {['00','15','30','45'].map(m => (
                                                    <button key={m} type="button" onClick={() => f('timeEnd', `${(form.timeEnd || '17:00').split(':')[0]}:${m}`)} className={cn('px-3 py-1.5 text-sm rounded hover:bg-accent cursor-pointer text-center min-w-[48px]', (form.timeEnd || '17:00').split(':')[1] === m && 'bg-primary text-primary-foreground hover:bg-primary/90')}>{m}</button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Training Duration Info */}
                    {form.dateStart && (
                        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-blue-700 dark:text-blue-300">
                                <span><span className="font-semibold">{trainingCalc.days}</span> training day{trainingCalc.days !== 1 ? 's' : ''}</span>
                                <span><span className="font-semibold">{trainingCalc.hoursPerDay}</span> hrs/day</span>
                                <span>Total: <span className="font-semibold">{trainingCalc.totalHours}</span> hrs</span>
                            </div>
                        </div>
                    )}

                    {/* Instructor (Select) + Attendance Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Instructor <span className="text-red-400">*</span></label>
                            <select
                                value={form.courseInstructorId || ''}
                                onChange={e => {
                                    const id = Number(e.target.value)
                                    const inst = instructors.find(i => i.id === id)
                                    setForm(p => ({
                                        ...p,
                                        courseInstructorId: id,
                                        instructor: inst ? `${inst.title} ${inst.name}` : '',
                                    }))
                                }}
                                className={cn('w-full px-3 py-2 text-sm border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer', submitted && !form.courseInstructorId ? 'border-red-400' : 'border-border')}
                            >
                                <option value="">Select instructor...</option>
                                {instructors.map(inst => (
                                    <option key={inst.id} value={inst.id}>
                                        {inst.title} {inst.name}
                                    </option>
                                ))}
                            </select>
                            {submitted && !form.courseInstructorId && <p className="text-[11px] text-red-500 mt-1">Instructor is required</p>}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Attendance Type</label>
                            <select value={form.trainingAttendanceTypeId || 1} onChange={e => { f('trainingAttendanceTypeId', Number(e.target.value)); f('venue', '') }}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                {attendanceTypes.length > 0 ? (
                                    attendanceTypes.map((at: AttendanceType) => (
                                        <option key={at.id} value={at.id}>{at.name}</option>
                                    ))
                                ) : null}
                            </select>
                        </div>
                    </div>

                    {/* Venue or Link */}
                    <div>
                        {attendanceTypes.find((at: AttendanceType) => at.id === form.trainingAttendanceTypeId)?.code === 'Online' ? (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Link2 className="w-3.5 h-3.5" />Meeting Link</label>
                                <input type="url" value={form.venue} onChange={e => f('venue', e.target.value)} placeholder="e.g. https://zoom.us/..."
                                    className={cn('w-full px-3 py-2 text-sm border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10', form.venue && !/^https?:\/\/.+/i.test(form.venue) ? 'border-red-400 focus:ring-red-200' : 'border-border')} />
                                {form.venue && !/^https?:\/\/.+/i.test(form.venue) && (
                                    <p className="text-[11px] text-red-500 mt-1">Please enter a valid URL (e.g. https://zoom.us/...)</p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Location (Venue)</label>
                                <input type="text" value={form.venue} onChange={e => f('venue', e.target.value)} placeholder="e.g. BKK Base Room 1"
                                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                            </div>
                        )}
                    </div>

                    {/* Status + Total Hours + Max participants */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status</label>
                            <select value={form.status} onChange={e => f('status', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                {(() => {
                                    const allowed = ['Draft', 'Open Registration', 'Registration Closed', 'In Progress']
                                    const filtered = statusOptions.filter(s => allowed.includes(s.name))
                                    return filtered.length > 0
                                        ? filtered.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                                        : allowed.map(s => <option key={s}>{s}</option>)
                                })()}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Total Hours</label>
                            <input type="number" min={0} step={0.5} value={form.totalHours || ''} disabled
                                placeholder="Auto"
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-muted/50 text-foreground cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Max Participants</label>
                            <input type="number" min={1} max={200} value={form.maxParticipants} onChange={e => f('maxParticipants', parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                    </div>

                    {/* Course Objective */}
                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Course Objective</label>
                        <textarea value={form.objective || ''} onChange={e => f('objective', e.target.value)} placeholder="Course objective will auto-fill when you select a course..." rows={3}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 resize-y" />
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

