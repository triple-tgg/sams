"use client";

import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/rootReducer";
import { Icon } from "@iconify/react";

/**
 * PermissionGuard
 *
 * Holds a full-page spinner until the authenticated user's permissions are in
 * the store, so protected pages never render against an empty permission set.
 *
 * Loading itself is done by `usePermissionHydration` in AuthProvider, which
 * runs on every route — including the root route, which sits outside this
 * layout and would otherwise wait on permissions nothing was fetching.
 */
export default function PermissionGuard({ children }: { children: React.ReactNode }) {
    const isAuth = useSelector((s: RootState) => s.auth.isAuth);
    const isLoaded = useSelector((s: RootState) => s.permission.isLoaded);

    if (isAuth && !isLoaded) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background gap-4">
                <Icon
                    icon="line-md:loading-twotone-loop"
                    className="text-primary w-14 h-14"
                />
                <p className="text-sm text-muted-foreground animate-pulse">
                    Loading permissions…
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
