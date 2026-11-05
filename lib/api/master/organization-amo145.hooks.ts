"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStaffDepartmentAmo145s,
  getStaffDepartmentAmo145ById,
  upsertStaffDepartmentAmo145,
  getStaffDepartmentPositionAmo145s,
  getStaffDepartmentPositionAmo145ById,
  upsertStaffDepartmentPositionAmo145,
  type UpsertStaffDepartmentPositionAmo145Request,
  type UpsertStaffDepartmentAmo145Request,
} from "@/lib/api/master/organization-amo145";

// ──────────────────────────────────────────────────────────────
// Query Keys
// ──────────────────────────────────────────────────────────────

export const organizationAmo145Keys = {
  departments: ["staffDepartmentAmo145s"] as const,
  departmentDetail: (id: number) => ["staffDepartmentAmo145Detail", id] as const,
  positions: ["staffDepartmentPositionAmo145s"] as const,
  positionDetail: (id: number) =>
    ["staffDepartmentPositionAmo145Detail", id] as const,
};

// ──────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────

/** Fetch all AMO145 staff departments */
export function useStaffDepartmentAmo145s() {
  return useQuery({
    queryKey: organizationAmo145Keys.departments,
    queryFn: getStaffDepartmentAmo145s,
  });
}

/** Fetch a single AMO145 staff department by ID (skipped when id is null) */
export function useStaffDepartmentAmo145ById(id: number | null) {
  return useQuery({
    queryKey: organizationAmo145Keys.departmentDetail(id ?? 0),
    queryFn: () => getStaffDepartmentAmo145ById(id as number),
    enabled: id !== null,
  });
}

/** Fetch all AMO145 staff department positions */
export function useStaffDepartmentPositionAmo145s() {
  return useQuery({
    queryKey: organizationAmo145Keys.positions,
    queryFn: getStaffDepartmentPositionAmo145s,
  });
}

/** Fetch a single AMO145 staff department position by ID (skipped when id is null) */
export function useStaffDepartmentPositionAmo145ById(id: number | null) {
  return useQuery({
    queryKey: organizationAmo145Keys.positionDetail(id ?? 0),
    queryFn: () => getStaffDepartmentPositionAmo145ById(id as number),
    enabled: id !== null,
  });
}

// ──────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────

/** Add (id = 0) or edit an AMO145 staff department */
export function useUpsertStaffDepartmentAmo145() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertStaffDepartmentAmo145Request) =>
      upsertStaffDepartmentAmo145(data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: organizationAmo145Keys.departments });
      if (variables.id !== 0) {
        qc.invalidateQueries({
          queryKey: organizationAmo145Keys.departmentDetail(variables.id),
        });
      }
    },
  });
}

/** Add (id = 0) or edit an AMO145 staff department position */
export function useUpsertStaffDepartmentPositionAmo145() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertStaffDepartmentPositionAmo145Request) =>
      upsertStaffDepartmentPositionAmo145(data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: organizationAmo145Keys.positions });
      if (variables.id !== 0) {
        qc.invalidateQueries({
          queryKey: organizationAmo145Keys.positionDetail(variables.id),
        });
      }
    },
  });
}
