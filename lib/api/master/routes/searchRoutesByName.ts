import axios from "axios";
import type { RouteSearchResponse } from "./routes.interface";

const searchRoutesByName = async (name: string): Promise<RouteSearchResponse> => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
            ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/master/Routes-bynames/${encodeURIComponent(name)}`
            : `https://sam-api-staging-triple-tcoth-production.up.railway.app/master/Routes-bynames/${encodeURIComponent(name)}`;

        const res = await axios.get(apiUrl, {
            headers: { 'Content-Type': 'application/json' },
        });

        return res.data as RouteSearchResponse;
    } catch (error: any) {
        console.error('Error searching routes by name:', error);
        throw new Error(error.response?.data?.message || 'Failed to search routes');
    }
};

export default searchRoutesByName;
