import axios from "@/lib/axios.config";
import type { AxiosError } from "axios";

// Login Request Interface
export interface CanEditLoginRequest {
    email: string;
    password: string;
}

// User data from response
export interface CanEditUserData {
    id: number;
    userName: string;
    email: string;
    fullName: string;
    role: string;
}

// API Response Interface
export interface CanEditLoginResponse {
    message: string;
    responseData: CanEditUserData | null;
    error: string;
}

type ReqOpts = { signal?: AbortSignal; token?: string };

/**
 * Verify user credentials for edit permission
 * 
 * @param credentials - Email and password
 * @param opts - Request options (signal, token)
 * @returns Promise with login response
 */
export async function canEditLogin(
    credentials: CanEditLoginRequest,
    opts: ReqOpts = {}
): Promise<CanEditLoginResponse> {
    try {
        const res = await axios.post<CanEditLoginResponse>("/user/login/canedit", credentials, {
            signal: opts.signal,
            headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
        });
        return res.data;
    } catch (e) {
        const err = e as AxiosError<CanEditLoginResponse>;
        // Re-throw with the error message from API response
        const errorMsg = err.response?.data?.error ?? err.response?.data?.message ?? err.message ?? "Login failed";
        throw new Error(errorMsg);
    }
}

export default canEditLogin;
