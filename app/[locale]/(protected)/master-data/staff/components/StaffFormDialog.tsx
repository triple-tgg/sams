"use client";

import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { StaffItem } from '@/lib/api/master/staff/staff.interface';
import { useStaffsTypesAllOptions } from '@/lib/api/hooks/useStaffsTypes';

type Props = {
    mode: 'add' | 'edit' | 'view';
    staff?: StaffItem | null;
    isPending?: boolean;
    onClose: () => void;
    onSubmit?: (data: {
        code: string;
        name: string;
        staffstypeid: number;
        isActive: boolean;
        title: string;
        jobTitle: string;
    }) => void;
};

const StaffFormDialog = ({
    mode,
    staff,
    isPending = false,
    onClose,
    onSubmit
}: Props) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [staffstypeid, setStaffstypeid] = useState<number>(0);
    const [isActive, setIsActive] = useState(true);
    const [title, setTitle] = useState('');
    const [jobTitle, setJobTitle] = useState('');

    const { options: staffTypeOptions, isLoading: loadingTypes } = useStaffsTypesAllOptions();

    const isViewMode = mode === 'view';
    const dialogTitle = mode === 'add' ? 'Add New Staff' : mode === 'edit' ? 'Edit Staff' : 'View Staff';

    useEffect(() => {
        if (staff) {
            setCode(staff.code || '');
            setName(staff.name || '');
            setStaffstypeid(staff.staffstypeObj?.id || 0);
            setIsActive(staff.isActive ?? true);
            setTitle(staff.title || '');
            setJobTitle(staff.jobTitle || '');
        }
    }, [staff]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit({
                code: code.trim(),
                name: name.trim(),
                staffstypeid,
                isActive,
                title: title.trim(),
                jobTitle: jobTitle.trim()
            });
        }
    };

    const titleOptions = ['Mr.', 'Ms.', 'Mrs.', 'Miss', 'Dr.'];

    return (
        <div className="w-full max-w-[500px] mx-auto">
            <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>
                    {mode === 'add' && 'Fill in the details to add a new staff member.'}
                    {mode === 'edit' && 'Update the staff information.'}
                    {mode === 'view' && 'Viewing staff details.'}
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Code */}
                    <div className="space-y-2">
                        <Label htmlFor="staff-code">Code *</Label>
                        <Input
                            id="staff-code"
                            placeholder="e.g. 0001"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={isViewMode || isPending}
                            maxLength={20}
                            required={!isViewMode}
                        />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="staff-title">Title</Label>
                        <Select
                            value={title}
                            onValueChange={setTitle}
                            disabled={isViewMode || isPending}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                            <SelectContent>
                                {titleOptions.map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                    <Label htmlFor="staff-name">Name *</Label>
                    <Input
                        id="staff-name"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isViewMode || isPending}
                        required={!isViewMode}
                    />
                </div>

                {/* Job Title */}
                <div className="space-y-2">
                    <Label htmlFor="staff-jobtitle">Job Title</Label>
                    <Input
                        id="staff-jobtitle"
                        placeholder="e.g. Senior Aircraft Mechanic"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        disabled={isViewMode || isPending}
                    />
                </div>

                {/* Staff Type */}
                <div className="space-y-2">
                    <Label htmlFor="staff-type">Staff Type *</Label>
                    <Select
                        key={`staff-type-${staffstypeid}-${loadingTypes}`}
                        value={staffstypeid ? staffstypeid.toString() : ''}
                        onValueChange={(val) => setStaffstypeid(parseInt(val))}
                        disabled={isViewMode || isPending || loadingTypes}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={loadingTypes ? "Loading..." : "Select staff type"} />
                        </SelectTrigger>
                        <SelectContent>
                            {staffTypeOptions.map((opt) => (
                                <SelectItem key={opt.id} value={opt.id.toString()}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Is Active */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="staff-active">Active Status</Label>
                        <p className="text-sm text-muted-foreground">
                            {isActive ? 'Staff is active' : 'Staff is inactive'}
                        </p>
                    </div>
                    <Switch
                        id="staff-active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        disabled={isViewMode || isPending}
                    />
                </div>

                {/* View mode: additional info */}
                {isViewMode && staff && (
                    <div className="space-y-2 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Created By:</span>
                                <p className="font-medium">{staff.createdby || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Created Date:</span>
                                <p className="font-medium">
                                    {staff.createddate
                                        ? new Date(staff.createddate).toLocaleDateString('en-GB', {
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
                                <p className="font-medium">{staff.updatedby || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Updated Date:</span>
                                <p className="font-medium">
                                    {staff.updateddate
                                        ? new Date(staff.updateddate).toLocaleDateString('en-GB', {
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
                            disabled={isPending || !code.trim() || !name.trim() || !staffstypeid}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                mode === 'add' ? 'Add Staff' : 'Save Changes'
                            )}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default StaffFormDialog;
