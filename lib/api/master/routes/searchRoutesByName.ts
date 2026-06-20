import axios from "@/lib/axios.config";
import type { RouteSearchResponse } from "./routes.interface";

const searchRoutesByName = async (name: string): Promise<RouteSearchResponse> => {
    try {
        const res = await axios.get(`/master/Routes-bynames/${encodeURIComponent(name)}`, {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as RouteSearchResponse;
    } catch (error: any) {
        console.error('Error searching routes by name:', error);
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to search routes');
    }
};

export default searchRoutesByName;
