import axiosConfig from "@/lib/axios.config";

export interface AircraftTypeLicense {
    id: number;
    code: string;
    name: string;
}

export interface AircraftTypeLicensesResponse {
    message: string;
    responseData: AircraftTypeLicense[];
    error: string;
}

/**
 * Fetch all Aircraft Type Licenses
 * GET /master/aircraft-type-licenses
 */
export const getAircraftTypeLicenses = async (): Promise<AircraftTypeLicense[]> => {
    try {
        const res = await axiosConfig.get("/master/aircraft-type-licenses");
        return res.data.responseData || [];
    } catch (error: any) {
        console.error("Error fetching aircraft type licenses:", error);
        throw new Error(error.response?.data?.message || "Failed to fetch aircraft type licenses");
    }
};
