import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MapPin, Clock, Users, CheckCircle } from 'lucide-react'
import { Employee, CourseRef } from '../types'

interface CourseEnrollmentModalProps {
    isOpen: boolean
    onClose: () => void
    employee: Employee | null
    course: CourseRef | null
    enrolledSessionId: string | null
    onEnroll: (sessionId: string) => void
}

export const MOCK_SESSIONS = [
    { id: 's1', date: '14 Nov 2026 - 15 Nov 2026', time: '09:00 - 16:00', location: 'HQ Training Room A', enrolled: 28, capacity: 30, instructor: 'Capt. Aphisit' },
    { id: 's2', date: '21 Nov 2026 - 22 Nov 2026', time: '09:00 - 16:00', location: 'BKK Base Room 3', enrolled: 30, capacity: 30, instructor: 'Inst. Somchai' },
    { id: 's3', date: '05 Dec 2026 - 06 Dec 2026', time: '09:00 - 16:00', location: 'Online (Zoom)', enrolled: 12, capacity: 50, instructor: 'Capt. Aphisit' },
]

export function CourseEnrollmentModal({ isOpen, onClose, employee, course, enrolledSessionId, onEnroll }: CourseEnrollmentModalProps) {
    if (!employee || !course) return null

    const handleEnroll = (sessionId: string) => {
        onEnroll(sessionId)
    }

    const sessionsToShow = enrolledSessionId 
        ? MOCK_SESSIONS.filter(s => s.id === enrolledSessionId)
        : MOCK_SESSIONS

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent size='md' className="max-w-2xl bg-card text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <span>Course Enrollment: {course.label}</span>
                        <Badge color="secondary" className="ml-2 font-mono text-xs">{course.short}</Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Select an available training session for <strong>{employee.name}</strong> ({employee.id}).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {sessionsToShow.map(session => {
                        const isFull = session.enrolled >= session.capacity
                        const isEnrolled = enrolledSessionId === session.id

                        return (
                            <div key={session.id} className={`p-4 rounded-xl border transition-all ${isEnrolled
                                    ? 'border-primary bg-primary/5'
                                    : isFull
                                        ? 'border-border bg-muted/30 opacity-70'
                                        : 'border-border hover:border-primary/50 bg-card hover:shadow-sm'
                                }`}>
                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <CalendarDays className="w-4 h-4 text-primary" />
                                            {session.date}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {session.time}</span>
                                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {session.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                            <Users className="w-3.5 h-3.5" />
                                            Instructor: {session.instructor}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                            {session.enrolled} / {session.capacity} Seats
                                        </div>
                                        {isEnrolled ? (
                                            <Button disabled variant="outline" className="w-28 border-primary text-primary bg-primary/10 opacity-100">
                                                <CheckCircle className="w-4 h-4 mr-2" /> Enrolled
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleEnroll(session.id)}
                                                disabled={isFull || !!enrolledSessionId}
                                                variant={isFull ? 'soft' : 'default'}
                                                className="w-28"
                                            >
                                                {isFull ? 'Class Full' : 'Enroll Now'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <DialogFooter className="sm:justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground">
                        {enrolledSessionId ? "Enrollment confirmed. Staff will be notified via email." : "Please review the schedule carefully before enrolling."}
                    </p>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 
