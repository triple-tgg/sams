import axiosConfig from "@/lib/axios.config";

// Interface for push THF request data
export interface PushThfRequest {
  flightsId: number;
  flightInfosId: number;
  airlinesCode: string;
  stationsCode: string;
  acReg: string;
  acTypeCode: string;
  arrivalFlightNo: string;
  arrivalDate: string;
  arrivalStaTime: string;
  arrivalAtaTime: string;
  departureFlightNo: string;
  departureDate: string;
  departureStdTime: string;
  departureAtdTime: string;
  bayNo: string;
  statusCode: string;
  note: string;
  thfNo: string;
}

// Interface for push THF response
export interface PushThfResponse {
  message: string;
  responseData: null;
  error: string;
}

export const pushThf = async (data: PushThfRequest): Promise<PushThfResponse> => {
  try {
    const response = await axiosConfig.put("/lineMaintenances/flight-thf", data);
    return response.data;
  } catch (error) {
    console.error("Push THF error:", error);
    throw error;
  }
};
