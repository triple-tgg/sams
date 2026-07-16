"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getStaffDocumentStatuses,
} from "@/lib/api/master/staff/staffDocumentStatuses";

export const staffDocumentStatusKeys = {
  list: ["staffDocumentStatuses"] as const,
};

/** Fetch all staff document statuses */
export function useStaffDocumentStatuses() {
  return useQuery({
    queryKey: staffDocumentStatusKeys.list,
    queryFn: getStaffDocumentStatuses,
    staleTime: 10 * 60 * 1000, // statuses rarely change
  });
}
