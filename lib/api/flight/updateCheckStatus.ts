import axios from "@/lib/axios.config";
import type { AxiosError } from "axios";

export interface UpdateCheckStatusData {
    flightInfosId: number;
    maintenanceStatusId: number;
}

export interface UpdateCheckStatusResponse {
    message: string;
    responseData: null;
    error: string;
}

type ReqOpts = { signal?: AbortSignal; token?: string };

export async function updateCheckStatus(
    data: UpdateCheckStatusData,
    opts: ReqOpts = {}
): Promise<UpdateCheckStatusResponse> {
    try {
        const res = await axios.post<UpdateCheckStatusResponse>("/flight/update-v2", data, {
            signal: opts.signal,
            headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
        });
        return res.data;
    } catch (e) {
        const err = e as AxiosError<{ message?: string; error?: string }>;
        const msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? "Update check status failed";
        throw new Error(msg);
    }
}
