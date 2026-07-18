"use client";

import { useQuery } from "@tanstack/react-query";
import { getEmployeeLogbookRecords, GetLogbookParams } from "./employee-logbook";

export const employeeLogbookKeys = {
  all: ["employeeLogbook"] as const,
  lists: () => [...employeeLogbookKeys.all, "list"] as const,
  list: (params: GetLogbookParams) => [...employeeLogbookKeys.lists(), params] as const,
};

export function useEmployeeLogbookList(params: GetLogbookParams) {
  return useQuery({
    queryKey: employeeLogbookKeys.list(params),
    queryFn: () => getEmployeeLogbookRecords(params),
  });
}
