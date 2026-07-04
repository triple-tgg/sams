"use client";
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
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
    getStaffTrainingDashboard,
    TrainingDashboardResponse,
    createTrainingHistory,
    updateTrainingHistory,
    deleteTrainingHistory,
    UpsertTrainingHistoryRequest,
    TrainingHistoryMutationResponse,
    getLogbookSummary,
    LogbookSummaryResponse,
    getLogbookRecords,
    LogbookRecordsRequest,
    LogbookRecordsResponse,
    getLogbookPending,
    LogbookPendingResponse,
    upsertLogbookRecord,
    UpsertLogbookRecordRequest,
    UpsertLogbookRecordResponse,
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
        departmentId: 0,
        staffstypeId: 0,
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
            params.departmentId,
            params.staffstypeId,
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
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["qa-staff-list"] });
            if (variables.staffId > 0) {
                queryClient.invalidateQueries({ queryKey: ["qa-staff-detail", variables.staffId] });
            }
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

/**
 * Hook for fetching staff training dashboard
 * Uses GET /staffs/{staffId}/trainings/dashboard
 */
export const useStaffTrainingDashboard = (
    staffId: number,
    enabled: boolean = true
): UseQueryResult<TrainingDashboardResponse, Error> => {
    return useQuery({
        queryKey: ["qa-staff-training-dashboard", staffId],
        queryFn: () => getStaffTrainingDashboard(staffId),
        enabled: enabled && staffId > 0,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook for creating a new training history
 * Uses POST /staffs/{staffId}/trainings/histories
 */
export const useCreateTrainingHistory = (
    staffId: number
): UseMutationResult<TrainingHistoryMutationResponse, Error, UpsertTrainingHistoryRequest> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpsertTrainingHistoryRequest) => createTrainingHistory(staffId, data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["qa-staff-training-dashboard", staffId] });
            toast.success(res.responseData || "Training history added successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to add training history");
        },
    });
};

/**
 * Hook for updating an existing training history
 * Uses PUT /staffs/{staffId}/trainings/histories/{historyId}
 */
export const useUpdateTrainingHistory = (
    staffId: number
): UseMutationResult<TrainingHistoryMutationResponse, Error, { historyId: number; data: UpsertTrainingHistoryRequest }> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ historyId, data }) => updateTrainingHistory(staffId, historyId, data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["qa-staff-training-dashboard", staffId] });
            toast.success(res.responseData || "Training history updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update training history");
        },
    });
};

/**
 * Hook for deleting a training history
 * Uses DEL /staffs/{staffId}/trainings/histories/{historyId}
 */
export const useDeleteTrainingHistory = (
    staffId: number
): UseMutationResult<TrainingHistoryMutationResponse, Error, number> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (historyId: number) => deleteTrainingHistory(staffId, historyId),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["qa-staff-training-dashboard", staffId] });
            toast.success(res.responseData || "Training history deleted successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete training history");
        },
    });
};

export default useQAStaffList;

/**
 * Hook for fetching logbook summary
 * Uses GET /staffs/{staffId}/logbooks/summary
 */
export const useLogbookSummary = (
    staffId: number,
    enabled: boolean = true
): UseQueryResult<LogbookSummaryResponse, Error> => {
    return useQuery({
        queryKey: ["qa-staff-logbook-summary", staffId],
        queryFn: () => getLogbookSummary(staffId),
        enabled: enabled && staffId > 0,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook for fetching logbook records
 * Uses POST /staffs/{staffId}/logbooks/maintenance
 */
export const useLogbookRecords = (
    staffId: number,
    params: LogbookRecordsRequest = {
        formDate: "",
        aircraftTypeId: null,
        thfNo: "",
        page: 1,
        perPage: 10
    },
    enabled: boolean = true
): UseQueryResult<LogbookRecordsResponse, Error> => {
    return useQuery({
        queryKey: ["qa-staff-logbook-records", staffId, params.formDate, params.aircraftTypeId, params.thfNo, params.page, params.perPage],
        queryFn: () => getLogbookRecords(staffId, params),
        enabled: enabled && staffId > 0,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook for fetching logbook pending records
 * Uses GET /staffs/{staffId}/logbooks/pending
 */
export const useLogbookPending = (
    staffId: number,
    enabled: boolean = true
): UseQueryResult<LogbookPendingResponse, Error> => {
    return useQuery({
        queryKey: ["qa-staff-logbook-pending", staffId],
        queryFn: () => getLogbookPending(staffId),
        enabled: enabled && staffId > 0,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook for upserting logbook record
 * Uses POST /staffs/{staffId}/logbooks/record/upsert
 */
export const useUpsertLogbookRecord = (staffId: number): UseMutationResult<
    UpsertLogbookRecordResponse,
    Error,
    UpsertLogbookRecordRequest
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpsertLogbookRecordRequest) => upsertLogbookRecord(staffId, data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["qa-staff-logbook-pending", staffId] });
            queryClient.invalidateQueries({ queryKey: ["qa-staff-logbook-records", staffId] });
            queryClient.invalidateQueries({ queryKey: ["qa-staff-logbook-summary", staffId] });
            toast.success("Record saved successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to save record");
        },
    });
};
