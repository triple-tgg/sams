// Role & Permission interfaces

export interface RoleItem {
    id: number;
    code: string;
    name: string;
    description?: string;
    isdelete?: boolean;
    createddate?: string;
    createdby?: string;
    updateddate?: string;
    updatedby?: string;
    // legacy / optional
    isActive?: boolean;
}

export interface RoleListRequest {
    page: number;
    perPage: number;
}

export interface RolesResponse {
    message: string;
    responseData: RoleItem[];
    page: number;
    perPage: number;
    total: number;
    totalAll: number;
    error: string;
}

export interface RoleByIdResponse {
    message: string;
    responseData: RoleItem;
    error: string;
}

export interface RoleUpsertRequest {
    id: number;          // 0 = Add, role.id = Edit
    code: string;
    name: string;
    description?: string;
    isdelete: boolean;   // false = active, true = deleted
    userName: string;
}

export interface RoleUpsertResponse {
    message: string;
    responseData: RoleItem;
    error: string;
}

export interface RoleDeleteRequest {
    id: number;
    userName: string;
}

export interface RoleDeleteResponse {
    message: string;
    responseData: string[];
    error: string;
}

// Permission interfaces
export interface MenuPermission {
    menuId: string;
    menuName: string;
    menuKey: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
}

export interface RolePermissionResponse {
    message: string;
    responseData: MenuPermission[];
    error: string;
}

export interface RolePermissionUpsertRequest {
    roleId: number;
    permissions: MenuPermission[];
    userName: string;
}

export interface RolePermissionUpsertResponse {
    message: string;
    error: string;
}
