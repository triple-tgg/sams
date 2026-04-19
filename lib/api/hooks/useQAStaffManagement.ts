"use client";
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import {
    getQAStaffList,
    QAStaffListRequest,
    QAStaffListResponse,
    upsertStaff,
    UpsertStaffRequest,
    UpsertStaffResponse,
    uploadStaffFile,
    UploadFileRequest,
    UploadFileResponse,
    getStaffById,
    StaffByIdResponse,
} from "@/lib/api/qa/staff-management";

/**
 * Hook for QA staff management paginated list
 * Uses POST /master/staff-management/listdata
 */
export const useQAStaffList = (
    params: QAStaffListRequest = {
        name: "",
        employeeId: "",
        positionId: 0,
        page: 1,
        perPage: 20,
    },
    enabled: boolean = true
): UseQueryResult<QAStaffListResponse, Error> => {
    return useQuery({
        queryKey: [
            "qa-staff-list",
            params.page,
            params.perPage,
            params.name,
            params.employeeId,
            params.positionId,
        ],
        queryFn: () => getQAStaffList(params),
        enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook for creating/updating staff
 * Uses POST /master/staff-management/upsert
 */
export const useUpsertStaff = (): UseMutationResult<UpsertStaffResponse, Error, UpsertStaffRequest> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: upsertStaff,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["qa-staff-list"] });
        },
    });
};

/**
 * Hook for uploading staff profile file
 * Uses POST /master/staff-management/uploadfile
 */
export const useUploadStaffFile = (): UseMutationResult<UploadFileResponse, Error, UploadFileRequest> => {
    return useMutation({
        mutationFn: uploadStaffFile,
    });
};

/**
 * Hook for fetching staff details by ID
 * Uses GET /master/staff-management/byid/{staffId}
 */
export const useStaffById = (
    staffId: number,
    enabled: boolean = true
): UseQueryResult<StaffByIdResponse, Error> => {
    return useQuery({
        queryKey: ["qa-staff-detail", staffId],
        queryFn: () => getStaffById(staffId),
        enabled: enabled && staffId > 0,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

export default useQAStaffList;
