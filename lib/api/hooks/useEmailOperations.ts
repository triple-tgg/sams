"use client";
import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseQueryResult,
} from "@tanstack/react-query";
import {
    getEmailPreview,
    sendEmail,
    getEmailLog,
} from "@/lib/api/email/emailOperations";
import type {
    EmailPreviewResponse,
    EmailSendResponse,
    EmailLogResponse,
} from "@/lib/api/email/email.interface";

/**
 * Hook to fetch email preview by lineMaintenanceId
 */
export const useEmailPreview = (
    lineMaintenanceId: number,
    enabled: boolean = true
): UseQueryResult<EmailPreviewResponse, Error> => {
    return useQuery({
        queryKey: ["email-preview", lineMaintenanceId],
        queryFn: () => getEmailPreview(lineMaintenanceId),
        enabled: enabled && lineMaintenanceId > 0,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to fetch email send log by lineMaintenanceId
 */
export const useEmailLog = (
    lineMaintenanceId: number,
    enabled: boolean = true
): UseQueryResult<EmailLogResponse, Error> => {
    return useQuery({
        queryKey: ["email-log", lineMaintenanceId],
        queryFn: () => getEmailLog(lineMaintenanceId),
        enabled: enabled && lineMaintenanceId > 0,
        staleTime: 1 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to send email by lineMaintenanceId
 */
export const useSendEmail = () => {
    const queryClient = useQueryClient();

    return useMutation<EmailSendResponse, Error, number>({
        mutationFn: (lineMaintenanceId: number) => sendEmail(lineMaintenanceId),
        mutationKey: ["email-send"],
        onSuccess: (_data, lineMaintenanceId) => {
            // Refetch log and preview after successful send
            queryClient.invalidateQueries({
                queryKey: ["email-log", lineMaintenanceId],
            });
            queryClient.invalidateQueries({
                queryKey: ["email-preview", lineMaintenanceId],
            });
        },
        onError: (error) => {
            console.error("Email send failed:", error);
        },
    });
};
