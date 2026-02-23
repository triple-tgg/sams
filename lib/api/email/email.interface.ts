export interface EmailAttachment {
    fileName: string;
    filePath: string;
    fileSize?: number;
}

export interface EmailPreviewData {
    emailTo: string;
    emailCc: string;
    subject: string;
    bodyHtml: string;
    attachments: EmailAttachment[];
}

export interface EmailPreviewResponse {
    message: string;
    responseData: EmailPreviewData | null;
    error: string;
}

export interface EmailLogItem {
    id: number;
    sentDate: string;
    sentBy: string;
    status: string;
    emailTo: string;
    emailCc: string;
    subject: string;
}

export interface EmailLogResponse {
    message: string;
    responseData: EmailLogItem[];
    error: string;
}

export interface EmailSendResponse {
    message: string;
    responseData: null;
    error: string;
}
