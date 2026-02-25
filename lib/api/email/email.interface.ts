export interface EmailPreviewData {
    htmlContent: string;
}

export interface EmailPreviewResponse {
    message: string;
    responseData: EmailPreviewData | null;
    error: string;
}

export interface EmailLogItem {
    id: number;
    lineMaintenancesId: number;
    sentDate: string;
    senderEmail: string;
    recipientEmail: string;
    status: string;
    errorMessage: string | null;
    subject: string;
    emailCc: string;
}

export interface EmailLogResponse {
    message: string;
    responseData: EmailLogItem[];
    error: string;
}

export interface EmailSendData {
    isSuccess: boolean;
    emailFrom: string | null;
    emailTo: string | null;
    emailCc: string | null;
    subject: string | null;
    errorMessage: string | null;
}

export interface EmailSendResponse {
    message: string;
    responseData: EmailSendData | null;
    error: string;
}
