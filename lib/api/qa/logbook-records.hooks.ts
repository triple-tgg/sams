"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLogbookRecordsList,
  type LogbookRecordsListRequest,
} from "@/lib/api/qa/logbook-records";

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const logbookRecordsKeys = {
  all: ["logbook-records"] as const,
  list: (params: LogbookRecordsListRequest) =>
    [...logbookRecordsKeys.all, "list", params] as const,
};

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useLogbookRecordsList(
  params: LogbookRecordsListRequest,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: logbookRecordsKeys.list(params),
    queryFn: () => getLogbookRecordsList(params),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
