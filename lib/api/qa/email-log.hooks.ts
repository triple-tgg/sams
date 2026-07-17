"use client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getEmailLogDatalist, previewEmailConfirmed, previewEmailDepartment, sendEmailDepartment, type EmailLogRequest } from "@/lib/api/qa/email-log";

// ──────────────────────────────────────────────────────────────
// Query Keys (central registry for cache management)
// ──────────────────────────────────────────────────────────────
export const emailLogKeys = {
  /** /training/email-log-datalist */
  datalist: (scheduleId: number, staffId: number) =>
    ["emailLogDatalist", scheduleId, staffId] as const,
  /** /training/preview-email-confirmed */
  preview: (scheduleId: number, staffId: number) =>
    ["previewEmailConfirmed", scheduleId, staffId] as const,
};

// ──────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────

/** Fetch email logs for a specific schedule + staff */
export function useEmailLogDatalist(scheduleId: number, staffId: number, enabled = true) {
  return useQuery({
    queryKey: emailLogKeys.datalist(scheduleId, staffId),
    queryFn: () => getEmailLogDatalist({ trainingScheduleId: scheduleId, staffId }),
    enabled: enabled && !!scheduleId && !!staffId,
  });
}

/** Fetch HTML preview of the confirmed-session email */
export function usePreviewEmailConfirmed(scheduleId: number, staffId: number, enabled = true) {
  return useQuery({
    queryKey: emailLogKeys.preview(scheduleId, staffId),
    queryFn: () => previewEmailConfirmed({ scheduleId, staffId }),
    enabled: enabled && !!scheduleId && !!staffId,
  });
}

/** Hook to manually invalidate email log cache (call after sending email) */
export function useInvalidateEmailLogs() {
  const qc = useQueryClient();
  return (scheduleId: number, staffId: number) => {
    qc.invalidateQueries({ queryKey: emailLogKeys.datalist(scheduleId, staffId) });
  };
}

/** Mutation: preview department manager report email HTML */
export function usePreviewEmailDepartment() {
  return useMutation({
    mutationFn: (scheduleId: number) => previewEmailDepartment({ scheduleId }),
  });
}

/** Mutation: send department manager report email */
export function useSendEmailDepartment() {
  return useMutation({
    mutationFn: (data: { scheduleId: number; subject: string; emailFrom: string | null; emailCc: string | null }) =>
      sendEmailDepartment(data),
  });
}
