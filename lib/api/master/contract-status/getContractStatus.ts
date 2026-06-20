import axios from "@/lib/axios.config";
import type { ResContractStatus } from "./contractStatus.interface";

const getContractStatus = async (): Promise<ResContractStatus> => {
    try {
        const res = await axios.get('/master/ContractStatus', {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as ResContractStatus;
    } catch (error: any) {
        console.error('Error fetching contract status:', error);
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to fetch contract status');
    }
};

export default getContractStatus;
