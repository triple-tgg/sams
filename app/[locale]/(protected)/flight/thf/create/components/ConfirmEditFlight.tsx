"use client";

import { Button } from '@/components/ui/button'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCanEditLogin } from '@/lib/api/hooks/useCanEditLogin'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'
import Image from "next/image";

type Props = {
    onClose: () => void
    onConfirm: () => void
    setUserConfirm: (value: string) => void
}

const ConfirmEditFlight = ({ onClose, onConfirm, setUserConfirm }: Props) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    const { mutate: verifyLogin, isPending } = useCanEditLogin()

    const handleConfirm = () => {
        // Validate inputs
        if (!email.trim()) {
            setError('Email is required')
            return
        }
        if (!password.trim()) {
            setError('Password is required')
            return
        }

        setError(null)

        // Call API to verify credentials
        verifyLogin(
            { email: email.trim(), password: password.trim() },
            {
                onSuccess: (data) => {
                    if (data.message === 'success' && data.responseData) {
                        // Set the userName and proceed
                        setUserConfirm(data.responseData.userName)
                        toast.success(`Verified as ${data.responseData.fullName}`)
                        onConfirm()
                    } else {
                        setError(data.error || 'Verification failed')
                    }
                },
                onError: (err) => {
                    setError(err.message || 'Username or Password not correct.')
                }
            }
        )
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isPending) {
            e.preventDefault()
            handleConfirm()
        }
    }

    return (
        <div className="w-[500px] mx-auto pt-16">
            <DialogHeader>
                <DialogTitle><span className='text-state-300'>Confirm Edit Flight Information</span></DialogTitle>
            </DialogHeader>
            <DialogDescription className="mt-2">
                Please enter your credentials to confirm editing this flight information.
            </DialogDescription>
            <div className="max-w-[500px] flex flex-col gap-6 shadow-2xl shadow-slate-400 rounded-xl p-6 mt-10 bg-slate-100  border border-slate-200">
                <div className="flex items-center justify-center">
                    <Image
                        src="/images/logo/logo.png"
                        alt="dashcode"
                        width={90}
                        height={36}
                        className="w-[120px] h-auto object-contain"
                    />
                </div>
                <div className="space-y-6">
                    <div className="space-y-4">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm-email">Email</Label>
                            <Input
                                id="confirm-email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    setError(null)
                                }}
                                onKeyDown={handleKeyDown}
                                disabled={isPending}
                                autoFocus
                                className='outline-none a'
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError(null)
                                }}
                                onKeyDown={handleKeyDown}
                                disabled={isPending}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-6">
                        <Button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            color="secondary"
                            className='shadow bg-slate-200'
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isPending}
                            color='primary'
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Confirm'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmEditFlight