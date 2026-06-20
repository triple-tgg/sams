"use client";

import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import type { RootState } from "@/store/rootReducer";
import { getMenuPermissions } from "@/lib/api/permission/getMenuPermissions";
import { setPermissionsLoading, setPermissions } from "@/components/partials/auth/permissionSlice";
import { Icon } from "@iconify/react";

/**
 * PermissionGuard
 *
 * - If the user is authenticated but permissions have NOT been loaded yet
 *   (e.g. after a page refresh), re-fetches permissions from the API.
 * - Shows a full-page loading spinner while permissions are loading.
 * - Renders children once permissions are ready.
 */
export default function PermissionGuard({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();
    const isAuth = useSelector((s: RootState) => s.auth.isAuth);
    const users = useSelector((s: RootState) => s.auth.users);
    const { isLoaded, isLoading } = useSelector((s: RootState) => s.permission);

    // Re-fetch permissions if user is logged in but permissions not in store
    // (happens after browser refresh — Redux is reset but localStorage keeps the user)
    useEffect(() => {
        if (isAuth && !isLoaded && !isLoading) {
            // Try to load permissions from localStorage first (saved during login)
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    if (userData.menuPermissions && userData.menuPermissions.length > 0) {
                        console.log('[PermissionGuard] loaded permissions from localStorage:', userData.menuPermissions.length, 'items');
                        dispatch(setPermissions(userData.menuPermissions));
                        return;
                    }
                } catch (e) {
                    console.warn('[PermissionGuard] Failed to parse saved user data');
                }
            }

            // Fallback: fetch from API if not in localStorage
            const roleId = (users as any)?.roleId;
            if (roleId) {
                dispatch(setPermissionsLoading());
                getMenuPermissions(Number(roleId))
                    .then((res) => {
                        console.log('[PermissionGuard] fetched permissions from API:', res.responseData?.length, 'items');
                        dispatch(setPermissions(res.responseData ?? []));
                    })
                    .catch((err) => {
                        console.error('[PermissionGuard] fetch failed:', err);
                        dispatch(setPermissions([]));
                    });
            } else {
                console.warn('[PermissionGuard] No roleId found — setting empty permissions');
                dispatch(setPermissions([]));
            }
        }
    }, [isAuth, isLoaded, isLoading, users, dispatch]);

    // Show loading overlay while fetching
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
