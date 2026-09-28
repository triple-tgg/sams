import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { deleteFlightInfos } from "../flight/deleteFlightInfos";

export const useDeleteFlightInfosMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flightInfoIds: number[]) => deleteFlightInfos(flightInfoIds),
    onSuccess: (_data, flightInfoIds) => {
      toast.success(flightInfoIds.length > 1 ? `${flightInfoIds.length} flights deleted` : "Flight deleted");
      queryClient.invalidateQueries({ queryKey: ["flightList"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || error?.message || "Failed to delete flight");
    },
  });
};
