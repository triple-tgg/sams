"use client";

import React from "react";
import { useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import type { RootState } from "@/store/rootReducer";
import { canAccessRoute } from "@/lib/route-permissions";
import { usePermissionIndex } from "@/hooks/use-menu-permission";
import { Icon } from "@iconify/react";

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
 * an "Access Denied" screen instead of the page content.
 *
 * Must be placed INSIDE PermissionGuard (which loads permissions first).
 */
export default function RoutePermissionGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const permIndex = usePermissionIndex();
    const isPermLoaded = useSelector((s: RootState) => s.permission.isLoaded);

    // Don't check until permissions are loaded (PermissionGuard handles the loading state)
    if (!isPermLoaded) {
        return <>{children}</>;
    }

    // Strip locale, then check the route's required menu code + action
    const hasAccess = canAccessRoute(permIndex, stripLocale(pathname));

    if (hasAccess) {
        return <>{children}</>;
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
                Please contact your administrator to request access.
            </p>
            <button
                onClick={() => {
                    // If opened in a new tab (no history), close the tab
                    if (window.history.length <= 1) {
                        window.close();
                    } else {
                        router.back();
                    }
                }}
                className="mt-2 px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
                Go Back
            </button>
        </div>
    );
}
