import axiosConfig from "@/lib/axios.config";

export interface AmelCategory {
  id: number;
  code: string;
  name: string;
  isdelete?: boolean;
  createddate?: string;
  createdby?: string | null;
  updateddate?: string | null;
  updatedby?: string | null;
}

export interface AmelCategoriesResponse {
  message: string;
  responseData: AmelCategory[];
  error: string;
}

/**
 * Fetch all AMEL categories
 * GET /master/amel-categories
 */
export const getAmelCategories = async (): Promise<AmelCategory[]> => {
  try {
    const res = await axiosConfig.get("/master/amel-categories");
    return res.data?.responseData || [];
  } catch (error: any) {
    console.error("Error fetching AMEL categories:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch AMEL categories");
  }
};
