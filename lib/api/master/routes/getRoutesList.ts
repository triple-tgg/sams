import axios from "axios";
import type { RouteListResponse } from "./routes.interface";

const getRoutesList = async (): Promise<RouteListResponse> => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
            ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/master/Routes-list`
            : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/master/Routes-list';

        const res = await axios.post(apiUrl, {
            page: 1,
            perPage: 999,
        }, {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as RouteListResponse;
    } catch (error: any) {
        console.error('Error fetching routes list:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch routes list');
    }
};

export default getRoutesList;
