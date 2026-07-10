"use client";

import { useQuery } from "@tanstack/react-query";
import { getAttendanceTypes } from "./attendanceTypes";

export const attendanceTypesKeys = {
  all: ["attendanceTypes"] as const,
};

export function useAttendanceTypes() {
  return useQuery({
    queryKey: attendanceTypesKeys.all,
    queryFn: getAttendanceTypes,
  });
}
