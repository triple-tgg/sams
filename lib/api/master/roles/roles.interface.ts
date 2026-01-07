// Role interfaces for dropdown options

export interface RoleItem {
    id: number;
    code: string;
    name: string;
}

export interface RolesResponse {
    message: string;
    responseData: RoleItem[];
    error: string;
}
