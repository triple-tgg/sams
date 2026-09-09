"use client";

import { useQuery } from "@tanstack/react-query";
import { getAmelCategories, AmelCategory } from "./amel-categories";

export const amelCategoryKeys = {
  all: ["amelCategories"] as const,
};

export function useAmelCategories() {
  return useQuery<AmelCategory[]>({
    queryKey: amelCategoryKeys.all,
    queryFn: getAmelCategories,
    staleTime: 5 * 60 * 1000,
  });
}
