import { describe, expect, it } from "vitest";
import type { Group } from "@/lib/menus";
import { buildPermissionIndex } from "@/lib/permission-utils";
import { sortMenuListByDb } from "./sidebar-order";

const perm = (menuCode: string, sortOrder: number) =>
  ({ menuId: 0, menuCode, name: menuCode, icon: "", route: "", parentId: null, sortOrder,
     canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, children: null }) as any;

const sub = (label: string, permCode?: string, children?: any[]) =>
  ({ href: "/" + label, label, active: false, icon: null, permCode, children });
const menu = (label: string, submenus: any[], permCode?: string) =>
  ({ id: label, href: "/" + label, label, active: false, icon: null, submenus, permCode });

describe("sortMenuListByDb", () => {
  const groups: Group[] = [{
    id: "g", groupLabel: "",
    menus: [
      menu("Flight", [sub("List", "FLIGHT_LIST")]),
      menu("Contract", [], "CONTRACT"),
      menu("HR", [sub("Staff", "HR_STAFF"), sub("Workload", "HR_WORKLOAD")]),
      menu("Unknown", [], "NOT_IN_DB"),
    ],
  }];

  it("orders each level by DB sortOrder; groups use their smallest child", () => {
    const index = buildPermissionIndex([
      perm("FLIGHT_LIST", 310), perm("CONTRACT", 200), perm("HR_STAFF", 102), perm("HR_WORKLOAD", 101),
    ]);
    const out = sortMenuListByDb(groups, index)[0].menus;
    expect(out.map((m) => m.label)).toEqual(["HR", "Contract", "Flight", "Unknown"]);
    expect(out[0].submenus.map((s) => s.label)).toEqual(["Workload", "Staff"]);
  });

  it("orders nested children", () => {
    const g: Group[] = [{ id: "g", groupLabel: "", menus: [
      menu("MD", [sub("System", undefined, [sub("Role", "ROLE"), sub("Station", "STATION")])]),
    ] }];
    const out = sortMenuListByDb(g, buildPermissionIndex([perm("ROLE", 943), perm("STATION", 941)]));
    expect(out[0].menus[0].submenus[0].children!.map((c) => c.label)).toEqual(["Station", "Role"]);
  });

  it("leaves the list alone without DB data", () => {
    expect(sortMenuListByDb(groups, new Map())).toBe(groups);
  });
});
