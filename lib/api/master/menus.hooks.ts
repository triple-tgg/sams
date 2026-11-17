"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMenuList,
  getMenuById,
  upsertMenu,
  isMenuUpsertSuccess,
  type MenuUpsertRequest,
} from "@/lib/api/master/menus";

export const menuKeys = {
  all: ["menus"] as const,
  list: () => [...menuKeys.all, "list"] as const,
  detail: (id: number) => [...menuKeys.all, "detail", id] as const,
};

/** Fetch all menus */
export function useMenuList() {
  return useQuery({
    queryKey: menuKeys.list(),
    queryFn: getMenuList,
    refetchOnWindowFocus: false,
  });
}

/** Fetch one menu (enabled only for a real id) */
export function useMenuById(id: number, enabled = true) {
  return useQuery({
    queryKey: menuKeys.detail(id),
    queryFn: () => getMenuById(id),
    enabled: enabled && id > 0,
    refetchOnWindowFocus: false,
  });
}

/** Create or update one menu */
export function useUpsertMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MenuUpsertRequest) => upsertMenu(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menuKeys.all });
      // Role & Permission reads menu order/name from the menu table
      qc.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
}

/**
 * Save the sort order of several menus. The API only upserts one row at a
 * time, so this sends one upsert per changed row and reports which failed.
 */
export function useSaveMenuOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: MenuUpsertRequest[]) => {
      const results = await Promise.allSettled(rows.map((r) => upsertMenu(r)));
      const failed = rows.filter((_, i) => {
        const r = results[i];
        return r.status === "rejected" || !isMenuUpsertSuccess(r.value);
      });
      return { saved: rows.length - failed.length, failed };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: menuKeys.all });
      // Role & Permission reads menu order/name from the menu table
      qc.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
}
