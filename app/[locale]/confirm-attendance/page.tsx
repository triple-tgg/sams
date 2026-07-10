'use client'

import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Clock, CalendarDays, MapPin, Loader2, ShieldAlert, User, Mail } from 'lucide-react'
import { confirmAttendance, sendEmailConfirmedList, getAttendanceTypesPublic, type ConfirmAttendanceItem, type SendEmailResult } from '@/lib/api/qa/enrollment'

// ─── Date Formatter ─────────────────────────────────────────────────────────

function formatDisplayDate(dateStr: string): string {
    try {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
        return dateStr
    }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type EmailStatus =
    | { state: 'sending' }
    | { state: 'sent'; message: string; result?: SendEmailResult }
    | { state: 'failed' }

// ─── Status Cards ───────────────────────────────────────────────────────────

function SuccessCard({ data, emailStatus, attendanceTypeName }: { data: ConfirmAttendanceItem; emailStatus?: EmailStatus; attendanceTypeName?: string }) {
    const schedule = data.trainingSchedule
    const course = schedule.courseObj

    return (
        <div className="text-center">
            {/* Icon */}
            <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg ${emailStatus?.state === 'sending'
                ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-200'
                : 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-200'
                }`}>
                {emailStatus?.state === 'sending' ? (
                    <Loader2 className="h-10 w-10 text-white animate-spin" strokeWidth={2.5} />
                ) : (
                    <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
                )}
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Attendance Confirmed!</h1>
            <p className="text-slate-500 mb-8">
                Your attendance has been successfully registered. See you at the training session.
            </p>

            {/* Session Details Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5 text-left">
                <table className="w-full text-sm">
                    <tbody className="[&_td]:py-1.5">
                        <tr>
                            <td className="text-slate-400 font-medium w-28 align-top pr-3">Course:</td>
                            <td className="text-slate-800 font-semibold">{course.courseName}</td>
                        </tr>
                        <tr>
                            <td className="text-slate-400 font-medium align-top pr-3">Course Code:</td>
                            <td className="text-slate-800 font-medium">{course.courseCode}</td>
                        </tr>
                        <tr>
                            <td className="text-slate-400 font-medium align-top pr-3">Date:</td>
                            <td className="text-slate-800 font-medium">
                                {formatDisplayDate(schedule.startDate)}
                                {schedule.endDate !== schedule.startDate && ` — ${formatDisplayDate(schedule.endDate)}`}
                            </td>
                        </tr>
                        <tr>
                            <td className="text-slate-400 font-medium align-top pr-3">Time:</td>
                            <td className="text-slate-800 font-medium">
                                {new Date(schedule.startDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                {' – '}
                                {new Date(schedule.endDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                        </tr>
                        <tr>
                            <td className="text-slate-400 font-medium align-top pr-3">Instructor:</td>
                            <td className="text-slate-800 font-medium">{schedule.instructor || '-'}</td>
                        </tr>
                        <tr>
                            <td className="text-slate-400 font-medium align-top pr-3">Attendance Type:</td>
                            <td className="text-slate-800 font-medium">{attendanceTypeName || '-'}</td>
                        </tr>
                        <tr>
                            <td className="text-slate-400 font-medium align-top pr-3">Location:</td>
                            <td className="text-slate-800 font-medium">
                                {schedule.venue || schedule.trainingAttendanceTypeObj?.name || '-'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Email Notification Status */}
            {emailStatus && (
                <div className="mt-5">
                    {emailStatus.state === 'sending' && (
                        <div className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                            <span className="text-sm text-blue-700">Sending confirmation email...</span>
                        </div>
                    )}
                    {emailStatus.state === 'sent' && emailStatus.message === 'success' && (
                        <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                            <Mail className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm text-emerald-700">Confirmation email sent successfully</span>
                        </div>
                    )}
                    {emailStatus.state === 'sent' && emailStatus.message !== 'success' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 space-y-1">
                            <div className="flex items-center justify-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-sm text-amber-700">Unable to send confirmation email</span>
                            </div>
                            {emailStatus.result?.details
                                ?.filter((d) => !d.isSuccess)
                                .map((d, i) => (
                                    <p key={i} className="text-xs text-amber-600 text-center">
                                        {d.email && <span>{d.email}: </span>}
                                        {d.errorMessage}
                                    </p>
                                ))}
                        </div>
                    )}
                    {emailStatus.state === 'failed' && (
                        <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm text-amber-700">Unable to send confirmation email</span>
                        </div>
                    )}
                </div>
            )}

            <p className="mt-5 text-xs text-slate-400">
                You can safely close this page.
            </p>
        </div>
    )
}

function AlreadyConfirmedCard({ data }: { data: ConfirmAttendanceItem }) {
    const schedule = data.trainingSchedule
    const course = schedule.courseObj

    return (
        <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-200">
                <AlertTriangle className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Already Confirmed</h1>
            <p className="text-slate-500 mb-6">
                Your attendance for this session has already been confirmed. No further action is needed.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <p className="text-sm font-semibold text-amber-800">{course.courseName}</p>
                <p className="text-xs text-amber-600 mt-1">
                    {formatDisplayDate(schedule.startDate)}
                </p>
                <p className="text-xs text-amber-600">{schedule.venue || schedule.trainingAttendanceTypeObj?.name || '-'}</p>
            </div>
            <p className="mt-6 text-xs text-slate-400">You can safely close this page.</p>
        </div>
    )
}

function ErrorCard({ title, message, icon }: { title: string; message: string; icon: React.ReactNode }) {
    return (
        <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-200">
                {icon}
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
            <p className="text-slate-500 mb-6">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700">
                    If you believe this is an error, please contact your training administrator or HR department for assistance.
                </p>
            </div>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="text-center py-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200">
                <Loader2 className="h-10 w-10 text-slate-400 animate-spin" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2">Verifying your attendance...</h2>
            <p className="text-sm text-slate-400">Please wait while we confirm your registration.</p>
        </div>
    )
}

// ─── Main Content (uses useSearchParams) ─────────────────────────────────────

function ConfirmAttendanceContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ConfirmAttendanceItem | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [emailStatus, setEmailStatus] = useState<EmailStatus | undefined>(undefined)
    const [attendanceTypeName, setAttendanceTypeName] = useState<string>('')

    useEffect(() => {
        if (!token) {
            setError('missing_token')
            setLoading(false)
            return
        }

        confirmAttendance(token)
            .then((res) => {
                if (res.message === 'success' && res.responseData?.length > 0) {
                    const item = res.responseData[0]
                    setData(item)

                    // Look up attendance type name from master data
                    getAttendanceTypesPublic()
                        .then((types) => {
                            const found = types.find((t) => t.id === item.trainingSchedule.trainingAttendanceTypeId)
                            setAttendanceTypeName(found?.name ?? '')
                        })
                        .catch(() => { /* silently fail */ })

                    setLoading(false)

                    // If newly confirmed, send the confirmation email asynchronously
                    if (item.confirmed) {
                        setEmailStatus({ state: 'sending' })
                        sendEmailConfirmedList({
                            scheduleId: item.trainingScheduleId,
                            staffIdList: [item.staffId],
                            subject: `Registration Confirmed - ${item.trainingSchedule.courseObj.courseName}`,
                            emailFrom: null,
                            emailCc: null,
                        })
                            .then(({ message, result }) => {
                                setEmailStatus({ state: 'sent', message, result })
                            })
                            .catch(() => {
                                setEmailStatus({ state: 'failed' })
                            })
                    }
                } else if (res.error) {
                    setError(res.error)
                    setLoading(false)
                } else {
                    setError('unknown')
                    setLoading(false)
                }
            })
            .catch((err) => {
                const status = err?.response?.status
                const serverError = err?.response?.data?.error || err?.response?.data?.message
                if (status === 400 || status === 401) {
                    setError(serverError || 'invalid_token')
                } else if (status === 410) {
                    setError('expired_token')
                } else {
                    setError(serverError || 'network_error')
                }
                setLoading(false)
            })
    }, [token])

    if (loading) return <LoadingState />

    // ── Error states ────────────────────────────────────
    if (error || !data) {
        const errorKey = error ?? 'unknown'

        if (errorKey === 'missing_token' || errorKey === 'invalid_token') {
            return (
                <ErrorCard
                    title="Invalid Link"
                    message="The confirmation link is invalid or malformed. Please check the link in your email and try again."
                    icon={<XCircle className="h-10 w-10 text-white" strokeWidth={2.5} />}
                />
            )
        }
        if (errorKey === 'expired_token') {
            return (
                <ErrorCard
                    title="Link Expired"
                    message="This confirmation link has expired. Please contact your training administrator to receive a new link."
                    icon={<Clock className="h-10 w-10 text-white" strokeWidth={2.5} />}
                />
            )
        }
        if (errorKey === 'network_error') {
            return (
                <ErrorCard
                    title="Connection Error"
                    message="Unable to reach the server. Please check your internet connection and try again."
                    icon={<ShieldAlert className="h-10 w-10 text-white" strokeWidth={2.5} />}
                />
            )
        }
        return (
            <ErrorCard
                title="Something Went Wrong"
                message={typeof errorKey === 'string' && errorKey !== 'unknown' ? errorKey : 'An unexpected error occurred. Please try again later.'}
                icon={<XCircle className="h-10 w-10 text-white" strokeWidth={2.5} />}
            />
        )
    }

    // ── Success states ──────────────────────────────────
    if (data.confirmed) {
        return <SuccessCard data={data} emailStatus={emailStatus} attendanceTypeName={attendanceTypeName} />
    } else {
        // confirmed === false means already confirmed previously
        return <AlreadyConfirmedCard data={data} />
    }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ConfirmAttendancePage() {
    return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary/3 to-transparent blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Image
                        src="/images/logo/logo.png"
                        alt="SAMS Engineering Maintenance System"
                        width={140}
                        height={56}
                        className="h-auto object-contain"
                        priority
                    />
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl shadow-slate-200/50 border border-white/60 p-8">
                    <Suspense fallback={<LoadingState />}>
                        <ConfirmAttendanceContent />
                    </Suspense>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    SAMS Engineering Maintenance System
                </p>
            </div>
        </div>
    )
}
