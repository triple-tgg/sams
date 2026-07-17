"use client";
import { useQuery } from "@tanstack/react-query";
import { getAttendanceSheet } from "@/lib/api/qa/attendance-sheet";

// ──────────────────────────────────────────────────────────────
// Query Keys
// ──────────────────────────────────────────────────────────────

export const attendanceSheetKeys = {
  detail: (scheduleId: number) => ["attendanceSheet", scheduleId] as const,
};

// ──────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────

/** Fetch attendance sheet data for printing */
export function useAttendanceSheet(scheduleId: number, enabled = true) {
  return useQuery({
    queryKey: attendanceSheetKeys.detail(scheduleId),
    queryFn: () => getAttendanceSheet(scheduleId),
    enabled: enabled && !!scheduleId,
  });
}
