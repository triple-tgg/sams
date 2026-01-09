"use client";

import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { UserItem } from '@/lib/api/master/users/users.interface';
import { useRolesOptions } from '@/lib/api/hooks/useRoles';

type Props = {
    mode: 'add' | 'edit' | 'view';
    user?: UserItem | null;
    isPending?: boolean;
    onClose: () => void;
    onSubmit?: (data: {
        username: string;
        email: string;
        passwordData: string;
        fullName: string;
        role: string;
        isActive: boolean;
    }) => void;
};

const UserFormDialog = ({
    mode,
    user,
    isPending = false,
    onClose,
    onSubmit
}: Props) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [passwordData, setPasswordData] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('');
    const [isActive, setIsActive] = useState(true);

    const { options: roleOptions, isLoading: loadingRoles } = useRolesOptions();

    const isViewMode = mode === 'view';
    const isAddMode = mode === 'add';
    const dialogTitle = mode === 'add' ? 'Add New User' : mode === 'edit' ? 'Edit User' : 'View User';

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setEmail(user.email || '');
            setFullName(user.fullName || '');
            setRole(user.roleObj?.id?.toString() || '');
            setIsActive(user.isActive ?? true);
            setPasswordData(''); // Never prefill password
        } else {
            setUsername('');
            setEmail('');
            setPasswordData('');
            setFullName('');
            setRole('');
            setIsActive(true);
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit({
                username: username.trim(),
                email: email.trim(),
                passwordData: passwordData.trim(),
                fullName: fullName.trim(),
                role,
                isActive
            });
        }
    };

    const isFormValid = () => {
        if (isAddMode) {
            return username.trim() && email.trim() && passwordData.trim() && role;
        }
        return username.trim() && email.trim() && role;
    };

    return (
        <div className="w-full max-w-[500px] mx-auto">
            <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>
                    {mode === 'add' && 'Fill in the details to create a new user account.'}
                    {mode === 'edit' && 'Update the user information. Leave password empty to keep current.'}
                    {mode === 'view' && 'Viewing user details.'}
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Username */}
                <div className="space-y-2">
                    <Label htmlFor="user-username">Username *</Label>
                    <Input
                        id="user-username"
                        placeholder="e.g. johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isViewMode || isPending}
                        required={!isViewMode}
                    />
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="user-email">Email *</Label>
                    <Input
                        id="user-email"
                        type="email"
                        placeholder="e.g. john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isViewMode || isPending}
                        required={!isViewMode}
                    />
                </div>

                {/* Password - only show for add/edit */}
                {!isViewMode && (
                    <div className="space-y-2">
                        <Label htmlFor="user-password">
                            Password {isAddMode ? '*' : '(leave empty to keep current)'}
                        </Label>
                        <Input
                            id="user-password"
                            type="password"
                            placeholder={isAddMode ? "Enter password" : "Enter new password (optional)"}
                            value={passwordData}
                            onChange={(e) => setPasswordData(e.target.value)}
                            disabled={isPending}
                            required={isAddMode}
                        />
                    </div>
                )}

                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="user-fullname">Full Name</Label>
                    <Input
                        id="user-fullname"
                        placeholder="e.g. John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isViewMode || isPending}
                    />
                </div>

                {/* Role */}
                <div className="space-y-2">
                    <Label htmlFor="user-role">Role *</Label>
                    <Select
                        key={`user-role-${role}-${loadingRoles}`}
                        value={role}
                        onValueChange={setRole}
                        disabled={isViewMode || isPending || loadingRoles}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={loadingRoles ? "Loading..." : "Select role"} />
                        </SelectTrigger>
                        <SelectContent>
                            {roleOptions.map((opt) => (
                                <SelectItem key={opt.id} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Is Active */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="user-active">Active Status</Label>
                        <p className="text-sm text-muted-foreground">
                            {isActive ? 'User is active' : 'User is inactive'}
                        </p>
                    </div>
                    <Switch
                        id="user-active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        disabled={isViewMode || isPending}
                    />
                </div>

                {/* View mode: additional info */}
                {isViewMode && user && (
                    <div className="space-y-2 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Role:</span>
                                <p className="font-medium">{user.roleObj?.name || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Role Code:</span>
                                <p className="font-medium">{user.roleObj?.code || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Created By:</span>
                                <p className="font-medium">{user.createdBy || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Created Date:</span>
                                <p className="font-medium">
                                    {user.createdDate
                                        ? new Date(user.createdDate).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Updated By:</span>
                                <p className="font-medium">{user.updatedBy || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Updated Date:</span>
                                <p className="font-medium">
                                    {user.updatedDate
                                        ? new Date(user.updatedDate).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {isViewMode ? 'Close' : 'Cancel'}
                    </Button>
                    {!isViewMode && (
                        <Button
                            type="submit"
                            disabled={isPending || !isFormValid()}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                mode === 'add' ? 'Add User' : 'Save Changes'
                            )}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default UserFormDialog;
