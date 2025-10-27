import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  getEquipmentNames,
  getEquipmentByCode,
  getEquipmentByCodes,
  Equipment,
  EquipmentApiResponse,
  EquipmentByCodeApiResponse
} from '@/lib/api/master/equipment/getEquiment';

// Query keys for equipment
export const equipmentQueryKeys = {
  all: ['equipment'] as const,
  names: () => [...equipmentQueryKeys.all, 'names'] as const,
  byCode: (code: string) => [...equipmentQueryKeys.all, 'byCode', code] as const,
  byCodes: (codes: string[]) => [...equipmentQueryKeys.all, 'byCodes', codes] as const,
};

/**
 * Hook to fetch all equipment names
 */
export const useEquipmentNames = (): UseQueryResult<EquipmentApiResponse, Error> => {
  return useQuery({
    queryKey: equipmentQueryKeys.names(),
    queryFn: getEquipmentNames,
    // staleTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 0,
    gcTime: 0,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch equipment by specific code
 */
export const useEquipmentByCode = (
  equipmentCode: string,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<EquipmentByCodeApiResponse, Error> => {
  return useQuery({
    queryKey: equipmentQueryKeys.byCode(equipmentCode),
    queryFn: () => getEquipmentByCode(equipmentCode),
    enabled: Boolean(equipmentCode && equipmentCode.trim() !== '' && options?.enabled !== false),
    // staleTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 0,
    gcTime: 0,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch multiple equipment by codes
 */
export const useEquipmentByCodes = (
  equipmentCodes: string[],
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<Equipment[], Error> => {
  return useQuery({
    queryKey: equipmentQueryKeys.byCodes(equipmentCodes),
    queryFn: () => getEquipmentByCodes(equipmentCodes),
    enabled: Boolean(
      equipmentCodes &&
      equipmentCodes.length > 0 &&
      equipmentCodes.some(code => code && code.trim() !== '') &&
      options?.enabled !== false
    ),
    // staleTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 0,
    gcTime: 0,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to get equipment data with search functionality
 */
export const useEquipmentSearch = () => {
  const { data: equipmentNames, isLoading, error } = useEquipmentNames();

  const searchEquipment = (searchTerm: string): Equipment[] => {
    if (!equipmentNames?.responseData || !searchTerm) {
      return equipmentNames?.responseData || [];
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return equipmentNames.responseData.filter(equipment =>
      equipment.code.toLowerCase().includes(lowerSearchTerm) ||
      equipment.id.toString().includes(lowerSearchTerm)
    );
  };

  return {
    equipmentList: equipmentNames?.responseData || [],
    searchEquipment,
    isLoading,
    error,
    isSuccess: !!equipmentNames?.responseData,
  };
};

/**
 * Custom hook for equipment validation
 */
export const useEquipmentValidation = () => {
  const { equipmentList } = useEquipmentSearch();

  const validateEquipmentCode = (code: string): boolean => {
    if (!code || code.trim() === '') return false;
    return equipmentList.some(equipment => equipment.code === code);
  };

  const getEquipmentByCodeFromList = (code: string): Equipment | null => {
    return equipmentList.find(equipment => equipment.code === code) || null;
  };

  return {
    validateEquipmentCode,
    getEquipmentByCodeFromList,
    availableEquipment: equipmentList,
  };
};

// Export all hooks
const equipmentHooks = {
  useEquipmentNames,
  useEquipmentByCode,
  useEquipmentByCodes,
  useEquipmentSearch,
  useEquipmentValidation,
};

export default equipmentHooks;
