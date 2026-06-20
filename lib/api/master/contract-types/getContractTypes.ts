import axios from "@/lib/axios.config";
import type { ResContractType } from "./contractTypes.interface";

const getContractTypes = async (): Promise<ResContractType> => {
    try {
        const res = await axios.get('/master/ContractTypes', {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as ResContractType;
    } catch (error: any) {
        console.error('Error fetching contract types:', error);
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to fetch contract types');
    }
};

export default getContractTypes;
