import axiosConfig from "@/lib/axios.config";

// Interface for Airline object
export interface ContractDetailAirlineObj {
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

// Interface for Contract Status object
export interface ContractDetailStatusObj {
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

// Interface for Contract Type object
export interface ContractDetailContractTypeObj {
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

// Interface for attachment object
export interface ContractDetailAttachmentObj {
    id: string;
    contractId: number;
    realName: string;
    storagePath: string;
    fileType: string;
    createdDate: string;
    createdBy: string;
    isDelete: boolean;
}

// Interface for aircraft type object
export interface ContractDetailAircraftTypeObj {
    id: number;
    code: string;
    name: string;
    isDelete: boolean;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
}

// Interface for pricing data in response
export interface ContractDetailPricingData {
    id: number;
    stationCodeList: string[];
    aircraftTypeCodeList: string[]; // Array of aircraft type codes (e.g., ["A318", "A319", "A320"])
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
    hydraulicFluidQuad: number | null;
    lowPressureN2: number;
    highPressureN2: number;
    defectRectificationTools: number;
    materialHandlingFee: number;
    isDelete: boolean;
    createdDate: string;
    createdBy: string;
    updatedDate: string | null;
    updatedBy: string | null;
}

// Interface for personnel in contract detail response
export interface ContractDetailPersonnel {
    id: string;
    contractId: number;
    title: string;
    name: string;
    phoneNo: string;
    email: string;
}

// Interface for contract detail response data
export interface ContractDetail {
    id: number;
    contractNo: string;
    airlineObj: ContractDetailAirlineObj;
    effectiveFrom: string;
    validFrom: string;
    expiresOn: string;
    isNoExpiryDate: boolean | null;
    creditTerms: string;
    contractStatusObj: ContractDetailStatusObj;
    serviceStation: string[];
    attachContractObj: ContractDetailAttachmentObj | null;
    pricingDataList: ContractDetailPricingData[];
    contractTypeObj: ContractDetailContractTypeObj;
    personnelList: ContractDetailPersonnel[] | null;
}

// Interface for get contract by ID API response
export interface ContractByIdResponse {
    message: string;
    responseData: ContractDetail;
    error: string;
}

/**
 * Get contract by ID
 * @param id - Contract ID
 * @returns Promise<ContractByIdResponse>
 */
export const getContractById = async (id: number): Promise<ContractByIdResponse> => {
    try {
        console.log('Fetching contract by ID:', id);
        const response = await axiosConfig.get(`/contract/byid/${id}`);
        console.log('Contract by ID response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Get contract by ID error:', error);
        throw error;
    }
};

export default getContractById;
