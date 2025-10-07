import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import {
  putService,
  createServiceRequestFromForm,
  type ServiceRequest,
  type ServiceResponse
} from "../lineMaintenances/services/putService";

/**
 * Hook for updating service data using PUT API
 * @returns Mutation object for service update
 */
export const usePutService = () => {
  return useMutation<
    ServiceResponse,
    Error,
    { lineMaintenanceId: number; serviceData: ServiceRequest }
  >({
    mutationFn: async ({ lineMaintenanceId, serviceData }) => {
      return await putService(lineMaintenanceId, serviceData);
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Service Updated",
        description: `Service data for line maintenance ${variables.lineMaintenanceId} has been updated successfully.`,
      });
      console.log("Service update successful:", data);
    },
    onError: (error, variables) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || `Failed to update service data for line maintenance ${variables.lineMaintenanceId}. Please try again.`,
      });
      console.error("Service update failed:", error);
    },
  });
};

/**
 * Hook for updating service data from form data
 * @returns Mutation object for service update with form data transformation
 */
export const usePutServiceFromForm = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ServiceResponse,
    Error,
    {
      lineMaintenanceId: number;
      formData: any;
      options?: {
        enablePersonnels?: boolean;
        enableAdditionalDefect?: boolean;
        enableFluidServicing?: boolean;
        enableFlightdeck?: boolean;
        enableAircraftTowing?: boolean;
      };
    }
  >({
    mutationFn: async ({ lineMaintenanceId, formData, options = {} }) => {
      // Transform form data to service request format
      const serviceRequest = createServiceRequestFromForm(formData, options);

      console.log("Transformed service request:", {
        lineMaintenanceId,
        serviceRequest,
        originalFormData: formData
      });

      return await putService(lineMaintenanceId, serviceRequest);
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Service Saved",
        description: `Service data has been saved successfully for line maintenance ${variables.lineMaintenanceId}.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["lineMaintenancesThf"]
      });
    },
    onError: (error, variables) => {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || `Failed to save service data for line maintenance ${variables.lineMaintenanceId}. Please try again.`,
      });
      console.error("Service form update failed:", error);
    },
  });
};

/**
 * Hook for updating specific service sections
 * @returns Mutation object for partial service updates
 */
export const usePutServiceSection = () => {
  return useMutation<
    ServiceResponse,
    Error,
    {
      lineMaintenanceId: number;
      formData: any;
      section: 'personnels' | 'additionalDefect' | 'fluidServicing' | 'flightdeck' | 'aircraftTowing';
    }
  >({
    mutationFn: async ({ lineMaintenanceId, formData, section }) => {
      // Create service request with only the specified section enabled
      const options = {
        enablePersonnels: section === 'personnels',
        enableAdditionalDefect: section === 'additionalDefect',
        enableFluidServicing: section === 'fluidServicing',
        enableFlightdeck: section === 'flightdeck',
        enableAircraftTowing: section === 'aircraftTowing',
      };

      const serviceRequest = createServiceRequestFromForm(formData, options);

      console.log(`Updating ${section} section:`, {
        lineMaintenanceId,
        section,
        serviceRequest
      });

      return await putService(lineMaintenanceId, serviceRequest);
    },
    onSuccess: (data, variables) => {
      const sectionNames = {
        personnels: 'Personnel',
        additionalDefect: 'Additional Defects',
        fluidServicing: 'Fluid Servicing',
        flightdeck: 'Flight Deck',
        aircraftTowing: 'Aircraft Towing'
      };

      toast({
        title: "Section Updated",
        description: `${sectionNames[variables.section]} section has been updated successfully.`,
      });
      console.log(`${variables.section} section update successful:`, data);
    },
    onError: (error, variables) => {
      const sectionNames = {
        personnels: 'Personnel',
        additionalDefect: 'Additional Defects',
        fluidServicing: 'Fluid Servicing',
        flightdeck: 'Flight Deck',
        aircraftTowing: 'Aircraft Towing'
      };

      toast({
        variant: "destructive",
        title: "Section Update Failed",
        description: error.message || `Failed to update ${sectionNames[variables.section]} section. Please try again.`,
      });
      console.error(`${variables.section} section update failed:`, error);
    },
  });
};
