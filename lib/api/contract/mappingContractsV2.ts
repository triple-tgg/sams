import axiosConfig from "@/lib/axios.config";

export interface MappingContractsV2Request {
    lineMaintenanceIdLiist: number[];
    curencyType?: string;
    curencyRate?: number;
}

/**
 * Pre-Invoice generation can take well over the global 30s axios timeout (many THFs / long ranges).
 * Give this one request more time instead of changing the whole app.
 */
export const PRE_INVOICE_TIMEOUT_MS = 3 * 60 * 1000;

export const mapContractsV2 = async (data: MappingContractsV2Request) => {
    const res = await axiosConfig.put(
        "/lineMaintenances/mapping-contracts-v2",
        { lineMaintenanceIdLiist: data.lineMaintenanceIdLiist },
        { timeout: PRE_INVOICE_TIMEOUT_MS },
    );
    if (res.data?.message === "error") {
        throw new Error(res.data.error || "Failed to map contracts");
    }
    return res.data;
};
