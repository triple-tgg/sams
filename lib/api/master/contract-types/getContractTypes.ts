import axios from "axios";
import type { ResContractType } from "./contractTypes.interface";

const getContractTypes = async (): Promise<ResContractType> => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
            ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/master/ContractTypes`
            : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/master/ContractTypes';

        const res = await axios.get(apiUrl, {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as ResContractType;
    } catch (error: any) {
        console.error('Error fetching contract types:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch contract types');
    }
};

export default getContractTypes;
