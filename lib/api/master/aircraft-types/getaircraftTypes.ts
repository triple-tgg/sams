import axiosConfig from "@/lib/axios.config";
import { AircraftTypesResponse } from "./aircraftTypes.interface";

export const getAircraftTypes = async (): Promise<AircraftTypesResponse> => {
  try {
    const response = await axiosConfig.get("/master/AircraftTypes");
    console.log(`API URL: ${axiosConfig.defaults.baseURL}/master/AircraftTypes`);
    return response.data;
  } catch (error) {
    console.error("Get aircraft types error:", error);
    throw error;
  }
};
