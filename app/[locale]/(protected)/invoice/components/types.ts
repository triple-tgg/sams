// Invoice tab type
export type InvoiceTabType = "pre-invoice" | "draft-invoice";

// Pre-Invoice interface - flight service records
export interface PreInvoice {
    id: number;
    // Flight Info
    date: string;
    station: string;
    flightNo: string;
    aircraftType: string;
    acReg: string;
    cert145: boolean;
    // Time
    ata: string;
    atd: string;
    trTimeMins: number;
    // Transit Checks
    tsChkUnder2hrsCert: number;
    tsChk2to3hrsNoCert: number;
    tsChk3to4hrsNoCert: number;
    tsChkUnder2hrsNoCert: number;
    tsChkOver2hrsNoCert: number;
    // Routine Checks
    standbyPerCheck: number;
    preFlightCheck: number;
    weeklyCheck: number;
    // Labor
    additionalLaeMhHr: number;
    additionalMechMhHr: number;
    // Wheel Services
    lhOrRhNoseWheelRpl: number;
    lhAndRhNoseWheelRpl: number;
    mainWheelRpl: number;
    twoMwRplNoReposition: number;
    twoMwRplReposition: number;
    brakeRpl: number;
    // Ground Services
    towingPerService: number;
    storageFeeMonth: number;
    storageHandlingFee: number;
    // Fluids/N2
    engineOilQuad: number;
    hydraulicFluidQuad: number;
    maintStepHr: number;
    lowPressureN2: number;
    highPressureN2: number;
    // Other
    defectRectificationTools: number;
    materialHandlingFee: number;
    marshalling: number;
    // Total
    totalServicePrice: number;
    remark: string;
}

// Draft Invoice interface - invoice line items
export interface DraftInvoice {
    id: number;
    item: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}
