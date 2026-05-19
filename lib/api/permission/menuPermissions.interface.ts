// Permission menu interfaces — /permission/menus/{roleId}

export interface MenuPermissionItem {
    menuId: number;
    menuCode: string;
    name: string;
    icon: string;
    route: string;
    parentId: number | null;
    sortOrder: number;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
    children: MenuPermissionItem[] | null;
}

export interface MenuPermissionsResponse {
    message: string;
    responseData: MenuPermissionItem[];
    error: string;
}

// Batch upsert — POST /permission/user-menu/batch-upsert

export interface BatchUpsertPermissionItem {
    menuId: number;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
}

export interface BatchUpsertPermissionRequest {
    roleId: number;
    permissions: BatchUpsertPermissionItem[];
    updatedBy: string;
}

export interface BatchUpsertPermissionResponse {
    message: string;
    responseData: any;
    error: string;
}
