import { Contract, ContractFormData, ContractStatus, PricingRate } from "./types";

// Mock data for demonstration
export const mockContracts: Contract[] = [
    {
        id: 1,
        contractNo: "SAMS-SM-THA-001-2024",
        contractType: "MSA",
        contractName: "Line Maintenance Support",
        customerAirline: "Thai Airways",
        effective: "2024-01-01",
        valid: "2024-01-01",
        expires: "2025-12-31",
        noExpiry: false,
        location: "BKK, CNX",
        station: "BKK",
        status: "active",
    },
    {
        id: 2,
        contractNo: "SAMS-SM-EVA-002-2024",
        contractType: "GHS",
        contractName: "Ground Handling Support",
        customerAirline: "EVA Airways",
        effective: "2024-02-15",
        valid: "2024-02-15",
        expires: "2026-02-14",
        noExpiry: true,
        location: "BKK",
        station: "BKK",
        status: "active",
    },
    {
        id: 3,
        contractNo: "SAMS-SM-SIA-003-2024",
        contractType: "MSA",
        contractName: "MSA Agreement",
        customerAirline: "Singapore Airlines",
        effective: "2024-03-01",
        valid: "2024-03-01",
        expires: "2024-12-31",
        noExpiry: false,
        location: "BKK, HKT",
        station: "HKT",
        status: "on-hold",
    },
    {
        id: 4,
        contractNo: "SAMS-SM-CPA-004-2023",
        contractType: "LMS",
        contractName: "Transit Maintenance",
        customerAirline: "Cathay Pacific",
        effective: "2023-06-01",
        valid: "2023-06-01",
        expires: "2024-05-31",
        noExpiry: false,
        location: "BKK",
        station: "BKK",
        status: "terminated",
    },
    {
        id: 5,
        contractNo: "SAMS-SM-JAL-005-2024",
        contractType: "MSA",
        contractName: "Full Service Agreement",
        customerAirline: "Japan Airlines",
        effective: "2024-04-01",
        valid: "2024-04-01",
        expires: "2027-03-31",
        noExpiry: true,
        location: "BKK, CNX, HKT",
        station: "CNX",
        status: "active",
    },
    {
        id: 6,
        contractNo: "SAMS-SM-ANA-006-2024",
        contractType: "LMS",
        contractName: "Line Maintenance",
        customerAirline: "All Nippon Airways",
        effective: "2024-05-01",
        valid: "2024-05-01",
        expires: "2026-04-30",
        noExpiry: false,
        location: "BKK",
        station: "BKK",
        status: "active",
    },
];

// Unique airlines for filter dropdown
export const airlines = [
    "Thai Airways",
    "EVA Airways",
    "Singapore Airlines",
    "Cathay Pacific",
    "Japan Airlines",
    "All Nippon Airways",
];

// Default pricing rate with all fields
export const defaultPricingRate: Omit<PricingRate, 'id'> = {
    serviceLocation: [],
    aircraftTypes: [],
    aircraftTypeId: 0,
    // Service Rates - Transit Checks (with Certificate)
    tsChkUnder2hrsCert: 0,
    tsChk2to3hrsCert: 0,
    tsChk3to4hrsCert: 0,
    tsChk4to5hrsCert: 0,
    tsChk5to6hrsCert: 0,
    additionalFee6hrsPlusCert: 0,
    // Service Rates - Transit Checks (without Certificate)
    tsChkUnder2hrsNoCert: 0,
    tsChk2to3hrsNoCert: 0,
    tsChk3to4hrsNoCert: 0,
    tsChk4to5hrsNoCert: 0,
    tsChk5to6hrsNoCert: 0,
    additionalFee6hrsPlusNoCert: 0,
    // Service Rates - Transit Checks (Other)
    standbyPerCheck: 0,
    onCallPerCheck: 0,
    // Service Rates - Routine Checks
    dailyCheck: 0,
    preFlightCheck: 0,
    weeklyCheck: 0,
    nightStop: 0,
    // Service Rates - Labor
    additionalLaeMhHr: 0,
    additionalMechMhHr: 0,
    // Service Rates - Wheel Services
    lhOrRhNoseWheelRpl: 0,
    lhAndRhNoseWheelRpl: 0,
    mainWheelRpl: 0,
    twoMwRplNoReposition: 0,
    twoMwRplReposition: 0,
    brakeRpl: 0,
    // Service Rates - Ground Services
    towingPerService: 0,
    storageFeeMonth: 0,
    storageHandlingFee: 0,
    maintStepHr: 0,
    marshalling: 0,
    // Service Rates - Fluids
    engineOilQuad: 0,
    hydraulicFluidQuad: 0,
    lowPressureN2: 0,
    highPressureN2: 0,
    // Service Rates - Other
    defectRectificationTools: 0,
    materialHandlingFee: 0,
};

export const defaultFormData: ContractFormData = {
    // IDs for API
    contractId: 0,
    airlineId: 0,
    contractTypeId: 0,
    contractStatusId: 0,
    // General Info
    referenceDocument: "",
    contractType: "",
    contractCode: "",
    station: "",
    // Handler Company
    handlerCompanyName: "",
    handlerCompanyAddress: "",
    // Carrier
    carrierName: "",
    carrierAddress: "",
    // Duration
    effectiveFrom: "",
    validFrom: "",
    expiresOn: "",
    isNoExpiryDate: false,
    domicileCountry: "",
    status: "",
    // Pricing Rates (multi-rate)
    pricingRates: [],
    yearlyIncreaseRate: "",
    // Billing
    billingAttn: "",
    billingEmail: "",
    billingPhone: "",
    billingAddress: "",
    paymentTerms: "",
    latePenalty: "",
    creditTerms: "",
    // Operational Contacts
    operationalContacts: [],
    // Contract Document
    contractDocumentPath: "",
    contractDocumentName: "",
};

export const FORM_STEPS = [
    { id: 1, title: "General Info", titleEn: "Contract Details" },
    { id: 2, title: "Pricing", titleEn: "Service Rates" },
    { id: 3, title: "Operational Contact", titleEn: "Contact Information" },
];

