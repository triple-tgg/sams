"use client";
import { useQuery } from "@tanstack/react-query";
import { getAuthorityAuthList } from "./authority-auth";

export const authorityAuthKeys = {
  all: ["authority-auth"] as const,
  lists: () => [...authorityAuthKeys.all, "list"] as const,
};

export function useAuthorityAuthList() {
  return useQuery({
    queryKey: authorityAuthKeys.lists(),
    queryFn: () => getAuthorityAuthList(),
  });
}
