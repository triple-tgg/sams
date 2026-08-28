"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAircraftTypes,
  upsertAircraftType,
  deleteAircraftType,
  type AircraftTypeUpsertRequest,
} from "./aircraft-types";

export const aircraftTypeKeys = {
  list: ["aircraftTypes"] as const,
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
    },
  });
}

export function useDeleteAircraftType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAircraftType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aircraftTypeKeys.list });
    },
  });
}
