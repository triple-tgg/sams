// src/lib/api/hooks/usePushThf.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import { pushThf, PushThfRequest, PushThfResponse } from "../lineMaintenances/flight-thf/pushThf";

export function usePushThf() {
  const queryClient = useQueryClient();
  const loadingToastRef = useRef<string | number | undefined>();

  return useMutation<PushThfResponse, Error, PushThfRequest>({
    mutationFn: pushThf,
    onSuccess: (data, variables) => {
      // Dismiss loading toast if exists
      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
        loadingToastRef.current = undefined;
      }

      // Success toast
      toast.success("THF pushed successfully!", {
        description: `THF No: ${variables.thfNo} for flight ${variables.arrivalFlightNo}`,
      });

      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["lineMaintenancesThf"]
      });

      queryClient.invalidateQueries({
        queryKey: ["flight", "list"]
      });

      console.log("Push THF success:", data);
    },
    onError: (error, variables) => {
      // Dismiss loading toast if exists
      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
        loadingToastRef.current = undefined;
      }

      // Error toast
      toast.error("Failed to push THF", {
        description: error.message || "An error occurred while pushing THF",
      });

      console.error("Push THF error:", error);
      console.error("Failed with data:", variables);
    },
    onMutate: (variables) => {
      // Loading toast and store the ID
      loadingToastRef.current = toast.loading("Pushing THF...", {
        description: `Processing THF ${variables.thfNo}`,
      });

      console.log("Pushing THF with data:", variables);
    }
  });
}
