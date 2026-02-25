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
 * Get email preview by lineMaintenanceId (returns pre-rendered HTML)
 */
export const getEmailPreview = async (
    lineMaintenanceId: number
): Promise<EmailPreviewResponse> => {
    try {
        const res = await axios.get(
            `${API_BASE}/email/preview/${lineMaintenanceId}`,
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
 * Send email by lineMaintenanceId
 */
export const sendEmail = async (
    lineMaintenanceId: number
): Promise<EmailSendResponse> => {
    try {
        const res = await axios.post(
            `${API_BASE}/email/send/${lineMaintenanceId}`,
            {},
            { headers: { "Content-Type": "application/json" } }
        );
        const data = res.data as EmailSendResponse;
        // API may return success HTTP status but with isSuccess: false
        if (data.responseData && !data.responseData.isSuccess) {
            throw new Error(
                data.responseData.errorMessage || data.error || "Failed to send email"
            );
        }
        return data;
    } catch (error: any) {
        // Re-throw if it's already our custom error
        if (error.message && !error.response) throw error;
        console.error("Error sending email:", error);
        throw new Error(
            error.response?.data?.responseData?.errorMessage ||
            error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to send email"
        );
    }
};

/**
 * Get email send log by lineMaintenanceId
 */
export const getEmailLog = async (
    lineMaintenanceId: number
): Promise<EmailLogResponse> => {
    try {
        const res = await axios.get(
            `${API_BASE}/email/log/${lineMaintenanceId}`,
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
