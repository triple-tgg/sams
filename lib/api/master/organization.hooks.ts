"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStaffDepartments,
  getStaffDepartmentPositions,
  getStaffDepartmentById,
  getStaffDepartmentPositionById,
  upsertStaffDepartment,
  type UpsertStaffDepartmentRequest,
  upsertStaffDepartmentPosition,
  type UpsertStaffDepartmentPositionRequest,
  deleteStaffDepartment,
  deleteStaffDepartmentPosition,
  getStaffDepartmentChiefs,
  upsertStaffDepartmentChief,
  type UpsertStaffDepartmentChiefRequest,
} from "@/lib/api/master/organization";

// ──────────────────────────────────────────────────────────────
// Query Keys
// ──────────────────────────────────────────────────────────────

export const organizationKeys = {
  departments: ["staffDepartments"] as const,
  departmentDetail: (id: number) => ["staffDepartmentDetail", id] as const,
  positions: ["staffDepartmentPositions"] as const,
  positionDetail: (id: number) => ["staffDepartmentPositionDetail", id] as const,
  chiefs: ["staffDepartmentChiefs"] as const,
};

// ──────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────

/** Fetch all staff departments */
export function useStaffDepartments() {
  return useQuery({
    queryKey: organizationKeys.departments,
    queryFn: getStaffDepartments,
  });
}

/** Fetch all staff department positions */
export function useStaffDepartmentPositions() {
  return useQuery({
    queryKey: organizationKeys.positions,
    queryFn: getStaffDepartmentPositions,
  });
}

/** Fetch all department chiefs (manager mappings) */
export function useStaffDepartmentChiefs() {
  return useQuery({
    queryKey: organizationKeys.chiefs,
    queryFn: getStaffDepartmentChiefs,
  });
}

/** Assign or update a department chief */
export function useUpsertStaffDepartmentChief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertStaffDepartmentChiefRequest) => upsertStaffDepartmentChief(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.chiefs });
    },
  });
}

/** Fetch a single staff department by ID */
export function useStaffDepartmentById(id: number | null) {
  return useQuery({
    queryKey: organizationKeys.departmentDetail(id!),
    queryFn: () => getStaffDepartmentById(id!),
    enabled: id !== null,
  });
}

/** Fetch a single staff department position by ID */
export function useStaffDepartmentPositionById(id: number | null) {
  return useQuery({
    queryKey: organizationKeys.positionDetail(id!),
    queryFn: () => getStaffDepartmentPositionById(id!),
    enabled: id !== null,
  });
}

// ──────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────

/** Add or Edit a staff department */
export function useUpsertStaffDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertStaffDepartmentRequest) => upsertStaffDepartment(data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: organizationKeys.departments });
      if (variables.id !== 0) {
        qc.invalidateQueries({ queryKey: organizationKeys.departmentDetail(variables.id) });
      }
    },
  });
}

/** Add or Edit a staff department position */
export function useUpsertStaffDepartmentPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertStaffDepartmentPositionRequest) => upsertStaffDepartmentPosition(data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: organizationKeys.positions });
      if (variables.id !== 0) {
        qc.invalidateQueries({ queryKey: organizationKeys.positionDetail(variables.id) });
      }
    },
  });
}

/** Delete a staff department */
export function useDeleteStaffDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteStaffDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.departments });
      qc.invalidateQueries({ queryKey: organizationKeys.positions });
    },
  });
}

/** Delete a staff department position */
export function useDeleteStaffDepartmentPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteStaffDepartmentPosition(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.positions });
    },
  });
}
