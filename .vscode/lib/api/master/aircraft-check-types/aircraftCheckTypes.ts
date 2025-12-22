import axiosConfig from "@/lib/axios.config";
import { AircraftCheckSubType, AircraftCheckType, MasterDataResponse } from "./airlines.interface";

/**
 * Get Aircraft Check Types from master data
 */
export const getAircraftCheckTypes = async (): Promise<MasterDataResponse<AircraftCheckType>> => {
  try {
    const response = await axiosConfig.get('/master/AircraftCheckTypes');
    console.log('API URL:', `${axiosConfig.defaults.baseURL}/master/AircraftCheckTypes`);
    return response.data;
  } catch (error) {
    console.error('Get aircraft check types error:', error);
    throw error;
  }
};

/**
 * Get Aircraft Check Sub Types from master data
 */
export const getAircraftCheckSubTypes = async (): Promise<MasterDataResponse<AircraftCheckSubType>> => {
  try {
    const response = await axiosConfig.get('/master/AircraftCheckSubTypes');
    console.log('API URL:', `${axiosConfig.defaults.baseURL}/master/AircraftCheckSubTypes`);
    return response.data;
  } catch (error) {
    console.error('Get aircraft check sub types error:', error);
    throw error;
  }
};
