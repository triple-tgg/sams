/**
 * Orders the sidebar by the `sortOrder` set in the DB menus table (Master Data ›
 * Permission Menu). The sidebar structure still comes from lib/menus.ts; only the
 * order of items at each level changes.
 *
 * An item's order is the sortOrder of its permCode. Items without a permCode
 * (group rows) take the smallest order found among their descendants. Items with
 * no order at all keep their place from lib/menus.ts (stable sort, placed last).
 */
import type { Group, Menu, Submenu, SubChildren } from "@/lib/menus";
import { resolvePermission, type PermissionIndex } from "@/lib/permission-utils";
import type { MenuCodeRef } from "@/lib/permission-codes";

type Node = { permCode?: MenuCodeRef; submenus?: Node[]; children?: Node[] };

function ownOrder(index: PermissionIndex, code?: MenuCodeRef): number | undefined {
  if (!code || (typeof code !== "string" && code.length === 0)) return undefined;
  const item = resolvePermission(index, code);
  return typeof item?.sortOrder === "number" ? item.sortOrder : undefined;
}

function orderOf(index: PermissionIndex, node: Node): number {
  const own = ownOrder(index, node.permCode);
  if (own !== undefined) return own;
  let min = Infinity;
  for (const c of [...(node.submenus ?? []), ...(node.children ?? [])]) min = Math.min(min, orderOf(index, c));
  return min;
}

function sortList<T extends Node>(index: PermissionIndex, list: T[]): T[] {
  return list
    .map((item, i) => ({ item, i, o: orderOf(index, item) }))
    .sort((a, b) => (a.o === b.o ? a.i - b.i : a.o - b.o))
    .map(({ item }) => item);
}

function sortChildren(index: PermissionIndex, list: SubChildren[]): SubChildren[] {
  return sortList(index, list).map((c) =>
    c.children?.length ? { ...c, children: sortChildren(index, c.children) } : c
  );
}

function sortSubmenus(index: PermissionIndex, list: Submenu[]): Submenu[] {
  return sortList(index, list).map((s) => ({
    ...s,
    ...(s.submenus?.length ? { submenus: sortSubmenus(index, s.submenus) } : {}),
    ...(s.children?.length ? { children: sortChildren(index, s.children) } : {}),
  }));
}

export function sortMenuListByDb(groups: Group[], index: PermissionIndex): Group[] {
  if (index.size === 0) return groups;
  return groups.map((g) => ({
    ...g,
    menus: sortList(index, g.menus as (Menu & Node)[]).map((m) =>
      m.submenus?.length ? { ...m, submenus: sortSubmenus(index, m.submenus) } : m
    ),
  }));
}
