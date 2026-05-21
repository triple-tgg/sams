import type { MenuPermissionItem } from "@/lib/api/permission/menuPermissions.interface";

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
 * Find the first viewable route from the permissions list.
 * Flattens nested children, sorts by `sortOrder`, and returns the route
 * of the first item with `canView === true`.
 * Falls back to '/flight/list' if nothing is viewable.
 */
export function getFirstViewableRoute(permissions: MenuPermissionItem[]): string {
    const flat = flattenItems(permissions);
    const firstViewable = flat
        .filter((item) => item.canView === true && item.route && item.route !== '#')
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .at(0);

    return firstViewable?.route ?? '/flight/list';
}
