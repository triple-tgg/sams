import { useQuery } from "@tanstack/react-query";
import {
  getAircraftCheckTypes,
  getAircraftCheckSubTypes,
} from "../master/aircraft-check-types/aircraftCheckTypes";
import { AircraftCheckSubType, AircraftCheckType, MasterDataResponse } from "../master/aircraft-check-types/airlines.interface";

/**
 * Hook for fetching Aircraft Check Types
 */
export const useAircraftCheckTypes = () => {
  return useQuery<MasterDataResponse<AircraftCheckType>, Error>({
    queryKey: ["master", "aircraftCheckTypes"],
    queryFn: getAircraftCheckTypes,
    staleTime: 10 * 60 * 1000, // 10 minutes - master data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for fetching Aircraft Check Sub Types
 */
export const useAircraftCheckSubTypes = () => {
  return useQuery<MasterDataResponse<AircraftCheckSubType>, Error>({
    queryKey: ["master", "aircraftCheckSubTypes"],
    queryFn: getAircraftCheckSubTypes,
    staleTime: 10 * 60 * 1000, // 10 minutes - master data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Combined hook for fetching both Aircraft Check Types and Sub Types
 */
export const useAircraftCheckMasterData = () => {
  const checkTypesQuery = useAircraftCheckTypes();
  const checkSubTypesQuery = useAircraftCheckSubTypes();

  return {
    // Check Types
    checkTypes: checkTypesQuery.data?.responseData || [],
    isLoadingCheckTypes: checkTypesQuery.isLoading,
    checkTypesError: checkTypesQuery.error,

    // Check Sub Types
    checkSubTypes: checkSubTypesQuery.data?.responseData || [],
    isLoadingCheckSubTypes: checkSubTypesQuery.isLoading,
    checkSubTypesError: checkSubTypesQuery.error,

    // Combined states
    isLoading: checkTypesQuery.isLoading || checkSubTypesQuery.isLoading,
    isError: checkTypesQuery.isError || checkSubTypesQuery.isError,
    error: checkTypesQuery.error || checkSubTypesQuery.error,

    // Refetch functions
    refetchCheckTypes: checkTypesQuery.refetch,
    refetchCheckSubTypes: checkSubTypesQuery.refetch,
    refetchAll: () => {
      checkTypesQuery.refetch();
      checkSubTypesQuery.refetch();
    }
  };
};
