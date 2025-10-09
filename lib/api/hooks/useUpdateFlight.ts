// src/lib/api/hooks/useUpdateFlight.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateFlight,
  updateFlights,
  type UpdateFlightData,
  type UpdateFlightResponse
} from "@/lib/api/flight/updateFlight";

/**
 * Hook for updating a single flight
 * 
 * @returns Mutation object with mutate function and states
 * 
 * @example
 * ```typescript
 * const { mutate: updateFlightMutation, isPending, error } = useUpdateFlight();
 * 
 * updateFlightMutation(
 *   { payload: flightData },
 *   {
 *     onSuccess: () => {
 *       toast.success("Flight updated successfully!");
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   }
 * );
 * ```
 */
export function useUpdateFlight() {
  const qc = useQueryClient();

  type MutationContext = {
    previousFlight: unknown;
    previousFlightList: unknown;
    flightId: string;
  };

  return useMutation<
    UpdateFlightResponse,
    Error,
    { payload: UpdateFlightData; token?: string },
    MutationContext
  >({
    mutationFn: ({ payload, token }) => updateFlight(payload, { token }),
    onSuccess: (data, variables) => {
      // Invalidate flight-related queries to refresh data
      qc.invalidateQueries({ queryKey: ["flightList"] });
      qc.invalidateQueries({ queryKey: ["flightQuery", variables.payload.id] });
      qc.invalidateQueries({ queryKey: ["flights"] });

      // Optionally update the specific flight in cache
      qc.setQueryData(["flightQuery", variables.payload.id], (oldData: any) => {
        if (oldData?.responseData?.[0]) {
          return {
            ...oldData,
            responseData: [{ ...oldData.responseData[0], ...variables.payload }]
          };
        }
        return oldData;
      });
    },
    onError: (error, variables) => {
      console.error("Failed to update flight:", error);
      // Optionally invalidate queries on error to refresh stale data
      qc.invalidateQueries({ queryKey: ["flightQuery", variables.payload.id] });
    },
  });
}

/**
 * Hook for updating multiple flights in batch
 * 
 * @returns Mutation object for batch updates
 * 
 * @example
 * ```typescript
 * const { mutate: batchUpdate, isPending } = useUpdateFlights();
 * 
 * batchUpdate(
 *   { payload: [flight1, flight2, flight3] },
 *   {
 *     onSuccess: () => {
 *       toast.success("All flights updated successfully!");
 *     }
 *   }
 * );
 * ```
 */
export function useUpdateFlights() {
  const qc = useQueryClient();

  return useMutation<
    UpdateFlightResponse,
    Error,
    { payload: UpdateFlightData[]; token?: string }
  >({
    mutationFn: ({ payload, token }) => updateFlights(payload, { token }),
    onSuccess: (data, variables) => {
      // Invalidate all flight-related queries
      qc.invalidateQueries({ queryKey: ["flightList"] });
      qc.invalidateQueries({ queryKey: ["flights"] });

      // Invalidate individual flight queries
      variables.payload.forEach(flight => {
        qc.invalidateQueries({ queryKey: ["flightQuery", flight.id] });
      });
    },
    onError: (error) => {
      console.error("Failed to batch update flights:", error);
      // Refresh all flight data on error
      qc.invalidateQueries({ queryKey: ["flightList"] });
    },
  });
}

/**
 * Hook for optimistic flight updates
 * Immediately updates the UI before API call completes
 * 
 * @returns Mutation object with optimistic updates
 */
export function useOptimisticUpdateFlight() {
  const qc = useQueryClient();

  type MutationContext = {
    previousFlight: unknown;
    previousFlightList: unknown;
    flightId: string;
  };

  return useMutation<
    UpdateFlightResponse,
    Error,
    { payload: UpdateFlightData; token?: string },
    MutationContext
  >({
    mutationFn: ({ payload, token }) => updateFlight(payload, { token }),

    // Optimistic update - update UI immediately
    onMutate: async ({ payload }) => {
      // Cancel any outgoing refetches
      await qc.cancelQueries({ queryKey: ["flightQuery", payload.id] });
      await qc.cancelQueries({ queryKey: ["flightList"] });

      // Snapshot the previous value
      const previousFlight = qc.getQueryData(["flightQuery", payload.id]);
      const previousFlightList = qc.getQueryData(["flightList"]);

      // Optimistically update the individual flight
      qc.setQueryData(["flightQuery", payload.id], (oldData: any) => {
        if (oldData?.responseData?.[0]) {
          return {
            ...oldData,
            responseData: [{ ...oldData.responseData[0], ...payload }]
          };
        }
        return oldData;
      });

      // Return context with previous values for rollback
      return { previousFlight, previousFlightList, flightId: String(payload.id) };
    },

    // On success, invalidate to get fresh data
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({ queryKey: ["flightList"] });
      qc.invalidateQueries({ queryKey: ["flightQuery", variables.payload.id] });
    },

    // On error, rollback the optimistic update
    onError: (error, variables, context) => {
      if (context?.previousFlight) {
        qc.setQueryData(["flightQuery", context.flightId], context.previousFlight);
      }
      if (context?.previousFlightList) {
        qc.setQueryData(["flightList"], context.previousFlightList);
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: ["flightQuery", variables.payload.id] });
    },
  });
}

// Export default hook for convenience
export default useUpdateFlight;
