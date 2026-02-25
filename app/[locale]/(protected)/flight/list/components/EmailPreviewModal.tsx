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
import { Skeleton } from "@/components/ui/skeleton";
import {
    Mail,
    Send,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    User,
    AtSign,
} from "lucide-react";
import { useEmailPreview, useEmailLog, useSendEmail } from "@/lib/api/hooks/useEmailOperations";
import { useLineMaintenancesQueryThfByFlightId } from "@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId";
import { toast } from "sonner";
import type { EmailLogItem } from "@/lib/api/email/email.interface";

interface EmailPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flightInfosId: number | null;
    flightNo?: string;
    emailTo?: string | null;
    emailCc?: string | null;
}

/**
 * Renders a full HTML email inside a sandboxed iframe that auto-resizes.
 */
function HtmlEmailRenderer({ html }: { html: string }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current && html) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(html);
                doc.close();

                // Auto-resize iframe height to fit content
                const resizeObserver = new ResizeObserver(() => {
                    if (iframeRef.current && doc.body) {
                        iframeRef.current.style.height = `${doc.body.scrollHeight + 16}px`;
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
            className="w-full min-h-[300px] border-0 bg-white"
            sandbox="allow-same-origin"
            title="Email Preview"
        />
    );
}

/**
 * Single expandable log entry card
 */
function LogEntryCard({ log }: { log: EmailLogItem }) {
    const [expanded, setExpanded] = React.useState(false);
    const isFailed = log.status?.toLowerCase() === "failed";
    const isSuccess = log.status?.toLowerCase() === "success";

    const formattedDate = (() => {
        try {
            return new Date(log.sentDate).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
        } catch {
            return log.sentDate;
        }
    })();

    return (
        <div
            className={`border rounded-lg transition-all ${isFailed
                ? "border-destructive/30 bg-destructive/5"
                : "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20"
                }`}
        >
            {/* Card header - always visible */}
            <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-lg"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Status icon */}
                <div className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${isFailed ? "bg-destructive/10" : "bg-emerald-100 dark:bg-emerald-900/40"}`}>
                    {isFailed ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Badge
                            color={isSuccess ? "success" : "destructive"}
                            rounded="full"
                            className="text-[10px]"
                        >
                            {log.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formattedDate}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {log.subject}
                    </p>
                </div>

                {/* Expand icon */}
                <div className="shrink-0">
                    {expanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* Expanded details */}
            {expanded && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-dashed border-inherit ml-11 mr-4">
                    {/* Sender */}
                    <div className="flex items-start gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sender</p>
                            <p className="text-xs">{log.senderEmail || "—"}</p>
                        </div>
                    </div>

                    {/* Recipient */}
                    <div className="flex items-start gap-2">
                        <AtSign className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">To</p>
                            <p className="text-xs break-all">{log.recipientEmail || "—"}</p>
                        </div>
                    </div>

                    {/* Cc */}
                    {log.emailCc && (
                        <div className="flex items-start gap-2">
                            <AtSign className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cc</p>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                    {log.emailCc.split(/[;,]+/).map((cc, i) => (
                                        <Badge key={i} color="default" rounded="full" className="text-[10px] font-normal">
                                            {cc.trim()}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subject */}
                    <div className="flex items-start gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Subject</p>
                            <p className="text-xs">{log.subject || "—"}</p>
                        </div>
                    </div>

                    {/* Error message - only show on failure */}
                    {isFailed && log.errorMessage && (
                        <div className="flex items-start gap-2 mt-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider">Error</p>
                                <div className="mt-1 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                                    <p className="text-xs text-destructive/90 break-all leading-relaxed">
                                        {log.errorMessage}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function EmailPreviewModal({
    open,
    onOpenChange,
    flightInfosId,
    flightNo,
    emailTo,
    emailCc,
}: EmailPreviewModalProps) {
    const enabled = open && !!flightInfosId && flightInfosId > 0;

    // Fetch lineMaintenanceId from THF data (needed for both preview & log)
    const {
        lineMaintenanceData,
        isLoading: thfLoading,
    } = useLineMaintenancesQueryThfByFlightId({
        flightInfosId: enabled ? (flightInfosId ?? 0) : 0,
    });

    const lineMaintenanceId = lineMaintenanceData?.id ?? 0;
    const hasLineMaintenanceId = enabled && lineMaintenanceId > 0;

    // Fetch email preview (uses lineMaintenanceId)
    const {
        data: previewRes,
        isLoading: previewLoading,
        error: previewError,
    } = useEmailPreview(lineMaintenanceId, hasLineMaintenanceId);

    // Fetch email log (uses lineMaintenanceId)
    const {
        data: logRes,
        isLoading: logLoading,
    } = useEmailLog(lineMaintenanceId, hasLineMaintenanceId);

    const sendMutation = useSendEmail();

    const htmlContent = previewRes?.responseData?.htmlContent ?? null;
    const logs = logRes?.responseData ?? [];

    const handleSendEmail = () => {
        if (!lineMaintenanceId) return;
        sendMutation.mutate(lineMaintenanceId, {
            onSuccess: () => {
                toast.success("Email sent successfully");
            },
            onError: (err) => {
                toast.error(err.message || "Failed to send email", {
                    duration: 6000,
                });
            },
        });
    };

    const isPreviewLoading = thfLoading || previewLoading;
    const isLogLoading = thfLoading || logLoading;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
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

                    {/* View Email Tab — renders the full HTML content */}
                    <TabsContent
                        value="preview"
                        className="flex-1 overflow-y-auto m-0"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "transparent transparent" } as React.CSSProperties}
                        onMouseEnter={(e) => { (e.currentTarget.style as any).scrollbarColor = "rgba(148,163,184,0.5) transparent"; }}
                        onMouseLeave={(e) => { (e.currentTarget.style as any).scrollbarColor = "transparent transparent"; }}
                    >
                        {isPreviewLoading ? (
                            <div className="space-y-4 p-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : previewError ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground px-6">
                                <XCircle className="h-10 w-10 mb-3 text-destructive/50" />
                                <p className="text-sm">Failed to load email preview</p>
                                <p className="text-xs mt-1">{previewError.message}</p>
                            </div>
                        ) : lineMaintenanceId === 0 && !thfLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground px-6">
                                <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-sm">No line maintenance data found</p>
                                <p className="text-xs mt-1">Create a THF first to preview email</p>
                            </div>
                        ) : htmlContent ? (
                            <div className="bg-slate-100 dark:bg-slate-800">
                                {/* Email To / Cc header */}
                                {(emailTo || emailCc) && (
                                    <div className="bg-white dark:bg-slate-900 border-b px-5 py-3 space-y-2">
                                        {emailTo && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-xs font-semibold text-muted-foreground w-8 pt-0.5 shrink-0">To:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {emailTo.split(/[;,]+/).filter(Boolean).map((email, i) => (
                                                        <Badge key={i} color="default" className="text-[11px] font-normal px-2 py-0.5">
                                                            {email.trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {emailCc && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-xs font-semibold text-muted-foreground w-8 pt-0.5 shrink-0">Cc:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {emailCc.split(/[;,]+/).filter(Boolean).map((email, i) => (
                                                        <Badge key={i} color="secondary" className="text-[11px] font-normal px-2 py-0.5">
                                                            {email.trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <HtmlEmailRenderer html={htmlContent} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground px-6">
                                <Mail className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-sm">No email preview available</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Log Tab */}
                    <TabsContent
                        value="log"
                        className="flex-1 overflow-y-auto px-6 pb-4 m-0"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "transparent transparent" } as React.CSSProperties}
                        onMouseEnter={(e) => { (e.currentTarget.style as any).scrollbarColor = "rgba(148,163,184,0.5) transparent"; }}
                        onMouseLeave={(e) => { (e.currentTarget.style as any).scrollbarColor = "transparent transparent"; }}
                    >
                        {isLogLoading ? (
                            <div className="space-y-3 py-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : logs.length > 0 ? (
                            <div className="space-y-2 py-4">
                                {/* Summary bar */}
                                <div className="flex items-center gap-3 mb-3 px-1">
                                    <span className="text-xs text-muted-foreground">
                                        {logs.length} {logs.length === 1 ? "entry" : "entries"}
                                    </span>
                                    <div className="flex items-center gap-1.5 ml-auto">
                                        {logs.filter(l => l.status?.toLowerCase() === "success").length > 0 && (
                                            <Badge color="success" rounded="full" className="text-[10px] gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                {logs.filter(l => l.status?.toLowerCase() === "success").length}
                                            </Badge>
                                        )}
                                        {logs.filter(l => l.status?.toLowerCase() === "failed").length > 0 && (
                                            <Badge color="destructive" rounded="full" className="text-[10px] gap-1">
                                                <XCircle className="h-3 w-3" />
                                                {logs.filter(l => l.status?.toLowerCase() === "failed").length}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Log entries */}
                                {logs.map((log) => (
                                    <LogEntryCard key={log.id} log={log} />
                                ))}
                            </div>
                        ) : lineMaintenanceId === 0 && !thfLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-sm">No line maintenance data found</p>
                                <p className="text-xs mt-1">Create a THF first to enable email logging</p>
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
                        disabled={sendMutation.isPending || !htmlContent || lineMaintenanceId === 0}
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
