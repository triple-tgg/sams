'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, Link2, Loader2, Lock, Mail, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import UserFormDialog from '@/app/[locale]/(protected)/master-data/user-login/components/UserFormDialog'
import { useCheckUserEmail, useUpsertUser } from '@/lib/api/hooks/useUserOperations'
import type { UserItem } from '@/lib/api/master/users/users.interface'
import type { UserCheckResult } from '@/lib/api/master/users/userCheck'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Step = 'loading' | 'check' | 'result' | 'form'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    staffName: string
    employeeId: string
    defaultEmail: string
    defaultFullName: string
    /** MASTER_DATA_USER_LOGIN canEdit: linking updates an existing account. */
    canLink: boolean
    /** Called after an account is created or linked, to refresh the staff record. */
    onDone: () => void
}

/**
 * Create User Account from a staff profile. Opening it checks the staff email right away
 * (the email step is shown only when the staff has no valid email, the check fails,
 * or the user chooses a different email):
 * - no account uses it         → Add New User form (email locked)
 * - account without a staff link → link it (set Internal Staff + this Employee ID)
 * - account linked to a staff  → warn and ask to check the email
 */
export function CreateUserAccountDialog({
    open, onOpenChange, staffName, employeeId, defaultEmail, defaultFullName, canLink, onDone,
}: Props) {
    const [step, setStep] = useState<Step>('check')
    const [email, setEmail] = useState(defaultEmail)
    const [emailError, setEmailError] = useState('')
    const [result, setResult] = useState<UserCheckResult | null>(null)

    const { mutate: checkEmail, isPending: isChecking } = useCheckUserEmail()
    const { mutate: upsertUser, isPending: isSaving } = useUpsertUser()
    const busy = isChecking || isSaving

    const close = () => !busy && onOpenChange(false)

    const runCheck = (value: string) => {
        setEmailError('')
        checkEmail(
            { email: value, employeeID: employeeId },
            {
                onSuccess: (res) => {
                    setEmail(value)
                    setResult(res)
                    setStep(res.status === 'available' ? 'form' : 'result')
                },
                onError: (err) => {
                    toast.error(err.message || 'Failed to check email')
                    setStep('check')
                },
            }
        )
    }

    // Every time the dialog opens: check the staff email immediately; ask for one only if it is missing
    useEffect(() => {
        if (!open) return
        const value = defaultEmail.trim()
        setEmail(value)
        setEmailError('')
        setResult(null)
        if (EMAIL_RE.test(value) && employeeId) {
            setStep('loading')
            runCheck(value)
        } else {
            setStep('check')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const handleCheck = (e?: React.FormEvent) => {
        e?.preventDefault()
        const value = email.trim()
        if (!EMAIL_RE.test(value)) {
            setEmailError('Enter a valid email address.')
            return
        }
        runCheck(value)
    }

    const finish = (message: string) => {
        toast.success(message)
        onOpenChange(false)
        onDone()
    }

    /** Link an existing account: only flagInternal and staffEmployeeId change. Empty password keeps the current one. */
    const handleLink = (user: UserItem) => {
        const roleId = user.roleObj?.id
        if (!roleId) {
            toast.error('This account has no role. Assign a role in Master Data › User Login first.')
            return
        }
        upsertUser(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                passwordData: '',
                fullName: user.fullName,
                roleId,
                isActive: user.isActive,
                flagInternal: true,
                staffEmployeeId: employeeId,
            },
            {
                onSuccess: (res) => {
                    if (res.message === 'success') finish(`Account linked to ${staffName}`)
                    else toast.error(res.error || 'Failed to link account')
                },
                onError: (err) => toast.error(err.message || 'Failed to link account'),
            }
        )
    }

    const handleCreate = (form: {
        username: string; email: string; passwordData: string; fullName: string
        role: string; isActive: boolean
    }) => {
        upsertUser(
            {
                id: 0,
                username: form.username,
                email: email.trim(),
                passwordData: form.passwordData,
                fullName: form.fullName,
                roleId: parseInt(form.role, 10),
                isActive: form.isActive,
                // Always linked to this staff member
                flagInternal: true,
                staffEmployeeId: employeeId,
            },
            {
                onSuccess: (res) => {
                    if (res.message === 'success') finish('User account created successfully')
                    else toast.error(res.error || 'Failed to create user account')
                },
                onError: (err) => toast.error(err.message || 'Failed to create user account'),
            }
        )
    }

    const backToEmail = () => {
        setStep('check')
        setResult(null)
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && close()}>
            <DialogContent
                size="md"
                className={step === 'form' ? 'max-w-4xl p-0 gap-0' : 'max-w-lg p-0 gap-0'}
                onInteractOutside={(e) => e.preventDefault()}
            >
                {step === 'loading' ? (
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Create User Account</DialogTitle>
                            <DialogDescription>Checking the email for an existing account.</DialogDescription>
                        </DialogHeader>
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Checking email…</p>
                            <p className="mt-1 text-xs text-slate-500">
                                Looking for an existing account with <span className="font-medium text-slate-700">{email}</span>
                            </p>
                        </div>
                    </div>
                ) : step === 'form' ? (
                    <UserFormDialog
                        mode="add"
                        defaults={{
                            username: employeeId,
                            email: email.trim(),
                            fullName: defaultFullName,
                            flagInternal: true,
                            staffEmployeeId: employeeId,
                        }}
                        lockStaffLink
                        lockEmail
                        isPending={isSaving}
                        onClose={close}
                        onSubmit={handleCreate}
                    />
                ) : step === 'check' ? (
                    <form onSubmit={handleCheck}>
                        <DialogHeader className="border-b border-border px-6 pb-4 pt-5">
                            <DialogTitle>Create User Account</DialogTitle>
                            <DialogDescription>
                                Check the email first so the same person does not end up with two accounts.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 px-6 py-5">
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                                <span className="min-w-0 truncate font-medium text-slate-800">{staffName}</span>
                                <span className="shrink-0 rounded-md bg-white px-2 py-0.5 font-mono text-xs text-slate-600 ring-1 ring-slate-200">
                                    {employeeId || '-'}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-account-email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="create-account-email"
                                        type="email"
                                        autoFocus
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                                        placeholder="e.g. john@example.com"
                                        className="pl-9"
                                        disabled={isChecking}
                                        aria-invalid={!!emailError}
                                    />
                                </div>
                                {emailError ? (
                                    <p className="text-xs text-destructive">{emailError}</p>
                                ) : (
                                    <p className="text-xs text-slate-500">
                                        If an account already uses this email, you can link it to this staff member instead.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                            <Button type="button" variant="outline" onClick={close} disabled={isChecking}>Cancel</Button>
                            <Button type="submit" disabled={isChecking || !email.trim() || !employeeId}>
                                {isChecking
                                    ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Checking…</>
                                    : <><Search className="mr-1.5 h-4 w-4" /> Check Email</>}
                            </Button>
                        </div>
                    </form>
                ) : result?.user ? (
                    <CheckResultView
                        result={result as UserCheckResult & { user: UserItem }}
                        staffName={staffName}
                        employeeId={employeeId}
                        canLink={canLink}
                        isSaving={isSaving}
                        onBack={backToEmail}
                        onClose={close}
                        onLink={handleLink}
                        onRefresh={() => { onOpenChange(false); onDone() }}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

function CheckResultView({
    result, staffName, employeeId, canLink, isSaving, onBack, onClose, onLink, onRefresh,
}: {
    result: UserCheckResult & { user: UserItem }
    staffName: string
    employeeId: string
    canLink: boolean
    isSaving: boolean
    onBack: () => void
    onClose: () => void
    onLink: (user: UserItem) => void
    onRefresh: () => void
}) {
    const { status, user } = result

    const notice = {
        unlinked: {
            icon: <Link2 className="h-5 w-5" />,
            tone: 'border-blue-200 bg-blue-50 text-blue-800',
            iconTone: 'bg-blue-100 text-blue-600',
            title: 'Existing account found',
            body: `An account already uses this email and is not linked to any staff member. Link it to ${staffName} instead of creating a new account.`,
        },
        'linked-other': {
            icon: <AlertTriangle className="h-5 w-5" />,
            tone: 'border-amber-200 bg-amber-50 text-amber-800',
            iconTone: 'bg-amber-100 text-amber-600',
            title: 'Email already in use',
            body: `This email belongs to an account linked to another staff member (Employee ID ${user.staffEmployeeId}). Check the email address and try again.`,
        },
        'linked-self': {
            icon: <CheckCircle2 className="h-5 w-5" />,
            tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
            iconTone: 'bg-emerald-100 text-emerald-600',
            title: 'Account already linked',
            body: `This account is already linked to ${staffName}. Refresh to show it.`,
        },
        available: null,
    }[status]

    if (!notice) return null

    const rows: { label: string; value: React.ReactNode }[] = [
        { label: 'Username', value: user.username || '-' },
        { label: 'Email', value: user.email || '-' },
        { label: 'Full Name', value: user.fullName || '-' },
        { label: 'Role', value: user.roleObj?.name || '-' },
        {
            label: 'Status',
            value: (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            label: 'Account Type',
            value: user.staffEmployeeId
                ? `Internal Staff · ${user.staffEmployeeId}`
                : user.flagInternal ? 'Internal Staff · not linked' : 'External',
        },
    ]

    return (
        <div>
            <DialogHeader className="border-b border-border px-6 pb-4 pt-5">
                <DialogTitle>Create User Account</DialogTitle>
                <DialogDescription>Result of the email check for {staffName}.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
                <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${notice.tone}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${notice.iconTone}`}>{notice.icon}</span>
                    <div>
                        <p className="font-semibold">{notice.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed opacity-90">{notice.body}</p>
                    </div>
                </div>

                <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-4">
                    {rows.map((row) => (
                        <div key={row.label} className="grid grid-cols-[110px_1fr] gap-3 py-2 text-sm">
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{row.label}</dt>
                            <dd className="min-w-0 break-words text-slate-800">{row.value}</dd>
                        </div>
                    ))}
                </dl>

                {status === 'unlinked' && (
                    <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
                        <p className="font-semibold text-slate-700">Linking will update</p>
                        <ul className="mt-1 space-y-0.5">
                            <li>• Account Type: <span className="font-medium text-slate-800">Internal Staff</span></li>
                            <li>• Staff Employee: <span className="font-mono font-medium text-slate-800">{employeeId}</span></li>
                        </ul>
                        <p className="mt-1.5">Username, password and role stay the same.</p>
                    </div>
                )}

                {status === 'unlinked' && !canLink && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Lock className="h-3.5 w-3.5" /> You do not have permission to edit user accounts.
                    </p>
                )}
            </div>

            <div className="flex justify-between gap-2 border-t border-border px-6 py-4">
                <Button type="button" variant="ghost" onClick={onBack} disabled={isSaving}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    {status === 'linked-other' ? 'Use a Different Email' : 'Back'}
                </Button>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                        {status === 'unlinked' ? 'Cancel' : 'Close'}
                    </Button>
                    {status === 'unlinked' && (
                        <Button type="button" onClick={() => onLink(user)} disabled={isSaving || !canLink}>
                            {isSaving
                                ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Linking…</>
                                : <><Link2 className="mr-1.5 h-4 w-4" /> Link Account</>}
                        </Button>
                    )}
                    {status === 'linked-self' && (
                        <Button type="button" onClick={onRefresh}>
                            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
