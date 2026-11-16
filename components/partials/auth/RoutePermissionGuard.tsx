"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import type { RootState } from "@/store/rootReducer";
import { canAccessRoute } from "@/lib/route-permissions";
import { usePermissionIndex } from "@/hooks/use-menu-permission";
import { Icon } from "@iconify/react";
import { getFirstViewableRoute } from "@/lib/api/permission/getFirstViewableRoute";
import { getLocaleFromPathname } from "@/lib/auth/resolveAuthRedirect";
import { IT_SUPPORT_ROUTE } from "@/config/support";

/**
 * Strip the locale prefix from the pathname.
 * e.g. "/en/master-data/staff" → "/master-data/staff"
 */
function stripLocale(pathname: string): string {
    // Pattern: /xx/... where xx is a 2-letter locale code
    const match = pathname.match(/^\/[a-z]{2}(\/.*)?$/);
    if (match) {
        return match[1] || "/";
    }
    return pathname;
}

/**
 * RoutePermissionGuard
 *
 * Checks the current route against ROUTE_PERMISSION_MAP (menu code + action,
 * canView by default). If the user lacks it, shows
 * an "Access Denied" screen (with a link to IT Support) instead of the page content.
 * A user whose role has no viewable menu at all is sent straight to the IT Support page.
 *
 * Must be placed INSIDE PermissionGuard (which loads permissions first).
 */
export default function RoutePermissionGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const permIndex = usePermissionIndex();
    const isPermLoaded = useSelector((s: RootState) => s.permission.isLoaded);
    const permissions = useSelector((s: RootState) => s.permission.menus);

    const path = stripLocale(pathname);
    const locale = getLocaleFromPathname(pathname);
    // Strip locale, then check the route's required menu code + action
    const hasAccess = !isPermLoaded || canAccessRoute(permIndex, path);
    // Denied here AND nothing else is viewable → the IT Support page is the only useful place
    const noViewableRoute = isPermLoaded && !hasAccess && getFirstViewableRoute(permissions) === null;

    useEffect(() => {
        if (noViewableRoute) router.replace(`/${locale}${IT_SUPPORT_ROUTE}`);
    }, [noViewableRoute, locale, router]);

    // Don't check until permissions are loaded (PermissionGuard handles the loading state)
    if (hasAccess) {
        return <>{children}</>;
    }

    // Redirecting to IT Support — render nothing to avoid flashing "Access Denied"
    if (noViewableRoute) {
        return null;
    }

    // ── Access Denied ───────────────────────────────────────
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
                <Icon
                    icon="heroicons-outline:shield-exclamation"
                    className="w-10 h-10 text-destructive"
                />
            </div>
            <h1 className="text-2xl font-bold text-destructive">
                Access Denied
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-md">
                You don&apos;t have permission to access this page.
                Please contact IT Support to request access.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <button
                onClick={() => {
                    // If opened in a new tab (no history), close the tab
                    if (window.history.length <= 1) {
                        window.close();
                    } else {
                        router.back();
                    }
                }}
                className="px-6 py-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
                Go Back
            </button>
            <button
                onClick={() => router.push(`/${locale}${IT_SUPPORT_ROUTE}?from=${encodeURIComponent(path)}`)}
                className="inline-flex items-center gap-1.5 px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
                <Icon icon="heroicons-outline:lifebuoy" className="w-4 h-4" />
                Contact IT Support
            </button>
            </div>
        </div>
    );
}
