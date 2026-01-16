import axiosConfig from "@/lib/axios.config";

// Interface for attachment in request
export interface ContractAttachmentRequest {
    storagePath: string;
    realName: string;
    fileType: string;
}

// Interface for pricing data in request
export interface ContractPricingDataRequest {
    id: number | string;
    stationCodeList: string[];
    aircraftTypeId: number;
    tsChkUnder2hrsCert: number;
    tsChk2to3hrsCert: number;
    tsChk3to4hrsCert: number;
    tsChk4to5hrsCert: number;
    tsChk5to6hrsCert: number;
    additionalFee6hrsPlusCert: number;
    tsChkUnder2hrsNoCert: number;
    tsChk2to3hrsNoCert: number;
    tsChk3to4hrsNoCert: number;
    tsChk4to5hrsNoCert: number;
    tsChk5to6hrsNoCert: number;
    additionalFee6hrsPlusNoCert: number;
    standbyPerCheck: number;
    onCallPerCheck: number;
    dailyCheck: number;
    preFlightCheck: number;
    weeklyCheck: number;
    additionalLaeMhHr: number;
    additionalMechMhHr: number;
    lhOrRhNoseWheelRpl: number;
    lhAndRhNoseWheelRpl: number;
    mainWheelRpl: number;
    twoMwRplNoReposition: number;
    twoMwRplReposition: number;
    brakeRpl: number;
    towingPerService: number;
    storageFeeMonth: number;
    storageHandlingFee: number;
    maintStepHr: number;
    marshalling: number;
    engineOilQuad: number;
    hydraulicFluidQuad: number;
    lowPressureN2: number;
    highPressureN2: number;
    defectRectificationTools: number;
    materialHandlingFee: number;
}

// Interface for contract upsert request
export interface ContractUpsertRequest {
    contractId: number;
    contractNo: string;
    airlineId: number;
    contractTypeId: number;
    effectiveFrom: string;
    validFrom: string;
    expiresOn: string;
    isNoExpiryDate: boolean;
    creditTerms: string;
    contractStatusId: number;
    attachContractList: ContractAttachmentRequest | null;
    pricingDataList: ContractPricingDataRequest[];
    userName: string;
}

// Interface for upsert response data
export interface ContractUpsertResponseData {
    contractId: number;
    contractNo: string;
}

// Interface for contract upsert API response
export interface ContractUpsertResponse {
    message: string;
    responseData: ContractUpsertResponseData[];
    error: string;
}

/**
 * Create or update a contract
 * @param data - Contract upsert request data
 * @returns Promise<ContractUpsertResponse>
 */
export const upsertContract = async (data: ContractUpsertRequest): Promise<ContractUpsertResponse> => {
    try {
        console.log('Upserting contract:', data);
        const response = await axiosConfig.post('/contract/upsert', data);
        console.log('Contract upsert response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Contract upsert error:', error);
        throw error;
    }
};

export default upsertContract;
