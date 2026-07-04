'use client'

import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Clock, CalendarDays, MapPin, Loader2, ShieldAlert, ArrowLeft } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type ConfirmResult =
    | { status: 'success'; session: SessionInfo }
    | { status: 'already_confirmed'; session: SessionInfo }
    | { status: 'invalid_token' }
    | { status: 'expired_token' }
    | { status: 'session_cancelled' }
    | { status: 'session_full' }

interface SessionInfo {
    courseName: string
    courseCode: string
    dateStart: string
    dateEnd: string
    timeStart: string
    timeEnd: string
    venue: string
    instructor: string
}

// ─── Mock API ───────────────────────────────────────────────────────────────

async function mockConfirmAttendance(token: string | null, sessionId: string | null, staffId: string | null): Promise<ConfirmResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock validation
    if (!token || !sessionId || !staffId) {
        return { status: 'invalid_token' }
    }

    const mockSession: SessionInfo = {
        courseName: 'Electrical Wiring Interconnection System (EWIS)',
        courseCode: 'SP-EWIS',
        dateStart: '2026-04-14',
        dateEnd: '2026-04-16',
        timeStart: '08:00',
        timeEnd: '17:00',
        venue: 'Hangar 1 – Classroom A',
        instructor: 'Eng. Priya N.',
    }

    // Simulate different outcomes based on token value
    if (token === 'expired') return { status: 'expired_token' }
    if (token === 'cancelled') return { status: 'session_cancelled' }
    if (token === 'full') return { status: 'session_full' }
    if (token === 'duplicate') return { status: 'already_confirmed', session: mockSession }

    // Default: success
    return { status: 'success', session: mockSession }
}

// ─── Date Formatter ─────────────────────────────────────────────────────────

function formatDisplayDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Status Cards ───────────────────────────────────────────────────────────

function SuccessCard({ session }: { session: SessionInfo }) {
    return (
        <div className="text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200">
                <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Attendance Confirmed!</h1>
            <p className="text-slate-500 mb-8">
                Your attendance has been successfully registered. See you at the training session.
            </p>

            {/* Session Details Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5 text-left space-y-3">
                <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Course</p>
                        <p className="text-sm font-semibold text-slate-800">{session.courseName}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {session.courseCode}
                        </span>
                    </div>
                </div>
                <div className="border-t border-slate-200" />
                <div className="flex items-center gap-3">
                    <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Clock className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date & Time</p>
                        <p className="text-sm font-semibold text-slate-800">
                            {formatDisplayDate(session.dateStart)}
                            {session.dateEnd !== session.dateStart && ` — ${formatDisplayDate(session.dateEnd)}`}
                        </p>
                        <p className="text-xs text-slate-500">{session.timeStart} – {session.timeEnd}</p>
                    </div>
                </div>
                <div className="border-t border-slate-200" />
                <div className="flex items-center gap-3">
                    <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Venue</p>
                        <p className="text-sm font-semibold text-slate-800">{session.venue}</p>
                    </div>
                </div>
            </div>

            <p className="mt-6 text-xs text-slate-400">
                A confirmation email has been sent to you. You can safely close this page.
            </p>
        </div>
    )
}

function AlreadyConfirmedCard({ session }: { session: SessionInfo }) {
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
                <p className="text-sm font-semibold text-amber-800">{session.courseName}</p>
                <p className="text-xs text-amber-600 mt-1">
                    {formatDisplayDate(session.dateStart)} · {session.timeStart} – {session.timeEnd}
                </p>
                <p className="text-xs text-amber-600">{session.venue}</p>
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
    const sessionId = searchParams.get('session')
    const staffId = searchParams.get('staff')

    const [loading, setLoading] = useState(true)
    const [result, setResult] = useState<ConfirmResult | null>(null)

    useEffect(() => {
        mockConfirmAttendance(token, sessionId, staffId).then((res) => {
            setResult(res)
            setLoading(false)
        })
    }, [token, sessionId, staffId])

    if (loading) return <LoadingState />

    if (!result) return null

    switch (result.status) {
        case 'success':
            return <SuccessCard session={result.session} />
        case 'already_confirmed':
            return <AlreadyConfirmedCard session={result.session} />
        case 'invalid_token':
            return (
                <ErrorCard
                    title="Invalid Link"
                    message="The confirmation link is invalid or malformed. Please check the link in your email and try again."
                    icon={<XCircle className="h-10 w-10 text-white" strokeWidth={2.5} />}
                />
            )
        case 'expired_token':
            return (
                <ErrorCard
                    title="Link Expired"
                    message="This confirmation link has expired. Please contact your training administrator to receive a new link."
                    icon={<Clock className="h-10 w-10 text-white" strokeWidth={2.5} />}
                />
            )
        case 'session_cancelled':
            return (
                <ErrorCard
                    title="Session Cancelled"
                    message="This training session has been cancelled. No further action is required."
                    icon={<ShieldAlert className="h-10 w-10 text-white" strokeWidth={2.5} />}
                />
            )
        case 'session_full':
            return (
                <ErrorCard
                    title="Session Full"
                    message="This training session has reached maximum capacity. Please contact your training administrator for alternative sessions."
                    icon={<AlertTriangle className="h-10 w-10 text-white" strokeWidth={2.5} />}
                />
            )
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
                        alt="SAM Airline Maintenance"
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
                    SAM Airline Maintenance Training System
                </p>
            </div>
        </div>
    )
}
