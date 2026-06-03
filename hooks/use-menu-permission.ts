"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/rootReducer";
import type { MenuPermissionItem } from "@/lib/api/permission/menuPermissions.interface";

/**
 * Recursively find a permission item by its menuCode.
 */
function findPermissionByCode(
    items: MenuPermissionItem[],
    code: string
): MenuPermissionItem | null {
    for (const item of items) {
        if (item.menuCode === code) return item;
        if (item.children && item.children.length > 0) {
            const found = findPermissionByCode(item.children, code);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Hook to retrieve granular permissions (canCreate, canEdit, canDelete, etc.)
 * for a specific menu code from the Redux store.
 * 
 * If the menu code is not found, all permissions default to false.
 * 
 * @param menuCode The permission code (e.g., "QA_STAFF", "MASTER_DATA_ROLE")
 */
export function useMenuPermission(menuCode: string) {
    const permMenus = useSelector((s: RootState) => s.permission.menus);

    return useMemo(() => {
        if (!permMenus || permMenus.length === 0) {
            return {
                canView: false,
                canCreate: false,
                canEdit: false,
                canDelete: false,
                canExport: false,
            };
        }

        const perm = findPermissionByCode(permMenus, menuCode);

        return {
            canView: perm?.canView ?? false,
            canCreate: perm?.canCreate ?? false,
            canEdit: perm?.canEdit ?? false,
            canDelete: perm?.canDelete ?? false,
            canExport: perm?.canExport ?? false,
        };
    }, [permMenus, menuCode]);
}
