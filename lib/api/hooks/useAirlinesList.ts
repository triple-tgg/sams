// src/lib/api/hooks/useAirlinesList.ts
"use client";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getAirlinesList } from "@/lib/api/master/airlines/getAirlinesList";
import type { AirlineListRequest, AirlineListResponse } from "@/lib/api/master/airlines/airlines.interface";

/**
 * Custom hook for getting paginated airlines list
 * @param params - Pagination parameters (page, perPage)
 * @param enabled - Whether to enable the query
 */
export const useAirlinesList = (
    params: AirlineListRequest = { page: 1, perPage: 10 },
    enabled: boolean = true
): UseQueryResult<AirlineListResponse, Error> => {
    return useQuery({
        queryKey: ['airlines-list', params.page, params.perPage],
        queryFn: () => getAirlinesList(params),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

export default useAirlinesList;
