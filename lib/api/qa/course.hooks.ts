"use client";

import { useQuery } from "@tanstack/react-query";
import { getCourseList, CourseData, CourseListRequest } from "./course";

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
