import { describe, expect, it } from "vitest";
import type { MenuItem } from "@/lib/api/master/menus";
import { buildChildrenMap, flattenTree, nextSortOrder, reorderSiblings, subtreeIds } from "./menu-tree";

const m = (id: number, parentId: number | null, sortOrder: number): MenuItem => ({
  id, parentId, sortOrder, menuCode: `M${id}`, name: `Menu ${id}`, icon: null, route: null, isActive: true,
});

const menus = [m(44, 34, 940), m(45, 44, 941), m(46, 44, 942), m(47, 44, 943), m(34, null, 900), m(1, 0, 100)];

describe("menu-tree", () => {
  it("groups by parent (0 and null are both top level) and sorts by sortOrder", () => {
    const map = buildChildrenMap(menus, {});
    expect(map.get(null)!.map((x) => x.id)).toEqual([1, 34]);
    expect(map.get(44)!.map((x) => x.id)).toEqual([45, 46, 47]);
    expect(flattenTree(map).map((x) => [x.menu.id, x.depth])).toEqual([
      [1, 0], [34, 0], [44, 1], [45, 2], [46, 2], [47, 2],
    ]);
  });

  it("reorder reuses the group's numbers in the new order", () => {
    const siblings = buildChildrenMap(menus, {}).get(44)!;
    const draft = reorderSiblings(siblings, [47, 45, 46], {});
    expect(draft).toEqual({ 47: 941, 45: 942, 46: 943 });
    // moving back drops the draft entries
    expect(reorderSiblings(siblings, [45, 46, 47], draft)).toEqual({});
  });

  it("reorder makes duplicate numbers strictly increasing", () => {
    const sib = [m(1, 5, 10), m(2, 5, 10), m(3, 5, 10)];
    expect(reorderSiblings(sib, [3, 2, 1], {})).toEqual({ 2: 11, 1: 12 }); // id 3 keeps its saved 10
  });

  it("reorder shifts sub menus with their parent", () => {
    const data = [
      m(6, null, 600), m(61, 6, 610), m(62, 61, 611),
      m(7, null, 700), m(71, 7, 710),
    ];
    const map = buildChildrenMap(data, {});
    const draft = reorderSiblings(map.get(null)!, [7, 6], {}, map);
    expect(draft).toEqual({ 7: 600, 71: 610, 6: 700, 61: 710, 62: 711 });
    // dragging back again cancels everything
    const map2 = buildChildrenMap(data, draft);
    expect(reorderSiblings(map2.get(null)!, [6, 7], draft, map2)).toEqual({});
  });

  it("suggests the next free sortOrder", () => {
    const map = buildChildrenMap(menus, {});
    expect(nextSortOrder(map, 44)).toBe(944);
    expect(nextSortOrder(map, 45)).toBe(942); // first child of 941
    expect(nextSortOrder(map, null)).toBe(1000);
  });

  it("collects a subtree", () => {
    expect([...subtreeIds(buildChildrenMap(menus, {}), 34)].sort((a, b) => a - b)).toEqual([34, 44, 45, 46, 47]);
  });
});
