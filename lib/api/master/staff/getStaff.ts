import axiosConfig from "@/lib/axios.config";

// Interface for Position
export interface Position {
  id: number;
  code: string;
}

// Interface for Staff
export interface Staff {
  id: number;
  code: string;
  name: string;
  position: Position;
}

// Interface for Staff request data
export interface StaffRequest {
  code: string;
  name: string;
  id: string;
}

// Interface for API response
export interface StaffResponse {
  message: string;
  responseData: Staff[];
  error: string;
}

/**
 * Get Staff from master data
 * @param data - Staff search criteria
 * @returns Promise<StaffResponse>
 */
export const getStaff = async (data: StaffRequest): Promise<StaffResponse> => {
  try {
    const response = await axiosConfig.post('/master/Staffs', data);
    console.log('API URL:', `${axiosConfig.defaults.baseURL}/master/Staffs`);
    console.log('Request data:', data);
    console.log('Staff response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get staff error:', error);
    throw error;
  }
};