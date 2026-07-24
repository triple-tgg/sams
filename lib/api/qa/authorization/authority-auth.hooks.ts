"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_AUTHORITY_AUTH_LIST_REQUEST,
  getAuthorityAuthList,
  getAuthorityLicenseDetail,
  upsertAuthorityLicense,
  type AuthorityAuthListRequest,
} from "./authority-auth";
import { authorizationKeys } from "../authorization.hooks";

export const authorityAuthKeys = {
  all: ["authority-auth"] as const,
  lists: () => [...authorityAuthKeys.all, "list"] as const,
  list: (params: AuthorityAuthListRequest) => [...authorityAuthKeys.lists(), params] as const,
  details: () => [...authorityAuthKeys.all, "detail"] as const,
  detail: (id: number | null) => [...authorityAuthKeys.details(), id] as const,
};

export function useAuthorityAuthList(params: AuthorityAuthListRequest = DEFAULT_AUTHORITY_AUTH_LIST_REQUEST) {
  return useQuery({
    queryKey: authorityAuthKeys.list(params),
    queryFn: () => getAuthorityAuthList(params),
  });
}

export function useAuthorityLicenseDetail(id: number | null) {
  return useQuery({
    queryKey: authorityAuthKeys.detail(id),
    queryFn: () => getAuthorityLicenseDetail(id as number),
    enabled: id !== null,
  });
}

export function useUpsertAuthorityLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertAuthorityLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authorityAuthKeys.all });
      queryClient.invalidateQueries({ queryKey: authorizationKeys.all });
    },
  });
}
