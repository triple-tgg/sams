"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCertificate,
  getCertificateList,
} from "@/lib/api/qa/certificate";

export const certificateKeys = {
  byEnrollment: (enrollmentId: number) =>
    ["certificate", enrollmentId] as const,
  list: (enrollmentIds: number[]) =>
    ["certificateList", ...enrollmentIds] as const,
};

/** Fetch certificate data for a given enrollment */
export function useCertificate(enrollmentId: number | null) {
  return useQuery({
    queryKey: certificateKeys.byEnrollment(enrollmentId ?? 0),
    queryFn: () => getCertificate(enrollmentId!),
    enabled: !!enrollmentId,
  });
}

/** Fetch certificate data for multiple enrollments */
export function useCertificateList(enrollmentIds: number[], enabled = true) {
  return useQuery({
    queryKey: certificateKeys.list(enrollmentIds),
    queryFn: () => getCertificateList(enrollmentIds),
    enabled: enabled && enrollmentIds.length > 0,
  });
}
