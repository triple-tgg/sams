import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
    getAircraftTypeById,
    AircraftTypeByIdResponse,
    AircraftTypeFlags,
    computeAircraftTypeFlags,
} from "../master/aircraft-types/getAircraftTypeById";

/**
 * Hook to fetch aircraft type detail by ID and compute feature flags.
 * Used by ServicesStep to determine which fluid servicing fields to display.
 */
export const useAircraftTypeById = (id: number | null | undefined) => {
    const query = useQuery<AircraftTypeByIdResponse, Error>({
        queryKey: ["aircraftTypeById", id],
        queryFn: () => getAircraftTypeById(id!),
        enabled: !!id,
        staleTime: 30 * 60 * 1000, // 30 min — master data rarely changes
        gcTime: 60 * 60 * 1000,
        retry: 2,
    });

    const flags: AircraftTypeFlags | null = useMemo(() => {
        if (!query.data?.responseData) return null;
        return computeAircraftTypeFlags(query.data.responseData);
    }, [query.data]);

    return {
        ...query,
        aircraftTypeDetail: query.data?.responseData || null,
        flags,
    };
};
