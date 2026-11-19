import { describe, it, expect } from "vitest";
import {
    resolveAuthRedirect,
    stripLocale,
    getLocaleFromPathname,
    FALLBACK_ROUTE,
    PROFILE_ROUTE,
} from "./resolveAuthRedirect";
import type { MenuPermissionItem } from "@/lib/api/permission/menuPermissions.interface";

const menu = (
    over: Partial<MenuPermissionItem> & { menuCode: string; route: string }
): MenuPermissionItem => ({
    menuId: 1,
    name: over.menuCode,
    icon: "",
    parentId: null,
    sortOrder: 1,
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    children: null,
    ...over,
});

const FLIGHT = menu({ menuId: 1, menuCode: "FLIGHT_LIST", route: "/flight", sortOrder: 1 });
const INVOICE = menu({ menuId: 2, menuCode: "INVOICE", route: "/invoice", sortOrder: 2 });

describe("stripLocale / getLocaleFromPathname", () => {
    it("strips a locale prefix and normalises the bare locale to /", () => {
        expect(stripLocale("/en/flight/list")).toBe("/flight/list");
        expect(stripLocale("/en")).toBe("/");
        expect(stripLocale("/")).toBe("/");
    });

    it("does not treat a path that merely starts with the locale letters as a prefix", () => {
        expect(stripLocale("/entry/list")).toBe("/entry/list");
        expect(getLocaleFromPathname("/entry/list")).toBe("en");
    });

    it("reads the locale from the prefix", () => {
        expect(getLocaleFromPathname("/ar/flight/list")).toBe("ar");
        expect(getLocaleFromPathname("/flight/list")).toBe("en");
    });
});

describe("resolveAuthRedirect — root route", () => {
    it("sends an anonymous visitor to login", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en",
                isAuth: false,
                isPermLoaded: false,
                permissions: [],
            })
        ).toEqual({ action: "redirect", href: "/en/auth/login" });
    });

    it("waits while permissions are still loading", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en",
                isAuth: true,
                isPermLoaded: false,
                permissions: [],
            })
        ).toEqual({ action: "stay" });
    });

    it("sends an authenticated user to their first viewable route", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en",
                isAuth: true,
                isPermLoaded: true,
                permissions: [INVOICE, FLIGHT],
            })
        ).toEqual({ action: "redirect", href: "/en/flight" });
    });

    // Regression: the root page renders nothing but a spinner, so returning
    // "stay" here left the user staring at "Loading..." with no way forward.
    it("never parks a permission-less user on the root spinner", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en",
                isAuth: true,
                isPermLoaded: true,
                permissions: [],
            })
        ).toEqual({ action: "redirect", href: `/en${FALLBACK_ROUTE}` });
    });

    it("keeps the locale it was given", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/ar",
                isAuth: true,
                isPermLoaded: true,
                permissions: [FLIGHT],
            })
        ).toEqual({ action: "redirect", href: "/ar/flight" });
    });
});

describe("resolveAuthRedirect — login page", () => {
    it("lets an anonymous visitor see the form", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en/auth/login",
                isAuth: false,
                isPermLoaded: false,
                permissions: [],
            })
        ).toEqual({ action: "stay" });
    });

    it("holds an authenticated user on the form until permissions arrive", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en/auth/login",
                isAuth: true,
                isPermLoaded: false,
                permissions: [],
            })
        ).toEqual({ action: "stay" });
    });

    it("moves an authenticated user off the form once permissions arrive", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en/auth/login",
                isAuth: true,
                isPermLoaded: true,
                permissions: [FLIGHT],
            })
        ).toEqual({ action: "redirect", href: "/en/flight" });
    });

    it("moves a permission-less user off the form too", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en/auth/login",
                isAuth: true,
                isPermLoaded: true,
                permissions: [],
            })
        ).toEqual({ action: "redirect", href: `/en${FALLBACK_ROUTE}` });
    });
});

describe("resolveAuthRedirect — protected routes", () => {
    it("sends an anonymous visitor to login", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en/flight/list",
                isAuth: false,
                isPermLoaded: false,
                permissions: [],
            })
        ).toEqual({ action: "redirect", href: "/en/auth/login" });
    });

    it("renders the page for an authenticated user, permissions or not", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en/flight/list",
                isAuth: true,
                isPermLoaded: false,
                permissions: [],
            })
        ).toEqual({ action: "stay" });
        expect(
            resolveAuthRedirect({
                pathname: "/en/flight/list",
                isAuth: true,
                isPermLoaded: true,
                permissions: [FLIGHT],
            })
        ).toEqual({ action: "stay" });
    });
});

describe("FALLBACK_ROUTE", () => {
    it("sends a user with no viewable menu to the IT Support page", () => {
        expect(FALLBACK_ROUTE).toBe("/it-support");
        expect(
            resolveAuthRedirect({
                pathname: "/en/auth/login",
                isAuth: true,
                isPermLoaded: true,
                permissions: [],
            })
        ).toEqual({ action: "redirect", href: "/en/it-support" });
    });
});

describe("PROFILE_ROUTE — staff-linked user with no viewable menu", () => {
    it("lands on their own profile after login", () => {
        expect(PROFILE_ROUTE).toBe("/profile");
        expect(
            resolveAuthRedirect({
                pathname: "/en/auth/login",
                isAuth: true,
                isPermLoaded: true,
                permissions: [],
                hasStaffProfile: true,
            })
        ).toEqual({ action: "redirect", href: `/en${PROFILE_ROUTE}` });
    });

    it("lands on their own profile from the root route", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/ar",
                isAuth: true,
                isPermLoaded: true,
                permissions: [],
                hasStaffProfile: true,
            })
        ).toEqual({ action: "redirect", href: `/ar${PROFILE_ROUTE}` });
    });

    it("still prefers the first viewable menu when there is one", () => {
        expect(
            resolveAuthRedirect({
                pathname: "/en/auth/login",
                isAuth: true,
                isPermLoaded: true,
                permissions: [FLIGHT],
                hasStaffProfile: true,
            })
        ).toEqual({ action: "redirect", href: "/en/flight" });
    });
});
