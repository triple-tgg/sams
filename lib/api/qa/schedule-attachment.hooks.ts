"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertScheduleAttachment, type ScheduleAttachmentUpsertRequest } from "@/lib/api/qa/schedule-attachment";
import { schedulerKeys } from "@/lib/api/qa/scheduler.hooks";

// ──────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────

/** Upsert a schedule attachment, then invalidate scheduler detail cache */
export function useUpsertScheduleAttachment(scheduleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ScheduleAttachmentUpsertRequest) => upsertScheduleAttachment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: schedulerKeys.detail(scheduleId) });
    },
  });
}
