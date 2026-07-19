import axiosConfig from "@/lib/axios.config";

export interface StaffAuthorizationAirlineStatus {
    id: number;
    code: string;
    name: string;
}

export interface GetStaffAuthorizationAirlineStatusesResponse {
    message: string;
    responseData: StaffAuthorizationAirlineStatus[];
    error: string;
}

export const getStaffAuthorizationAirlineStatuses = async (): Promise<StaffAuthorizationAirlineStatus[]> => {
    const res = await axiosConfig.get("/master/authorization-statuses");
    return res.data?.responseData || [];
};
