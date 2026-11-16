import axios from "@/lib/axios.config";
import type {
    UserListRequest,
    UserListResponse,
    UserByIdResponse,
    UserUpsertRequest,
    UserUpsertResponse,
    UserDeleteRequest,
    UserDeleteResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    UserCheckRequest,
    UserItem
} from "./users.interface";
import { findUserByEmail, resolveUserCheck, type UserCheckResult } from "./userCheck";

const API_BASE = process.env.NEXT_PUBLIC_ENVIRONTMENT !== "production"
    ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}`
    : `${process.env.NEXT_PUBLIC_PRODUCTION_API}`;

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
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to fetch user list');
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
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to fetch user');
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
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to save user');
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
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete user');
    }
};

/**
 * Change the signed-in user's own password.
 * POST /user/change-password — body: { currentPassword, newPassword }.
 * The target account comes from the access token, so this cannot change another user's password
 * (admins reset other users' passwords via Users-upsert `passwordData`).
 */
export const changeUserPassword = async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    try {
        const res = await axios.post(`${API_BASE}/user/change-password`, data, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data as ChangePasswordResponse;
    } catch (error: any) {
        console.error('Error changing password:', error);
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to change password');
    }
};

/**
 * Check whether an account already uses `email` before creating a login for a staff member.
 * POST /master/users-check — body: { email, employeeID }.
 *
 * The endpoint is still being built. Until it is deployed (404 / 405), the check falls back to
 * Users-list filtered by email, which returns the same account fields (flagInternal, staffEmployeeId).
 * `responseData` is read as a single account, an array, or null so either backend shape works.
 */
export const checkUserEmail = async (data: UserCheckRequest): Promise<UserCheckResult> => {
    const email = data.email.trim();
    try {
        const res = await axios.post(`${API_BASE}/master/users-check`, { ...data, email }, {
            headers: { 'Content-Type': 'application/json' },
        });
        const body = res.data as { message?: string; responseData?: UserItem | UserItem[] | null; error?: string };
        if (body?.error && body.message !== 'success') throw new Error(body.error);
        const raw = body?.responseData;
        const matched = Array.isArray(raw) ? findUserByEmail(raw, email) : raw && raw.id ? raw : null;
        return resolveUserCheck(matched, data.employeeID);
    } catch (error: any) {
        const status = error?.response?.status;
        if (status !== 404 && status !== 405) {
            console.error('Error checking user email:', error);
            throw new Error(error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to check email');
        }
    }

    // Fallback: endpoint not available yet
    const list = await getUserList({ page: 1, perPage: 50, email });
    return resolveUserCheck(findUserByEmail(list.responseData, email), data.employeeID);
};
