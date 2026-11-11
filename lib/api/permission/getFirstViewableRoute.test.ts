import { describe, it, expect } from "vitest";
import { getFirstViewableRoute } from "./getFirstViewableRoute";
import type { MenuPermissionItem } from "./menuPermissions.interface";

let nextId = 1;
const menu = (
    menuCode: string,
    route: string,
    sortOrder: number,
    over: Partial<MenuPermissionItem> = {}
): MenuPermissionItem => ({
    menuId: nextId++,
    menuCode,
    name: menuCode,
    icon: "",
    route,
    parentId: null,
    sortOrder,
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    children: null,
    ...over,
});

describe("getFirstViewableRoute", () => {
    it("returns the viewable page with the lowest sortOrder", () => {
        expect(
            getFirstViewableRoute([menu("INVOICE", "/invoice", 300), menu("CONTRACT", "/contract", 200)])
        ).toBe("/contract");
    });

    it("returns null when nothing is viewable", () => {
        expect(getFirstViewableRoute([])).toBeNull();
        expect(getFirstViewableRoute([menu("CONTRACT", "/contract", 200, { canView: false })])).toBeNull();
    });

    it("skips a group row and lands on the child the user can actually open", () => {
        // HR is viewable because one child is, but its route points at Staff List.
        const hr = menu("HR", "/hr/staff", 700, {
            children: [
                menu("HR_STAFF", "/hr/staff", 701, { canView: false }),
                menu("HR_STAFF_INCOME", "/hr/employee-income", 702),
            ],
        });
        expect(getFirstViewableRoute([hr])).toBe("/hr/employee-income");
    });

    it("skips a group row whose route has no page", () => {
        const pp = menu("PRODUCTION_PLANNER", "/production-planner/", 500, {
            children: [menu("PRODUCTION_PLAN", "/production-planner/production-plan", 502)],
        });
        expect(getFirstViewableRoute([pp])).toBe("/production-planner/production-plan");
    });

    it("recognises group rows in a flat list linked by parentId", () => {
        const hr = menu("HR", "/hr/staff", 700);
        const income = menu("HR_STAFF_INCOME", "/hr/employee-income", 702, { parentId: hr.menuId });
        expect(getFirstViewableRoute([hr, income])).toBe("/hr/employee-income");
    });

    it("skips a page whose route is guarded by a different code", () => {
        // Row says /flight, but the route guard requires FLIGHT_LIST.
        expect(
            getFirstViewableRoute([menu("SOMETHING_ELSE", "/flight", 100), menu("REPORT", "/report", 400)])
        ).toBe("/report");
    });

    it("ignores rows without a route", () => {
        expect(getFirstViewableRoute([menu("THF", "", 130), menu("REPORT", "/report", 400)])).toBe("/report");
        expect(getFirstViewableRoute([menu("X", "#", 1), menu("REPORT", "/report", 400)])).toBe("/report");
    });
});
