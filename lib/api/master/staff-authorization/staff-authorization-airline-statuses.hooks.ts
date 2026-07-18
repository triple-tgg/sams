"use client";
import { useQuery } from "@tanstack/react-query";
import { getStaffAuthorizationAirlineStatuses } from "./staff-authorization-airline-statuses";

export const staffAuthorizationAirlineStatusesKeys = {
    all: ["staff-authorization-airline-statuses"] as const,
};

export function useStaffAuthorizationAirlineStatuses() {
    return useQuery({
        queryKey: staffAuthorizationAirlineStatusesKeys.all,
        queryFn: getStaffAuthorizationAirlineStatuses,
    });
}
