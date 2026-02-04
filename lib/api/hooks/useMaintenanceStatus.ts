'use client';

import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios.config';

const API_BASE = process.env.NEXT_PUBLIC_DEVELOPMENT_API
    || 'https://sam-api-staging-triple-tcoth-production.up.railway.app';

export interface MaintenanceStatus {
    id: number;
    code: string;
    name: string;
}

export interface MaintenanceStatusResponse {
    message: string;
    responseData: MaintenanceStatus[];
    error: string;
}

/**
 * Fetch maintenance status list
 */
const getMaintenanceStatus = async (): Promise<MaintenanceStatusResponse> => {
    const res = await axios.get(`${API_BASE}/master/MaintenanceStatus`);
    return res.data as MaintenanceStatusResponse;
};

/**
 * Hook for fetching maintenance status options
 */
export const useMaintenanceStatus = (enabled: boolean = true) => {
    const query = useQuery({
        queryKey: ['maintenance-status'],
        queryFn: getMaintenanceStatus,
        enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    // Transform to select options
    const options = query.data?.responseData?.map((status) => ({
        value: status.code,
        label: status.name,
        id: status.id,
    })) || [];

    return {
        data: query.data?.responseData || [],
        options,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
    };
};

export default useMaintenanceStatus;
