"use client";
import { useQuery } from "@tanstack/react-query";
import getAirlines from "./getAirlines";

export const airlineKeys = {
  all: ["airlines"] as const,
};

export function useAirlines() {
  return useQuery({
    queryKey: airlineKeys.all,
    queryFn: getAirlines,
    staleTime: 1000 * 60 * 60, // Data rarely changes, cache for 1 hour
  });
}
