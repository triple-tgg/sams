import axiosConfig from "@/lib/axios.config";

export interface MappingContractsV2Request {
    lineMaintenanceIdLiist: number[];
    curencyType?: string;
    curencyRate?: number;
}

export const mapContractsV2 = async (data: MappingContractsV2Request) => {
    const res = await axiosConfig.put("/lineMaintenances/mapping-contracts-v2", {
        lineMaintenanceIdLiist: data.lineMaintenanceIdLiist,
    });
    if (res.data?.message === "error") {
        throw new Error(res.data.error || "Failed to map contracts");
    }
    return res.data;
};
