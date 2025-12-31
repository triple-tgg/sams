// src/lib/api/hooks/useAirlineOperations.ts
"use client";
import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { upsertAirline, getAirlineById, deleteAirline } from "@/lib/api/master/airlines/airlineOperations";
import type {
    AirlineUpsertRequest,
    AirlineUpsertResponse,
    AirlineByIdResponse,
    AirlineDeleteRequest,
    AirlineDeleteResponse
} from "@/lib/api/master/airlines/airlines.interface";

/**
 * Hook for getting airline by ID
 */
export const useAirlineById = (
    id: number,
    enabled: boolean = true
): UseQueryResult<AirlineByIdResponse, Error> => {
    return useQuery({
        queryKey: ['airline', id],
        queryFn: () => getAirlineById(id),
        enabled: enabled && id > 0,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

/**
 * Hook for creating/updating airline
 */
export const useUpsertAirline = () => {
    const queryClient = useQueryClient();

    return useMutation<AirlineUpsertResponse, Error, AirlineUpsertRequest>({
        mutationFn: (data) => upsertAirline(data),
        mutationKey: ['airline-upsert'],
        onSuccess: () => {
            // Invalidate airlines list to refetch
            queryClient.invalidateQueries({ queryKey: ['airlines-list'] });
            queryClient.invalidateQueries({ queryKey: ['airlines'] });
        },
        onError: (error) => {
            console.error('Airline upsert failed:', error);
        },
    });
};

/**
 * Hook for deleting airline
 */
export const useDeleteAirline = () => {
    const queryClient = useQueryClient();

    return useMutation<AirlineDeleteResponse, Error, AirlineDeleteRequest>({
        mutationFn: (data) => deleteAirline(data),
        mutationKey: ['airline-delete'],
        onSuccess: () => {
            // Invalidate airlines list to refetch
            queryClient.invalidateQueries({ queryKey: ['airlines-list'] });
            queryClient.invalidateQueries({ queryKey: ['airlines'] });
        },
        onError: (error) => {
            console.error('Airline delete failed:', error);
        },
    });
};

export { useAirlineById as default };
