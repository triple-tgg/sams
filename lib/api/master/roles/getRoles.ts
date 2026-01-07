import axios from "@/lib/axios.config";
import type { RolesResponse } from "./roles.interface";

const API_BASE = process.env.NEXT_PUBLIC_DEVELOPMENT_API
    || 'https://sam-api-staging-triple-tcoth-production.up.railway.app';

/**
 * Get all roles for dropdown
 */
export const getRoles = async (): Promise<RolesResponse> => {
    try {
        const res = await axios.get(`${API_BASE}/master/Roles`, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as RolesResponse;
    } catch (error: any) {
        console.error('Error fetching roles:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch roles');
    }
};

export default getRoles;
