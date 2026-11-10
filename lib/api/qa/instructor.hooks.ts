"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInstructors,
  getInstructorById,
  upsertInstructor,
  deleteInstructor,
  type InstructorUpsertRequest,
} from "@/lib/api/qa/instructor";

export const instructorKeys = {
  all: ["instructors"] as const,
  list: () => [...instructorKeys.all, "list"] as const,
  detail: (id: number) => [...instructorKeys.all, "detail", id] as const,
};

/** Fetch all instructors */
export function useInstructorList() {
  return useQuery({
    queryKey: instructorKeys.list(),
    queryFn: async () => {
      const res = await getInstructors();
      return res.responseData ?? [];
    },
  });
}

/** Fetch one instructor by id (disabled until a valid id is given) */
export function useInstructorById(id: number | null | undefined) {
  return useQuery({
    queryKey: instructorKeys.detail(id ?? 0),
    queryFn: async () => {
      const res = await getInstructorById(id as number);
      return res.responseData ?? null;
    },
    enabled: typeof id === "number" && id > 0,
  });
}

/** Create or update an instructor */
export function useUpsertInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InstructorUpsertRequest) => upsertInstructor(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.all });
    },
  });
}

/** Delete an instructor */
export function useDeleteInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteInstructor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instructorKeys.all });
    },
  });
}
