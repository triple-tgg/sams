import axios from "@/lib/axios.config";
import type { AirlineListRequest, AirlineListResponse } from "./airlines.interface";

export const getAirlinesList = async (params: AirlineListRequest): Promise<AirlineListResponse> => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
            ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/master/Airlines-list`
            : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/master/Airlines-list';

        const res = await axios.post(apiUrl, params, {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as AirlineListResponse;
    } catch (error: any) {
        console.error('Error fetching airlines list:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch airlines list');
    }
};

export default getAirlinesList;
