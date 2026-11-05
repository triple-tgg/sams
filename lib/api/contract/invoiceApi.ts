import axiosConfig from "@/lib/axios.config";
import dayjs from "dayjs";
import "@/lib/dayjs";

// ── Request ──────────────────────────────────────────────
export interface PreInvoiceRequest {
    dateStart: string;   // "2026-02-15"
    dateEnd: string;     // "2026-02-16"
    airlineCode: string; // optional – send "" if not selected
    stationCodeList: string[];       // optional – send [] if not selected
    airCraftTypeCodeList: string[];  // optional – send [] if not selected
    currencyType: string;            // e.g. "USD" | "THB" | ""
}

export interface InvoiceRequest extends Omit<PreInvoiceRequest, "currencyType"> {
    thfNumber?: string;
    currencyType?: string;
}

// ── Pre-Invoice Response ─────────────────────────────────
export interface AirlineObj {
    id: number;
    code: string;
    carrierCode?: string | null;
    name: string;
    description: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
    colorForeground: string;
    colorBackground: string;
    emailTo: string | null;
    emailCc: string | null;
}

export interface PreInvoiceRetentionFeeItem {
    contractNo: string;
    retentionFee: number | null;
}

export type DraftInvoiceRetentionFeeItem = PreInvoiceRetentionFeeItem;

export interface PreInvoiceItem {
    activityDate: string;
    airlineObj: AirlineObj;
    stationCode: string;
    currencyType: string | null;
    retentionFeeObj?: PreInvoiceRetentionFeeItem[] | null;
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
    standbyEngineer: number | null;
    standbyMechanic: number | null;
    onCallEngineer: number | null;
    onCallMechanic: number | null;
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

/** Currency label for a set of invoice rows, e.g. "USD"; joins with " / " when rows differ, falls back to fallbackCurrency when rows have null currencyType. */
export const getInvoiceCurrency = (
    items: { currencyType: string | null }[],
    fallbackCurrency?: string | null
): string => {
    const fromItems = Array.from(new Set(items.map((i) => i.currencyType?.trim()).filter(Boolean))).join(" / ");
    return fromItems || (fallbackCurrency?.trim() ?? "");
};

export interface PreInvoiceResponse {
    message: string;
    responseData: PreInvoiceItem[];
    error: string;
}

// ── Draft-Invoice Response ───────────────────────────────
export interface DraftInvoiceItem {
    item: number;
    currencyType: string | null;
    retentionFeeObj?: DraftInvoiceRetentionFeeItem[] | null;
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
const buildInvoicePayload = (data: InvoiceRequest): PreInvoiceRequest => ({
    dateStart: data.dateStart ? dayjs(data.dateStart).startOf('day').utc().format() : data.dateStart,
    dateEnd: data.dateEnd ? dayjs(data.dateEnd).endOf('day').utc().format() : data.dateEnd,
    airlineCode: data.airlineCode ?? "",
    stationCodeList: data.stationCodeList ?? [],
    airCraftTypeCodeList: data.airCraftTypeCodeList ?? [],
    currencyType: data.currencyType ?? "",
});

export const getPreInvoice = async (data: InvoiceRequest): Promise<PreInvoiceResponse> => {
    try {
        const utcParams = buildInvoicePayload(data);
        console.log("Fetching pre-invoice with:", utcParams);
        const response = await axiosConfig.post("/contract/pre-invoice", utcParams);
        console.log("Pre-invoice response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Get pre-invoice error:", error);
        throw error;
    }
};

export const getDraftInvoice = async (data: InvoiceRequest): Promise<DraftInvoiceResponse> => {
    try {
        const utcParams = buildInvoicePayload(data);
        console.log("Fetching draft-invoice with:", utcParams);
        const response = await axiosConfig.post("/contract/draft-invoice", utcParams);
        console.log("Draft-invoice response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Get draft-invoice error:", error);
        throw error;
    }
};
