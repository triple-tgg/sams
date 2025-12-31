import axios from "@/lib/axios.config";
import type {
    AirlineUpsertRequest,
    AirlineUpsertResponse,
    AirlineByIdResponse,
    AirlineDeleteRequest,
    AirlineDeleteResponse
} from "./airlines.interface";

const API_BASE = process.env.NEXT_PUBLIC_DEVELOPMENT_API
    || 'https://sam-api-staging-triple-tcoth-production.up.railway.app';

/**
 * Upsert (Create or Update) an airline
 */
export const upsertAirline = async (data: AirlineUpsertRequest): Promise<AirlineUpsertResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Airlines-upsert`, data, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as AirlineUpsertResponse;
    } catch (error: any) {
        console.error('Error upserting airline:', error);
        throw new Error(error.response?.data?.message || 'Failed to save airline');
    }
};

/**
 * Get airline by ID
 */
export const getAirlineById = async (id: number): Promise<AirlineByIdResponse> => {
    try {
        const res = await axios.get(`${API_BASE}/master/Airlines-byid/${id}`, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as AirlineByIdResponse;
    } catch (error: any) {
        console.error('Error fetching airline by ID:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch airline');
    }
};

/**
 * Delete an airline
 */
export const deleteAirline = async (data: AirlineDeleteRequest): Promise<AirlineDeleteResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Airlines-delete`, data, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as AirlineDeleteResponse;
    } catch (error: any) {
        console.error('Error deleting airline:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete airline');
    }
};
