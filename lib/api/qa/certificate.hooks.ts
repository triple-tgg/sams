"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCertificate,
} from "@/lib/api/qa/certificate";

export const certificateKeys = {
  byEnrollment: (enrollmentId: number) =>
    ["certificate", enrollmentId] as const,
};

/** Fetch certificate data for a given enrollment */
export function useCertificate(enrollmentId: number | null) {
  return useQuery({
    queryKey: certificateKeys.byEnrollment(enrollmentId ?? 0),
    queryFn: () => getCertificate(enrollmentId!),
    enabled: !!enrollmentId,
  });
}
