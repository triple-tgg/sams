import axiosInstance from "@/lib/axios.config";
import type {
    BatchUpsertPermissionRequest,
    BatchUpsertPermissionResponse,
} from "./menuPermissions.interface";

/**
 * Batch upsert role permissions.
 * POST /permission/user-menu/batch-upsert
 */
export const batchUpsertPermissions = async (
    data: BatchUpsertPermissionRequest
): Promise<BatchUpsertPermissionResponse> => {
    try {
        const res = await axiosInstance.post<BatchUpsertPermissionResponse>(
            `/permission/user-menu/batch-upsert`,
            data,
            { headers: { "Content-Type": "application/json" } }
        );
        return res.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to save permissions"
        );
    }
};
