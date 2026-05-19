import axiosInstance from "@/lib/axios.config";
import type { MenuPermissionsResponse } from "./menuPermissions.interface";

/**
 * Fetch menu permissions for a given role ID.
 * GET /permission/menus/{roleId}
 */
export const getMenuPermissions = async (roleId: number): Promise<MenuPermissionsResponse> => {
    try {
        const res = await axiosInstance.get<MenuPermissionsResponse>(
            `/permission/menus/${roleId}`
        );
        return res.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to fetch menu permissions"
        );
    }
};
