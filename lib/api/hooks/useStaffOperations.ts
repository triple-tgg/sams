// src/lib/api/hooks/useStaffOperations.ts
"use client";
import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { getStaffList, getStaffById, upsertStaff, deleteStaff } from "@/lib/api/master/staff/staffOperations";
import type {
    StaffListRequest,
    StaffListResponse,
    StaffByIdResponse,
    StaffUpsertRequest,
    StaffUpsertResponse,
    StaffDeleteRequest,
    StaffDeleteResponse
} from "@/lib/api/master/staff/staff.interface";

/**
 * Hook for getting paginated staff list
 */
export const useStaffList = (
    params: StaffListRequest = { page: 1, perPage: 10 },
    enabled: boolean = true
): UseQueryResult<StaffListResponse, Error> => {
    return useQuery({
        queryKey: ['staff-list', params.page, params.perPage],
        queryFn: () => getStaffList(params),
        enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook for getting staff by ID
 */
export const useStaffById = (
    id: number,
    enabled: boolean = true
): UseQueryResult<StaffByIdResponse, Error> => {
    return useQuery({
        queryKey: ['staff', id],
        queryFn: () => getStaffById(id),
        enabled: enabled && id > 0,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

/**
 * Hook for creating/updating staff
 */
export const useUpsertStaff = () => {
    const queryClient = useQueryClient();

    return useMutation<StaffUpsertResponse, Error, StaffUpsertRequest>({
        mutationFn: (data) => upsertStaff(data),
        mutationKey: ['staff-upsert'],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-list'] });
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
        onError: (error) => {
            console.error('Staff upsert failed:', error);
        },
    });
};

/**
 * Hook for deleting staff
 */
export const useDeleteStaff = () => {
    const queryClient = useQueryClient();

    return useMutation<StaffDeleteResponse, Error, StaffDeleteRequest>({
        mutationFn: (data) => deleteStaff(data),
        mutationKey: ['staff-delete'],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-list'] });
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
        onError: (error) => {
            console.error('Staff delete failed:', error);
        },
    });
};

export default useStaffList;
