// src/lib/api/hooks/useContractStatus.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import getContractStatus from "@/lib/api/master/contract-status/getContractStatus";
import type { ResContractStatus, ContractStatusItem } from "@/lib/api/master/contract-status/contractStatus.interface";

export function useContractStatus() {
    return useQuery<ResContractStatus, Error>({
        queryKey: ["contractStatus"],
        queryFn: getContractStatus,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });
}

// Hook สำหรับ options ที่พร้อมใช้กับ Select
export function useContractStatusOptions() {
    const { data, isLoading, error } = useContractStatus();

    // Fallback options กรณี API ล้มเหลว
    const fallbackOptions = [
        { value: "active", label: "Active", id: 1 },
        { value: "on-hold", label: "On Hold", id: 2 },
        { value: "terminated", label: "Terminated", id: 3 },
    ];

    const apiOptions = data?.responseData?.map((status: ContractStatusItem) => ({
        value: status.code,
        label: status.name,
        id: status.id,
    })) ?? [];

    // ใช้ API options ถ้ามีข้อมูล ไม่งั้นใช้ fallback
    const options = apiOptions.length > 0 ? apiOptions : (error ? fallbackOptions : []);

    return {
        options,
        isLoading,
        error,
        isEmpty: options.length === 0 && !isLoading,
        usingFallback: error && options.length > 0,
    };
}
