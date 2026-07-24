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
        sessionQueries.forEach(query => {
            query.data?.responseData.forEach(session => {
                const endTimestamp = Date.parse(session.endDate)
                if (
                    session.courseId === Number(course.id)
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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent size="md" className="max-h-[90vh] max-w-2xl overflow-y-auto bg-card text-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <span>Course Enrollment: {course.label}</span>
                        <Badge color="secondary" className="ml-2 text-xs">{course.short}</Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Select an available training session for <strong>{employee.name}</strong> ({employee.id}).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
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

                        return (
                            <div
                                key={session.id}
                                className={`rounded-xl border p-4 transition-all ${
                                    isEnrolled
                                        ? 'border-primary bg-primary/5'
                                        : isFull || !isOpenRegistration
                                            ? 'border-border bg-muted/30 opacity-70'
                                            : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <CalendarDays className="h-4 w-4 text-primary" />
                                            {formatSessionDate(session.startDate, session.endDate)}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" /> {formatSessionTime(session.startDate, session.endDate)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5" /> {session.venueName || '—'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Users className="h-3.5 w-3.5" />
                                            Instructor: {session.instructorName || '—'}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <div className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                            isFull ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                                        }`}>
                                            {session.enrolledCount} / {session.maxParticipants} Seats
                                        </div>
                                        {isEnrolled ? (
                                            <Button disabled variant="outline" className="w-32 border-primary bg-primary/10 text-primary opacity-100">
                                                <CheckCircle className="mr-2 h-4 w-4" /> Enrolled
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleEnroll(session)}
                                                disabled={isFull || !isOpenRegistration || enrollingSessionId !== null}
                                                variant={isFull || !isOpenRegistration ? 'soft' : 'default'}
                                                className="w-32"
                                            >
                                                {isEnrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                {isFull ? 'Class Full' :
                                                    !isOpenRegistration ? session.statusName :
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
