"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getVerificationList,
  approveDocument,
  type VerificationListRequest,
  type ApproveDocumentRequest,
} from "@/lib/api/hr/documentVerification";

export const verificationKeys = {
  list: (params: VerificationListRequest) =>
    ["verificationList", params] as const,
  all: ["verificationList"] as const,
};

/** Fetch paginated document verification list */
export function useVerificationList(params: VerificationListRequest) {
  return useQuery({
    queryKey: verificationKeys.list(params),
    queryFn: () => getVerificationList(params),
  });
}

/** Approve or reject a document */
export function useApproveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, data }: { staffId: number; data: ApproveDocumentRequest }) =>
      approveDocument(staffId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: verificationKeys.all });
    },
  });
}
