import axiosConfig from "@/lib/axios.config";

// Interface for attachment files
export interface AttachFiles {
  storagePath: string;
  realName: string;
  fileType: string;
}

// Interface for aircraft check type
export interface AircraftCheckType {
  checkType: string;
  checkSubType: string[];
}

// Interface for personnel
export interface Personnel {
  staffId: number;
  fromTime: string;
  toTime: string;
  note?: string;
}

// Interface for additional defect
export interface AdditionalDefect {
  details: string;
  maintenancePerformed: string;
  ataChapter: string;
  lae: number;
  mech: number;
  attachFiles?: AttachFiles;
}

// Interface for engine oil
export interface EngOil {
  leftOil: number;
  rightOil: number;
}

// Interface for fluid servicing
export interface FluidServicing {
  fluidName: string;
  hydraulicA: number;
  hydraulicB: number;
  hydraulicSTBY: number;
  engOil: EngOil[];
  otherOil: number;
}

// Interface for aircraft towing
export interface AircraftTowing {
  aircraftDate: string;
  onTime: string;
  offTime: string;
  bayFrom?: string;
  bayTo?: string;
}

// Interface for aircraft data
export interface AircraftData {
  aircraftCheckType: AircraftCheckType[];
  personnels?: Personnel[];
  additionalDefect?: AdditionalDefect[];
  fluidServicing?: FluidServicing;
  aircraftTowing?: AircraftTowing[];
}

// Interface for service request
export interface ServiceRequest {
  isPersonnels: boolean;
  isAdditionalDefect: boolean;
  isFluidServicing: boolean;
  isFlightdeck: boolean;
  isAircraftTowing: boolean;
  aircraft: AircraftData;
}

// Interface for service response
export interface ServiceResponse {
  message: string;
  responseData: any;
  error: string;
}

/**
 * Update service data for a line maintenance
 * @param lineMaintenanceId - ID of the line maintenance record
 * @param serviceData - Service data to update
 * @returns Promise<ServiceResponse> - Response from the API
 */
