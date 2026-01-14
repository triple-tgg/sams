// Contract status type
export type ContractStatus = "all" | "active" | "on-hold" | "terminated";

// Contract interface
export interface Contract {
    id: number;
    contractNo: string;
    contractName: string;
    customerAirline: string;
    effective: string;
    valid: string;
    expires: string;
    noExpiry: boolean;
    location: string;
    station: string;
    status: "active" | "on-hold" | "terminated";
}

// Contract Form Data interface
export interface ContractFormData {
    // General Info
    referenceDocument: string;
    contractType: string;
    contractCode: string;
    station: string;
    // Handler Company
    handlerCompanyName: string;
    handlerCompanyAddress: string;
    // Carrier
    carrierName: string;
    carrierAddress: string;
    // Duration
    effectiveFrom: string;
    validFrom: string;
    expiresOn: string;
    serviceLocation: string;
    status: "active" | "on-hold" | "terminated";
    // Service Rates - Transit Checks
    tsChkUnder2hrsCert: number;
    tsChk2to3hrsNoCert: number;
    tsChk3to4hrsNoCert: number;
    tsChkUnder2hrsNoCert: number;
    tsChkOver2hrsNoCert: number;
    // Service Rates - Routine Checks
    standbyPerCheck: number;
    preFlightCheck: number;
    weeklyCheck: number;
    // Service Rates - Labor
    additionalLaeMhHr: number;
    additionalMechMhHr: number;
    // Service Rates - Wheel Services
    lhOrRhNoseWheelRpl: number;
    lhAndRhNoseWheelRpl: number;
    mainWheelRpl: number;
    twoMwRplNoReposition: number;
    twoMwRplReposition: number;
    brakeRpl: number;
    // Service Rates - Ground Services
    towingPerService: number;
    storageFeeMonth: number;
    storageHandlingFee: number;
    maintStepHr: number;
    marshalling: number;
    // Service Rates - Fluids
    engineOilQuad: number;
    hydraulicFluidQuad: number;
    lowPressureN2: number;
    highPressureN2: number;
    // Service Rates - Other
    defectRectificationTools: number;
    materialHandlingFee: number;
    yearlyIncreaseRate: string;
    // Billing
    billingAttn: string;
    billingEmail: string;
    billingPhone: string;
    billingAddress: string;
    paymentTerms: string;
    latePenalty: string;
    creditTerms: string;
}

// Step component props
export interface StepProps {
    formData: ContractFormData;
    onFormChange: (field: keyof ContractFormData, value: string | number) => void;
}
