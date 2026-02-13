import axios from "axios";
import type { RouteUpsertRequest, RouteUpsertResponse } from "./routes.interface";

const upsertRoute = async (data: RouteUpsertRequest): Promise<RouteUpsertResponse> => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
            ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/master/Routes-upsert`
            : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/master/Routes-upsert';

        const res = await axios.post(apiUrl, data, {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as RouteUpsertResponse;
    } catch (error: any) {
        console.error('Error upserting route:', error);
        throw new Error(error.response?.data?.message || 'Failed to upsert route');
    }
};

export default upsertRoute;
