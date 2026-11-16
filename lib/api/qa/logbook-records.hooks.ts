"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLogbookRecordsList,
  getAllLogbookRecords,
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

/** All records for one staff member (no paging), for the Maintenance Experiences Logbook Records form. */
export function useAllLogbookRecords(
  filter: Omit<LogbookRecordsListRequest, "page" | "perPage">,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...logbookRecordsKeys.all, "all", filter] as const,
    queryFn: () => getAllLogbookRecords(filter),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
