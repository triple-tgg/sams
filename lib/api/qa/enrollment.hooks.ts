"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStaffForEnrollment,
  getEnrolledStaffList,
  enrollStaff,
  unenrollStaff,
  sendEmailList,
  type EnrollRequest,
  type UnenrollRequest,
  type StaffListRequest,
  type SendEmailListRequest,
} from "@/lib/api/qa/enrollment";

// ──────────────────────────────────────────────────────────────
// Query Keys (central registry for cache management)
// ──────────────────────────────────────────────────────────────
export const enrollmentKeys = {
  /** /training/enrollment/staff-for-enrollment/{id} */
  staffForEnrollment: (scheduleId: number) => ["staffForEnrollment", scheduleId] as const,
  /** /training/enrollment/staff-list */
  enrolledList: (scheduleId: number) => ["enrolledStaffList", scheduleId] as const,
  /** /training/scheduler/byid/{id} */
  sessionDetail: (scheduleId: number) => [`/training/scheduler/byid/${scheduleId}`] as const,
};

// ──────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────

/** Fetch available staff for enrollment */
export function useStaffForEnrollment(scheduleId: number) {
  return useQuery({
    queryKey: enrollmentKeys.staffForEnrollment(scheduleId),
    queryFn: () => getStaffForEnrollment(scheduleId),
    enabled: !!scheduleId,
  });
}

/** Fetch enrolled staff list (paginated, keyword search) */
export function useEnrolledStaffList(params: StaffListRequest) {
  return useQuery({
    queryKey: [...enrollmentKeys.enrolledList(params.scheduleId), params.page, params.searchKeyword] as const,
    queryFn: () => getEnrolledStaffList(params),
    enabled: !!params.scheduleId,
  });
}

// ──────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────

/** Enroll a staff member into a training session */
export function useEnrollStaff(scheduleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EnrollRequest) => enrollStaff(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.enrolledList(scheduleId) });
      qc.invalidateQueries({ queryKey: enrollmentKeys.staffForEnrollment(scheduleId) });
      qc.invalidateQueries({ queryKey: enrollmentKeys.sessionDetail(scheduleId) });
    },
  });
}

/** Unenroll (remove) a staff member from a training session */
export function useUnenrollStaff(scheduleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UnenrollRequest) => unenrollStaff(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.enrolledList(scheduleId) });
      qc.invalidateQueries({ queryKey: enrollmentKeys.staffForEnrollment(scheduleId) });
      qc.invalidateQueries({ queryKey: enrollmentKeys.sessionDetail(scheduleId) });
    },
  });
}

/** Send email notifications to selected enrolled staff */
export function useSendEmailList(scheduleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendEmailListRequest) => sendEmailList(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.enrolledList(scheduleId) });
    },
  });
}
