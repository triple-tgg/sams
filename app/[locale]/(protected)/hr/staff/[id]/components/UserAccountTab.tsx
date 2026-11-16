'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, KeyRound, Loader2, Lock, ShieldCheck, UserPlus, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CollapsibleCard } from './CollapsibleCard'
import { CreateUserAccountDialog } from './CreateUserAccountDialog'
import type { StaffData } from '../types'
import type { StaffByIdData } from '@/lib/api/qa/staff-management'
import { useUserById } from '@/lib/api/hooks/useUserOperations'
import { ChangePasswordForm } from '@/components/partials/auth/ChangePasswordForm'
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'
import { MENU } from '@/lib/permission-codes'
import { useMenuPermission } from '@/hooks/use-menu-permission'

const formatDateTime = (value?: string | null) =>
    value
        ? new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-'

/** Staff profile → User Account: create a login for this staff member, or view it and change its password. */
export function UserAccountTab({ staff, apiData }: { staff: StaffData; apiData?: StaffByIdData }) {
    // Account management is governed by the User master-data permission, not HR_STAFF
    const userPerm = useMenuPermission(MENU.MASTER_DATA_USER_LOGIN)
    const { user: currentUser } = useReduxAuth()
    const queryClient = useQueryClient()

    const hasAccount = !!apiData?.isUser && !!apiData?.userId
    const userId = apiData?.userId ?? 0
    const isOwnAccount = !!currentUser?.id && currentUser.id === userId

    const { data: userRes, isLoading: userLoading, isError: userError } = useUserById(userId, hasAccount && (userPerm.canView || isOwnAccount))
    const account = userRes?.responseData

    // ── Create account (checks the email first, see CreateUserAccountDialog) ──
    const [createOpen, setCreateOpen] = useState(false)
    // Refresh isUser / userId on the staff record
    const refreshStaff = () => queryClient.invalidateQueries({ queryKey: ['qa-staff-detail', apiData?.id] })

    // ── Change password ──
    // POST /user/change-password acts on the signed-in user (token) and needs the current
    // password, so it only works on your own account. Admins reset other users' passwords
    // from Master Data › User Login instead.
    const canChangePassword = isOwnAccount

    // ── No account yet ──
    if (!hasAccount) {
        return (
            <>
                <CollapsibleCard
                    icon={<UserRound className="h-4 w-4" />}
                    iconClassName="bg-blue-100 text-blue-600"
                    title="User Account"
                    collapsibleOn="always"
                    defaultOpen
                >
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <UserPlus className="h-6 w-6" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">No user account yet</p>
                            <p className="mt-1 text-xs text-slate-500">
                                {staff.name} cannot sign in to the system until an account is created.
                            </p>
                        </div>
                        {userPerm.canCreate ? (
                            <Button size="sm" onClick={() => setCreateOpen(true)} className="mt-1">
                                <UserPlus className="mr-1.5 h-4 w-4" /> Create User Account
                            </Button>
                        ) : (
                            <p className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Lock className="h-3.5 w-3.5" /> You do not have permission to create user accounts.
                            </p>
                        )}
                    </div>
                </CollapsibleCard>

                <CreateUserAccountDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    staffName={apiData?.fullNameEn || staff.name || ''}
                    employeeId={apiData?.employeeId || staff.empId || ''}
                    defaultEmail={apiData?.email || ''}
                    defaultFullName={apiData?.fullNameEn || staff.name || ''}
                    canLink={userPerm.canEdit}
                    onDone={refreshStaff}
                />
            </>
        )
    }

    // ── Has account ──
    const infoRows: { label: string; value: React.ReactNode }[] = [
        { label: 'Username', value: account?.username || '-' },
        { label: 'Email', value: account?.email || '-' },
        { label: 'Full Name', value: account?.fullName || '-' },
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
        { label: 'Created', value: account ? `${formatDateTime(account.createdDate)} by ${account.createdBy || '-'}` : '-' },
        { label: 'Last Updated', value: account ? `${formatDateTime(account.updatedDate)} by ${account.updatedBy || '-'}` : '-' },
    ]

    return (
        <div className="grid grid-cols-1 gap-x-4 xl:grid-cols-2">
            {/* Account details */}
            <CollapsibleCard
                icon={<ShieldCheck className="h-4 w-4" />}
                iconClassName="bg-blue-100 text-blue-600"
                title="User Account"
                collapsibleOn="always"
                defaultOpen
                className="min-w-0"
            >
                {!userPerm.canView && !isOwnAccount ? (
                    <p className="flex items-center gap-1.5 py-6 text-xs text-slate-500">
                        <Lock className="h-3.5 w-3.5" /> This staff member has a user account. You do not have permission to view its details.
                    </p>
                ) : userLoading ? (
                    <div className="flex items-center gap-2 py-6 text-xs text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading account…
                    </div>
                ) : userError || !account ? (
                    <p className="flex items-center gap-1.5 py-6 text-xs text-red-500">
                        <AlertCircle className="h-3.5 w-3.5" /> Unable to load the user account.
                    </p>
                ) : (
                    <dl className="divide-y divide-slate-100">
                        {infoRows.map((row) => (
                            <div key={row.label} className="grid grid-cols-[130px_1fr] gap-3 py-2.5 text-sm">
                                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{row.label}</dt>
                                <dd className="min-w-0 break-words text-slate-800">{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </CollapsibleCard>

            {/* Change password */}
            <CollapsibleCard
                icon={<KeyRound className="h-4 w-4" />}
                iconClassName="bg-amber-100 text-amber-600"
                title="Change Password"
                collapsibleOn="always"
                defaultOpen
                className="min-w-0"
            >
                {!canChangePassword ? (
                    <p className="flex items-start gap-1.5 py-6 text-xs text-slate-500">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {userPerm.canEdit
                            ? 'Only the account owner can change their password here. To reset it, edit the user in Master Data › User Login.'
                            : 'Only the account owner can change this password.'}
                    </p>
                ) : (
                    <ChangePasswordForm idPrefix="staff-password" />
                )}
            </CollapsibleCard>
        </div>
    )
}
