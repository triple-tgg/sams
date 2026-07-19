"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSamsAuthList, getSamsAuthById, upsertSamsAuth, SamsAuthListRequest, SamsAuthUpsertRequest } from "./sams-auth";

export const samsAuthKeys = {
  all: ["sams-auth"] as const,
  list: (params: SamsAuthListRequest) => [...samsAuthKeys.all, "list", params] as const,
  detail: (staffId: number) => [...samsAuthKeys.all, "detail", staffId] as const,
};

export function useSamsAuthList(params: SamsAuthListRequest) {
  return useQuery({
    queryKey: samsAuthKeys.list(params),
    queryFn: () => getSamsAuthList(params),
    placeholderData: (previousData) => previousData, // keep previous data while fetching
  });
}

export function useSamsAuthById(staffId: number | null) {
  return useQuery({
    queryKey: samsAuthKeys.detail(staffId!),
    queryFn: () => getSamsAuthById(staffId!),
    enabled: staffId !== null,
  });
}

export function useUpsertSamsAuth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SamsAuthUpsertRequest) => upsertSamsAuth(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: samsAuthKeys.all });
    },
  });
}
