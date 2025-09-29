import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelFlight, CancelFlightParams } from "../flight/cancelFlight";
import toast from "react-hot-toast";

export const useCancelFlightMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CancelFlightParams) => cancelFlight(params),
    onSuccess: (data, variables) => {
      // Show success message
      toast.success(data.message || "Flight cancelled successfully");

      // Invalidate flight list with a slight delay to avoid concurrent operations
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["flightList"] });
      }, 100);

      console.log(`Flight ${variables.flightInfosId} cancelled successfully`);
    },
    onError: (error: any) => {
      // Show error message
      const errorMessage = error?.response?.data?.message || "Failed to cancel flight";
      toast.error(errorMessage);

      console.error("Cancel flight error:", error);
    },
  });
};
