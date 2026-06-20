import axiosConfig from "@/lib/axios.config";

export interface FlightInfoPersonnelData {
  staff: {
    id: number;
    code: string | null;
    name: string | null;
    staffTypeId: number | null;
    staffTypeCode: string | null;
  };
  formDate: string | null;
  toDate: string | null;
  formTime: string | null;
  toTime: string | null;
  note: string | null;
}

export interface FlightInfoPersonnelsResponse {
  message: string | null;
  responseData: FlightInfoPersonnelData[];
  error: string | null;
}

export const getPersonnelsByFlightInfoId = async (
  flightInfosId: number | string
): Promise<FlightInfoPersonnelsResponse> => {
  try {
    const response = await axiosConfig.get(`/lineMaintenances/flightInfo/${flightInfosId}/personnels`);
    return response.data;
  } catch (error) {
    console.error("Get personnels by flight info ID error:", error);
    throw error;
  }
};
