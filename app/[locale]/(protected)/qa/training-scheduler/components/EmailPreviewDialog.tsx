'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Mail, Send, Loader2, Clock, CheckCircle, XCircle, AlertCircle, Eye, FileText } from 'lucide-react'
import { useEmailLogDatalist, usePreviewEmailConfirmed } from '@/lib/api/qa/email-log.hooks'
import type { EmailLogItem } from '@/lib/api/qa/email-log'

interface StaffItem {
    id: string
    enrollmentId?: number
    name: string
    code: string
    license: string
    dept: string
    date: string
    status: string
    result: string
}

interface EmailPreviewDialogProps {
    isOpen: boolean
    onClose: () => void
    staff: StaffItem
    scheduleId: number
    onSend: (staffId: number) => Promise<void>
    isSending: boolean
}

export function EmailPreviewDialog({ isOpen, onClose, staff, scheduleId, onSend, isSending }: EmailPreviewDialogProps) {
    const [activeTab, setActiveTab] = useState<'preview' | 'log'>('preview')

    // ── Fetch email preview HTML from API ──────────────────────────
    const { data: previewHtml, isLoading: isLoadingPreview } = usePreviewEmailConfirmed(
        scheduleId,
        Number(staff.id),
        isOpen,
    )

    // ── Fetch email logs from API ─────────────────────────────────
    const { data: emailLogs = [], isLoading: isLoadingLogs } = useEmailLogDatalist(
        scheduleId,
        Number(staff.id),
        isOpen, // only fetch when dialog is open
    )

    const handleSend = async () => {
        await onSend(Number(staff.id))
    }

    const formatDateTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr)
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        } catch { return dateStr }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent size="lg" className="p-0 gap-0 overflow-hidden min-h-[90vh] flex flex-col">
                <DialogHeader className="px-6 pt-5 pb-0">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Mail className="w-4 h-4 text-primary" />
                        Email Notification
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        Send training session confirmation to <span className="font-semibold text-foreground">{staff.name}</span>
                    </p>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as 'preview' | 'log')}
                    className="mt-3 flex-1 flex flex-col"
                >
                    <div className="px-6">
                        <TabsList className="h-9 w-auto inline-flex bg-transparent p-0 gap-4">
                            <TabsTrigger value="preview" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent px-1 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                                <Eye className="w-3.5 h-3.5" />
                                Preview
                            </TabsTrigger>
                            <TabsTrigger value="log" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent px-1 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                                <FileText className="w-3.5 h-3.5" />
                                Log
                                {emailLogs.length > 0 && (
                                    <span className="ml-1 bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none">
                                        {emailLogs.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ── Preview Tab ────────────────────────── */}
                    <TabsContent value="preview" className="mt-0 px-6 pb-4 flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
                        {isLoadingPreview ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                                <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin mb-3" />
                                <p className="text-xs text-muted-foreground">Loading email preview...</p>
                            </div>
                        ) : previewHtml ? (
                            <iframe
                                srcDoc={previewHtml}
                                className="mt-4 flex-1 w-full border border-border rounded-xl bg-white"
                                sandbox="allow-same-origin"
                                title="Email Preview"
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                                <Mail className="w-8 h-8 text-muted-foreground/30 mb-3" />
                                <p className="text-sm font-medium text-muted-foreground">No preview available</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    Unable to load email preview for this staff member.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Log Tab ─────────────────────────────── */}
                    <TabsContent value="log" className="mt-0 px-6 pb-4 flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
                        <div className="mt-4 flex-1 flex flex-col min-h-0">
                            {isLoadingLogs ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin mb-3" />
                                    <p className="text-xs text-muted-foreground">Loading email history...</p>
                                </div>
                            ) : emailLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Clock className="w-8 h-8 text-muted-foreground/30 mb-3" />
                                    <p className="text-sm font-medium text-muted-foreground">No email history</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        Email logs for this staff member will appear here after sending.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 flex-1 overflow-y-auto">
                                    {emailLogs.map((log: EmailLogItem) => (
                                        <div
                                            key={log.id}
                                            className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-xs ${log.isSuccess
                                                ? 'bg-emerald-50/50 border-emerald-200/60'
                                                : 'bg-red-50/50 border-red-200/60'
                                                }`}
                                        >
                                            <div className="mt-0.5 shrink-0">
                                                {log.isSuccess ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className={`font-semibold ${log.isSuccess ? 'text-emerald-700' : 'text-red-700'}`}>
                                                        {log.isSuccess ? 'Sent Successfully' : 'Failed'}
                                                    </span>
                                                    <span className="text-muted-foreground/70 text-[10px] shrink-0 ml-2">
                                                        {formatDateTime(log.sentDate)}
                                                    </span>
                                                </div>
                                                <div className="mt-1 space-y-0.5">
                                                    {log.emailTo && (
                                                        <p className="text-muted-foreground">
                                                            <span className="text-muted-foreground/70">To:</span> {log.emailTo}
                                                        </p>
                                                    )}
                                                    {log.emailFrom && (
                                                        <p className="text-muted-foreground">
                                                            <span className="text-muted-foreground/70">From:</span> {log.emailFrom}
                                                        </p>
                                                    )}
                                                    <p className="text-foreground/80 truncate">
                                                        <span className="text-muted-foreground/70">Subject:</span> {log.subject}
                                                    </p>
                                                </div>
                                                {!log.isSuccess && log.errorMessage && (
                                                    <div className="flex items-start gap-1.5 mt-1.5 text-red-600">
                                                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                                        <span>{log.errorMessage}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="px-6 py-4 border-t border-border bg-slate-50/50">
                    <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                        Close
                    </Button>
                    <Button size="sm" onClick={handleSend} disabled={isSending} className="text-xs gap-1.5">
                        {isSending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Send className="w-3.5 h-3.5" />
                        )}
                        {isSending ? 'Sending...' : 'Send Email'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
