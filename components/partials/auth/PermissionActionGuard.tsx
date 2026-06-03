"use client";

import React from "react";
import { useMenuPermission } from "@/hooks/use-menu-permission";

type PermissionAction = "canView" | "canCreate" | "canEdit" | "canDelete" | "canExport";

interface PermissionActionGuardProps {
    /** The permission code (e.g., "QA_STAFF", "MASTER_DATA_ROLE") */
    menuCode: string;
    /** The required permission action */
    action: PermissionAction;
    /** Content to render if permission is granted */
    children: React.ReactNode;
    /** Optional content to render if permission is denied (defaults to null) */
    fallback?: React.ReactNode;
}

/**
 * A wrapper component that conditionally renders its children based on the user's
 * granular permissions for a specific menu code.
 * 
 * Example usage:
 * <PermissionActionGuard menuCode="QA_STAFF" action="canEdit">
 *   <Button>Edit User</Button>
 * </PermissionActionGuard>
 */
export function PermissionActionGuard({
    menuCode,
    action,
    children,
    fallback = null,
}: PermissionActionGuardProps) {
    const permissions = useMenuPermission(menuCode);

    if (permissions[action]) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
