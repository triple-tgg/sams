"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  getStaffSuggestionList,
  StaffSuggestionRequest,
  StaffSuggestionResponse,
} from "../lineMaintenances/staff/getStaffSuggestionList";

export const useStaffSuggestionList = (
  criteria: StaffSuggestionRequest,
  enabled: boolean = true
): UseQueryResult<StaffSuggestionResponse, Error> => {
  return useQuery({
    queryKey: [
      "staffSuggestionList",
      criteria.airlineId,
      criteria.aircraftTypesId,
      criteria.staffsTypeId,
      criteria.series,
      criteria.engineCode,
    ],
    queryFn: () => getStaffSuggestionList(criteria),
    enabled:
      enabled &&
      Boolean(criteria.staffsTypeId && criteria.staffsTypeId > 0) &&
      Boolean(criteria.airlineId && criteria.airlineId > 0) &&
      Boolean(criteria.aircraftTypesId && criteria.aircraftTypesId > 0),
    staleTime: 0, // Always fetch fresh from API on every change
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export type {
  StaffSuggestionRequest,
  StaffSuggestionItem,
  StaffSuggestionResponse,
} from "../lineMaintenances/staff/getStaffSuggestionList";
