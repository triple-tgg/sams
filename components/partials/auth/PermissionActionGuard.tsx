"use client";

import React from "react";
import { useMenuPermission } from "@/hooks/use-menu-permission";
import type { MenuCodeRef } from "@/lib/permission-codes";
import type { PermissionAction } from "@/lib/permission-utils";

interface PermissionActionGuardProps {
    /** Menu code, or ordered fallback list (e.g. MENU.HR_STAFF, ["NEW_CODE", "OLD_CODE"]) */
    menuCode: MenuCodeRef;
    /** Required action; a list means "any of them" */
    action: PermissionAction | readonly PermissionAction[];
    /** Content to render if permission is granted */
    children: React.ReactNode;
    /** Optional content to render if permission is denied (defaults to null) */
    fallback?: React.ReactNode;
}

/**
 * Renders its children only if the user has the required permission.
 *
 * @example
 * <PermissionActionGuard menuCode={MENU.HR_STAFF} action="canEdit">
 *   <Button>Edit</Button>
 * </PermissionActionGuard>
 */
export function PermissionActionGuard({
    menuCode,
    action,
    children,
    fallback = null,
}: PermissionActionGuardProps) {
    const permissions = useMenuPermission(menuCode);
    const actions = typeof action === "string" ? [action] : action;

    if (actions.some((a) => permissions[a])) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
