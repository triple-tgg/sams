import { locales } from "@/config";
import { IT_SUPPORT_ROUTE } from "@/config/support";
import { getFirstViewableRoute } from "@/lib/api/permission/getFirstViewableRoute";
import type { MenuPermissionItem } from "@/lib/api/permission/menuPermissions.interface";

/** Login route, without the locale prefix. */
export const LOGIN_ROUTE = "/auth/login";

/**
 * Where an authenticated user is sent when their permissions contain no
 * viewable route: the IT Support page, which explains the situation and how to
 * request access (instead of an endless spinner or a bare "Access Denied").
 * It is not in ROUTE_PERMISSION_MAP, so it opens with zero permissions.
 */
export const FALLBACK_ROUTE = IT_SUPPORT_ROUTE;

/**
 * The signed-in user's own staff profile (no locale prefix). Shown in the
 * header profile menu when the account is linked to a staff record. Not in
 * ROUTE_PERMISSION_MAP, so it opens with zero permissions.
 */
export const PROFILE_ROUTE = "/profile";

/**
 * Landing route for a user with no viewable menu: their own profile when the
 * account is linked to a staff record, otherwise the IT Support page.
 */
export function getNoMenuLandingRoute(hasStaffProfile: boolean): string {
    return hasStaffProfile ? PROFILE_ROUTE : FALLBACK_ROUTE;
}

/** Routes reachable without being authenticated (no locale prefix). */
export const PUBLIC_ROUTES = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
];

const LOCALE_RE = new RegExp(`^/(${locales.join("|")})(?=/|$)`);

/** "/en/flight/list" → "en". Falls back to the default locale. */
export function getLocaleFromPathname(pathname: string): string {
    return pathname.match(LOCALE_RE)?.[1] ?? "en";
}

/** "/en/flight/list" → "/flight/list", "/en" → "/". */
export function stripLocale(pathname: string): string {
    return pathname.replace(LOCALE_RE, "") || "/";
}

export type AuthDecision =
    /** Render the current page. No navigation. */
    | { action: "stay" }
    /** Navigate to `href` (replace, not push — these are guard redirects). */
    | { action: "redirect"; href: string };

export interface AuthRedirectInput {
    /** Full pathname including the locale prefix, e.g. "/en/auth/login". */
    pathname: string;
    isAuth: boolean;
    /** True once permissions have been fetched (or resolved to empty). */
    isPermLoaded: boolean;
    permissions: MenuPermissionItem[];
    /** True when the account is linked to a staff record (users.staffId). */
    hasStaffProfile?: boolean;
}

/**
 * Decide where the auth guard should send the user.
 *
 * The landing route for an authenticated user depends on their permissions, so
 * a decision on the root route or the login page has to wait for those to load.
 * `stay` on those two routes is therefore only ever temporary: the caller must
 * guarantee `isPermLoaded` eventually flips to true, otherwise the user is
 * parked on a loading screen forever.
 */
export function resolveAuthRedirect({
    pathname,
    isAuth,
    isPermLoaded,
    permissions,
    hasStaffProfile = false,
}: AuthRedirectInput): AuthDecision {
    const locale = getLocaleFromPathname(pathname);
    const path = stripLocale(pathname);
    const loginHref = `/${locale}${LOGIN_ROUTE}`;

    // Landing route once permissions are known. Never null: an authenticated
    // user with no viewable menu still gets moved off the loading screen —
    // to their own profile when staff-linked, else to IT Support.
    const landingHref = () =>
        `/${locale}${getFirstViewableRoute(permissions) ?? getNoMenuLandingRoute(hasStaffProfile)}`;

    // Root route ("/", "/en", "/ar") — it renders a bare spinner, so it must
    // always redirect somewhere.
    if (path === "/") {
        if (!isAuth) return { action: "redirect", href: loginHref };
        if (!isPermLoaded) return { action: "stay" };
        return { action: "redirect", href: landingHref() };
    }

    // Already authenticated but sitting on the login page.
    if (isAuth && path === LOGIN_ROUTE) {
        if (!isPermLoaded) return { action: "stay" };
        return { action: "redirect", href: landingHref() };
    }

    // Protected route without a session.
    if (!isAuth && !PUBLIC_ROUTES.includes(path)) {
        return { action: "redirect", href: loginHref };
    }

    return { action: "stay" };
}
