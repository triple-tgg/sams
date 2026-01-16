// Contract status type
export type ContractStatus = "all" | "active" | "on-hold" | "terminated";

// Contract interface
export interface Contract {
    id: number;
    contractNo: string;
    contractType: string;
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

// Pricing Rate interface for multi-rate pricing
export interface PricingRate {
    id: number | string; // 0 for new, actual ID for existing
    serviceLocation: string[];
    aircraftTypes: string[]; // For display (codes)
    aircraftTypeId: number; // For API submission
    // Service Rates - Transit Checks (with Certificate)
    tsChkUnder2hrsCert: number;
    tsChk2to3hrsCert: number;
    tsChk3to4hrsCert: number;
    tsChk4to5hrsCert: number;
    tsChk5to6hrsCert: number;
    additionalFee6hrsPlusCert: number;
    // Service Rates - Transit Checks (without Certificate)
    tsChkUnder2hrsNoCert: number;
    tsChk2to3hrsNoCert: number;
    tsChk3to4hrsNoCert: number;
    tsChk4to5hrsNoCert: number;
    tsChk5to6hrsNoCert: number;
    additionalFee6hrsPlusNoCert: number;
    // Service Rates - Transit Checks (Other)
    standbyPerCheck: number;
    onCallPerCheck: number;
    // Service Rates - Routine Checks
    dailyCheck: number;
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
}

// Contract Form Data interface
export interface ContractFormData {
    // IDs for API
    contractId: number; // 0 for new, actual ID for edit
    airlineId: number;
    contractTypeId: number;
    contractStatusId: number;
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
    isNoExpiryDate: boolean;
    status: string;
    // Pricing Rates (multi-rate)
    pricingRates: PricingRate[];
    yearlyIncreaseRate: string;
    // Billing
    billingAttn: string;
    billingEmail: string;
    billingPhone: string;
    billingAddress: string;
    paymentTerms: string;
    latePenalty: string;
    creditTerms: string;
    // Contract Document
    contractDocumentPath: string;
    contractDocumentName: string;
}

// Step component props
export interface StepProps {
    formData: ContractFormData;
    onFormChange: (field: keyof ContractFormData, value: string | number | boolean) => void;
}
