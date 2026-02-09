import axiosConfig from "@/lib/axios.config";
import { convertDateToBackend } from "@/lib/utils/formatPicker";

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
  attachFiles?: AttachFiles[] | null;
  acDefect?: string;
  action?: string;
  technicalDelay?: string;
}

// Interface for engine oil
export interface EngOil {
  leftOil: number;
  rightOil: number;
}

// Interface for fluid servicing
export interface FluidServicing {
  hydraulicA: number;
  hydraulicB: number;
  hydraulicSTBY: number;
  engOil: EngOil[];
  csdOil: number[];
  apuOil: number;
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
  personnels?: Personnel[] | null;
  additionalDefect?: AdditionalDefect[] | null;
  fluidServicing?: FluidServicing;
  aircraftTowing?: AircraftTowing[] | null;
}

// Interface for service request
export interface ServiceRequest {
  isPersonnels: boolean;
  isAdditionalDefect: boolean;
  isFluidServicing: boolean;
  isFlightdeck: boolean;
  isAircraftTowing: boolean;
  aircraft: AircraftData;
  marshalling: number;
  rampFuel: number;
  actualUplift: number;
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
 */
// Helper function to safely parse number values
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to create fluid servicing data
const createFluidServicing = (fluidData: any): FluidServicing => {
  // Hydraulic oils
  const hydraulicA = safeParseFloat(fluidData.hydOilA || fluidData.hydOilBlue);
  const hydraulicB = safeParseFloat(fluidData.hydOilB || fluidData.hydOilGreen);
  const hydraulicSTBY = safeParseFloat(fluidData.hydOilSTBY || fluidData.hydOilYellow);

  // Engine oil array
  const engOil: EngOil[] = (fluidData.engOilSets || []).map((oilSet: any) => ({
    leftOil: safeParseFloat(oilSet.left || oilSet.leftOil),
    rightOil: safeParseFloat(oilSet.right || oilSet.rightOil)
  }));

  // CSD oil as number array (quantity values)
  const csdOil: number[] = (fluidData.csdIdgVsfgSets || []).map((set: any) =>
    safeParseFloat(set.quantity)
  );

  // APU oil
  const apuOil = safeParseFloat(fluidData.apuOil);

  console.log("createFluidServicing", { fluidData, hydraulicA, hydraulicB, hydraulicSTBY, engOil, csdOil, apuOil });

  return {
    hydraulicA,
    hydraulicB,
    hydraulicSTBY,
    engOil,
    csdOil,
    apuOil,
  };
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
  console.log("createServiceRequestFromForm", { options, formData });
  const shouldIncludePersonnels = formData.addPersonnels && formData.personnel?.length > 0;
  const shouldIncludeDefects = formData.additionalDefectRectification && formData.additionalDefects?.length > 0;
  const shouldIncludeFluid = !!formData.servicingPerformed && formData.fluid;
  const shouldIncludeTowing = formData.aircraftTowing && formData.aircraftTowingInfo?.length > 0;

  return {
    isPersonnels: options.enablePersonnels ?? formData.addPersonnels ?? false,
    isAdditionalDefect: options.enableAdditionalDefect ?? formData.additionalDefectRectification ?? false,
    isFluidServicing: options.enableFluidServicing ?? formData.servicingPerformed ?? false,
    isFlightdeck: options.enableFlightdeck ?? formData.flightDeck ?? false,
    isAircraftTowing: options.enableAircraftTowing ?? formData.aircraftTowing ?? false,

    // Top-level fields
    marshalling: safeParseFloat(formData.marshallingServicePerFlight),
    rampFuel: safeParseFloat(formData.fluid?.rampFuel),
    actualUplift: safeParseFloat(formData.fluid?.actualUplift),

    aircraft: {
      // Always include aircraft checks (required)
      aircraftCheckType: (formData.aircraftChecks || []).map((check: any) => ({
        checkType: check.maintenanceTypes || "",
        checkSubType: check.maintenanceSubTypes || []
      })),

      // Conditionally include other sections
      personnels: shouldIncludePersonnels
        ? formData.personnel.map((person: any) => ({
          staffId: person.staffId || "",
          formTime: person.formTime || "",
          formDate: person.formDate ? convertDateToBackend(person.formDate) : "",
          toDate: person.toDate ? convertDateToBackend(person.toDate) : "",
          toTime: person.toTime || "",
          staffTypeId: person.type ? Number(person.type) : undefined,
          note: person.remark || ""
        }))
        : null,

      additionalDefect: shouldIncludeDefects
        ? formData.additionalDefects.map((defect: any) => ({
          details: defect.defect || "",
          maintenancePerformed: defect.maintenancePerformed || "",
          ataChapter: defect.ataChapter || "",
          lae: safeParseFloat(defect.laeMH),
          mech: safeParseFloat(defect.mechMH),
          attachFiles: defect?.attachFiles || null,
          acDefect: defect.acDefect || "",
          action: defect.action || "",
          technicalDelay: defect.technicalDelay || "",
        }))
        : null,

      ...(shouldIncludeFluid && {
        fluidServicing: createFluidServicing(formData.fluid)
      }),

      aircraftTowing: shouldIncludeTowing
        ? formData.aircraftTowingInfo.map((towing: any) => ({
          aircraftDate: towing.aircraftDate ? convertDateToBackend(towing.aircraftDate) : "",
          onDate: towing.onDate ? convertDateToBackend(towing.onDate) : "",
          onTime: towing.onTime || "",
          offDate: towing.offDate ? convertDateToBackend(towing.offDate) : "",
          offTime: towing.offTime || "",
          ...(towing.bayFrom && { bayFrom: towing.bayFrom }),
          ...(towing.bayTo && { bayTo: towing.bayTo })
        }))
        : null
    }
  };
};

export default putService;