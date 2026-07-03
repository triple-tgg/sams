"use client";

import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/rootReducer";
import type { MenuPermissionItem } from "@/lib/api/permission/menuPermissions.interface";
import { getMenuList, type Group } from "@/lib/menus";

/**
 * Flatten nested MenuPermissionItem[] into a flat array.
 * Parents with children[] are included alongside their flattened children.
 */
function flattenPermissions(items: any[]): MenuPermissionItem[] {
    const result: MenuPermissionItem[] = [];
    for (const item of items) {
        result.push(item);
        // บางที API อาจส่งกลับมาเป็น 'children' หรือ 'submenus'
        if (item.children && item.children.length > 0) {
            result.push(...flattenPermissions(item.children));
        }
        if (item.submenus && item.submenus.length > 0) {
            result.push(...flattenPermissions(item.submenus));
        }
    }
    return result;
}

/**
 * Recursively filter SubChildren by permCode.
 * - No permCode → always keep
 * - permCode viewable → keep (and recurse into nested children)
 * - permCode not viewable → remove
 */
function filterChildren(
    children: import("@/lib/menus").SubChildren[],
    isViewable: (code?: string) => boolean
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

        // Flatten nested children into a single map: menuCode → canView
        const flat = flattenPermissions(permMenus);
        const canViewMap = new Map(flat.map((m) => [m.menuCode, m.canView]));

        /**
         * Check if a permCode is viewable.
         * - No permCode at all      → always show
         * - permCode in map, canView === true  → show
         * - permCode in map, canView === false → hide
         * - permCode NOT in API map  → hide (ไม่มีสิทธิ์)
         */
        const isViewable = (code?: string) => {
            if (!code) return true;
            return canViewMap.get(code) === true;
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
