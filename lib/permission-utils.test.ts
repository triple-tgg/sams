import { describe, expect, it } from "vitest";
import type { MenuPermissionItem } from "@/lib/api/permission/menuPermissions.interface";
import {
    buildPermissionIndex,
    getPermissionFlags,
    hasPermission,
    normalizeMenuCode,
} from "@/lib/permission-utils";
import { canAccessRoute, findRoutePermission } from "@/lib/route-permissions";
import { MENU } from "@/lib/permission-codes";

function item(menuCode: string, flags: Partial<MenuPermissionItem> = {}, children: MenuPermissionItem[] = []): MenuPermissionItem {
    return {
        menuId: 0,
        menuCode,
        name: menuCode,
        icon: "",
        route: "",
        parentId: null,
        sortOrder: 0,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
        children,
        ...flags,
    };
}

describe("normalizeMenuCode", () => {
    it("treats spaces, underscores and case the same", () => {
        expect(normalizeMenuCode("FLIGHT ROSTER")).toBe("FLIGHT_ROSTER");
        expect(normalizeMenuCode(" flight_roster ")).toBe("FLIGHT_ROSTER");
        expect(normalizeMenuCode("Certifying  Staff")).toBe("CERTIFYING_STAFF");
    });
});

describe("buildPermissionIndex / getPermissionFlags", () => {
    const index = buildPermissionIndex([
        item("ROSTER", { canView: true }, [item("FLIGHT ROSTER", { canView: true, canEdit: true })]),
        item("HR", { canView: true }, [item("HR_STAFF", { canView: true, canCreate: true })]),
    ]);

    it("finds nested codes regardless of spelling", () => {
        expect(getPermissionFlags(index, MENU.FLIGHT_ROSTER).canEdit).toBe(true);
        expect(getPermissionFlags(index, "flight_roster").canView).toBe(true);
    });

    it("denies everything for an unknown code", () => {
        expect(getPermissionFlags(index, "NOPE")).toEqual({
            canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false,
        });
    });

    it("walks the legacy `submenus` key too", () => {
        const idx = buildPermissionIndex([{ ...item("A"), children: null, submenus: [item("B", { canView: true })] } as any]);
        expect(hasPermission(idx, "B")).toBe(true);
    });
});

describe("fallback refs (first code present decides)", () => {
    it("uses the fallback when the preferred code is not registered", () => {
        const index = buildPermissionIndex([item("OLD_CODE", { canView: true, canCreate: true })]);
        expect(hasPermission(index, ["NEW_CODE", "OLD_CODE"], "canCreate")).toBe(true);
    });

    it("uses the preferred code once registered, even if it denies", () => {
        const index = buildPermissionIndex([
            item("OLD_CODE", { canView: true, canCreate: true }),
            item("NEW_CODE", { canView: true, canCreate: false }),
        ]);
        expect(hasPermission(index, ["NEW_CODE", "OLD_CODE"], "canCreate")).toBe(false);
        expect(hasPermission(index, ["NEW_CODE", "OLD_CODE"], "canView")).toBe(true);
    });

    it("accepts a list of actions as any-of", () => {
        const index = buildPermissionIndex([item("THF", { canEdit: true })]);
        expect(hasPermission(index, MENU.THF, ["canCreate", "canEdit"])).toBe(true);
        expect(hasPermission(index, MENU.THF, ["canCreate", "canDelete"])).toBe(false);
    });

    it("does not let Flight List rights open THF (THF has its own permission)", () => {
        const index = buildPermissionIndex([
            item("FLIGHT", { canView: true }, [item("Flight_List", { canView: true, canCreate: true, canEdit: true })]),
        ]);
        expect(hasPermission(index, MENU.THF, ["canCreate", "canEdit"])).toBe(false);
        expect(canAccessRoute(index, "/flight/thf/create")).toBe(false);
        expect(canAccessRoute(index, "/flight/list")).toBe(true);
    });

    it("does not let the FLIGHT group (computed from THF) open the Flight List", () => {
        const index = buildPermissionIndex([
            item("FLIGHT", { canView: true }, [
                item("Flight_List", { canView: false }),
                item("THF", { canView: true, canCreate: true }),
            ]),
        ]);
        expect(canAccessRoute(index, "/flight")).toBe(false);
        expect(canAccessRoute(index, "/flight/thf/create")).toBe(true);
    });
});

describe("route permissions", () => {
    it("matches the most specific route first", () => {
        expect(findRoutePermission("/hr/staff/new")?.action).toBe("canCreate");
        expect(findRoutePermission("/hr/staff/123")?.menuCodes).toBe(MENU.HR_STAFF);
        expect(findRoutePermission("/flight/thf/create")?.menuCodes).toBe(MENU.THF);
        expect(findRoutePermission("/flight/list")?.menuCodes).toBe(MENU.FLIGHT_LIST);
        expect(findRoutePermission("/roster/manpower/planning")?.menuCodes).toBe(MENU.MANPOWER_ANALYSIS);
    });

    it("returns null for unlisted routes", () => {
        expect(findRoutePermission("/confirm-attendance")).toBeNull();
    });

    it("requires canCreate for the new-staff page, canView for the list", () => {
        const viewOnly = buildPermissionIndex([item("HR_STAFF", { canView: true })]);
        expect(canAccessRoute(viewOnly, "/hr/staff")).toBe(true);
        expect(canAccessRoute(viewOnly, "/hr/staff/new")).toBe(false);
        expect(canAccessRoute(viewOnly, "/hr/staff/new/")).toBe(false);

        const creator = buildPermissionIndex([item("HR_STAFF", { canView: true, canCreate: true })]);
        expect(canAccessRoute(creator, "/hr/staff/new")).toBe(true);
    });

    it("checks the AMO145 route by its own code only (no fallback to Department)", () => {
        const deptOnly = buildPermissionIndex([item("MASTER_DATA_DEPARTMENT", { canView: true })]);
        expect(canAccessRoute(deptOnly, "/master-data/department-amo145")).toBe(false);
        const amo = buildPermissionIndex([item("MASTER_DATA_DEPARTMENT_AMO145", { canView: true })]);
        expect(canAccessRoute(amo, "/master-data/department-amo145")).toBe(true);
    });
});
