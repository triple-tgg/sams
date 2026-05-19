"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { batchUpsertPermissions } from "@/lib/api/permission/batchUpsertPermissions";
import type {
    BatchUpsertPermissionRequest,
    BatchUpsertPermissionResponse,
} from "@/lib/api/permission/menuPermissions.interface";

/**
 * Mutation hook for batch upserting role permissions.
 * Invalidates the role-permissions query on success so the panel refreshes.
 */
export const useBatchUpsertPermissions = () => {
    const qc = useQueryClient();
    return useMutation<BatchUpsertPermissionResponse, Error, BatchUpsertPermissionRequest>({
        mutationFn: batchUpsertPermissions,
        mutationKey: ["batch-upsert-permissions"],
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ["role-permissions", variables.roleId] });
        },
    });
};
