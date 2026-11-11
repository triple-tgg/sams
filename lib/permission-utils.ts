/**
 * Pure permission logic shared by the sidebar filter, the route guard and the
 * action-button hooks. No React here so it can be unit-tested.
 */
import type { MenuPermissionItem } from "@/lib/api/permission/menuPermissions.interface";
import type { MenuCodeRef } from "@/lib/permission-codes";

export type PermissionAction = "canView" | "canCreate" | "canEdit" | "canDelete" | "canExport";

export interface PermissionFlags {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
}

export const NO_PERMISSION: PermissionFlags = Object.freeze({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
});

/** "flight roster" / "FLIGHT_ROSTER" / " Flight  Roster " → "FLIGHT_ROSTER" */
export function normalizeMenuCode(code: string): string {
    return code.trim().toUpperCase().replace(/[\s_]+/g, "_");
}

export type PermissionIndex = Map<string, MenuPermissionItem>;

/**
 * Flatten the permission tree into normalizedCode → item.
 * Walks both `children` and `submenus` (the API has used both names).
 * If a code appears twice, the first occurrence wins.
 */
export function buildPermissionIndex(items: MenuPermissionItem[] | null | undefined): PermissionIndex {
    const index: PermissionIndex = new Map();
    const walk = (list: any[] | null | undefined) => {
        for (const item of list ?? []) {
            if (item?.menuCode) {
                const key = normalizeMenuCode(item.menuCode);
                if (!index.has(key)) index.set(key, item);
            }
            walk(item?.children);
            walk(item?.submenus);
        }
    };
    walk(items);
    return index;
}

/**
 * Resolve a code ref to its permission item: the first code in the ref that
 * exists in the index (see `MenuCodeRef`). Returns null if none exist.
 */
export function resolvePermission(index: PermissionIndex, ref: MenuCodeRef): MenuPermissionItem | null {
    const codes = typeof ref === "string" ? [ref] : ref;
    for (const code of codes) {
        const item = index.get(normalizeMenuCode(code));
        if (item) return item;
    }
    return null;
}

/** Permission flags for a ref. Unknown code → all false (deny by default). */
export function getPermissionFlags(index: PermissionIndex, ref: MenuCodeRef): PermissionFlags {
    const item = resolvePermission(index, ref);
    if (!item) return NO_PERMISSION;
    return {
        canView: item.canView === true,
        canCreate: item.canCreate === true,
        canEdit: item.canEdit === true,
        canDelete: item.canDelete === true,
        canExport: item.canExport === true,
    };
}

/**
 * True if the ref grants the action. `actions` as a list means "any of them"
 * (e.g. a page that both creates and edits).
 */
export function hasPermission(
    index: PermissionIndex,
    ref: MenuCodeRef,
    actions: PermissionAction | readonly PermissionAction[] = "canView",
): boolean {
    const flags = getPermissionFlags(index, ref);
    const list = typeof actions === "string" ? [actions] : actions;
    return list.some((a) => flags[a]);
}
