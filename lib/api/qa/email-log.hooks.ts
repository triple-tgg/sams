"use client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getEmailLogDatalist, getEmailLogDepartmentList, getEmailLogInstructorList, previewEmailConfirmed, previewEmailDepartment, previewEmailInstructor, sendEmailDepartment, sendEmailInstructor, type EmailLogRequest, type EmailLogDepartmentRequest, type EmailLogInstructorRequest } from "@/lib/api/qa/email-log";

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
  /** /training/email-log-department-list */
  departmentList: (scheduleId?: number, staffId?: number) =>
    ["emailLogDepartmentList", scheduleId, staffId] as const,
  /** /training/email-log-instructor-list */
  instructorList: (scheduleId?: number) =>
    ["emailLogInstructorList", scheduleId] as const,
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

/** Fetch email log department list */
export function useEmailLogDepartmentList(scheduleId?: number, staffId?: number, enabled = true) {
  return useQuery({
    queryKey: emailLogKeys.departmentList(scheduleId, staffId),
    queryFn: () => getEmailLogDepartmentList({ trainingScheduleId: scheduleId, staffId }),
    enabled: enabled && (!!scheduleId || !!staffId),
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

/** Fetch email log instructor list */
export function useEmailLogInstructorList(scheduleId?: number, enabled = true) {
  return useQuery({
    queryKey: emailLogKeys.instructorList(scheduleId),
    queryFn: () => getEmailLogInstructorList({ trainingScheduleId: scheduleId }),
    enabled: enabled && !!scheduleId,
  });
}

/** Mutation: preview instructor email HTML */
export function usePreviewEmailInstructor() {
  return useMutation({
    mutationFn: (scheduleId: number) => previewEmailInstructor({ scheduleId }),
  });
}

/** Mutation: send instructor email */
export function useSendEmailInstructor() {
  return useMutation({
    mutationFn: (data: { scheduleId: number; subject: string; emailFrom: string | null; emailCc: string | null }) =>
      sendEmailInstructor(data),
  });
}
