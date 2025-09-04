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
  return {
    isPersonnels: options.enablePersonnels ?? formData.addPersonnels ?? false,
    isAdditionalDefect: options.enableAdditionalDefect ?? formData.additionalDefectRectification ?? false,
    isFluidServicing: options.enableFluidServicing ?? formData.servicingPerformed ?? false,
    isFlightdeck: options.enableFlightdeck ?? formData.flightDeck ?? false,
    isAircraftTowing: options.enableAircraftTowing ?? formData.aircraftTowing ?? false,
    aircraft: {
      aircraftCheckType: (formData.aircraftChecks || []).map((check: any) => ({
        checkType: check.maintenanceTypes || "",
        checkSubType: check.maintenanceSubTypes || []
      })),
      ...(formData.addPersonnels && formData.personnel && {
        personnels: formData.personnel.map((person: any) => ({
          staffId: parseInt(person.staffId) || 0,
          fromTime: person.from || "",
          toTime: person.to || "",
          note: person.remark || ""
        }))
      }),
      ...(formData.additionalDefectRectification && formData.additionalDefects && {
        additionalDefect: formData.additionalDefects.map((defect: any) => ({
          details: defect.defect || "",
          maintenancePerformed: defect.maintenancePerformed || "",
          ataChapter: defect.ataChapter || "",
          lae: parseFloat(defect.laeMH) || 0,
          mech: parseFloat(defect.mechMH) || 0,
          ...(defect.photo && defect.photo.length > 0 && {
            attachFiles: {
              storagePath: defect.photo[0], // First photo path
              realName: defect.photo[0].split('/').pop() || "",
              fileType: "service"
            }
          })
        }))
      }),
      ...(formData.servicingPerformed && formData.fluid && {
        fluidServicing: {
          fluidName: formData.fluid.fluidName.value || "",
          hydraulicA: parseFloat(formData.fluid.hydraulicA) || 0,
          hydraulicB: parseFloat(formData.fluid.hydraulicB) || 0,
          hydraulicSTBY: parseFloat(formData.fluid.hydraulicSTBY) || 0,
          engOil: (formData.fluid.engineOilSets || []).map((oilSet: any) => ({
            leftOil: parseFloat(oilSet.leftOil) || 0,
            rightOil: parseFloat(oilSet.rightOil) || 0
          })),
          otherOil: parseFloat(formData.fluid.otherOil) || 0
        }
      }),
      ...(formData.aircraftTowing && formData.aircraftTowingInfo && {
        aircraftTowing: formData.aircraftTowingInfo.map((towing: any) => ({
          aircraftDate: towing.aircraftDate || "",
          onTime: towing.onTime || "",
          offTime: towing.offTime || "",
          ...(towing.bayFrom && { bayFrom: towing.bayFrom }),
          ...(towing.bayTo && { bayTo: towing.bayTo })
        }))
      })
    }
  };
};

export default putService;
