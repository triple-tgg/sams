// src/lib/api/hooks/useContractTypes.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import getContractTypes from "@/lib/api/master/contract-types/getContractTypes";
import type { ResContractType, ContractTypeItem } from "@/lib/api/master/contract-types/contractTypes.interface";

export function useContractTypes() {
    return useQuery<ResContractType, Error>({
        queryKey: ["contractTypes"],
        queryFn: getContractTypes,
        // staleTime: 5 * 60 * 1000, // 5 minutes
        // gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });
}

// Type for select options
type SelectOption = { value: string; label: string; id: number };

// Hook สำหรับ options ที่พร้อมใช้กับ Select
export function useContractTypesOptions() {
    const { data, isLoading, error } = useContractTypes();

    // Fallback options กรณี API ล้มเหลว
    const fallbackOptions: SelectOption[] = [
        { value: "MSA", label: "MSA", id: 1 },
        { value: "SGHA", label: "SGHA", id: 2 },
        { value: "Reciprocal Contract", label: "Reciprocal Contract", id: 3 },
        { value: "MOU", label: "MOU", id: 4 },
    ];

    const apiOptions: SelectOption[] = data?.responseData?.map((type: ContractTypeItem) => ({
        value: type.code,
        label: type.name,
        id: type.id,
    })) ?? [];

    // ใช้ API options ถ้ามีข้อมูล ไม่งั้นใช้ fallback
    const options: SelectOption[] = apiOptions.length > 0 ? apiOptions : (error ? fallbackOptions : []);

    return {
        options,
        isLoading,
        error,
        isEmpty: options.length === 0 && !isLoading,
        usingFallback: error && options.length > 0,
    };
}
