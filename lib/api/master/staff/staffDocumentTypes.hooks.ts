"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getStaffDocumentTypes,
} from "@/lib/api/master/staff/staffDocumentTypes";

export const staffDocumentTypeKeys = {
  list: ["staffDocumentTypes"] as const,
};

/** Fetch all staff document types */
export function useStaffDocumentTypes() {
  return useQuery({
    queryKey: staffDocumentTypeKeys.list,
    queryFn: getStaffDocumentTypes,
    staleTime: 10 * 60 * 1000, // document types rarely change
  });
}
