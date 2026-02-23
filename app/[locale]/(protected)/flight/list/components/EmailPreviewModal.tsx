"use client";

import React, { useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Mail,
    Send,
    FileText,
    Paperclip,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
} from "lucide-react";
import { useEmailPreview, useEmailLog, useSendEmail } from "@/lib/api/hooks/useEmailOperations";
import { toast } from "sonner";

interface EmailPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flightInfosId: number | null;
    flightNo?: string;
}

/**
 * Renders a list of email addresses as badges.
 */
function EmailBadges({ emails, label }: { emails: string; label: string }) {
    const list = emails
        .split(/[;,]+/)
        .map((e) => e.trim())
        .filter(Boolean);

    if (!list.length) return <span className="text-muted-foreground text-sm">—</span>;

    return (
        <div className="flex flex-wrap gap-1.5">
            {list.map((email, i) => (
                <Badge key={`${label}-${i}`} color="default" rounded="full" className="text-xs font-normal">
                    {email}
                </Badge>
            ))}
        </div>
    );
}

/**
 * Renders an HTML email body inside a sandboxed iframe.
 */
function HtmlBodyRenderer({ html }: { html: string }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current && html) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; font-size: 14px; color: #333; margin: 16px; line-height: 1.6; }
              table { border-collapse: collapse; width: 100%; }
              td, th { border: 1px solid #ddd; padding: 8px; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>${html}</body>
          </html>
        `);
                doc.close();

                // Auto-resize iframe height to fit content
                const resizeObserver = new ResizeObserver(() => {
                    if (iframeRef.current && doc.body) {
                        iframeRef.current.style.height = `${doc.body.scrollHeight + 32}px`;
                    }
                });
                if (doc.body) resizeObserver.observe(doc.body);
                return () => resizeObserver.disconnect();
            }
        }
    }, [html]);

    return (
        <iframe
            ref={iframeRef}
            className="w-full min-h-[200px] max-h-[400px] border rounded-lg bg-white overflow-auto"
            sandbox="allow-same-origin"
            title="Email Body"
        />
    );
}

export default function EmailPreviewModal({
    open,
    onOpenChange,
    flightInfosId,
    flightNo,
}: EmailPreviewModalProps) {
    const enabled = open && !!flightInfosId && flightInfosId > 0;

    const {
        data: previewRes,
        isLoading: previewLoading,
        error: previewError,
    } = useEmailPreview(flightInfosId ?? 0, enabled);

    const {
        data: logRes,
        isLoading: logLoading,
    } = useEmailLog(flightInfosId ?? 0, enabled);

    const sendMutation = useSendEmail();

    const preview = previewRes?.responseData ?? null;
    const logs = logRes?.responseData ?? [];

    const handleSendEmail = () => {
        if (!flightInfosId) return;
        sendMutation.mutate(flightInfosId, {
            onSuccess: () => {
                toast.success("Email sent successfully");
            },
            onError: (err) => {
                toast.error(err.message || "Failed to send email");
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <span>Email Preview</span>
                        {flightNo && (
                            <Badge color="primary" rounded="full" className="ml-2 text-xs">
                                {flightNo}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Tabs content */}
                <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="px-6 pt-3 pb-0 border-b shrink-0">
                        <TabsTrigger value="preview" className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" />
                            View Email
                        </TabsTrigger>
                        <TabsTrigger value="log" className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            Log
                            {logs.length > 0 && (
                                <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                    {logs.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* View Email Tab */}
                    <TabsContent value="preview" className="flex-1 overflow-y-auto px-6 pb-4 m-0">
                        {previewLoading ? (
                            <div className="space-y-4 py-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                        ) : previewError ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <XCircle className="h-10 w-10 mb-3 text-destructive/50" />
                                <p className="text-sm">Failed to load email preview</p>
                                <p className="text-xs mt-1">{previewError.message}</p>
                            </div>
                        ) : preview ? (
                            <div className="space-y-4 py-4">
                                {/* Email To */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        To
                                    </Label>
                                    <EmailBadges emails={preview.emailTo} label="to" />
                                </div>

                                {/* Email Cc */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Cc
                                    </Label>
                                    <EmailBadges emails={preview.emailCc} label="cc" />
                                </div>

                                {/* Subject */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Subject
                                    </Label>
                                    <div className="text-sm font-medium border rounded-lg px-3 py-2 bg-muted/30">
                                        {preview.subject || "—"}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Body
                                    </Label>
                                    {preview.bodyHtml ? (
                                        <HtmlBodyRenderer html={preview.bodyHtml} />
                                    ) : (
                                        <div className="text-sm text-muted-foreground border rounded-lg px-3 py-6 text-center bg-muted/20">
                                            No email body
                                        </div>
                                    )}
                                </div>

                                {/* Attachments */}
                                {preview.attachments && preview.attachments.length > 0 && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Attachments
                                        </Label>
                                        <div className="space-y-1.5">
                                            {preview.attachments.map((att, i) => (
                                                <a
                                                    key={i}
                                                    href={att.filePath}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm px-3 py-2 border rounded-lg hover:bg-muted/40 transition-colors group"
                                                >
                                                    <Paperclip className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                                                    <span className="truncate flex-1">{att.fileName}</span>
                                                    {att.fileSize && (
                                                        <span className="text-xs text-muted-foreground shrink-0">
                                                            {(att.fileSize / 1024).toFixed(1)} KB
                                                        </span>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <Mail className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-sm">No email preview available</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Log Tab */}
                    <TabsContent value="log" className="flex-1 overflow-y-auto px-6 pb-4 m-0">
                        {logLoading ? (
                            <div className="space-y-3 py-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : logs.length > 0 ? (
                            <div className="py-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs">Date/Time</TableHead>
                                            <TableHead className="text-xs">Sent By</TableHead>
                                            <TableHead className="text-xs">Status</TableHead>
                                            <TableHead className="text-xs">Subject</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    {new Date(log.sentDate).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-xs">{log.sentBy}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        color={log.status === "success" ? "success" : "destructive"}
                                                        rounded="full"
                                                        className="text-[10px]"
                                                    >
                                                        {log.status === "success" ? (
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                        )}
                                                        {log.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs max-w-[200px] truncate">
                                                    {log.subject}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <Clock className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-sm">No send history yet</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Footer — Send button */}
                <div className="px-6 py-4 border-t shrink-0 flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    <Button
                        color="primary"
                        disabled={sendMutation.isPending || !preview}
                        onClick={handleSendEmail}
                    >
                        {sendMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        {sendMutation.isPending ? "Sending..." : "Send Email"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
