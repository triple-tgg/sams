import { useMemo, useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MapPin, Clock, Users, CheckCircle, Loader2 } from 'lucide-react'
import { Employee, CourseRef } from '../types'
import {
    getSchedulerCalendar,
    type SchedulerSessionData,
} from '@/lib/api/qa/scheduler'
import { schedulerKeys } from '@/lib/api/qa/scheduler.hooks'
import {
    enrollStaff,
    getEnrolledStaffList,
    getStaffForEnrollment,
} from '@/lib/api/qa/enrollment'
import { getTrainingEnrollmentActionStatuses } from '@/lib/api/master/trainingEnrollmentActionStatuses'

interface CourseEnrollmentModalProps {
    isOpen: boolean
    onClose: () => void
    employee: Employee | null
    course: CourseRef | null
    enrolledSessionId: string | null
    onEnroll: (sessionId: string) => void
}

function formatSessionDate(startDate: string, endDate: string): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—'
    if (start.toDateString() === end.toDateString()) {
        return formatter.format(start)
    }
    return `${formatter.format(start)} - ${formatter.format(end)}`
}

function formatSessionTime(startDate: string, endDate: string): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—'
    return `${formatter.format(start)} - ${formatter.format(end)}`
}

export function CourseEnrollmentModal({
    isOpen,
    onClose,
    employee,
    course,
    enrolledSessionId,
    onEnroll,
}: CourseEnrollmentModalProps) {
    const queryClient = useQueryClient()
    const [enrollingSessionId, setEnrollingSessionId] = useState<number | null>(null)
    const currentYear = new Date().getFullYear()
    const years = [currentYear, currentYear + 1]
    const sessionQueries = useQueries({
        queries: years.map(year => ({
            queryKey: schedulerKeys.calendar({ month: null, year }),
            queryFn: () => getSchedulerCalendar({ month: null, year }),
            enabled: isOpen && Boolean(course),
            staleTime: 30_000,
        })),
    })

    const sessions = useMemo(() => {
        if (!course) return []
        const now = Date.now()
        const byId = new Map<number, SchedulerSessionData>()
        const cId = Number(course.id)
        const cCode = (typeof course.code === 'string' ? course.code : (course.code?.[0] || course.short)).toLowerCase().trim()
        const cShort = course.short.toLowerCase().trim()

        sessionQueries.forEach(query => {
            query.data?.responseData.forEach(session => {
                const endTimestamp = Date.parse(session.endDate)
                const sCode = (session.courseCode || '').toLowerCase().trim()
                const sCourseId = session.courseId

                const isMatch = (cId && sCourseId === cId) || (sCode && (sCode === cCode || sCode === cShort))
                if (
                    isMatch
                    && !Number.isNaN(endTimestamp)
                    && endTimestamp >= now
                ) {
                    byId.set(session.id, session)
                }
            })
        })
        return Array.from(byId.values()).sort(
            (a, b) => Date.parse(a.startDate) - Date.parse(b.startDate),
        )
    }, [course, sessionQueries])

    if (!employee || !course) return null

    const isLoading = sessionQueries.some(query => query.isLoading)
    const isError = sessionQueries.every(query => query.isError)

    const handleEnroll = async (session: SchedulerSessionData) => {
        if (!employee.staffId) {
            toast.error('Staff ID is unavailable')
            return
        }
        if (session.enrolledCount >= session.maxParticipants) {
            toast.error('This training session is full')
            return
        }
        if (session.statusName.trim().toLowerCase() !== 'open registration') {
            toast.error('This training session is not open for registration')
            return
        }

        setEnrollingSessionId(session.id)
        try {
            const [availableStaff, enrolledData, actionStatuses] = await Promise.all([
                getStaffForEnrollment(session.id),
                getEnrolledStaffList({
                    scheduleId: session.id,
                    searchKeyword: employee.id,
                    page: 1,
                    perPage: 100,
                }),
                getTrainingEnrollmentActionStatuses(),
            ])
            const alreadyEnrolled = enrolledData.list.some(item => item.staffId === employee.staffId)
            if (alreadyEnrolled) {
                onEnroll(String(session.id))
                toast.info('Staff is already enrolled in this session')
                return
            }
            const canEnroll = availableStaff.some(item => item.staffId === employee.staffId)
            if (!canEnroll) {
                toast.error('Staff is not eligible for this training session')
                return
            }

            const enrollActionStatusId = actionStatuses.responseData.find(status => {
                const value = `${status.code} ${status.name}`.toUpperCase()
                return value.includes('ENROLL')
            })?.id
            if (!enrollActionStatusId) {
                toast.error('Enrollment action status is unavailable')
                return
            }

            await enrollStaff({
                trainingScheduleId: session.id,
                staffId: employee.staffId,
                note: '',
                trainingEnrollmentActionStatusId: enrollActionStatusId,
                trainingEnrollmentStatusId: 1,
            })
            onEnroll(String(session.id))
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: schedulerKeys.all }),
                queryClient.invalidateQueries({ queryKey: ['training-monitoring'] }),
                queryClient.invalidateQueries({ queryKey: ['staffForEnrollment', session.id] }),
                queryClient.invalidateQueries({ queryKey: ['enrolledStaffList', session.id] }),
            ])
            toast.success('Staff enrolled successfully')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to enroll staff')
        } finally {
            setEnrollingSessionId(null)
        }
    }

    const courseCode = typeof course.code === 'string' ? course.code : (course.code?.[0] || course.short)

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent size="md" className="max-h-[90vh] max-w-2xl overflow-y-auto bg-card text-foreground">
                <DialogHeader className="pr-10 space-y-2 text-left">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {courseCode && (
                                <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-primary/10 text-primary rounded-md border border-primary/20">
                                    {courseCode}
                                </span>
                            )}
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Course Enrollment
                            </span>
                        </div>
                        <DialogTitle className="text-lg font-bold text-foreground leading-snug">
                            {course.label}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Select an available training session for <strong className="text-foreground">{employee.name}</strong> ({employee.id}).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            Loading training sessions…
                        </div>
                    ) : isError ? (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-10 text-center text-sm text-destructive">
                            Unable to load training sessions.
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
                            No upcoming training sessions found for this course.
                        </div>
                    ) : sessions.map(session => {
                        const isFull = session.enrolledCount >= session.maxParticipants
                        const isEnrolled = enrolledSessionId === String(session.id)
                        const isOpenRegistration = session.statusName.trim().toLowerCase() === 'open registration'
                        const isEnrolling = enrollingSessionId === session.id
                        const seatsLeft = Math.max(0, session.maxParticipants - session.enrolledCount)
                        const hasVenue = Boolean(session.venueName && session.venueName.trim() !== '' && session.venueName !== '—' && session.venueName !== '-')
                        const hasInstructor = Boolean(session.instructorName && session.instructorName.trim() !== '' && session.instructorName !== '—' && session.instructorName !== '-')
                        const sessionTime = formatSessionTime(session.startDate, session.endDate)
                        const hasTime = Boolean(sessionTime && sessionTime !== '—')

                        return (
                            <div
                                key={session.id}
                                className={`rounded-xl border p-4 transition-all ${
                                    isEnrolled
                                        ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
                                        : isFull || !isOpenRegistration
                                            ? 'border-border bg-muted/30 opacity-75'
                                            : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                    <div className="flex-1 space-y-2.5">
                                        {/* Top row: Date, Status, Department */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                                                <CalendarDays className="h-4 w-4 text-primary" />
                                                <span>{formatSessionDate(session.startDate, session.endDate)}</span>
                                            </div>
                                            {session.statusName && (
                                                <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                                                    isOpenRegistration
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {session.statusName}
                                                </span>
                                            )}
                                            {session.targetDepartmentName && (
                                                <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                                                    {session.targetDepartmentName}
                                                </span>
                                            )}
                                        </div>

                                        {/* Time, Venue, Instructor */}
                                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                                            {hasTime && (
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                    <span>{sessionTime}</span>
                                                </span>
                                            )}
                                            {hasVenue && (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                    <span>{session.venueName}</span>
                                                </span>
                                            )}
                                            {hasInstructor && (
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                    <span>Instructor: <strong className="text-foreground/80 font-medium">{session.instructorName}</strong></span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Optional note */}
                                        {session.note && (
                                            <div className="text-xs text-muted-foreground/90 bg-muted/40 px-2.5 py-1.5 rounded-md border border-border/50">
                                                <span className="font-medium text-foreground/70">Note: </span>{session.note}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Seats badge & Enroll Button */}
                                    <div className="flex shrink-0 flex-col items-end gap-2.5 self-stretch sm:self-center justify-between sm:justify-center">
                                        <div className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                            isFull
                                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                            {session.enrolledCount} / {session.maxParticipants} Seats
                                            {!isFull && session.maxParticipants > session.enrolledCount && (
                                                <span className="ml-1 text-[10px] font-normal opacity-85">
                                                    ({seatsLeft} left)
                                                </span>
                                            )}
                                        </div>

                                        {isEnrolled ? (
                                            <Button
                                                disabled
                                                variant="outline"
                                                className="w-32 border-primary bg-primary/10 text-primary opacity-100 font-semibold"
                                            >
                                                <CheckCircle className="mr-1.5 h-4 w-4" /> Enrolled
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleEnroll(session)}
                                                disabled={isFull || !isOpenRegistration || enrollingSessionId !== null}
                                                color="primary"
                                                className={`w-32 font-semibold shadow-sm transition-all ${
                                                    isFull || !isOpenRegistration
                                                        ? 'bg-slate-200 text-slate-500 hover:bg-slate-200 cursor-not-allowed'
                                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                }`}
                                            >
                                                {isEnrolling && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                                                {isFull ? 'Class Full' :
                                                    !isOpenRegistration ? (session.statusName?.toLowerCase().includes('close') ? 'Closed' : session.statusName) :
                                                        isEnrolling ? 'Enrolling…' : 'Enroll Now'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <DialogFooter className="items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                        Enrollment is saved to Training Scheduler immediately.
                    </p>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
