"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSchedulerDashboardCalendar,
  getSchedulerCalendar,
  getSchedulerById,
  upsertScheduler,
  deleteScheduler,
  type SchedulerCalendarRequest,
  type SchedulerSessionDetail,
  type SchedulerUpsertRequest,
} from "@/lib/api/qa/scheduler";
import type { Session } from "@/app/[locale]/(protected)/qa/training-scheduler/types";

// ──────────────────────────────────────────────────────────────
// Query Keys
// ──────────────────────────────────────────────────────────────

export const schedulerKeys = {
  all: ["scheduler"] as const,
  calendar: (req: SchedulerCalendarRequest) => ["scheduler", "calendar", req] as const,
  dashboard: (req: SchedulerCalendarRequest) => ["scheduler", "dashboard", req] as const,
  detail: (id: number) => ["scheduler", "detail", id] as const,
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/** Map raw API detail → page-level Session shape */
export function mapSchedulerDetailToSession(d: SchedulerSessionDetail): Session {
  const startDate = d.startDate?.split("T")[0] ?? "";
  const endDate = d.endDate?.split("T")[0] ?? "";

  return {
    id: d.id,
    courseId: d.courseId,
    courseName: d.courseObj?.courseName ?? "",
    courseCode: d.courseObj?.courseCode ?? "",
    category: d.categoryObj?.name ?? "",
    dateStart: startDate,
    dateEnd: endDate,
    timeStart: d.startDate?.split("T")[1]?.substring(0, 5) ?? "",
    timeEnd: d.endDate?.split("T")[1]?.substring(0, 5) ?? "",
    instructor: d.instructor ?? "",
    venue: d.venue ?? "",
    dept: "",
    maxParticipants: d.maxParticipants ?? 0,
    enrolled: d.enrolledCount ?? 0,
    status: d.trainingDataStatusesId === 1 ? "Scheduled" : "Scheduled",
    type: d.courseObj?.courseType ?? "",
    objective: d.courseObj?.courseObjective ?? undefined,
    note: d.courseObj?.additionalNote || d.note || undefined,
    trainingAttendanceTypeId: d.trainingAttendanceTypeObj?.id || 1,
  };
}

// ──────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────

/** Fetch a single scheduler session by ID, pre-mapped to Session */
export function useSchedulerById(id: number) {
  return useQuery({
    queryKey: schedulerKeys.detail(id),
    queryFn: async () => {
      const res = await getSchedulerById(id);
      return mapSchedulerDetailToSession(res.responseData);
    },
    enabled: !!id,
  });
}

/** Fetch scheduler calendar sessions */
export function useSchedulerCalendar(req: SchedulerCalendarRequest) {
  return useQuery({
    queryKey: schedulerKeys.calendar(req),
    queryFn: () => getSchedulerCalendar(req),
    enabled: !!req.year,
  });
}

/** Fetch scheduler dashboard summary */
export function useSchedulerDashboard(req: SchedulerCalendarRequest) {
  return useQuery({
    queryKey: schedulerKeys.dashboard(req),
    queryFn: () => getSchedulerDashboardCalendar(req),
    enabled: !!req.year,
  });
}

// ──────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────

/** Create or update a scheduler session */
export function useUpsertScheduler() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SchedulerUpsertRequest) => upsertScheduler(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: schedulerKeys.all });
    },
  });
}

/** Delete a scheduler session */
export function useDeleteScheduler() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; userName: string }) => deleteScheduler(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: schedulerKeys.all });
    },
  });
}
