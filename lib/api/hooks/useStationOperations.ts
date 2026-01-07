// src/lib/api/hooks/useStationOperations.ts
"use client";
import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { getStationList, getStationById, upsertStation, deleteStation } from "@/lib/api/master/stations/stationOperations";
import type {
    StationListRequest,
    StationListResponse,
    StationByIdResponse,
    StationUpsertRequest,
    StationUpsertResponse,
    StationDeleteRequest,
    StationDeleteResponse
} from "@/lib/api/master/stations/stations.interface";

/**
 * Hook for getting paginated station list
 */
export const useStationList = (
    params: StationListRequest = { page: 1, perPage: 10 },
    enabled: boolean = true
): UseQueryResult<StationListResponse, Error> => {
    return useQuery({
        queryKey: ['station-list', params.page, params.perPage],
        queryFn: () => getStationList(params),
        enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook for getting station by ID
 */
export const useStationById = (
    id: number,
    enabled: boolean = true
): UseQueryResult<StationByIdResponse, Error> => {
    return useQuery({
        queryKey: ['station', id],
        queryFn: () => getStationById(id),
        enabled: enabled && id > 0,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

/**
 * Hook for creating/updating station
 */
export const useUpsertStation = () => {
    const queryClient = useQueryClient();

    return useMutation<StationUpsertResponse, Error, StationUpsertRequest>({
        mutationFn: (data) => upsertStation(data),
        mutationKey: ['station-upsert'],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['station-list'] });
            queryClient.invalidateQueries({ queryKey: ['station'] });
        },
        onError: (error) => {
            console.error('Station upsert failed:', error);
        },
    });
};

/**
 * Hook for deleting station
 */
export const useDeleteStation = () => {
    const queryClient = useQueryClient();

    return useMutation<StationDeleteResponse, Error, StationDeleteRequest>({
        mutationFn: (data) => deleteStation(data),
        mutationKey: ['station-delete'],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['station-list'] });
            queryClient.invalidateQueries({ queryKey: ['station'] });
        },
        onError: (error) => {
            console.error('Station delete failed:', error);
        },
    });
};

export default useStationList;
