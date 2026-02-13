// Routes interfaces for API

export interface RouteItem {
    id: number;
    code: string;
    name: string | null;
    description: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

export interface RouteListResponse {
    message: string;
    responseData: RouteItem[];
    page: number;
    perPage: number;
    total: number;
    totalAll: number;
    error: string;
}

export interface RouteSearchItem {
    id: number;
    code: string;
    name: string | null;
}

export interface RouteSearchResponse {
    message: string;
    responseData: RouteSearchItem[];
    error: string;
}

export interface RouteUpsertRequest {
    id: number; // 0 for new
    code: string;
    name: string;
    description: string;
    userName: string;
    isdelete: boolean;
}

export interface RouteUpsertResponse {
    message: string;
    responseData: null;
    error: string;
}
