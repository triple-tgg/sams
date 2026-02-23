import axios from "@/lib/axios.config";
import type {
    EmailPreviewResponse,
    EmailLogResponse,
    EmailSendResponse,
} from "./email.interface";

const API_BASE =
    process.env.NEXT_PUBLIC_DEVELOPMENT_API ||
    "https://sam-api-staging-triple-tcoth-production.up.railway.app";

/**
 * Get email preview for a flight (To, Cc, Subject, Body HTML, Attachments)
 */
export const getEmailPreview = async (
    flightInfosId: number
): Promise<EmailPreviewResponse> => {
    try {
        const res = await axios.get(
            `${API_BASE}/email/preview/${flightInfosId}`,
            { headers: { "Content-Type": "application/json" } }
        );
        return res.data as EmailPreviewResponse;
    } catch (error: any) {
        console.error("Error fetching email preview:", error);
        throw new Error(
            error.response?.data?.message || "Failed to fetch email preview"
        );
    }
};

/**
 * Send email for a flight
 */
export const sendEmail = async (
    flightInfosId: number
): Promise<EmailSendResponse> => {
    try {
        const res = await axios.post(
            `${API_BASE}/email/send/${flightInfosId}`,
            {},
            { headers: { "Content-Type": "application/json" } }
        );
        return res.data as EmailSendResponse;
    } catch (error: any) {
        console.error("Error sending email:", error);
        throw new Error(
            error.response?.data?.message || "Failed to send email"
        );
    }
};

/**
 * Get email send log for a flight
 */
export const getEmailLog = async (
    flightInfosId: number
): Promise<EmailLogResponse> => {
    try {
        const res = await axios.get(
            `${API_BASE}/email/log/${flightInfosId}`,
            { headers: { "Content-Type": "application/json" } }
        );
        return res.data as EmailLogResponse;
    } catch (error: any) {
        console.error("Error fetching email log:", error);
        throw new Error(
            error.response?.data?.message || "Failed to fetch email log"
        );
    }
};
