import axiosConfig from "@/lib/axios.config";

// Interface for Airline object in contract response
export interface ContractAirlineObj {
    id: number;
    code: string;
    name: string;
    description: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
    colorForeground: string;
    colorBackground: string;
}

// Interface for Contract Status object in contract response
export interface ContractStatusObj {
    id: number;
    code: string;
    name: string;
    description: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

// Interface for Contract item from API
export interface ContractListItem {
    id: number;
    contractNo: string;
    airlineObj: ContractAirlineObj;
    effectiveFrom: string;
    validFrom: string;
    expiresOn: string;
    isNoExpiryDate: boolean | null;
    serviceStation: string[];
    creditTerms: string;
    contractStatusObj: ContractStatusObj;
}

// Interface for Contract list request
export interface ContractListRequest {
    contractNo: string;
    airlineId: number;
    stationCodeList: string[];
    dateStart: string;
    dateEnd: string;
    page: number;
    perPage: number;
}

// Interface for Contract list API response
export interface ContractListResponse {
    message: string;
    responseData: ContractListItem[];
    page: number;
    perPage: number;
    total: number;
    totalAll: number;
    error: string;
}

/**
 * Get contract list from API
 * @param data - Contract list request data
 * @returns Promise<ContractListResponse>
 */
export const getContractList = async (data: ContractListRequest): Promise<ContractListResponse> => {
    try {
        console.log('Fetching contract list with:', data);
        const response = await axiosConfig.post('/contract/listdata', data);
        console.log('Contract list response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Get contract list error:', error);
        throw error;
    }
};

export default getContractList;
