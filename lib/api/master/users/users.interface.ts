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
    /** true = internal (staff-linked) account, false = external account. */
    flagInternal: boolean;
    /** Linked staff employee ID (internal accounts only). */
    staffEmployeeId: string | null;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
}

// List request/response
export interface UserListRequest {
    page: number;
    perPage: number;
    username?: string;
    email?: string;
    fullName?: string;
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
    /** true = internal (staff-linked) account, false = external account. */
    flagInternal: boolean;
    /** Linked staff employee ID — send "" for external accounts. */
    staffEmployeeId: string;
}

export interface UserUpsertResponse {
    message: string;
    responseData: string[] | null;
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

// Change password (POST /user/change-password)
// Changes the password of the signed-in user (identified by the access token).
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    message: string;
    responseData: string;
    error: string;
}

// Account check before creating a staff login (POST /master/users-check)
// Finds an existing account by email so the staff profile can link it instead of creating a duplicate.
export interface UserCheckRequest {
    email: string;
    /** Employee ID of the staff member the account is being created for. */
    employeeID: string;
}

export interface UserCheckResponse {
    message: string;
    /** Matched account, or null when no account uses this email. */
    responseData: UserItem | null;
    error: string;
}
