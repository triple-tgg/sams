// '@/lib/api/hooks/useFlightListPlanbyQuery.ts'
'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import getFlightListPlanby, { GetFlightListPlanbyParams } from '@/lib/api/flight/getFlightListPlanby';
import { GetFlightListParams } from '../flight/getFlightList';

export function useFlightListPlanbyQuery(params: GetFlightListParams) {
    return useQuery({
        queryKey: ['flightListPlanby', params],
        queryFn: () => getFlightListPlanby(params),
        enabled: Boolean(params.dateStart && params.dateEnd),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: 0,
        gcTime: 0,
        retry: (failureCount) => {
            if (failureCount < 3) {
                return true;
            }
            return false;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}

// Re-export types for convenience
export type { GetFlightListPlanbyParams, FlightPlanbyItem, GetFlightListPlanbyResponse } from '@/lib/api/flight/getFlightListPlanby';
