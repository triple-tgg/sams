import axios from "@/lib/axios.config";
import type {
    UserListRequest,
    UserListResponse,
    UserByIdResponse,
    UserUpsertRequest,
    UserUpsertResponse,
    UserDeleteRequest,
    UserDeleteResponse
} from "./users.interface";

const API_BASE = process.env.NEXT_PUBLIC_DEVELOPMENT_API
    || 'https://sam-api-staging-triple-tcoth-production.up.railway.app';

/**
 * Get paginated user list
 */
export const getUserList = async (params: UserListRequest): Promise<UserListResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Users-list`, params, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as UserListResponse;
    } catch (error: any) {
        console.error('Error fetching user list:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch user list');
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (id: number): Promise<UserByIdResponse> => {
    try {
        const res = await axios.get(`${API_BASE}/master/Users-byid/${id}`, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as UserByIdResponse;
    } catch (error: any) {
        console.error('Error fetching user by ID:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
};

/**
 * Upsert (Create or Update) a user
 */
export const upsertUser = async (data: UserUpsertRequest): Promise<UserUpsertResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Users-upsert`, data, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as UserUpsertResponse;
    } catch (error: any) {
        console.error('Error upserting user:', error);
        throw new Error(error.response?.data?.message || 'Failed to save user');
    }
};

/**
 * Delete a user
 */
export const deleteUser = async (data: UserDeleteRequest): Promise<UserDeleteResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/master/Users-delete`, data, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as UserDeleteResponse;
    } catch (error: any) {
        console.error('Error deleting user:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
};
