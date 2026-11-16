'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { usePathname, useSearchParams } from 'next/navigation'
import {
    AlertTriangle,
    Check,
    Clock,
    Copy,
    Headset,
    Mail,
    MessageCircle,
    Phone,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { RootState } from '@/store/rootReducer'
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'
import { getFirstViewableRoute } from '@/lib/api/permission/getFirstViewableRoute'
import { getLocaleFromPathname } from '@/lib/auth/resolveAuthRedirect'
import { IT_SUPPORT, hasAnyItSupportChannel } from '@/config/support'
import { useUserById } from '@/lib/api/hooks/useUserOperations'
import { useQAStaffList } from '@/lib/api/hooks/useQAStaffManagement'
import {
    useStaffDepartmentAmo145s,
    useStaffDepartmentPositionAmo145s,
} from '@/lib/api/master/organization-amo145.hooks'

/**
 * Department / position (regular and AMO 145) of the signed-in user, from the staff record
 * linked to their account (user.staffEmployeeId). Each lookup degrades to null on error,
 * e.g. when a role without permissions cannot read staff data.
 */
function useMyOrganization(userId: number) {
    const { data: userRes } = useUserById(userId, userId > 0)
    const employeeId = userRes?.responseData?.staffEmployeeId?.trim() || ''

    const { data: staffRes, isLoading: staffLoading } = useQAStaffList(
        {
            keyword: '',
            name: '',
            employeeId,
            staffDepartmentPositionId: 0,
            departmentId: 0,
            stationId: 0,
            staffstypeId: 0,
            isActive: true,
            sortBy: 'employeeId',
            sortDirection: 'asc',
            page: 1,
            perPage: 5,
        },
        !!employeeId
    )
    const staff = staffRes?.responseData?.find((s) => s.employeeId === employeeId) ?? null

    const { data: amoDeptRes } = useStaffDepartmentAmo145s()
    const { data: amoPosRes } = useStaffDepartmentPositionAmo145s()
    const amoPosition = staff?.isDepartmentAmo145 && staff.staffDepartmentPositionAmo145Id
        ? amoPosRes?.responseData?.find((p) => p.id === staff.staffDepartmentPositionAmo145Id) ?? null
        : null
    const amoDepartment = amoPosition?.staffDepartmentAmo145Id
        ? amoDeptRes?.responseData?.find((d) => d.id === amoPosition.staffDepartmentAmo145Id) ?? null
        : null

    return {
        loading: !!employeeId && staffLoading,
        department: staff?.departmentObj?.name || '',
        position: staff?.positionObj?.name || '',
        amoDepartment: amoDepartment?.name || '',
        amoPosition: amoPosition?.name || '',
    }
}

/** Only accept an in-app path for ?from= so the page never echoes arbitrary URLs. */
const safeFromPath = (value: string | null) =>
    value && value.startsWith('/') && !value.startsWith('//') ? value.slice(0, 200) : ''

/**
 * IT Support — contact page.
 *
 * Also the landing page for a signed-in user whose role has no viewable menu
 * (FALLBACK_ROUTE), and the target of "Contact IT Support" on the Access Denied screen.
 * Not in ROUTE_PERMISSION_MAP on purpose: it must stay reachable with zero permissions.
 */
function ItSupportContent() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const locale = getLocaleFromPathname(pathname)
    const fromPath = safeFromPath(searchParams.get('from'))

    const { user } = useReduxAuth()
    const permissions = useSelector((s: RootState) => s.permission.menus)
    const isPermLoaded = useSelector((s: RootState) => s.permission.isLoaded)
    const noAccess = isPermLoaded && getFirstViewableRoute(permissions) === null
    const org = useMyOrganization(Number(user?.id) || 0)

    // Timestamp is taken on the client only, to avoid a server/client mismatch
    const [requestedAt, setRequestedAt] = useState('')
    useEffect(() => {
        setRequestedAt(new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC')
    }, [])

    const reason = noAccess
        ? 'My account has no menu permissions assigned.'
        : fromPath
            ? `I need access to ${fromPath}.`
            : 'I need help with SAMS.'

    const details = useMemo(
        () =>
            [
                'SAMS Engineering Maintenance System — Access / Support Request',
                '',
                `Name: ${user?.fullName || '-'}`,
                `Username: ${user?.username || '-'}`,
                `Email: ${user?.email || '-'}`,
                `Role: ${user?.role || '-'}`,
                `Department: ${org.department || '-'}`,
                `Position: ${org.position || '-'}`,
                '',
                '--- AMO 145 ----',
                `Department: ${org.amoDepartment || '-'}`,
                `Position: ${org.amoPosition || '-'}`,
                '',
                `Requested page: ${fromPath || '-'}`,
                `Reason: ${reason}`,
                `Time: ${requestedAt || '-'}`,
            ].join('\n'),
        [user, org.department, org.position, org.amoDepartment, org.amoPosition, fromPath, reason, requestedAt]
    )

    const [copied, setCopied] = useState(false)
    const copyDetails = async () => {
        try {
            await navigator.clipboard.writeText(details)
            setCopied(true)
            toast.success('Request details copied')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Unable to copy. Please select the text and copy it manually.')
        }
    }

    const mailtoHref = IT_SUPPORT.email
        ? `mailto:${IT_SUPPORT.email}?subject=${encodeURIComponent(
            `SAMS access request - ${user?.username || user?.email || 'user'}`
        )}&body=${encodeURIComponent(details)}`
        : ''

    // Full reload so permissions are fetched again, then the root route sends the user to their landing page
    const checkAgain = () => window.location.assign(`/${locale}`)

    const channels = [
        IT_SUPPORT.email && {
            key: 'email',
            icon: <Mail className="h-4 w-4" />,
            iconClass: 'bg-blue-100 text-blue-600',
            label: 'Email',
            value: IT_SUPPORT.email,
            href: mailtoHref,
            action: 'Send email',
        },
        IT_SUPPORT.phone && {
            key: 'phone',
            icon: <Phone className="h-4 w-4" />,
            iconClass: 'bg-emerald-100 text-emerald-600',
            label: 'Phone',
            value: IT_SUPPORT.phone,
            href: `tel:${IT_SUPPORT.phone.replace(/[^\d+]/g, '')}`,
            action: 'Call',
        },
        IT_SUPPORT.line && {
            key: 'line',
            icon: <MessageCircle className="h-4 w-4" />,
            iconClass: 'bg-green-100 text-green-600',
            label: 'LINE',
            value: IT_SUPPORT.line,
            href: '',
            action: '',
        },
    ].filter(Boolean) as {
        key: string; icon: React.ReactNode; iconClass: string; label: string
        value: string; href: string; action: string
    }[]

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            {/* Hero */}
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Headset className="h-7 w-7" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-bold tracking-tight text-default-900">Contact IT Support</h1>
                        <p className="mt-1 text-sm text-default-500">
                            Need access to a page or help with your account? Send the details below to the IT team.
                        </p>
                    </div>
                    {noAccess && (
                        <Button size="sm" variant="outline" onClick={checkAgain} className="shrink-0">
                            <RefreshCw className="mr-1.5 h-4 w-4" /> Check again
                        </Button>
                    )}
                </div>

                {noAccess && (
                    <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                            <p className="font-semibold">Your account has no access yet</p>
                            <p className="mt-0.5 text-amber-700">
                                You are signed in, but your role does not have permission to any menu.
                                Ask IT Support to assign permissions, then click <span className="font-medium">Check again</span>.
                            </p>
                        </div>
                    </div>
                )}

                {!noAccess && fromPath && (
                    <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            You don&apos;t have permission to open <span className="font-mono font-medium">{fromPath}</span>.
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                {/* Contact channels */}
                <div className="space-y-3 lg:col-span-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-default-500">Contact Channels</h2>

                    {channels.length > 0 ? (
                        channels.map((c) => (
                            <div key={c.key} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.iconClass}`}>
                                    {c.icon}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-default-400">{c.label}</p>
                                    <p className="truncate text-sm font-semibold text-default-900" title={c.value}>{c.value}</p>
                                </div>
                                {c.href && (
                                    <Button asChild size="sm" variant="outline" className="shrink-0">
                                        <a href={c.href}>{c.action}</a>
                                    </Button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-card p-4 text-sm text-default-600">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <p>
                                IT Support contact details have not been set up yet. Please contact your system
                                administrator and share the request details on the right.
                            </p>
                        </div>
                    )}

                    {IT_SUPPORT.hours && hasAnyItSupportChannel() && (
                        <div className="flex items-center gap-2 px-1 text-xs text-default-500">
                            <Clock className="h-3.5 w-3.5" /> Service hours: {IT_SUPPORT.hours}
                        </div>
                    )}
                </div>

                {/* Request details */}
                <div className="lg:col-span-3">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-default-500">Your Request Details</h2>
                        <Button size="sm" variant="outline" onClick={copyDetails}>
                            {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-600" /> : <Copy className="mr-1.5 h-4 w-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                    <pre className="whitespace-pre-wrap break-words rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-default-700">
                        {details}
                    </pre>
                    <ul className="mt-3 space-y-1.5 px-1 text-xs text-default-500">
                        <li>• Paste these details into your email or chat so IT can find your account quickly.</li>
                        <li>• Tell IT which menu or task you need, e.g. &quot;View Flight List&quot; or &quot;Edit Staff profile&quot;.</li>
                        <li>• After IT updates your role, sign out and sign in again, or click Check again.</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default function ItSupportPage() {
    // useSearchParams needs a Suspense boundary
    return (
        <Suspense fallback={null}>
            <ItSupportContent />
        </Suspense>
    )
}
