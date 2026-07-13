'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, MapPin, Search, UserPlus, Trash2, Calendar as CalendarIcon, AlertCircle, Users, GraduationCap, Mail, Printer, Lock, MoreVertical, CheckCircle, FileEdit, Unlock, PlayCircle, Edit3, XCircle, Award, File, Video, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PrintAttendanceModal } from '../components/PrintAttendanceModal'
import { EvidenceUploadModal } from '../components/EvidenceUploadModal'
import { CertificateModal } from '../components/CertificateModal'
import { EmailPreviewDialog } from '../components/EmailPreviewDialog'
import { STATUS_CONFIG, CAT_COLOR, formatDate } from '../types'
import type { Session } from '../types'
import { useSchedulerById } from '@/lib/api/qa/scheduler.hooks'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useStaffForEnrollment, useEnrolledStaffList, useEnrollStaff, useUnenrollStaff, useSendEmailList } from '@/lib/api/qa/enrollment.hooks'
import { useInvalidateEmailLogs, usePreviewEmailDepartment } from '@/lib/api/qa/email-log.hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { StaffForEnrollmentItem } from '@/lib/api/qa/enrollment'
import { toast } from 'sonner'

// Staff item shape used by this page
interface StaffItem {
    id: string
    enrollmentId?: number
    name: string
    code: string
    license: string
    dept: string
    date: string
    status: string
    result: string
    expireStatus?: string
}

