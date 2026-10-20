import axiosConfig from "@/lib/axios.config";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface EngineSummaryRequest {
    station: string; // "" = all stations
    search: string;
}

export interface EngineSummaryKpi {
    fleetModelsCount: number;
    engineVariantsCount: number;
    licenceHoldersCount: number;
    activeCsCount: number;
    coveragePercentage: number;
}

export interface EngineSummaryCombination {
    id: number;
    familyCode: string;
    series: string;
    engineCode: string;
    displayLabel: string;
    similarTechnology: string | null;
}

export interface EngineSummaryEngine {
    engineCode: string;
    engineName: string;
    licensedCount: number;
    certifyingCount: number;
    status: string; // e.g. "NO_AUTHORISED_CS"
    statusLabel: string; // e.g. "No Authorised CS"
    coveragePercentage: number;
    combinations: EngineSummaryCombination[];
}

export interface EngineSummaryFamily {
    familyCode: string;
    familyName: string;
    summary: {
        licensedCount: number;
        certifyingCount: number;
    };
    engines: EngineSummaryEngine[];
}

export interface EngineSummaryData {
    kpiSummary: EngineSummaryKpi;
    families: EngineSummaryFamily[];
}

export interface EngineSummaryResponse {
    message: string;
    responseData: EngineSummaryData;
    error?: string;
}

export const getEngineSummary = async (data: EngineSummaryRequest): Promise<EngineSummaryResponse> => {
    const res = await axiosConfig.post<EngineSummaryResponse>("/roster/engine-summary", data);
    return res.data;
};

export function useEngineSummary(request: EngineSummaryRequest) {
    return useQuery<EngineSummaryData, Error>({
        queryKey: ["roster", "engine-summary", request],
        queryFn: async () => (await getEngineSummary(request)).responseData,
        // Keep the current table on screen while a new station/search loads
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
    });
}
