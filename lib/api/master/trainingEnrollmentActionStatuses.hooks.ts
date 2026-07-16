"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrainingEnrollmentActionStatuses } from "./trainingEnrollmentActionStatuses";

export const trainingEnrollmentActionStatusesKeys = {
  all: ["trainingEnrollmentActionStatuses"] as const,
};

export function useTrainingEnrollmentActionStatuses() {
  return useQuery({
    queryKey: trainingEnrollmentActionStatusesKeys.all,
    queryFn: getTrainingEnrollmentActionStatuses,
  });
}
