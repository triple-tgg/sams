"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTrainingVenueList,
  getTrainingVenueById,
  upsertTrainingVenue,
  deleteTrainingVenue,
  type TrainingVenueUpsertRequest,
  type TrainingVenueDeleteRequest,
} from "@/lib/api/master/training-venues";

export const trainingVenueKeys = {
  all: ["training-venues"] as const,
  list: () => [...trainingVenueKeys.all, "list"] as const,
  detail: (id: number) => [...trainingVenueKeys.all, "detail", id] as const,
};

/** Fetch all training venues */
export function useTrainingVenueList() {
  return useQuery({
    queryKey: trainingVenueKeys.list(),
    queryFn: getTrainingVenueList,
    refetchOnWindowFocus: false,
  });
}

/** Fetch one training venue (enabled only for a real id) */
export function useTrainingVenueById(id: number, enabled = true) {
  return useQuery({
    queryKey: trainingVenueKeys.detail(id),
    queryFn: () => getTrainingVenueById(id),
    enabled: enabled && id > 0,
    refetchOnWindowFocus: false,
  });
}

/** Create or update a training venue */
export function useUpsertTrainingVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TrainingVenueUpsertRequest) => upsertTrainingVenue(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trainingVenueKeys.all });
    },
  });
}

/** Delete a training venue */
export function useDeleteTrainingVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TrainingVenueDeleteRequest) => deleteTrainingVenue(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trainingVenueKeys.all });
    },
  });
}
