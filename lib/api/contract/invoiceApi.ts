import axiosConfig from "@/lib/axios.config";

// ── Request ──────────────────────────────────────────────
export interface InvoiceRequest {
    dateStart: string;   // "2026-02-15"
    dateEnd: string;     // "2026-02-16"
    airlineCode: string; // optional – send "" if not selected
    stationCodeList: string[];       // optional – send [] if not selected
    airCraftTypeCodeList: string[];  // optional – send [] if not selected
}

// ── Pre-Invoice Response ─────────────────────────────────
export interface AirlineObj {
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
    emailTo: string;
    emailCc: string;
}

export interface PreInvoiceItem {
    activityDate: string;
    airlineObj: AirlineObj;
    stationCode: string;
    flightNo: string;
    aircraftCode: string;
    acReg: string;
    flagCert: boolean;
    ataTime: string;
    atdTime: string;
    trTime: string; // "HH:MM"
    // Transit Checks – with cert
    tsChkUnder2hrsCert: number;
    tsChk2to3hrsCert: number;
    tsChk3to4hrsCert: number;
    tsChk4to5hrsCert: number;
    tsChk5to6hrsCert: number;
    additionalFee6hrsPlusCert: number;
    // Transit Checks – without cert
    tsChkUnder2hrsNoCert: number;
    tsChk2to3hrsNoCert: number;
    tsChk3to4hrsNoCert: number;
    tsChk4to5hrsNoCert: number;
    tsChk5to6hrsNoCert: number;
    additionalFee6hrsPlusNoCert: number;
    // Other checks
    standbyPerCheck: number;
    onCallPerCheck: number;
    preFlightCheck: number;
    weeklyCheck: number;
    nightStop: number;
    // Labor
    additionalLaeMhHr: number;
    additionalMechMhHr: number;
    // Ground
    towingPerService: number;
    marshalling: number;
    // Fluids
    engineOilQuad: number;
    hydraulicFluidQuad: number;
    // Total
    totalServicePrice: number;
    remark: string;
}

export interface PreInvoiceResponse {
    message: string;
    responseData: PreInvoiceItem[];
    error: string;
}

// ── Draft-Invoice Response ───────────────────────────────
export interface DraftInvoiceItem {
    item: number;
    descrition: string; // note: API typo preserved
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface DraftInvoiceResponse {
    message: string;
    responseData: DraftInvoiceItem[];
    error: string;
}

// ── API Functions ────────────────────────────────────────
export const getPreInvoice = async (data: InvoiceRequest): Promise<PreInvoiceResponse> => {
    try {
        console.log("Fetching pre-invoice with:", data);
        const response = await axiosConfig.post("/contract/pre-invoice", data);
        console.log("Pre-invoice response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Get pre-invoice error:", error);
        throw error;
    }
};

export const getDraftInvoice = async (data: InvoiceRequest): Promise<DraftInvoiceResponse> => {
    try {
        console.log("Fetching draft-invoice with:", data);
        const response = await axiosConfig.post("/contract/draft-invoice", data);
        console.log("Draft-invoice response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Get draft-invoice error:", error);
        throw error;
    }
};
