"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAircraftFamilyCodes,
  upsertAircraftFamilyCode,
  deleteAircraftFamilyCode,
  type AircraftFamilyUpsertRequest,
} from "./aircraft-family";

export const aircraftFamilyKeys = {
  list: ["aircraftFamilyCodes"] as const,
};

export function useAircraftFamilyCodes() {
  return useQuery({
    queryKey: aircraftFamilyKeys.list,
    queryFn: fetchAircraftFamilyCodes,
  });
}

export function useUpsertAircraftFamilyCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AircraftFamilyUpsertRequest) => upsertAircraftFamilyCode(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aircraftFamilyKeys.list });
    },
  });
}

export function useDeleteAircraftFamilyCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAircraftFamilyCode(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aircraftFamilyKeys.list });
    },
  });
}
