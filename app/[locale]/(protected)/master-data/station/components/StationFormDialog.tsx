"use client";

import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { StationItem } from '@/lib/api/master/stations/stations.interface';

type Props = {
    mode: 'add' | 'edit' | 'view';
    station?: StationItem | null;
    isPending?: boolean;
    onClose: () => void;
    onSubmit?: (data: {
        code: string;
        name: string;
        description: string;
    }) => void;
};

const StationFormDialog = ({
    mode,
    station,
    isPending = false,
    onClose,
    onSubmit
}: Props) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const isViewMode = mode === 'view';
    const dialogTitle = mode === 'add' ? 'Add New Station' : mode === 'edit' ? 'Edit Station' : 'View Station';

    useEffect(() => {
        if (station) {
            setCode(station.code || '');
            setName(station.name || '');
            setDescription(station.description || '');
        } else {
            setCode('');
            setName('');
            setDescription('');
        }
    }, [station]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit({
                code: code.trim(),
                name: name.trim(),
                description: description.trim()
            });
        }
    };

    return (
        <div className="w-full max-w-[500px] mx-auto">
            <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>
                    {mode === 'add' && 'Fill in the details to add a new station.'}
                    {mode === 'edit' && 'Update the station information.'}
                    {mode === 'view' && 'Viewing station details.'}
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Code */}
                <div className="space-y-2">
                    <Label htmlFor="station-code">Code *</Label>
                    <Input
                        id="station-code"
                        placeholder="e.g. BKK"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        disabled={isViewMode || isPending}
                        maxLength={10}
                        required={!isViewMode}
                    />
                </div>

                {/* Name */}
                <div className="space-y-2">
                    <Label htmlFor="station-name">Name</Label>
                    <Input
                        id="station-name"
                        placeholder="e.g. Suvarnabhumi Airport"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isViewMode || isPending}
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="station-description">Description</Label>
                    <Textarea
                        id="station-description"
                        placeholder="Enter station description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isViewMode || isPending}
                        rows={3}
                    />
                </div>

                {/* View mode: additional info */}
                {isViewMode && station && (
                    <div className="space-y-2 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Created By:</span>
                                <p className="font-medium">{station.createdby || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Created Date:</span>
                                <p className="font-medium">
                                    {station.createddate
                                        ? new Date(station.createddate).toLocaleDateString('en-GB', {
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
                                <p className="font-medium">{station.updatedby || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Updated Date:</span>
                                <p className="font-medium">
                                    {station.updateddate
                                        ? new Date(station.updateddate).toLocaleDateString('en-GB', {
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
                            disabled={isPending || !code.trim()}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                mode === 'add' ? 'Add Station' : 'Save Changes'
                            )}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default StationFormDialog;
