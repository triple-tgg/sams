import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getAircraftTypes } from "../master/aircraft-types/getaircraftTypes";
import { AircraftTypesResponse, AircraftTypeOption } from "../master/aircraft-types/aircraftTypes.interface";

export const useAircraftTypes = () => {
  const query = useQuery<AircraftTypesResponse, Error>({
    queryKey: ["aircraftTypes"],
    queryFn: getAircraftTypes,
    // staleTime: 30 * 60 * 1000, // 30 minutes - master data doesn't change often
    // gcTime: 60 * 60 * 1000, // 1 hour
    staleTime: 0,
    gcTime: 0,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Memoized options for dropdowns/select components
  const options = useMemo(() => {
    if (!query.data?.responseData) return [];

    return query.data.responseData.map((aircraftType): AircraftTypeOption => ({
      value: aircraftType.code,
      label: aircraftType.code,
      id: aircraftType.id,
    }));
  }, [query.data]);

  // Memoized map for quick lookups
  const aircraftTypeMap = useMemo(() => {
    if (!query.data?.responseData) return new Map();

    const map = new Map();
    query.data.responseData.forEach(aircraftType => {
      map.set(aircraftType.id, aircraftType);
      map.set(aircraftType.code, aircraftType);
    });
    return map;
  }, [query.data]);

  // Helper functions
  const getAircraftTypeById = (id: number) => aircraftTypeMap.get(id);
  const getAircraftTypeByCode = (code: string) => aircraftTypeMap.get(code);

  const findOption = (value: string) => options.find(option => option.value === value);

  return {
    ...query,
    options,                    // For dropdowns: [{ value, label, id }]
    aircraftTypes: query.data?.responseData || [], // Raw data
    aircraftTypeMap,           // For quick lookups
    usingFallback: query.data?.error && options.length > 0,
    getAircraftTypeById,       // Helper: get by ID
    getAircraftTypeByCode,     // Helper: get by code
    findOption,                // Helper: find dropdown option
  };
};
