"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/rootReducer";
import { batchUpsertPermissions } from "@/lib/api/permission/batchUpsertPermissions";
import { getMenuPermissions } from "@/lib/api/permission/getMenuPermissions";
import { setPermissions } from "@/components/partials/auth/permissionSlice";
import type {
    BatchUpsertPermissionRequest,
    BatchUpsertPermissionResponse,
} from "@/lib/api/permission/menuPermissions.interface";

/**
 * Mutation hook for batch upserting role permissions.
 * Invalidates the role-permissions query on success so the panel refreshes,
 * and updates Redux + localStorage if the updated role belongs to the current user.
 */
export const useBatchUpsertPermissions = () => {
    const qc = useQueryClient();
    const dispatch = useDispatch();
    const currentRoleId = useSelector((s: RootState) => (s.auth.users as any)?.roleId);

    return useMutation<BatchUpsertPermissionResponse, Error, BatchUpsertPermissionRequest>({
        mutationFn: batchUpsertPermissions,
        mutationKey: ["batch-upsert-permissions"],
        onSuccess: async (_data, variables) => {
            qc.invalidateQueries({ queryKey: ["role-permissions", variables.roleId] });

            if (!currentRoleId || Number(currentRoleId) === Number(variables.roleId)) {
                try {
                    const res = await getMenuPermissions(Number(variables.roleId));
                    const newPerms = res.responseData ?? [];
                    dispatch(setPermissions(newPerms));
                    const cached = localStorage.getItem("user");
                    if (cached) {
                        const userData = JSON.parse(cached);
                        userData.menuPermissions = newPerms;
                        localStorage.setItem("user", JSON.stringify(userData));
                    }
                } catch {
                    // ignore refresh error
                }
            }
        },
    });
};
