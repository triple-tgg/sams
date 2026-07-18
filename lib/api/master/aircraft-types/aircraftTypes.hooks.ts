"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAircraftTypes,
} from "@/lib/api/master/aircraft-types/getaircraftTypes";
import {
  getAircraftTypeById,
  type AircraftTypeDetail,
} from "@/lib/api/master/aircraft-types/getAircraftTypeById";
import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Query Keys
// ──────────────────────────────────────────────────────────────

export const aircraftTypeKeys = {
  list: ["aircraftTypes"] as const,
  detail: (id: number) => ["aircraftTypeDetail", id] as const,
};

// ──────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────

/** Fetch all aircraft types (simple list for dropdowns) */
export function useAircraftTypes() {
  return useQuery({
    queryKey: aircraftTypeKeys.list,
    queryFn: getAircraftTypes,
  });
}

/** Fetch aircraft type detail by ID */
export function useAircraftTypeById(id: number | null) {
  return useQuery({
    queryKey: aircraftTypeKeys.detail(id!),
    queryFn: () => getAircraftTypeById(id!),
    enabled: id !== null,
  });
}

// ──────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────

export interface UpsertAircraftTypeRequest {
  id?: number;
  code: string;
  name: string;
  modelName: string;
  modelSubName: string;
  classicOrNeo: string;
  flagEnging1: boolean;
  flagEnging2: boolean;
  flagEnging3: boolean;
  flagEnging4: boolean;
  flagCsd1: boolean;
  flagCsd2: boolean;
  flagCsd3: boolean;
  flagCsd4: boolean;
  flagHydrolicGreen: boolean;
  flagHydrolicBlue: boolean;
  flagHydrolicYellow: boolean;
  flagApu: boolean;
}

/** Create or update an aircraft type */
export function useUpsertAircraftType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpsertAircraftTypeRequest) => {
      const res = data.id
        ? await axiosConfig.put("/master/AircraftTypes", data)
        : await axiosConfig.post("/master/AircraftTypes", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aircraftTypeKeys.list });
    },
  });
}

/** Delete an aircraft type */
export function useDeleteAircraftType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await axiosConfig.delete(`/master/AircraftTypes/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aircraftTypeKeys.list });
    },
  });
}
