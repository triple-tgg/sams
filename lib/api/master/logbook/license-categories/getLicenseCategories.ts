import axiosConfig from "@/lib/axios.config";
import { LicenseCategoriesResponse } from "./licenseCategories.interface";

export const getLicenseCategories = async (): Promise<LicenseCategoriesResponse> => {
  try {
    const response = await axiosConfig.get("/master/logbook/license-categories");
    return response.data;
  } catch (error) {
    console.error("Get license categories error:", error);
    throw error;
  }
};
