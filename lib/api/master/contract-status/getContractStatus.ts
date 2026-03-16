import axios from "axios";
import type { ResContractStatus } from "./contractStatus.interface";

const getContractStatus = async (): Promise<ResContractStatus> => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_ENVIRONTMENT !== "production"
            ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/master/ContractStatus`
            : `${process.env.NEXT_PUBLIC_PRODUCTION_API}/master/ContractStatus`;

        const res = await axios.get(apiUrl, {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as ResContractStatus;
    } catch (error: any) {
        console.error('Error fetching contract status:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch contract status');
    }
};

export default getContractStatus;
