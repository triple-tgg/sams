// User interfaces for paginated API

export interface RoleObj {
    id: number;
    code: string;
    name: string;
    description: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string | null;
    updatedby: string | null;
}

export interface UserItem {
    id: number;
    username: string;
    email: string;
    fullName: string;
    roleObj: RoleObj;
    isActive: boolean;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
}

// List request/response
export interface UserListRequest {
    page: number;
    perPage: number;
}

export interface UserListResponse {
    message: string;
    responseData: UserItem[];
    page: number;
    perPage: number;
    total: number;
    totalAll: number;
    error: string;
}

// Get by ID response
export interface UserByIdResponse {
    message: string;
    responseData: UserItem;
    error: string;
}

// Upsert (create/update) request
export interface UserUpsertRequest {
    id: number; // 0 for new, existing id for update
    username: string;
    email: string;
    passwordData: string;
    fullName: string;
    roleId: number; // role id as number
    isActive: boolean;
    userBy: string; // userName from canedit API
}

export interface UserUpsertResponse {
    message: string;
    responseData: UserItem | null;
    error: string;
}

// Delete request/response
export interface UserDeleteRequest {
    id: number;
    userName: string;
}

export interface UserDeleteResponse {
    message: string;
    responseData: null;
    error: string;
}
