import axiosConfig from "@/lib/axios.config";

export interface MappingContractsV2Request {
    curencyType: string;
    curencyRate: number;
    lineMaintenanceIdLiist: number[];
}

export const mapContractsV2 = async (data: MappingContractsV2Request) => {
    const res = await axiosConfig.put("/lineMaintenances/mapping-contracts-v2", data);
    if (res.data?.message === "error") {
        throw new Error(res.data.error || "Failed to map contracts");
    }
    return res.data;
};
