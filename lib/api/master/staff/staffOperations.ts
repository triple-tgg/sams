import axios from "@/lib/axios.config";
import type {
    StaffListRequest,
    StaffListResponse,
    StaffByIdResponse,
    StaffUpsertRequest,
    StaffUpsertResponse,
    StaffDeleteRequest,
    StaffDeleteResponse
} from "./staff.interface";

const API_BASE = process.env.NEXT_PUBLIC_DEVELOPMENT_API
    || 'https://sam-api-staging-triple-tcoth-production.up.railway.app';

/**
 * Get paginated staff list
 */
export const getStaffList = async (params: StaffListRequest): Promise<StaffListResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Staffs-list`, params, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as StaffListResponse;
    } catch (error: any) {
        console.error('Error fetching staff list:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch staff list');
    }
};

/**
 * Get staff by ID
 */
export const getStaffById = async (id: number): Promise<StaffByIdResponse> => {
    try {
        const res = await axios.get(`${API_BASE}/master/Staffs-byid/${id}`, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as StaffByIdResponse;
    } catch (error: any) {
        console.error('Error fetching staff by ID:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch staff');
    }
};

/**
 * Upsert (Create or Update) a staff
 */
export const upsertStaff = async (data: StaffUpsertRequest): Promise<StaffUpsertResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Staffs-upsert`, data, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as StaffUpsertResponse;
    } catch (error: any) {
        console.error('Error upserting staff:', error);
        throw new Error(error.response?.data?.message || 'Failed to save staff');
    }
};

/**
 * Delete a staff
 */
export const deleteStaff = async (data: StaffDeleteRequest): Promise<StaffDeleteResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Staffs-delete`, data, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as StaffDeleteResponse;
    } catch (error: any) {
        console.error('Error deleting staff:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete staff');
    }
};
