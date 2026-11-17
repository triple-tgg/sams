import type { MenuItem } from "@/lib/api/master/menus";

/** Sibling-group key: null = top level. The API may send 0 or null for top level. */
export type ParentKey = number | null;

export const parentKeyOf = (m: Pick<MenuItem, "parentId">): ParentKey =>
  m.parentId && m.parentId > 0 ? m.parentId : null;

/** Unsaved sort orders: menu id → new sortOrder */
export type OrderDraft = Record<number, number>;

export const effectiveOrder = (m: MenuItem, draft: OrderDraft): number =>
  draft[m.id] ?? m.sortOrder ?? 0;

/** Group menus by parent, each group sorted by (draft) sortOrder then id. */
export function buildChildrenMap(menus: MenuItem[], draft: OrderDraft): Map<ParentKey, MenuItem[]> {
  const ids = new Set(menus.map((m) => m.id));
  const map = new Map<ParentKey, MenuItem[]>();
  for (const m of menus) {
    let key = parentKeyOf(m);
    // Orphans (parent missing from the list) are shown at top level so they stay editable
    if (key !== null && !ids.has(key)) key = null;
    const list = map.get(key) ?? [];
    list.push(m);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => effectiveOrder(a, draft) - effectiveOrder(b, draft) || a.id - b.id);
  }
  return map;
}

/** Depth-first flat list with depth, in display order. */
export function flattenTree(
  childrenMap: Map<ParentKey, MenuItem[]>,
  parent: ParentKey = null,
  depth = 0,
  seen = new Set<number>()
): { menu: MenuItem; depth: number }[] {
  const out: { menu: MenuItem; depth: number }[] = [];
  for (const m of childrenMap.get(parent) ?? []) {
    if (seen.has(m.id)) continue; // guard against parent cycles in bad data
    seen.add(m.id);
    out.push({ menu: m, depth });
    out.push(...flattenTree(childrenMap, m.id, depth + 1, seen));
  }
  return out;
}

/** Ids of a menu and everything under it. */
export function subtreeIds(childrenMap: Map<ParentKey, MenuItem[]>, id: number): Set<number> {
  const out = new Set<number>([id]);
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const c of childrenMap.get(cur) ?? []) {
      if (!out.has(c.id)) {
        out.add(c.id);
        stack.push(c.id);
      }
    }
  }
  return out;
}

/**
 * Re-number one sibling group after a drag.
 *
 * The group keeps the same set of sortOrder numbers it already used, handed out
 * again in the new order, so numbering conventions (e.g. 941, 942, 943) survive.
 * Duplicate numbers are bumped so the new order is strictly increasing.
 *
 * Every sub menu of a moved row shifts by the same amount as its row, so a group
 * keeps its numbering relative to its parent (QA 600 → 700 moves 610 → 710, 611 → 711).
 *
 * Returns a new draft; entries equal to the saved value are dropped.
 */
export function reorderSiblings(
  siblings: MenuItem[],
  orderedIds: number[],
  draft: OrderDraft,
  childrenMap?: Map<ParentKey, MenuItem[]>
): OrderDraft {
  const byId = new Map(siblings.map((m) => [m.id, m]));
  const values = siblings.map((m) => effectiveOrder(m, draft)).sort((a, b) => a - b);
  for (let i = 1; i < values.length; i++) {
    if (values[i] <= values[i - 1]) values[i] = values[i - 1] + 1;
  }
  const next: OrderDraft = { ...draft };
  orderedIds.forEach((id, i) => {
    const m = byId.get(id);
    if (!m) return;
    const delta = values[i] - effectiveOrder(m, draft);
    setDraftValue(next, m, values[i]);
    if (delta !== 0 && childrenMap) {
      for (const d of descendants(childrenMap, m.id)) {
        setDraftValue(next, d, effectiveOrder(d, draft) + delta);
      }
    }
  });
  return next;
}

/** All menus under `id` (not including itself). */
export function descendants(childrenMap: Map<ParentKey, MenuItem[]>, id: number): MenuItem[] {
  const out: MenuItem[] = [];
  const seen = new Set<number>([id]);
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const c of childrenMap.get(cur) ?? []) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
      stack.push(c.id);
    }
  }
  return out;
}

/** Set one menu's draft sortOrder, removing the entry when it equals the saved value. */
export function setDraftValue(draft: OrderDraft, m: MenuItem, value: number): OrderDraft {
  if (value === m.sortOrder) delete draft[m.id];
  else draft[m.id] = value;
  return draft;
}

/** Suggested sortOrder for a new menu under `parent`: next number after the last sibling. */
export function nextSortOrder(childrenMap: Map<ParentKey, MenuItem[]>, parent: ParentKey, draft: OrderDraft = {}): number {
  if (parent !== null && !(parent > 0)) parent = null; // 0 / NaN = top level
  const siblings = childrenMap.get(parent) ?? [];
  const max = siblings.reduce((acc, m) => Math.max(acc, effectiveOrder(m, draft)), 0);
  if (parent === null) return Math.floor(max / 100) * 100 + 100; // top-level groups go by hundreds
  if (siblings.length === 0) {
    // First child: parent's number + 1 (e.g. group 950 → 951)
    const parentMenu = [...childrenMap.values()].flat().find((m) => m.id === parent);
    return (parentMenu?.sortOrder ?? 0) + 1;
  }
  return max + 1;
}
