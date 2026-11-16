'use client'

import { useState } from 'react'
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangePassword } from '@/lib/api/hooks/useUserOperations'
import {
    PasswordRequirements,
    isPasswordValid,
    validatePassword,
} from '@/app/[locale]/(protected)/master-data/user-login/components/UserFormDialog'

interface PasswordFieldProps {
    id: string
    label: string
    placeholder: string
    autoComplete: 'current-password' | 'new-password'
    value: string
    onChange: (value: string) => void
    disabled: boolean
}

function PasswordField({ id, label, placeholder, autoComplete, value, onChange, disabled }: PasswordFieldProps) {
    const [visible, setVisible] = useState(false)
    return (
        <>
            <Label htmlFor={id}>
                {label} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="pr-10"
                />
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setVisible((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </>
    )
}

/**
 * Change the signed-in user's own password (POST /user/change-password).
 * The API identifies the account from the access token, so only render this for the
 * current user's own account.
 */
export function ChangePasswordForm({ idPrefix = 'change-password' }: { idPrefix?: string }) {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const { mutate: changePassword, isPending: isChanging } = useChangePassword()

    const validation = validatePassword(newPassword)
    const complexityOk = isPasswordValid(validation)
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
    const sameAsCurrent = newPassword.length > 0 && newPassword === currentPassword
    const canSubmit = currentPassword.length > 0 && complexityOk && passwordsMatch && !sameAsCurrent && !isChanging

    const clearForm = () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return
        changePassword(
            { currentPassword, newPassword },
            {
                onSuccess: (res) => {
                    if (res.message === 'success') {
                        toast.success('Password changed successfully')
                        clearForm()
                    } else {
                        toast.error(res.error || 'Failed to change password')
                    }
                },
                onError: (err) => toast.error(err.message || 'Failed to change password'),
            }
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <PasswordField
                    id={`${idPrefix}-current`}
                    label="Current Password"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    disabled={isChanging}
                />
            </div>

            <div className="space-y-1">
                <PasswordField
                    id={`${idPrefix}-new`}
                    label="New Password"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={setNewPassword}
                    disabled={isChanging}
                />
                <PasswordRequirements validation={validation} show={newPassword.length > 0} />
                {sameAsCurrent && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> New password must be different from the current password
                    </p>
                )}
            </div>

            <div className="space-y-1">
                <PasswordField
                    id={`${idPrefix}-confirm`}
                    label="Confirm New Password"
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    disabled={isChanging}
                />
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
                    disabled={isChanging || (!currentPassword && !newPassword && !confirmPassword)}
                    onClick={clearForm}
                >
                    Clear
                </Button>
                <Button type="submit" size="sm" disabled={!canSubmit}>
                    {isChanging ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...</> : 'Change Password'}
                </Button>
            </div>
        </form>
    )
}

export default ChangePasswordForm
