import axios from "@/lib/axios.config";
import type {
    RolesResponse,
    RoleByIdResponse,
    RoleUpsertRequest,
    RoleUpsertResponse,
    RoleDeleteRequest,
    RoleDeleteResponse,
    RolePermissionUpsertRequest,
    RolePermissionUpsertResponse,
} from "./roles.interface";
import type { MenuPermissionsResponse } from "@/lib/api/permission/menuPermissions.interface";

const API_BASE =
    process.env.NEXT_PUBLIC_ENVIRONTMENT !== "production"
        ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}`
        : `${process.env.NEXT_PUBLIC_PRODUCTION_API}`;

/** Get all roles (paginated) — POST /master/Role-list */
export const getRoleList = async (params: { page: number; perPage: number }): Promise<RolesResponse> => {
    try {
        const res = await axios.post(
            `${API_BASE}/master/Role-list`,
            { page: params.page, perPage: params.perPage },
            { headers: { "Content-Type": "application/json" } }
        );
        return res.data as RolesResponse;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch roles");
    }
};

/** Get role by id — GET /master/Role-byid/{id} */
export const getRoleById = async (id: number): Promise<RoleByIdResponse> => {
    try {
        const res = await axios.get(`${API_BASE}/master/Role-byid/${id}`);
        return res.data as RoleByIdResponse;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch role");
    }
};

/** Create or update role — POST /master/Role-upsert */
export const upsertRole = async (data: RoleUpsertRequest): Promise<RoleUpsertResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Role-upsert`, data, {
            headers: { "Content-Type": "application/json" },
        });
        return res.data as RoleUpsertResponse;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to save role");
    }
};

/** Delete role — POST /master/Role-delete */
export const deleteRole = async (data: RoleDeleteRequest): Promise<RoleDeleteResponse> => {
    try {
        const res = await axios.post(
            `${API_BASE}/master/Role-delete`,
            { id: data.id, userName: data.userName },
            { headers: { "Content-Type": "application/json" } }
        );
        return res.data as RoleDeleteResponse;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to delete role");
    }
};

/** Get permissions for a specific role — GET /permission/menus/{roleId} */
export const getRolePermissions = async (roleId: number): Promise<MenuPermissionsResponse> => {
    try {
        const res = await axios.get(`${API_BASE}/permission/menus/${roleId}`);
        return res.data as MenuPermissionsResponse;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch permissions");
    }
};

/** Save permissions for a role */
export const upsertRolePermissions = async (
    data: RolePermissionUpsertRequest
): Promise<RolePermissionUpsertResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/RolePermissions/upsert`, data, {
            headers: { "Content-Type": "application/json" },
        });
        return res.data as RolePermissionUpsertResponse;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to save permissions");
    }
};
