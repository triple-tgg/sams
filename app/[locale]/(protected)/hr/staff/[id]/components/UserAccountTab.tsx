'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Check, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck, UserPlus, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CollapsibleCard } from './CollapsibleCard'
import type { StaffData } from '../types'
import type { StaffByIdData } from '@/lib/api/qa/staff-management'
import { useUpsertUser, useUserById } from '@/lib/api/hooks/useUserOperations'
import { changeUserPassword, CHANGE_PASSWORD_API_READY } from '@/lib/api/master/users/userOperations'
import UserFormDialog, {
    PasswordRequirements,
    isPasswordValid,
    validatePassword,
} from '@/app/[locale]/(protected)/master-data/user-login/components/UserFormDialog'
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

    // ── Create account ──
    const [createOpen, setCreateOpen] = useState(false)
    const { mutate: upsertUser, isPending: isCreating } = useUpsertUser()

    const handleCreate = (form: {
        username: string; email: string; passwordData: string; fullName: string
        role: string; isActive: boolean; flagInternal: boolean; staffEmployeeId: string
    }) => {
        upsertUser(
            {
                id: 0,
                username: form.username,
                email: form.email,
                passwordData: form.passwordData,
                fullName: form.fullName,
                roleId: parseInt(form.role, 10),
                isActive: form.isActive,
                // Always linked to this staff member
                flagInternal: true,
                staffEmployeeId: apiData?.employeeId || staff.empId,
            },
            {
                onSuccess: (res) => {
                    if (res.message === 'success') {
                        toast.success('User account created successfully')
                        setCreateOpen(false)
                        // Refresh isUser / userId on the staff record
                        queryClient.invalidateQueries({ queryKey: ['qa-staff-detail', apiData?.id] })
                    } else {
                        toast.error(res.error || 'Failed to create user account')
                    }
                },
                onError: (err) => toast.error(err.message || 'Failed to create user account'),
            }
        )
    }

    // ── Change password ──
    const canChangePassword = userPerm.canEdit || isOwnAccount
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [isChanging, setIsChanging] = useState(false)
    const validation = validatePassword(newPassword)
    const complexityOk = isPasswordValid(validation)
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
    const canSubmitPassword = CHANGE_PASSWORD_API_READY && complexityOk && passwordsMatch && !isChanging

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmitPassword) return
        setIsChanging(true)
        try {
            const res = await changeUserPassword({ userId, newPassword })
            if (res.message === 'success') {
                toast.success('Password changed successfully')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                toast.error(res.error || 'Failed to change password')
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to change password')
        } finally {
            setIsChanging(false)
        }
    }

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

                <Dialog open={createOpen} onOpenChange={(open) => !open && !isCreating && setCreateOpen(false)}>
                    <DialogContent size="md" className="max-w-4xl p-0 gap-0" onInteractOutside={(e) => e.preventDefault()}>
                        <UserFormDialog
                            mode="add"
                            defaults={{
                                username: apiData?.employeeId || staff.empId || '',
                                email: apiData?.email || '',
                                fullName: apiData?.fullNameEn || staff.name || '',
                                flagInternal: true,
                                staffEmployeeId: apiData?.employeeId || staff.empId || '',
                            }}
                            lockStaffLink
                            isPending={isCreating}
                            onClose={() => setCreateOpen(false)}
                            onSubmit={(data) => handleCreate(data)}
                        />
                    </DialogContent>
                </Dialog>
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
                    <p className="flex items-center gap-1.5 py-6 text-xs text-slate-500">
                        <Lock className="h-3.5 w-3.5" /> You do not have permission to change this password.
                    </p>
                ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        {!CHANGE_PASSWORD_API_READY && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                Password change is not available yet — the service is being updated.
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label htmlFor="staff-new-password">
                                New Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="staff-new-password"
                                    type={showNew ? 'text' : 'password'}
                                    placeholder="Enter new password"
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isChanging}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowNew((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showNew ? 'Hide password' : 'Show password'}
                                >
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <PasswordRequirements validation={validation} show={newPassword.length > 0} />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="staff-confirm-password">
                                Confirm New Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="staff-confirm-password"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Re-enter new password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isChanging}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && (
                                <p className={`flex items-center gap-1 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                                    {passwordsMatch
                                        ? <><Check className="h-3 w-3" /> Passwords match</>
                                        : <><AlertCircle className="h-3 w-3" /> Passwords do not match</>}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isChanging || (!newPassword && !confirmPassword)}
                                onClick={() => { setNewPassword(''); setConfirmPassword('') }}
                            >
                                Clear
                            </Button>
                            <Button type="submit" size="sm" disabled={!canSubmitPassword}>
                                {isChanging ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...</> : 'Change Password'}
                            </Button>
                        </div>
                    </form>
                )}
            </CollapsibleCard>
        </div>
    )
}
