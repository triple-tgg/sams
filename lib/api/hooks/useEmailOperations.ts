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
 * Hook to fetch email preview data for a flight
 */
export const useEmailPreview = (
    flightInfosId: number,
    enabled: boolean = true
): UseQueryResult<EmailPreviewResponse, Error> => {
    return useQuery({
        queryKey: ["email-preview", flightInfosId],
        queryFn: () => getEmailPreview(flightInfosId),
        enabled: enabled && flightInfosId > 0,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to fetch email send log for a flight
 */
export const useEmailLog = (
    flightInfosId: number,
    enabled: boolean = true
): UseQueryResult<EmailLogResponse, Error> => {
    return useQuery({
        queryKey: ["email-log", flightInfosId],
        queryFn: () => getEmailLog(flightInfosId),
        enabled: enabled && flightInfosId > 0,
        staleTime: 1 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to send email for a flight
 */
export const useSendEmail = () => {
    const queryClient = useQueryClient();

    return useMutation<EmailSendResponse, Error, number>({
        mutationFn: (flightInfosId: number) => sendEmail(flightInfosId),
        mutationKey: ["email-send"],
        onSuccess: (_data, flightInfosId) => {
            // Refetch log after successful send
            queryClient.invalidateQueries({
                queryKey: ["email-log", flightInfosId],
            });
        },
        onError: (error) => {
            console.error("Email send failed:", error);
        },
    });
};
