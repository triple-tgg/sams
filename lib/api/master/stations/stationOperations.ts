import axios from "@/lib/axios.config";
import type {
    StationListRequest,
    StationListResponse,
    StationByIdResponse,
    StationUpsertRequest,
    StationUpsertResponse,
    StationDeleteRequest,
    StationDeleteResponse
} from "./stations.interface";

const API_BASE = process.env.NEXT_PUBLIC_DEVELOPMENT_API
    || 'https://sam-api-staging-triple-tcoth-production.up.railway.app';

/**
 * Get paginated station list
 */
export const getStationList = async (params: StationListRequest): Promise<StationListResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Stations-list`, params, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as StationListResponse;
    } catch (error: any) {
        console.error('Error fetching station list:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch station list');
    }
};

/**
 * Get station by ID
 */
export const getStationById = async (id: number): Promise<StationByIdResponse> => {
    try {
        const res = await axios.get(`${API_BASE}/master/Stations-byid/${id}`, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as StationByIdResponse;
    } catch (error: any) {
        console.error('Error fetching station by ID:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch station');
    }
};

/**
 * Upsert (Create or Update) a station
 */
export const upsertStation = async (data: StationUpsertRequest): Promise<StationUpsertResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Stations-upsert`, data, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as StationUpsertResponse;
    } catch (error: any) {
        console.error('Error upserting station:', error);
        throw new Error(error.response?.data?.message || 'Failed to save station');
    }
};

/**
 * Delete a station
 */
export const deleteStation = async (data: StationDeleteRequest): Promise<StationDeleteResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Stations-delete`, data, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as StationDeleteResponse;
    } catch (error: any) {
        console.error('Error deleting station:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete station');
    }
};
