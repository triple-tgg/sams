// Staff list interfaces for paginated API

export interface StaffTypeObj {
    id: number;
    code: string;
    name: string;
    description: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

export interface StaffItem {
    id: number;
    code: string;
    name: string;
    staffstypeObj: StaffTypeObj;
    isActive: boolean;
    title: string;
    jobTitle: string | null;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

// List request/response
export interface StaffListRequest {
    page: number;
    perPage: number;
}

export interface StaffListResponse {
    message: string;
    responseData: StaffItem[];
    page: number;
    perPage: number;
    total: number;
    totalAll: number;
    error: string;
}

// Get by ID response
export interface StaffByIdResponse {
    message: string;
    responseData: StaffItem;
    error: string;
}

// Upsert (create/update) request
export interface StaffUpsertRequest {
    id: number; // 0 for new, existing id for update
    code: string;
    name: string;
    staffstypeid: number;
    userName: string;
    isAcive: boolean; // Note: API uses "isAcive" (typo)
    title: string;
    jobTitle: string;
}

export interface StaffUpsertResponse {
    message: string;
    responseData: StaffItem | null;
    error: string;
}

// Delete request/response
export interface StaffDeleteRequest {
    id: number;
    userName: string;
}

export interface StaffDeleteResponse {
    message: string;
    responseData: null;
    error: string;
}
