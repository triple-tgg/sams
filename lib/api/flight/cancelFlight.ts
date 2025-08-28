import axiosConfig from "@/lib/axios.config";

export interface CancelFlightParams {
  flightId: number | string;
}

export interface CancelFlightResponse {
  success: boolean;
  message: string;
}

export const cancelFlight = async (params: CancelFlightParams): Promise<CancelFlightResponse> => {
  try {
    const response = await axiosConfig.post(`/flight/cancel/${params.flightId}`);
    return response.data;
  } catch (error) {
    console.error('Cancel flight error:', error);
    throw error;
  }
};