export const putService = async (
  lineMaintenanceId: number,
  serviceData: ServiceRequest
): Promise<ServiceResponse> => {
  try {
    console.log('Updating service data:', {
      lineMaintenanceId,
      serviceData: {
        ...serviceData,
        aircraft: {
          ...serviceData.aircraft,
          // Log summary for debugging
          aircraftCheckTypeCount: serviceData.aircraft.aircraftCheckType?.length || 0,
          personnelsCount: serviceData.aircraft.personnels?.length || 0,
          additionalDefectCount: serviceData.aircraft.additionalDefect?.length || 0,
          aircraftTowingCount: serviceData.aircraft.aircraftTowing?.length || 0,
        }
      }
    });

    const response = await axiosConfig.put(
      `/lineMaintenances/${lineMaintenanceId}/services`,
      serviceData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    console.log('Service update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Service update error:', error);
    throw error;
  }
};

/**
 * Helper function to create a service request from form data
 * @param formData - Form data from Services Step
 * @param options - Additional options for data transformation
 * @returns ServiceRequest - Formatted service request data
 */
// Helper function to safely parse number values
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to safely parse integer values
const safeParseInt = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to create fluid servicing data
const createFluidServicing = (fluidData: any): FluidServicing => {
  const fluidType = fluidData?.fluidName?.value || "";

  // Base values calculation (only if needed)
  const baseHydraulicA = safeParseFloat(fluidData.hydOilA || fluidData.hydOilBlue);
  const baseHydraulicB = safeParseFloat(fluidData.hydOilB || fluidData.hydOilGreen);
  const baseHydraulicSTBY = safeParseFloat(fluidData.hydOilSTBY || fluidData.hydOilYellow);
  const baseOtherOil = safeParseFloat(fluidData.otherOil);

  console.log("createFluidServicing", { fluidData, baseHydraulicA, baseHydraulicB, baseHydraulicSTBY, baseOtherOil });
  // Create engine oil array only if needed
  const createEngOilArray = () => (fluidData.engOilSets || []).map((oilSet: any) => ({
    leftOil: safeParseFloat(oilSet.left || oilSet.leftOil),
    rightOil: safeParseFloat(oilSet.right || oilSet.rightOil)
  }));

  // Apply conditional logic based on fluid type for optimal performance
  switch (fluidType) {
    case 'ENG Oil':
      return {
        fluidName: fluidType,
        hydraulicA: 0,
        hydraulicB: 0,
        hydraulicSTBY: 0,
        engOil: createEngOilArray(),
        otherOil: 0
      };

    case 'Hydraulic':
      return {
        fluidName: fluidType,
        hydraulicA: baseHydraulicA,
        hydraulicB: baseHydraulicB,
        hydraulicSTBY: baseHydraulicSTBY,
        engOil: [],
        otherOil: 0
      };

    case 'APU Oil':
      return {
        fluidName: fluidType,
        hydraulicA: 0,
        hydraulicB: 0,
        hydraulicSTBY: 0,
        engOil: [],
        otherOil: baseOtherOil
      };

    default:
      return {
        fluidName: fluidType,
        hydraulicA: baseHydraulicA,
        hydraulicB: baseHydraulicB,
        hydraulicSTBY: baseHydraulicSTBY,
        engOil: createEngOilArray(),
        otherOil: baseOtherOil
      };
  }
};

export const createServiceRequestFromForm = (
  formData: any,
  options: {
    enablePersonnels?: boolean;
    enableAdditionalDefect?: boolean;
    enableFluidServicing?: boolean;
    enableFlightdeck?: boolean;
    enableAircraftTowing?: boolean;
  } = {}
): ServiceRequest => {
  // Pre-calculate boolean flags for better performance
  const shouldIncludePersonnels = formData.addPersonnels && formData.personnel?.length > 0;
  const shouldIncludeDefects = formData.additionalDefectRectification && formData.additionalDefects?.length > 0;
  const shouldIncludeFluid = !!formData.servicingPerformed && formData.fluid;
  const shouldIncludeTowing = formData.aircraftTowing && formData.aircraftTowingInfo?.length > 0;

  console.log("createServiceRequestFromForm options:", {
    shouldIncludePersonnels,
    shouldIncludeDefects,
    shouldIncludeFluid,
    shouldIncludeTowing
  });
  return {
    isPersonnels: options.enablePersonnels ?? formData.addPersonnels ?? false,
    isAdditionalDefect: options.enableAdditionalDefect ?? formData.additionalDefectRectification ?? false,
    isFluidServicing: options.enableFluidServicing ?? formData.servicingPerformed ?? false,
    isFlightdeck: options.enableFlightdeck ?? formData.flightDeck ?? false,
    isAircraftTowing: options.enableAircraftTowing ?? formData.aircraftTowing ?? false,
    aircraft: {
      // Always include aircraft checks (required)
      aircraftCheckType: (formData.aircraftChecks || []).map((check: any) => ({
        checkType: check.maintenanceTypes || "",
        checkSubType: check.maintenanceSubTypes || []
      })),

      // Conditionally include other sections for better performance
      ...(shouldIncludePersonnels && {
        personnels: formData.personnel.map((person: any) => ({
          staffId: person.staffId || "",
          formTime: person.formTime || "",
          formDate: person.formDate || "",
          toDate: person.toDate || "",
          toTime: person.toTime || "",
          note: person.remark || ""
        }))
      }),

      ...(shouldIncludeDefects && {
        additionalDefect: formData.additionalDefects.map((defect: any) => ({
          details: defect.defect || "",
          maintenancePerformed: defect.maintenancePerformed || "",
          ataChapter: defect.ataChapter || "",
          lae: safeParseFloat(defect.laeMH),
          mech: safeParseFloat(defect.mechMH),
          ...(defect.attachFiles?.length > 0 && {
            attachFiles: {
              storagePath: defect.attachFiles[0],
              realName: defect.attachFiles[0].split('/').pop() || "",
              fileType: "service"
            }
          })
        }))
      }),

      ...(shouldIncludeFluid && {
        fluidServicing: createFluidServicing(formData.fluid)
      }),

      ...(shouldIncludeTowing && {
        aircraftTowing: formData.aircraftTowingInfo.map((towing: any) => ({
          aircraftDate: towing.aircraftDate || "",
          onDate: towing.onDate || "",
          onTime: towing.onTime || "",
          offDate: towing.offDate || "",
          offTime: towing.offTime || "",
          ...(towing.bayFrom && { bayFrom: towing.bayFrom }),
          ...(towing.bayTo && { bayTo: towing.bayTo })
        }))
      })
    }
  };
};

export default putService;