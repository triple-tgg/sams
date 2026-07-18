"use client";

import { useQuery } from "@tanstack/react-query";
import { getAircraftTypeLicenses, AircraftTypeLicense } from "./aircraft-type-licenses";

export const aircraftTypeLicenseKeys = {
    all: ["aircraftTypeLicenses"] as const,
};

export function useAircraftTypeLicenses() {
    return useQuery<AircraftTypeLicense[]>({
        queryKey: aircraftTypeLicenseKeys.all,
        queryFn: getAircraftTypeLicenses,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
}
