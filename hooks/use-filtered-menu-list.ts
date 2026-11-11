"use client";

import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/rootReducer";
import { getMenuList, type Group } from "@/lib/menus";
import { buildPermissionIndex, hasPermission } from "@/lib/permission-utils";
import type { MenuCodeRef } from "@/lib/permission-codes";

/**
 * Recursively filter SubChildren by permCode.
 * - No permCode → always keep
 * - permCode viewable → keep (and recurse into nested children)
 * - permCode not viewable → remove
 */
function filterChildren(
    children: import("@/lib/menus").SubChildren[],
    isViewable: (code?: MenuCodeRef) => boolean
): import("@/lib/menus").SubChildren[] {
    return children
        .filter((child) => isViewable(child.permCode))
        .map((child) => {
            if (!child.children || child.children.length === 0) return child;
            const filtered = filterChildren(child.children, isViewable);
            return { ...child, children: filtered };
        });
}

/**
 * Hook that returns the menu list filtered by the user's canView permissions.
 * All sidebar menu variants (classic, two-column, draggable) should use this
 * instead of calling getMenuList directly.
 */
export function useFilteredMenuList(pathname: string, t: any): Group[] {
    const permMenus = useSelector((s: RootState) => s.permission.menus);
    const isPermLoaded = useSelector((s: RootState) => s.permission.isLoaded);

    const rawMenuList = getMenuList(pathname, t);

    return React.useMemo(() => {
        if (!isPermLoaded) return [];

        // No permCode → always shown; otherwise canView of the first code
        // in the ref that exists in the DB (see MenuCodeRef for fallbacks).
        const index = buildPermissionIndex(permMenus);
        const isViewable = (code?: MenuCodeRef) => {
            if (!code || (typeof code !== "string" && code.length === 0)) return true;
            return hasPermission(index, code, "canView");
        };

        return rawMenuList
            .map((group) => ({
                ...group,
                menus: group.menus
                    .map((menu) => {
                        // Flat menu (no submenus) → check permCode directly
                        if (menu.submenus.length === 0) {
                            return isViewable(menu.permCode) ? menu : null;
                        }
                        // Parent with submenus
                        // 1) Check parent permCode first
                        if (menu.permCode && !isViewable(menu.permCode)) {
                            return null;
                        }
                        // 2) Filter individual submenus + their children
                        const filteredSubs = menu.submenus
                            .filter((sub) => isViewable(sub.permCode))
                            .map((sub) => {
                                // If submenu has children, filter them by permCode too
                                if (!sub.children || sub.children.length === 0) return sub;
                                const filteredChildren = filterChildren(sub.children, isViewable);
                                // If all children were filtered out, hide the submenu group
                                if (filteredChildren.length === 0) return null;
                                return { ...sub, children: filteredChildren };
                            })
                            .filter(Boolean) as typeof menu.submenus;
                        if (filteredSubs.length === 0) return null;
                        return { ...menu, submenus: filteredSubs };
                    })
                    .filter(Boolean) as typeof group.menus,
            }))
            .filter((group) => group.menus.length > 0);
    }, [rawMenuList, isPermLoaded, permMenus]);
}
