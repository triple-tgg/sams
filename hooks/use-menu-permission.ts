"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/rootReducer";
import type { MenuCodeRef } from "@/lib/permission-codes";
import {
    buildPermissionIndex,
    getPermissionFlags,
    type PermissionFlags,
    type PermissionIndex,
} from "@/lib/permission-utils";

/** Normalized code → permission item, rebuilt only when the store changes. */
export function usePermissionIndex(): PermissionIndex {
    const permMenus = useSelector((s: RootState) => s.permission.menus);
    return useMemo(() => buildPermissionIndex(permMenus), [permMenus]);
}

/**
 * Granular permissions (canView, canCreate, canEdit, canDelete, canExport)
 * for a menu code — or an ordered list of codes, where the first code that
 * exists in the DB decides (see `MenuCodeRef`).
 *
 * Unknown code → everything false.
 *
 * @example const perm = useMenuPermission(MENU.HR_STAFF);
 *          {perm.canEdit && <Button>Edit</Button>}
 */
export function useMenuPermission(ref: MenuCodeRef): PermissionFlags {
    const index = usePermissionIndex();
    // Arrays from MENU_REF are stable, but an inline array literal is not — key on its contents.
    const key = typeof ref === "string" ? ref : ref.join("|");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => getPermissionFlags(index, ref), [index, key]);
}
