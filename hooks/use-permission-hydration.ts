"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/rootReducer";
import { getMenuPermissions } from "@/lib/api/permission/getMenuPermissions";
import {
    setPermissions,
    setPermissionsLoading,
} from "@/components/partials/auth/permissionSlice";

/**
 * Loads menu permissions into Redux whenever the user is authenticated but the
 * store has none — which is the case after every browser refresh, since Redux
 * resets while localStorage keeps the session.
 *
 * This must run app-wide (it is called from AuthProvider), not only inside the
 * protected layouts. The root route renders a bare spinner and waits for
 * `isLoaded` before deciding where to send the user, so if nothing hydrates
 * permissions there the page never resolves.
 *
 * Guarantee: for an authenticated user, `isLoaded` always ends up true — every
 * branch below dispatches `setPermissions`, including the failure paths.
 */
export function usePermissionHydration() {
    const dispatch = useDispatch();
    const isAuth = useSelector((s: RootState) => s.auth.isAuth);
    const users = useSelector((s: RootState) => s.auth.users);
    const { isLoaded, isLoading } = useSelector((s: RootState) => s.permission);

    useEffect(() => {
        if (!isAuth || isLoaded || isLoading) return;

        // Cached permissions from the last login render the UI immediately.
        let hasCachedPerms = false;
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                if (userData.menuPermissions?.length > 0) {
                    dispatch(setPermissions(userData.menuPermissions));
                    hasCachedPerms = true;
                }
            } catch {
                console.warn("[usePermissionHydration] Failed to parse saved user data");
            }
        }

        const roleId = (users as any)?.roleId;
        if (!roleId) {
            // No role to query with — resolve to empty rather than hang.
            if (!hasCachedPerms) {
                console.warn("[usePermissionHydration] No roleId — using empty permissions");
                dispatch(setPermissions([]));
            }
            return;
        }

        if (!hasCachedPerms) {
            dispatch(setPermissionsLoading());
        }

        getMenuPermissions(Number(roleId))
            .then((res) => {
                const newPerms = res.responseData ?? [];
                dispatch(setPermissions(newPerms));

                // Refresh the cache PermissionGuard reads on the next load.
                const cached = localStorage.getItem("user");
                if (cached) {
                    try {
                        const userData = JSON.parse(cached);
                        userData.menuPermissions = newPerms;
                        localStorage.setItem("user", JSON.stringify(userData));
                    } catch {
                        /* cache refresh is best-effort */
                    }
                }
            })
            .catch((err) => {
                console.error("[usePermissionHydration] fetch failed:", err);
                // Keep the cached permissions if we have them; otherwise resolve
                // to empty so the guards stop waiting.
                if (!hasCachedPerms) {
                    dispatch(setPermissions([]));
                }
            });
    }, [isAuth, isLoaded, isLoading, users, dispatch]);
}
