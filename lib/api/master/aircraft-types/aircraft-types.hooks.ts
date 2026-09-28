"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAircraftTypes,
  upsertAircraftType,
  deleteAircraftType,
  type AircraftTypeUpsertRequest,
} from "./aircraft-types";

export const aircraftTypeKeys = {
  // fetchAircraftTypes resolves to AircraftType[] — shares its cache with useAircraftTypesFull().
  // Must NOT be ["aircraftTypes"]: other hooks cache the raw { responseData } response under that key,
  // and whichever page loads first would hand the wrong shape to the other (".map is not a function").
  list: ["aircraftTypesFull"] as const,
  /** Legacy key used by the dropdown hooks — invalidated on writes so they refresh too. */
  legacyList: ["aircraftTypes"] as const,
};

export function useAircraftTypes() {
  return useQuery({
    queryKey: aircraftTypeKeys.list,
    queryFn: fetchAircraftTypes,
  });
}

export function useUpsertAircraftType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AircraftTypeUpsertRequest) => upsertAircraftType(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aircraftTypeKeys.list });
      qc.invalidateQueries({ queryKey: aircraftTypeKeys.legacyList });
    },
  });
}

export function useDeleteAircraftType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAircraftType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aircraftTypeKeys.list });
      qc.invalidateQueries({ queryKey: aircraftTypeKeys.legacyList });
    },
  });
}
