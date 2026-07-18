"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthorityList, AuthorityListRequest } from "./authorization";

export const authorizationKeys = {
  all: ["authorization"] as const,
  authorityList: (params: AuthorityListRequest) => [...authorizationKeys.all, "authorityList", params] as const,
};

export function useAuthorityList(params: AuthorityListRequest) {
  return useQuery({
    queryKey: authorizationKeys.authorityList(params),
    queryFn: () => getAuthorityList(params),
  });
}
