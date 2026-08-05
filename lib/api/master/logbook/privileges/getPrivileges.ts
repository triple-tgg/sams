import axiosConfig from "@/lib/axios.config";
import { PrivilegesResponse } from "./privileges.interface";

export const getPrivileges = async (): Promise<PrivilegesResponse> => {
  try {
    const response = await axiosConfig.get("/master/logbook/privileges");
    return response.data;
  } catch (error) {
    console.error("Get privileges error:", error);
    throw error;
  }
};
