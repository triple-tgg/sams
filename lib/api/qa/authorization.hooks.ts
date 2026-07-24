"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthorityList, getAuthorityAll, upsertAuthorityLicense, getAuthorityById, AuthorityListRequest } from "./authorization";

export const authorizationKeys = {
  all: ["authorization"] as const,
  authorityList: (params: AuthorityListRequest) => [...authorizationKeys.all, "authorityList", params] as const,
  authorityAll: () => [...authorizationKeys.all, "authorityAll"] as const,
  authorityById: (id: number | string) => [...authorizationKeys.all, "authorityById", id] as const,
};

export function useAuthorityList(params: AuthorityListRequest) {
  return useQuery({
    queryKey: authorizationKeys.authorityList(params),
    queryFn: () => getAuthorityList(params),
  });
}

export function useAuthorityAll() {
  return useQuery({
    queryKey: authorizationKeys.authorityAll(),
    queryFn: () => getAuthorityAll(),
  });
}

export function useAuthorityById(id: number | string) {
  return useQuery({
    queryKey: authorizationKeys.authorityById(id),
    queryFn: () => getAuthorityById(id),
    enabled: !!id,
  });
}

export function useUpsertAuthorityLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => upsertAuthorityLicense(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authorizationKeys.all });
    },
  });
}
