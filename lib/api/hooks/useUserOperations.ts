// src/lib/api/hooks/useUserOperations.ts
"use client";
import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { getUserList, getUserById, upsertUser, deleteUser } from "@/lib/api/master/users/userOperations";
import type {
    UserListRequest,
    UserListResponse,
    UserByIdResponse,
    UserUpsertRequest,
    UserUpsertResponse,
    UserDeleteRequest,
    UserDeleteResponse
} from "@/lib/api/master/users/users.interface";

/**
 * Hook for getting paginated user list
 */
export const useUserList = (
    params: UserListRequest = { page: 1, perPage: 10 },
    enabled: boolean = true
): UseQueryResult<UserListResponse, Error> => {
    return useQuery({
        queryKey: ['user-list', params.page, params.perPage],
        queryFn: () => getUserList(params),
        enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook for getting user by ID
 */
export const useUserById = (
    id: number,
    enabled: boolean = true
): UseQueryResult<UserByIdResponse, Error> => {
    return useQuery({
        queryKey: ['user', id],
        queryFn: () => getUserById(id),
        enabled: enabled && id > 0,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

/**
 * Hook for creating/updating user
 */
export const useUpsertUser = () => {
    const queryClient = useQueryClient();

    return useMutation<UserUpsertResponse, Error, UserUpsertRequest>({
        mutationFn: (data) => upsertUser(data),
        mutationKey: ['user-upsert'],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-list'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (error) => {
            console.error('User upsert failed:', error);
        },
    });
};

/**
 * Hook for deleting user
 */
export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation<UserDeleteResponse, Error, UserDeleteRequest>({
        mutationFn: (data) => deleteUser(data),
        mutationKey: ['user-delete'],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-list'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (error) => {
            console.error('User delete failed:', error);
        },
    });
};

export default useUserList;
