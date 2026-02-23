"use client";

import { TagInput } from '@/components/ui/tag-input';

import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { AirlineItem } from '@/lib/api/master/airlines/airlines.interface';

type Props = {
    mode: 'add' | 'edit' | 'view';
    airline?: AirlineItem | null;
    isPending?: boolean;
    onClose: () => void;
    onSubmit?: (data: {
        code: string;
        name: string;
        description: string;
        colorForeground: string;
        colorBackground: string;
        emailTo: string;
        emailCc: string;
    }) => void;
};

const AirlineFormDialog = ({
    mode,
    airline,
    isPending = false,
    onClose,
    onSubmit
}: Props) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [colorForeground, setColorForeground] = useState('#FFFFFF');
    const [colorBackground, setColorBackground] = useState('#1F2937');
    const [emailTo, setEmailTo] = useState<string[]>([]);
    const [emailCc, setEmailCc] = useState<string[]>([]);

    const isViewMode = mode === 'view';
    const title = mode === 'add' ? 'Add New Airline' : mode === 'edit' ? 'Edit Airline' : 'View Airline';

    useEffect(() => {
        if (airline) {
            setCode(airline.code || '');
            setName(airline.name || '');
            setDescription(airline.description || '');
            setColorForeground(airline.colorForeground || '#FFFFFF');
            setColorBackground(airline.colorBackground || '#1F2937');
            setEmailTo(airline.emailTo ? airline.emailTo.split(/[,;]+/).map(e => e.trim()).filter(Boolean) : []);
            setEmailCc(airline.emailCc ? airline.emailCc.split(/[,;]+/).map(e => e.trim()).filter(Boolean) : []);
        }
    }, [airline]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit({
                code: code.trim(),
                name: name.trim(),
                description: description.trim(),
                colorForeground,
                colorBackground,
                emailTo: emailTo.join(';'),
                emailCc: emailCc.join(';')
            });
        }
    };

    return (
        <div className="w-full max-w-[500px] mx-auto flex flex-col max-h-[80vh]">
            <DialogHeader className="shrink-0">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    {mode === 'add' && 'Fill in the details to add a new airline.'}
                    {mode === 'edit' && 'Update the airline information.'}
                    {mode === 'view' && 'Viewing airline details.'}
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-scroll pr-1 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border transition-colors">
                    {/* Code */}
                    <div className="space-y-2">
                        <Label htmlFor="airline-code">Code *</Label>
                        <Input
                            id="airline-code"
                            placeholder="e.g. ABC"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            disabled={isViewMode || isPending}
                            maxLength={10}
                            required={!isViewMode}
                        />
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="airline-name">Name *</Label>
                        <Input
                            id="airline-name"
                            placeholder="e.g. Airline Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isViewMode || isPending}
                            required={!isViewMode}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="airline-description">Description</Label>
                        <Textarea
                            id="airline-description"
                            placeholder="Optional description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isViewMode || isPending}
                            rows={3}
                        />
                    </div>

                    {/* Email To */}
                    <div className="space-y-2">
                        <Label htmlFor="email-to">Email To</Label>
                        <TagInput
                            placeholder="Add email address..."
                            tags={emailTo}
                            setTags={setEmailTo}
                            validate={(email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                            disabled={isViewMode || isPending}
                        />
                    </div>

                    {/* Email Cc */}
                    <div className="space-y-2">
                        <Label htmlFor="email-cc">Email Cc</Label>
                        <TagInput
                            placeholder="Add email address..."
                            tags={emailCc}
                            setTags={setEmailCc}
                            validate={(email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                            disabled={isViewMode || isPending}
                        />
                    </div>

                    {/* Color Pickers */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="color-foreground">Text Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="color-foreground"
                                    type="color"
                                    value={colorForeground}
                                    onChange={(e) => setColorForeground(e.target.value)}
                                    disabled={isViewMode || isPending}
                                    className="w-10 h-10 rounded border border-input cursor-pointer disabled:cursor-not-allowed"
                                />
                                <Input
                                    value={colorForeground}
                                    onChange={(e) => setColorForeground(e.target.value)}
                                    disabled={isViewMode || isPending}
                                    className="flex-1 font-mono text-sm"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color-background">Background Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="color-background"
                                    type="color"
                                    value={colorBackground}
                                    onChange={(e) => setColorBackground(e.target.value)}
                                    disabled={isViewMode || isPending}
                                    className="w-10 h-10 rounded border border-input cursor-pointer disabled:cursor-not-allowed"
                                />
                                <Input
                                    value={colorBackground}
                                    onChange={(e) => setColorBackground(e.target.value)}
                                    disabled={isViewMode || isPending}
                                    className="flex-1 font-mono text-sm"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="space-y-2">
                        <Label>Preview</Label>
                        <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
                            <div
                                className="px-4 py-2 rounded font-medium text-sm"
                                style={{
                                    backgroundColor: colorBackground,
                                    color: colorForeground,
                                }}
                            >
                                {code || 'CODE'}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {name || 'Airline Name'}
                            </span>
                        </div>
                    </div>

                    {/* View mode: additional info */}
                    {isViewMode && airline && (
                        <div className="space-y-2 pt-4 border-t">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Created By:</span>
                                    <p className="font-medium">{airline.createdby || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Created Date:</span>
                                    <p className="font-medium">
                                        {airline.createddate
                                            ? new Date(airline.createddate).toLocaleDateString('en-GB', {
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
                                    <p className="font-medium">{airline.updatedby || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Updated Date:</span>
                                    <p className="font-medium">
                                        {airline.updateddate
                                            ? new Date(airline.updateddate).toLocaleDateString('en-GB', {
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

                    {/* View mode: Emails */}
                    {isViewMode && airline && (
                        <div className="space-y-2 pt-4 border-t">
                            <Label>Emails</Label>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground mr-2">To:</span>
                                    <span>{airline.emailTo || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground mr-2">Cc:</span>
                                    <span>{airline.emailCc || '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 shrink-0 border-t mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {isViewMode ? 'Close' : 'Cancel'}
                    </Button>
                    {!isViewMode && (
                        <Button type="submit" disabled={isPending || !code.trim() || !name.trim()}>
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                mode === 'add' ? 'Add Airline' : 'Save Changes'
                            )}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AirlineFormDialog;
