import axios from "@/lib/axios.config";
import type { RouteUpsertRequest, RouteUpsertResponse } from "./routes.interface";

const upsertRoute = async (data: RouteUpsertRequest): Promise<RouteUpsertResponse> => {
    try {
        const res = await axios.post('/master/Routes-upsert', data, {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as RouteUpsertResponse;
    } catch (error: any) {
        console.error('Error upserting route:', error);
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to upsert route');
    }
};

export default upsertRoute;
