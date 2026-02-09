import axiosConfig from "@/lib/axios.config";

// Detailed aircraft type with feature flags
export interface AircraftTypeDetail {
    id: number;
    code: string;
    name: string;
    modelName: string;
    modelSubName: string;
    classicOrNeo: string;
    flagEnging1: boolean;
    flagEnging2: boolean;
    flagEnging3: boolean;
    flagEnging4: boolean;
    flagCsd1: boolean;
    flagCsd2: boolean;
    flagCsd3: boolean;
    flagCsd4: boolean;
    flagHydrolicGreen: boolean;
    flagHydrolicBlue: boolean;
    flagHydrolicYellow: boolean;
    flagApu: boolean;
    isDelete: boolean;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
}

export interface AircraftTypeByIdResponse {
    message: string;
    responseData: AircraftTypeDetail;
    error: string;
}

// Computed flags for easy consumption by UI components
export interface AircraftTypeFlags {
    engineCount: number; // Number of engines (count of true flagEnging1-4)
    csdCount: number;    // Number of CSD/IDG/VSFG (count of true flagCsd1-4)
    flagHydrolicGreen: boolean;
    flagHydrolicBlue: boolean;
    flagHydrolicYellow: boolean;
    flagApu: boolean;
}

/**
 * Compute UI-friendly flags from the raw aircraft type detail
 */
export const computeAircraftTypeFlags = (detail: AircraftTypeDetail): AircraftTypeFlags => {
    const engineCount = [detail.flagEnging1, detail.flagEnging2, detail.flagEnging3, detail.flagEnging4]
        .filter(Boolean).length;
    const csdCount = [detail.flagCsd1, detail.flagCsd2, detail.flagCsd3, detail.flagCsd4]
        .filter(Boolean).length;

    return {
        engineCount,
        csdCount,
        flagHydrolicGreen: detail.flagHydrolicGreen,
        flagHydrolicBlue: detail.flagHydrolicBlue,
        flagHydrolicYellow: detail.flagHydrolicYellow,
        flagApu: detail.flagApu,
    };
};

/**
 * Get aircraft type by ID
 * @param id - Aircraft Type ID
 */
export const getAircraftTypeById = async (id: number): Promise<AircraftTypeByIdResponse> => {
    try {
        const response = await axiosConfig.get(`/master/AircraftTypes-byid/${id}`);
        return response.data;
    } catch (error) {
        console.error("Get aircraft type by ID error:", error);
        throw error;
    }
};
