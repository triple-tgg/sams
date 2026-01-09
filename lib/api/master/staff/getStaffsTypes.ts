import axiosConfig from '@/lib/axios.config';

// Types for Staff Types API
export interface StaffType {
  id: number;
  code: string;
}

export interface StaffsTypesResponse {
  message: string;
  responseData: StaffType[];
  error: string;
}

// API function to get staff types
export const getStaffsTypes = async (): Promise<StaffsTypesResponse> => {
  try {
    const response = await axiosConfig.get<StaffsTypesResponse>('/master/StaffsTypes');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching staff types:', error);

    // Return fallback response structure on error
    return {
      message: "error",
      responseData: [],
      error: error?.response?.data?.message || error?.message || "Failed to fetch staff types"
    };
  }
};

// API function to get all staff types
export const getStaffsTypesAll = async (): Promise<StaffsTypesResponse> => {
  try {
    const response = await axiosConfig.get<StaffsTypesResponse>('/master/StaffsTypesAll');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching all staff types:', error);

    // Return fallback response structure on error
    return {
      message: "error",
      responseData: [],
      error: error?.response?.data?.message || error?.message || "Failed to fetch all staff types"
    };
  }
};

// Helper function to get staff types with fallback data
export const getStaffsTypesWithFallback = async (): Promise<StaffsTypesResponse> => {
  try {
    const response = await getStaffsTypes();

    // If API fails or returns empty data, provide fallback
    if (!response.responseData || response.responseData.length === 0) {
      return {
        message: "success",
        responseData: [
          {
            id: 1,
            code: "CS"
          },
          {
            id: 2,
            code: "MECH"
          }
        ],
        error: ""
      };
    }

    return response;
  } catch (error) {
    // Return fallback data on any error
    return {
      message: "success",
      responseData: [
        {
          id: 1,
          code: "CS"
        },
        {
          id: 2,
          code: "MECH"
        }
      ],
      error: ""
    };
  }
};

// Export default function
export default getStaffsTypes;
