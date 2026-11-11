/**
 * Permission tree helper shared by the Role page and the User Login dialog.
 */
export const PERM_FIELDS = ["canView", "canCreate", "canEdit", "canDelete", "canExport"] as const;
export type PermField = (typeof PERM_FIELDS)[number];

/** A flattened permission row: its depth in the tree and a link to its parent. */
export type PermTreeRow = Record<PermField, boolean> & {
    menuId: string | number;
    _depth: number;
    _isParent: boolean;
    _parentId: string | number | null;
};

/**
 * Recalculate group (parent) rows from their children: a parent is allowed
 * when any child is.
 *
 * Works bottom-up, deepest parents first, so a 3-level group such as
 * MASTER_DATA → MASTER_ORGANIZATION → MASTER_DATA_DEPARTMENT is computed from
 * its sub-groups' NEW values. A single top-down pass reads the sub-groups'
 * stale values and can save MASTER_DATA as false, hiding the whole menu.
 */
export function recalcParents<T extends PermTreeRow>(perms: T[]): T[] {
    const copies = perms.map((p) => ({ ...p }));
    const parents = copies.filter((p) => p._isParent).sort((a, b) => b._depth - a._depth);
    if (parents.length === 0) return perms;

    for (const parent of parents) {
        const children = copies.filter((c) => c._parentId === parent.menuId);
        for (const field of PERM_FIELDS) {
            (parent as PermTreeRow)[field] = children.some((c) => c[field] === true);
        }
    }
    return copies;
}
