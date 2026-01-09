import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getStaffsTypes, getStaffsTypesAll, StaffType, StaffsTypesResponse } from "../master/staff/getStaffsTypes";

// For dropdown/select components
export interface StaffTypeOption {
  value: number;
  label: string;
  id: number;
}

export const useStaffsTypes = () => {
  const query = useQuery<StaffsTypesResponse, Error>({
    queryKey: ["staffsTypes"],
    queryFn: getStaffsTypes,
    staleTime: 30 * 60 * 1000, // 30 minutes - master data doesn't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
    // enabled: false,
    // retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  // const query = useQuery<StaffsTypesResponse, Error>({
  //   queryKey: ["staffsTypes"],
  //   queryFn: getStaffsTypes,
  //   staleTime: 5 * 60 * 1000, // 5 minutes
  //   gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in newer versions)
  //   retry: 2,
  //   refetchOnWindowFocus: false,
  // });

  // Memoized options for dropdowns/select components
  const options = useMemo(() => {
    if (!query.data?.responseData) return [];

    return query.data.responseData.map((staffType): StaffTypeOption => ({
      value: staffType.id,
      label: staffType.code,
      id: staffType.id,
    }));
  }, [query.data]);

  // Memoized map for quick lookups
  const staffTypeMap = useMemo(() => {
    if (!query.data?.responseData) return new Map();

    const map = new Map();
    query.data.responseData.forEach(staffType => {
      map.set(staffType.id, staffType);
      map.set(staffType.code, staffType);
    });
    return map;
  }, [query.data]);

  // Helper functions
  const getStaffTypeById = (id: number) => staffTypeMap.get(id);
  const getStaffTypeByCode = (code: string) => staffTypeMap.get(code);

  const findOption = (value: number) => options.find(option => option.value === value);

  return {
    ...query,
    options,                    // For dropdowns: [{ value, label, id }]
    staffTypes: query.data?.responseData || [], // Raw data
    staffTypeMap,              // For quick lookups
    usingFallback: query.data?.error && options.length > 0,
    getStaffTypeById,          // Helper: get by ID
    getStaffTypeByCode,        // Helper: get by code
    findOption,                // Helper: find dropdown option
  };
};

export const useStaffsTypesOptions = () => {
  const { options, isLoading, error, isError } = useStaffsTypes();

  // Return simplified interface focused on options
  return {
    options,
    isLoading,
    error,
    isError,
    hasOptions: options.length > 0,
  };
};

// Re-export types for convenience
export type { StaffType, StaffsTypesResponse } from "../master/staff/getStaffsTypes";

// Hook for getting ALL staff types (uses /master/StaffsTypesAll)
export const useStaffsTypesAll = () => {
  const query = useQuery<StaffsTypesResponse, Error>({
    queryKey: ["staffsTypesAll"],
    queryFn: getStaffsTypesAll,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const options = useMemo(() => {
    if (!query.data?.responseData) return [];

    return query.data.responseData.map((staffType): StaffTypeOption => ({
      value: staffType.id,
      label: staffType.code,
      id: staffType.id,
    }));
  }, [query.data]);

  return {
    ...query,
    options,
    staffTypes: query.data?.responseData || [],
  };
};

export const useStaffsTypesAllOptions = () => {
  const { options, isLoading, error, isError } = useStaffsTypesAll();

  return {
    options,
    isLoading,
    error,
    isError,
    hasOptions: options.length > 0,
  };
};
