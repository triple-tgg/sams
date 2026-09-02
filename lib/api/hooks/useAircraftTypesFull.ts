// 'src/lib/api/hooks/useAircraftTypesFull.ts'
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAircraftTypes,
  type AircraftType,
} from "@/lib/api/master/aircraft-types/aircraft-types";

/**
 * Aircraft types with the full master record (familyCode, modelName, flags …)
 * via POST /master/aircraftTypes/list.
 *
 * NOTE: deliberately keyed "aircraftTypesFull" — useAircraftTypes() in this
 * folder and the two master-data hooks all share the ["aircraftTypes"] key but
 * resolve to different response shapes, so reusing it here would clash.
 */
export function useAircraftTypesFull() {
  return useQuery<AircraftType[], Error>({
    queryKey: ["aircraftTypesFull"],
    queryFn: fetchAircraftTypes,
    staleTime: 30 * 60 * 1000, // master data – rarely changes
    gcTime: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
