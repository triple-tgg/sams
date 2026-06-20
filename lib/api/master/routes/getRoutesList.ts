import axios from "@/lib/axios.config";
import type { RouteListResponse } from "./routes.interface";

const getRoutesList = async (): Promise<RouteListResponse> => {
    try {
        const res = await axios.post('/master/Routes-list', {
            page: 1,
            perPage: 999,
        }, {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as RouteListResponse;
    } catch (error: any) {
        console.error('Error fetching routes list:', error);
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to fetch routes list');
    }
};

export default getRoutesList;

