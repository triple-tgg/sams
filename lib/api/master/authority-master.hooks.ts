"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAuthorityMasterList,
  upsertAuthorityMaster,
  deleteAuthorityMaster,
  type AuthorityMasterUpsertRequest,
  type AuthorityMasterDeleteRequest,
} from "@/lib/api/master/authority-master";

export const authorityMasterKeys = {
  all: ["authority-master"] as const,
  list: () => [...authorityMasterKeys.all, "list"] as const,
};

/** Fetch all authority masters */
export function useAuthorityMasterList() {
  return useQuery({
    queryKey: authorityMasterKeys.list(),
    queryFn: getAuthorityMasterList,
  });
}

/** Create or update an authority master */
export function useUpsertAuthorityMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AuthorityMasterUpsertRequest) => upsertAuthorityMaster(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorityMasterKeys.all });
    },
  });
}

/** Delete an authority master */
export function useDeleteAuthorityMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AuthorityMasterDeleteRequest) => deleteAuthorityMaster(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorityMasterKeys.all });
    },
  });
}
