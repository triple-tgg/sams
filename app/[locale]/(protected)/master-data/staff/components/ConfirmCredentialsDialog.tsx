"use client";

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCanEditLogin } from '@/lib/api/hooks/useCanEditLogin';
import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Image from "next/image";

type Props = {
    title?: string;
    description?: string;
    onClose: () => void;
    onConfirm: (userName: string) => void;
};

const ConfirmCredentialsDialog = ({
    title = "Confirm Action",
    description = "Please enter your credentials to confirm this action.",
    onClose,
    onConfirm
}: Props) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { mutate: verifyLogin, isPending } = useCanEditLogin();

    const handleConfirm = () => {
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!password.trim()) {
            setError('Password is required');
            return;
        }

        setError(null);

        verifyLogin(
            { email: email.trim(), password: password.trim() },
            {
                onSuccess: (data) => {
                    if (data.message === 'success' && data.responseData) {
                        onConfirm(data.responseData.userName);
                    } else {
                        setError(data.error || 'Verification failed');
                    }
                },
                onError: (err) => {
                    setError(err.message || 'Username or Password not correct.');
                }
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isPending) {
            e.preventDefault();
            handleConfirm();
        }
    };

    return (
        <div className="w-full max-w-[500px] mx-auto pt-4">
            <DialogHeader>
                <DialogTitle><span className='text-slate-700 dark:text-slate-200'>{title}</span></DialogTitle>
            </DialogHeader>
            <DialogDescription className="mt-2">
                {description}
            </DialogDescription>
            <div className="flex flex-col gap-6 shadow-xl shadow-slate-300 dark:shadow-slate-900 rounded-xl p-6 mt-6 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-center">
                    <Image
                        src="/images/logo/logo.png"
                        alt="logo"
                        width={90}
                        height={36}
                        className="w-[100px] h-auto object-contain"
                    />
                </div>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="confirm-email">Email</Label>
                            <Input
                                id="confirm-email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={handleKeyDown}
                                disabled={isPending}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={handleKeyDown}
                                disabled={isPending}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isPending}
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
    );
};

export default ConfirmCredentialsDialog;
