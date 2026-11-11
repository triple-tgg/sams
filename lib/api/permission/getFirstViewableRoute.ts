import type { MenuPermissionItem } from "@/lib/api/permission/menuPermissions.interface";
import { buildPermissionIndex } from "@/lib/permission-utils";
import { canAccessRoute } from "@/lib/route-permissions";

/**
 * Flatten nested MenuPermissionItem[] into a flat array (parents + children).
 */
function flattenItems(items: MenuPermissionItem[]): MenuPermissionItem[] {
    const result: MenuPermissionItem[] = [];
    for (const item of items) {
        result.push(item);
        if (item.children && item.children.length > 0) {
            result.push(...flattenItems(item.children));
        }
    }
    return result;
}

/**
 * Find the landing route for a user: the first page menu (by `sortOrder`)
 * with `canView === true` whose route the route guard will let them open.
 *
 * Group rows (FLIGHT, HR, QA… — any row that has children) are skipped: a
 * group is viewable as soon as ANY of its children is, while its `route`
 * points at one specific child page (or at no page at all). Without this, a
 * role that can only see "HR > Employee Income" would land on /hr/staff and
 * get "Access Denied".
 *
 * Returns `null` if nothing is viewable (e.g. permissions not yet loaded
 * or user has no access to any menu).
 */
export function getFirstViewableRoute(permissions: MenuPermissionItem[]): string | null {
    const index = buildPermissionIndex(permissions);
    const flat = flattenItems(permissions);
    // Works for a nested tree and for a flat list linked by parentId.
    const groupIds = new Set(flat.map((item) => item.parentId).filter((id) => id != null));
    const firstViewable = flat
        .filter((item) => !groupIds.has(item.menuId) && !(item.children && item.children.length > 0))
        .filter((item) => item.canView === true && item.route && item.route !== "#")
        .filter((item) => canAccessRoute(index, item.route))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .at(0);

    return firstViewable?.route ?? null;
}
