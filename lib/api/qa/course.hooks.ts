"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCourseList,
  CourseData,
  CourseListRequest,
  upsertCourseMatrixRequirements,
  UpsertCourseMatrixRequirementRequest,
  UpsertCourseMatrixRequirementResponse,
} from "./course";

export const courseKeys = {
  all: ["courses-list"] as const,
  list: (params?: Partial<CourseListRequest>) => ["courses-list", params] as const,
};

export function useCourseList(params?: Partial<CourseListRequest>) {
  const requestBody: CourseListRequest = {
    categoryId: params?.categoryId ?? null,
    courseName: params?.courseName ?? "",
    courseDepartmentRequirementId: params?.courseDepartmentRequirementId ?? null,
    page: params?.page ?? 1,
    perPage: params?.perPage ?? 9999,
  };

  return useQuery({
    queryKey: courseKeys.list(requestBody),
    queryFn: () => getCourseList(requestBody),
    staleTime: 5 * 60 * 1000,
  });
}

/** Query key prefix used by the Training Needs Matrix (`['course-matrix', departmentId, categoryId]`). */
export const courseMatrixKeys = {
  all: ["course-matrix"] as const,
};

/**
 * Upsert Training Needs Matrix requirements.
 * One call carries a set of course × department-sub requirements plus the aircraft/engine
 * combinations that apply to all of them.
 */
export function useUpsertCourseMatrixRequirements() {
  const queryClient = useQueryClient();
  return useMutation<UpsertCourseMatrixRequirementResponse, Error, UpsertCourseMatrixRequirementRequest>({
    mutationKey: ["course-matrix-requirements-upsert"],
    mutationFn: (data) => upsertCourseMatrixRequirements(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseMatrixKeys.all });
    },
  });
}
