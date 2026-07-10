"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrainingDataStatuses } from "./trainingDataStatuses";

export const trainingDataStatusesKeys = {
  all: ["trainingDataStatuses"] as const,
};

export function useTrainingDataStatuses() {
  return useQuery({
    queryKey: trainingDataStatusesKeys.all,
    queryFn: getTrainingDataStatuses,
  });
}
