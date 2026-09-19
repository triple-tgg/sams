import axiosConfig from "@/lib/axios.config";

export interface StaffSuggestionRequest {
  airlineId?: number;
  aircraftTypesId?: number;
  staffsTypeId?: number;
  series?: string;
  engineCode?: string;
}

export interface StaffSuggestionItem {
  id?: number;
  code: string;
  fullNameEn: string;
  staffTypeCode?: string;
}

export interface StaffSuggestionResponse {
  message: string;
  responseData: StaffSuggestionItem[];
  error: string;
}

/**
 * Fetch staff suggestions based on flight parameters
 * POST /lineMaintenances/staffSuggestionList
 */
export const getStaffSuggestionList = async (
  body: StaffSuggestionRequest
): Promise<StaffSuggestionResponse> => {
  try {
    const response = await axiosConfig.post<StaffSuggestionResponse>(
      "/lineMaintenances/staffSuggestionList",
      body
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching staff suggestion list:", error);
    return {
      message: "error",
      responseData: [],
      error:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch staff suggestions",
    };
  }
};

export default getStaffSuggestionList;
