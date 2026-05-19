"use client";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery, UseQueryResult } from "@tanstack/react-query";
import {
    getRoleList,
    getRoleById,
    upsertRole,
    deleteRole,
    getRolePermissions,
    upsertRolePermissions,
} from "@/lib/api/master/roles/roleOperations";
import type {
    RolesResponse,
    RoleByIdResponse,
    RoleUpsertRequest,
    RoleUpsertResponse,
    RoleDeleteRequest,
    RoleDeleteResponse,
    RolePermissionUpsertRequest,
    RolePermissionUpsertResponse,
} from "@/lib/api/master/roles/roles.interface";
import type { MenuPermissionsResponse } from "@/lib/api/permission/menuPermissions.interface";

const PER_PAGE = 20;

/**
 * Infinite scroll role list — loads PER_PAGE items per page,
 * fetches next page when scroll sentinel is visible.
 */
export const useInfiniteRoleList = (enabled = true) =>
    useInfiniteQuery<RolesResponse, Error>({
        queryKey: ["role-list-infinite"],
        queryFn: ({ pageParam = 1 }) =>
            getRoleList({ page: pageParam as number, perPage: PER_PAGE }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const loaded = allPages.reduce((sum, p) => sum + (p.responseData?.length ?? 0), 0);
            return loaded < (lastPage.totalAll ?? 0) ? allPages.length + 1 : undefined;
        },
        enabled,
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });


/** Single role */
export const useRoleById = (id: number, enabled = true): UseQueryResult<RoleByIdResponse, Error> =>
    useQuery({
        queryKey: ["role", id],
        queryFn: () => getRoleById(id),
        enabled: enabled && id > 0,
    });

/** Create / update role */
export const useUpsertRole = () => {
    const qc = useQueryClient();
    return useMutation<RoleUpsertResponse, Error, RoleUpsertRequest>({
        mutationFn: upsertRole,
        mutationKey: ["role-upsert"],
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["role-list"] });
            qc.invalidateQueries({ queryKey: ["roles"] });
        },
    });
};

/** Delete role */
export const useDeleteRole = () => {
    const qc = useQueryClient();
    return useMutation<RoleDeleteResponse, Error, RoleDeleteRequest>({
        mutationFn: deleteRole,
        mutationKey: ["role-delete"],
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["role-list"] });
            qc.invalidateQueries({ queryKey: ["roles"] });
        },
    });
};

/** Permissions for a role */
export const useRolePermissions = (roleId: number, enabled = true): UseQueryResult<MenuPermissionsResponse, Error> =>
    useQuery({
        queryKey: ["role-permissions", roleId],
        queryFn: () => getRolePermissions(roleId),
        enabled: enabled && roleId > 0,
        staleTime: 2 * 60 * 1000,
    });

/** Save permissions */
export const useUpsertRolePermissions = () => {
    const qc = useQueryClient();
    return useMutation<RolePermissionUpsertResponse, Error, RolePermissionUpsertRequest>({
        mutationFn: upsertRolePermissions,
        mutationKey: ["role-permissions-upsert"],
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ["role-permissions", variables.roleId] });
        },
    });
};

export default useInfiniteRoleList;
