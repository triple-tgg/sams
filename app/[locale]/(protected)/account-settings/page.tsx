'use client'

import { AlertCircle, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'
import { useUserById } from '@/lib/api/hooks/useUserOperations'
import { ChangePasswordForm } from '@/components/partials/auth/ChangePasswordForm'

const formatDateTime = (value?: string | null) =>
    value
        ? new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-'

/**
 * Account Settings — the signed-in user's own account details and password change.
 * Opened from the header profile menu. Not in ROUTE_PERMISSION_MAP on purpose:
 * every signed-in user may manage their own account.
 */
export default function AccountSettingsPage() {
    const { user } = useReduxAuth()
    const userId = Number(user?.id) || 0
    const { data: userRes, isLoading, isError } = useUserById(userId, userId > 0)
    const account = userRes?.responseData

    const rows: { label: string; value: React.ReactNode }[] = [
        { label: 'Username', value: account?.username || user?.username || '-' },
        { label: 'Email', value: account?.email || user?.email || '-' },
        { label: 'Full Name', value: account?.fullName || user?.fullName || '-' },
        { label: 'Role', value: account?.roleObj?.name || '-' },
        {
            label: 'Status',
            value: account ? (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${account.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {account.isActive ? 'Active' : 'Inactive'}
                </span>
            ) : '-',
        },
        {
            label: 'Account Type',
            value: account ? (account.flagInternal ? `Internal Staff · ${account.staffEmployeeId || '-'}` : 'External') : '-',
        },
        { label: 'Last Updated', value: account ? `${formatDateTime(account.updatedDate)} by ${account.updatedBy || '-'}` : '-' },
    ]

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-default-900">Account Settings</h1>
                <p className="mt-0.5 text-sm text-default-500">Manage your account details and password.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <Card className="min-w-0">
                    <CardHeader className="flex-row items-center gap-2 border-b border-border py-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                            <ShieldCheck className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-semibold">My Account</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {isLoading ? (
                            <div className="flex items-center gap-2 py-6 text-xs text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading account…
                            </div>
                        ) : (
                            <>
                                {(isError || !account) && (
                                    <p className="mb-2 flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Unable to load all account details. Showing what is available from your session.
                                    </p>
                                )}
                                <dl className="divide-y divide-slate-100">
                                    {rows.map((row) => (
                                        <div key={row.label} className="grid grid-cols-[130px_1fr] gap-3 py-2.5 text-sm">
                                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{row.label}</dt>
                                            <dd className="min-w-0 break-words text-slate-800">{row.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="min-w-0">
                    <CardHeader className="flex-row items-center gap-2 border-b border-border py-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                            <KeyRound className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ChangePasswordForm idPrefix="account-password" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