export default function ScheduleDetailPage() {
    const params = useParams()
    const router = useRouter()
    const sessionId = Number(params?.id)

    // ── API: Fetch session data (React Query) ─────────────────────
    const { data: session = null, isLoading, error: sessionError } = useSchedulerById(sessionId)
    const fetchError = sessionError?.message ?? null

    // ── Staff states ──────────────────────────────────────────────
    const [enrolledStaff, setEnrolledStaff] = useState<StaffItem[]>([])
    const [enrolledSearch, setEnrolledSearch] = useState('')
    const [enrolledPage, setEnrolledPage] = useState(1)
    const [enrolledTotal, setEnrolledTotal] = useState(0)
    const enrolledPerPage = 20

    // ── React Query: Available staff for enrollment ──────────────
    const { data: availableStaffRaw = [], isLoading: isLoadingStaff } = useStaffForEnrollment(sessionId)
    const availableStaff: StaffItem[] = availableStaffRaw.map((s: StaffForEnrollmentItem) => ({
        id: String(s.staffId),
        name: `${s.title ?? ''} ${s.name ?? ''}`.trim(),
        code: s.code ?? '',
        license: '',
        dept: s.departmentName ?? '',
        expireStatus: s.status || 'Valid',
        date: '-',
        status: 'available',
        result: 'Pending',
    }))

    // ── React Query: Enrolled staff list ──────────────────────────
    const { data: enrolledData, isLoading: isLoadingEnrolled } = useEnrolledStaffList({
        scheduleId: sessionId,
        searchKeyword: enrolledSearch,
        page: enrolledPage,
        perPage: enrolledPerPage
    })

    useEffect(() => {
        if (enrolledData) {
            const mapped = enrolledData.list.map((s: any) => ({
                id: String(s.staffId),
                enrollmentId: s.enrollmentId,
                name: s.employeeName ?? '',
                code: s.employeeId ?? '',
                license: s.license || '-',
                dept: s.department || '-',
                date: s.enrolledDate ? s.enrolledDate.split('T')[0] : '-',
                status: s.status ?? 'Enrolled',
                result: s.result ?? 'Pending',
                expireStatus: '',
            }))
            setEnrolledStaff(mapped)
            setEnrolledTotal(enrolledData.total)
        }
    }, [enrolledData])

    const [staffSearch, setStaffSearch] = useState('')
    const [selectedEnrolledIds, setSelectedEnrolledIds] = useState<Set<string>>(new Set())
    const [sessionStatus, setSessionStatus] = useState<'Draft' | 'Open Registration' | 'Registration Closed' | 'In Progress' | 'Grading' | 'Completed' | 'Cancelled'>('Open Registration')
    const [showPrintModal, setShowPrintModal] = useState(false)
    const [showEvidenceModal, setShowEvidenceModal] = useState(false)
    const [evidences, setEvidences] = useState<File[]>([])
    const [showCertModal, setShowCertModal] = useState(false)
    const [certStaffList, setCertStaffList] = useState<StaffItem[]>([])
    const [emailPreviewStaff, setEmailPreviewStaff] = useState<StaffItem | null>(null)
    const invalidateEmailLogs = useInvalidateEmailLogs()
    const [showManagerReport, setShowManagerReport] = useState(false)
    const [managerReportHtml, setManagerReportHtml] = useState('')
    const previewDeptMutation = usePreviewEmailDepartment()

    const handleManagerReport = async () => {
        try {
            const html = await previewDeptMutation.mutateAsync(sessionId)
            if (html) {
                setManagerReportHtml(html)
                setShowManagerReport(true)
            } else {
                toast.error('No report data returned from the server.')
            }
        } catch {
            toast.error('Failed to load Managers Report. Please try again.')
        }
    }

    const handleStatusChange = (status: any) => {
        if (status === 'Completed' && evidences.length === 0) {
            setShowEvidenceModal(true)
            return
        }
        setSessionStatus(status)
    }

    const handleUploadEvidence = (files: File[]) => {
        setEvidences(files)
        setShowEvidenceModal(false)
        setSessionStatus('Completed')
    }

    const openCertificateModal = (staff?: any) => {
        if (staff) {
            setCertStaffList([staff])
        } else {
            // Issue to all passed staff
            setCertStaffList(enrolledStaff.filter(s => s.result === 'Pass'))
        }
        setShowCertModal(true)
    }

    const ALLOWED_NEXT_STATUS: Record<string, string[]> = {
        'Draft': ['Draft', 'Open Registration', 'Cancelled'],
        'Open Registration': ['Open Registration', 'Registration Closed', 'Cancelled'],
        'Registration Closed': ['Registration Closed', 'Open Registration', 'In Progress', 'Cancelled'],
        'In Progress': ['In Progress', 'Grading', 'Cancelled'],
        'Grading': ['Grading', 'Completed'],
        'Completed': ['Completed'],
        'Cancelled': ['Cancelled']
    }

    const isStatusDisabled = (targetStatus: string) => {
        return !ALLOWED_NEXT_STATUS[sessionStatus]?.includes(targetStatus);
    }

    const cfg = STATUS_CONFIG[session?.status ?? 'Scheduled'] || STATUS_CONFIG.Scheduled
    const enrolledCount = enrolledTotal > 0 ? enrolledTotal : (session?.enrolled ?? 0)
    const pct = (session?.maxParticipants ?? 0) > 0 ? (enrolledCount / (session?.maxParticipants ?? 1)) * 100 : 0
    const slotsLeft = (session?.maxParticipants ?? 0) - enrolledCount
    const isFull = slotsLeft <= 0

    const getInitials = (name: string) => {
        const words = name.replace('Mr. ', '').replace('Ms. ', '').replace('Capt. ', '').replace('Eng. ', '').split(' ')
        return words[0] ? words[0][0] : '?'
    }

    // ── Mutations (React Query hooks) ────────────────────────────
    const enrollMutation = useEnrollStaff(sessionId)
    const unenrollMutation = useUnenrollStaff(sessionId)
    const sendEmailMutation = useSendEmailList(sessionId)

    const [enrollingId, setEnrollingId] = useState<string | null>(null)

    const handleEnroll = async (staff: StaffItem) => {
        if (isFull || sessionStatus !== 'Open Registration' || enrollingId) return;
        setEnrollingId(staff.id)

        try {
            await enrollMutation.mutateAsync({
                trainingScheduleId: sessionId,
                staffId: Number(staff.id),
                note: '',
                trainingEnrollmentActionStatusId: 1,
                trainingEnrollmentStatusId: 1,
            })
        } catch (err: any) {
            console.error('Enroll failed:', err)
            toast.error(err?.message || 'Failed to enroll staff')
        } finally {
            setEnrollingId(null)
        }
    }

    const [removingId, setRemovingId] = useState<string | null>(null)
    const [confirmRemoveStaff, setConfirmRemoveStaff] = useState<StaffItem | null>(null)

    const handleRemove = (staff: any) => {
        if (sessionStatus === 'Completed' || sessionStatus === 'Grading') return;
        setConfirmRemoveStaff(staff)
    }

    const confirmUnenroll = async () => {
        const staff = confirmRemoveStaff
        if (!staff) return
        setConfirmRemoveStaff(null)

        const enrollmentId = staff.enrollmentId
        if (!enrollmentId) {
            toast.error('Enrollment ID not found')
            return
        }

        setRemovingId(staff.id)
        try {
            await unenrollMutation.mutateAsync({ enrollmentId })
            setSelectedEnrolledIds(prev => {
                const next = new Set(prev)
                next.delete(staff.id)
                return next
            })
        } catch (err: any) {
            console.error('Unenroll failed:', err)
            toast.error(err?.message || 'Failed to remove staff')
        } finally {
            setRemovingId(null)
        }
    }

    const handleUpdateResult = (staffId: string, field: 'score' | 'result', value: string) => {
        setEnrolledStaff(prev => prev.map(s => s.id === staffId ? { ...s, [field]: value } : s));
    }

    const handleSendAll = async () => {
        if (selectedEnrolledIds.size === 0) return
        const staffIdList = Array.from(selectedEnrolledIds).map(Number)

        try {
            const data = await sendEmailMutation.mutateAsync({
                scheduleId: sessionId,
                staffIdList,
                subject: `Confirmed Session - ${session?.courseName ?? 'Training Notification'}`,
                emailFrom: null,
                emailCc: null,
            })
            const sent = data?.totalSent ?? 0
            const failed = data?.totalFailed ?? 0
            if (failed > 0) {
                toast.warning(`Email sent: ${sent} success, ${failed} failed.`, {
                    description: data?.details?.filter((d) => !d.isSuccess).map((d) => d.errorMessage).join('\n') ?? ''
                })
            } else {
                toast.success(`Email sent successfully to ${sent} staff.`)
            }
            setSelectedEnrolledIds(new Set())
        } catch (err: any) {
            console.error('Send email failed:', err)
            toast.error(err?.message || 'Failed to send emails')
        }
    }

    const handleSendSingleEmail = async (staffId: number) => {
        try {
            const data = await sendEmailMutation.mutateAsync({
                scheduleId: sessionId,
                staffIdList: [staffId],
                subject: `Confirmed Session - ${session?.courseName ?? 'Training Notification'}`,
                emailFrom: null,
                emailCc: null,
            })
            const sent = data?.totalSent ?? 0
            const failed = data?.totalFailed ?? 0
            // Invalidate email log cache so the Log tab refreshes
            invalidateEmailLogs(sessionId, staffId)
            if (failed > 0) {
                toast.warning(`Email sent: ${sent} success, ${failed} failed.`)
            } else {
                toast.success(`Email sent successfully.`)
            }
        } catch (err: any) {
            console.error('Send single email failed:', err)
            toast.error(err?.message || 'Failed to send email')
        }
    }

    // ── Loading / Error states ──────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading session data...</span>
                </div>
            </div>
        )
    }

    if (fetchError || !session) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="max-w-md w-full">
                    <CardContent className="flex flex-col items-center gap-3 py-8">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                        <p className="text-sm font-semibold text-foreground">Failed to load session</p>
                        <p className="text-xs text-muted-foreground text-center">{fetchError || 'Session not found'}</p>
                        <button
                            onClick={() => router.back()}
                            className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold text-primary border border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                        >
                            Go Back
                        </button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div>
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-border bg-white"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Sessions
                        </button>
                        <div className="w-px h-6 bg-border" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {session.courseCode}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${sessionStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                sessionStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                    sessionStatus === 'Grading' ? 'bg-purple-100 text-purple-700' :
                                        sessionStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                            sessionStatus === 'Registration Closed' ? 'bg-amber-100 text-amber-700' :
                                                sessionStatus === 'Open Registration' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-slate-100 text-slate-700'
                                }`}>
                                {sessionStatus}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            {sessionStatus === 'Completed' && (
                                <button
                                    onClick={() => openCertificateModal()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary hover:bg-primary/5 transition-colors cursor-pointer bg-white"
                                >
                                    <Award className="w-3.5 h-3.5" />
                                    Issue Certificates
                                </button>
                            )}
                            <div className="relative">
                                <select
                                    value={sessionStatus}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold border border-border bg-white text-foreground transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="Draft" disabled={isStatusDisabled('Draft')}>Draft</option>
                                    <option value="Open Registration" disabled={isStatusDisabled('Open Registration')}>Open Registration</option>
                                    <option value="Registration Closed" disabled={isStatusDisabled('Registration Closed')}>Registration Closed</option>
                                    <option value="In Progress" disabled={isStatusDisabled('In Progress')}>In Progress</option>
                                    <option value="Grading" disabled={isStatusDisabled('Grading')}>Grading</option>
                                    <option value="Completed" disabled={isStatusDisabled('Completed')}>Completed</option>
                                    <option value="Cancelled" disabled={isStatusDisabled('Cancelled')}>Cancelled</option>
                                </select>
                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 pointer-events-none text-current opacity-50" />
                            </div>
                        </div>
                    </div>
                    <CardTitle className="mt-2">{session.courseName}</CardTitle>
                    <CardDescription>Manage staff enrollment for this training session</CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5">
                        {/* Left — Session Info */}
                        <div className="space-y-4">
                            {/* SessionInfoCard Replica */}
                            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-border p-5 space-y-4">
                                {/* Course Title & Status */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                                {session.courseCode}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${sessionStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                sessionStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                    sessionStatus === 'Grading' ? 'bg-purple-100 text-purple-700' :
                                                        sessionStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                            sessionStatus === 'Registration Closed' ? 'bg-amber-100 text-amber-700' :
                                                                sessionStatus === 'Open Registration' ? 'bg-emerald-100 text-emerald-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {sessionStatus}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground leading-snug">{session.courseName}</h3>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center gap-2 text-xs">
                                        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Date</span>
                                            <span className="text-foreground font-medium">
                                                {formatDate(session.dateStart)}
                                                {session.dateEnd !== session.dateStart && ` — ${formatDate(session.dateEnd)}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Time</span>
                                            <span className="text-foreground font-medium">{session.timeStart} – {session.timeEnd}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Instructor</span>
                                            <span className="text-foreground font-medium">{session.instructor}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        {session.trainingAttendanceTypeId === 2 ? (
                                            <Video className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        ) : (
                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        )}
                                        <div>
                                            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Attendance Type</span>
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md mt-0.5 ${session.trainingAttendanceTypeId === 2 ? 'bg-violet-50 text-violet-600' : 'bg-sky-50 text-sky-600'}`}>
                                                {session.trainingAttendanceTypeId === 2 ? 'Online' : 'Onsite'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Location / Meeting Link */}
                                <div className="flex items-start gap-2 text-xs mt-1">
                                    {session.trainingAttendanceTypeId === 2 ? (
                                        <Video className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                    ) : (
                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">
                                            {session.trainingAttendanceTypeId === 2 ? 'Meeting Link' : 'Location'}
                                        </span>
                                        {session.trainingAttendanceTypeId === 2 && session.link ? (
                                            <a href={session.link} target="_blank" rel="noopener noreferrer"
                                                className="text-primary font-medium hover:underline">
                                                {session.link.replace(/^https?:\/\//, '').substring(0, 35)}{session.link.length > 42 ? '...' : ''}
                                            </a>
                                        ) : (
                                            <span className="text-foreground font-medium">{session.venue}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Capacity Bar */}
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="font-semibold text-foreground">Enrollment Capacity</span>
                                        </div>
                                        <span className={`text-xs font-bold ${isFull ? 'text-red-600' : slotsLeft <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {enrolledCount}/{session.maxParticipants}
                                            <span className="text-muted-foreground font-medium ml-1">
                                                ({isFull ? 'Full' : `${slotsLeft} slots left`})
                                            </span>
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Course Objective */}
                                <div className="pt-2">
                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Course Objective</h4>
                                    <div className="bg-blue-50/50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed border border-blue-100">
                                        {session.objective ? (
                                            <p>{session.objective}</p>
                                        ) : (
                                            <p className="text-muted-foreground italic">No course objective specified</p>
                                        )}
                                    </div>
                                </div>

                                {/* Regulatory Notes */}
                                <div className="pt-2">
                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Regulatory Notes</h4>
                                    <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed border border-slate-100">
                                        {session.note ? (
                                            <p className="whitespace-pre-line">{session.note}</p>
                                        ) : (
                                            <p className="text-muted-foreground italic">No additional notes</p>
                                        )}
                                    </div>
                                </div>

                                {/* Uploaded Evidence */}
                                {evidences.length > 0 && (
                                    <div className="pt-2">
                                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Attached Evidence</h4>
                                        <div className="space-y-2">
                                            {evidences.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] group hover:shadow-md transition-shadow cursor-pointer">
                                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                                            <File className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[11px] font-bold text-slate-700 truncate">{file.name}</span>
                                                            <span className="text-[9px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Add Staff Panel */}
                            {sessionStatus === 'Open Registration' ? (
                                <div className="bg-white rounded-xl border border-border overflow-hidden">
                                    <div className="p-3 bg-slate-50/80 border-b border-border flex items-center gap-2">
                                        <UserPlus className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-bold text-foreground">Add Staff</span>
                                        <span className="text-[10px] text-muted-foreground ml-auto">
                                            {availableStaff.length} available
                                        </span>
                                    </div>

                                    {/* Search */}
                                    <div className="p-3 border-b border-border">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={staffSearch}
                                                onChange={e => setStaffSearch(e.target.value)}
                                                placeholder="Search by name, ID or department..."
                                                disabled={isFull}
                                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-60 disabled:bg-muted/30"
                                            />
                                        </div>
                                    </div>

                                    {/* Full Warning */}
                                    {isFull ? (
                                        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                                            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                            <span className="text-[11px] font-semibold text-red-700">Session is full. Cannot add more.</span>
                                        </div>
                                    ) : (
                                        <div className="max-h-[340px] overflow-y-auto">
                                            {availableStaff
                                                .filter(s =>
                                                    s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
                                                    s.code.includes(staffSearch) ||
                                                    s.dept.toLowerCase().includes(staffSearch.toLowerCase())
                                                )
                                                .sort((a, b) => {
                                                    const order: Record<string, number> = { 'Expired': 0, 'Expiring Soon': 1, 'Require': 2 };
                                                    return (order[a.expireStatus ?? ''] ?? 3) - (order[b.expireStatus ?? ''] ?? 3);
                                                })
                                                .map(staff => (
                                                    <div key={staff.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0">
                                                            {getInitials(staff.name)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs font-semibold text-foreground truncate">{staff.name}</p>
                                                                {staff.expireStatus === 'Expired' && <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-sm">Expired</span>}
                                                                {staff.expireStatus === 'Expiring Soon' && <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm">Expiring Soon</span>}
                                                                {staff.expireStatus === 'Require' && <span className="text-[9px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-sm">Require</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                                                <span className="font-bold">{staff.code}</span>
                                                                {/* <span>·</span>
                                                                <span>{staff.license}</span> */}
                                                                {/* <span>·</span> */}
                                                                {/* <span className="truncate">{staff.dept}</span> */}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEnroll(staff)}
                                                            disabled={enrollingId === staff.id}
                                                            className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${enrollingId === staff.id ? 'bg-muted text-muted-foreground cursor-wait' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
                                                        >
                                                            {enrollingId === staff.id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <UserPlus className="w-3 h-3" />
                                                            )}
                                                            {enrollingId === staff.id ? 'Enrolling...' : 'Enroll'}
                                                        </button>
                                                    </div>
                                                ))}
                                            {availableStaff.length === 0 && (
                                                <div className="p-6 text-center text-xs text-muted-foreground">No available staff found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-xl border border-border p-8 text-center flex flex-col items-center justify-center h-[300px]">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-border mb-3 shadow-sm">
                                        <Lock className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">Registration Closed</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Status must be "Open Registration" to add new staff members.</p>
                                </div>
                            )}
                        </div>

                        {/* Right — Enrolled Staff List */}
                        <div className="bg-white rounded-xl border border-border overflow-hidden">
                            <div className="p-4 bg-slate-50/80 border-b border-border flex items-center gap-3">
                                <Users className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-foreground">Enrolled Staff</span>
                                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-1">
                                    {enrolledCount}
                                </span>
                                <div className="relative ml-auto w-48">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={enrolledSearch}
                                        onChange={e => setEnrolledSearch(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                setEnrolledPage(1)
                                            }
                                        }}
                                        placeholder="Search enrolled..."
                                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                                    />
                                </div>

                                {/* Send email notification */}
                                {selectedEnrolledIds.size > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" onClick={handleSendAll} disabled={sendEmailMutation.isPending}>
                                                    {sendEmailMutation.isPending ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Mail className="w-3 h-3 mr-1.5" />}
                                                    Send All ({selectedEnrolledIds.size})
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Send Registration Reminder</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="sm" color="primary" onClick={handleManagerReport} disabled={previewDeptMutation.isPending} className="cursor-pointer">
                                                {previewDeptMutation.isPending ? (
                                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                                ) : (
                                                    <Mail className="w-3 h-3 mr-1.5" />
                                                )}
                                                Managers Report
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Send Report to Managers</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="icon" color="secondary" onClick={() => setShowPrintModal(true)} className='cursor-pointer transition-all duration-200 hover:scale-120'>
                                                <Printer className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Print Attendance Form</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <div className="grid grid-cols-[32px_1fr_120px_130px_80px_90px_70px] gap-3 px-4 py-2.5 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                                <span className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={enrolledStaff.length > 0 && selectedEnrolledIds.size === enrolledStaff.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedEnrolledIds(new Set(enrolledStaff.map(s => s.id)))
                                            } else {
                                                setSelectedEnrolledIds(new Set())
                                            }
                                        }}
                                        className="w-3.5 h-3.5 rounded border-border cursor-pointer accent-primary"
                                    />
                                </span>
                                <span>Employee Name</span>
                                <span>License</span>
                                <span>Department</span>
                                <span>Status</span>
                                <span>Result</span>
                                <span className="text-center">Action</span>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto">
                                {isLoadingEnrolled ? (
                                    <div className="p-12 text-center">
                                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">Loading enrolled staff...</p>
                                    </div>
                                ) : enrolledStaff.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">
                                            {enrolledSearch ? 'No matching enrolled staff' : 'No staff enrolled yet. Add staff from the left panel.'}
                                        </p>
                                    </div>
                                ) : (
                                    enrolledStaff.map((staff, idx) => (
                                        <div
                                            key={staff.id + '-' + idx}
                                            className={`grid grid-cols-[32px_1fr_120px_130px_80px_90px_70px] gap-3 px-4 py-3 items-center border-b border-border/50 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEnrolledIds.has(staff.id)}
                                                    onChange={(e) => {
                                                        setSelectedEnrolledIds(prev => {
                                                            const next = new Set(prev)
                                                            if (e.target.checked) {
                                                                next.add(staff.id)
                                                            } else {
                                                                next.delete(staff.id)
                                                            }
                                                            return next
                                                        })
                                                    }}
                                                    className="w-3.5 h-3.5 rounded border-border cursor-pointer accent-primary"
                                                />
                                            </div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button type="button" title={`${staff.name} (${staff.code})`} className="min-w-0 text-left w-full bg-transparent border-none p-0 cursor-default outline-none">
                                                            <p className="text-xs font-semibold text-foreground truncate">{staff.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold truncate">{staff.code}</p>
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <p>{staff.name}</p>
                                                        <p className="text-muted-foreground">{staff.code}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <div className="min-w-0 overflow-hidden">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button type="button" title={staff.license} className="w-full text-left bg-transparent border-none p-0 cursor-default outline-none text-xs font-semibold text-foreground truncate block">
                                                                {staff.license}
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{staff.license}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="min-w-0 overflow-hidden">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button type="button" title={staff.dept} className="w-full text-left bg-transparent border-none p-0 cursor-default outline-none text-[11px] text-muted-foreground font-medium truncate block">
                                                                {staff.dept}
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{staff.dept}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="flex">
                                                <span
                                                    className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[9px] font-bold capitalize"
                                                    style={{ background: '#dbeafe', color: '#1e40af' }}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />
                                                    {staff.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                {sessionStatus === 'Grading' ? (
                                                    <div className="flex bg-muted/50 p-0.5 rounded-md border border-border/50">
                                                        <button
                                                            onClick={() => handleUpdateResult(staff.id, 'result', 'Pass')}
                                                            className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-colors cursor-pointer border-none ${staff.result === 'Pass' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-100 bg-transparent'}`}
                                                        >
                                                            Pass
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateResult(staff.id, 'result', 'Fail')}
                                                            className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-colors cursor-pointer border-none ${staff.result === 'Fail' ? 'bg-red-500 text-white shadow-sm' : 'text-red-700 hover:bg-red-100 bg-transparent'}`}
                                                        >
                                                            Fail
                                                        </button>
                                                    </div>
                                                ) : sessionStatus === 'Completed' ? (
                                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${staff.result === 'Pass' || staff.result === 'Passed' ? 'bg-emerald-100 text-emerald-700' : staff.result === 'Fail' || staff.result === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {staff.result}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground italic px-2 py-1 bg-slate-100 rounded-md border border-border" title="Result can be edited during Grading">
                                                        {staff.result === 'Pending' ? 'Pending' : staff.result}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-center gap-1">
                                                {sessionStatus === 'Completed' && (staff.result === 'Pass' || staff.result === 'Passed') && (
                                                    <button
                                                        onClick={() => openCertificateModal(staff)}
                                                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer border-none bg-transparent"
                                                        title="Issue Certificate"
                                                    >
                                                        <Award className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border-none bg-transparent"
                                                    title="Send Email"
                                                    onClick={() => {
                                                        setEmailPreviewStaff(staff)
                                                    }}
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemove(staff)}
                                                    disabled={sessionStatus === 'Completed' || sessionStatus === 'Grading' || removingId === staff.id}
                                                    className={`p-1.5 rounded-lg transition-colors border-none bg-transparent ${sessionStatus === 'Completed' || sessionStatus === 'Grading' || removingId === staff.id ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'}`}
                                                    title="Remove Staff"
                                                >
                                                    {removingId === staff.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            {enrolledTotal > enrolledPerPage && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-slate-50/50">
                                    <span className="text-[11px] text-muted-foreground">
                                        Showing {((enrolledPage - 1) * enrolledPerPage) + 1}–{Math.min(enrolledPage * enrolledPerPage, enrolledTotal)} of {enrolledTotal}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setEnrolledPage(p => Math.max(1, p - 1))}
                                            disabled={enrolledPage <= 1}
                                            className={`p-1.5 rounded-lg text-xs font-semibold transition-colors border-none ${enrolledPage <= 1 ? 'text-slate-300 cursor-not-allowed bg-transparent' : 'text-foreground hover:bg-muted cursor-pointer bg-transparent'}`}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-[11px] font-bold text-foreground px-2">
                                            {enrolledPage} / {Math.ceil(enrolledTotal / enrolledPerPage)}
                                        </span>
                                        <button
                                            onClick={() => setEnrolledPage(p => Math.min(Math.ceil(enrolledTotal / enrolledPerPage), p + 1))}
                                            disabled={enrolledPage >= Math.ceil(enrolledTotal / enrolledPerPage)}
                                            className={`p-1.5 rounded-lg text-xs font-semibold transition-colors border-none ${enrolledPage >= Math.ceil(enrolledTotal / enrolledPerPage) ? 'text-slate-300 cursor-not-allowed bg-transparent' : 'text-foreground hover:bg-muted cursor-pointer bg-transparent'}`}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <PrintAttendanceModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                session={session as any}
                enrolledStaff={enrolledStaff}
            />
            <EvidenceUploadModal
                isOpen={showEvidenceModal}
                onClose={() => setShowEvidenceModal(false)}
                onUploadSuccess={handleUploadEvidence}
            />
            <CertificateModal
                isOpen={showCertModal}
                onClose={() => setShowCertModal(false)}
                session={session as any}
                staffList={certStaffList}
            />

            {/* Unenroll Confirmation Modal */}
            <AlertDialog open={!!confirmRemoveStaff} onOpenChange={(open) => { if (!open) setConfirmRemoveStaff(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Staff</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <span className="font-semibold text-foreground">{confirmRemoveStaff?.name}</span> from this training session? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmUnenroll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Email Preview Dialog */}
            {emailPreviewStaff && (
                <EmailPreviewDialog
                    isOpen={!!emailPreviewStaff}
                    onClose={() => setEmailPreviewStaff(null)}
                    staff={emailPreviewStaff}
                    scheduleId={sessionId}
                    onSend={handleSendSingleEmail}
                    isSending={sendEmailMutation.isPending}
                />
            )}

            {/* Managers Report Preview Dialog */}
            <Dialog open={showManagerReport} onOpenChange={(open) => { if (!open) setShowManagerReport(false) }}>
                <DialogContent size="lg" className="p-0 gap-0 overflow-hidden min-h-[90vh] flex flex-col">
                    <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Mail className="w-4 h-4 text-primary" />
                            Managers Report Preview
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 p-6 flex flex-col">
                        <iframe
                            srcDoc={managerReportHtml}
                            className="flex-1 w-full border border-border rounded-xl bg-white"
                            sandbox="allow-same-origin"
                            title="Managers Report Preview"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
