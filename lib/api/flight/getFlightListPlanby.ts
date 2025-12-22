// '@/lib/api/flight/getFlightListPlanby.ts'
import axios from "@/lib/axios.config";
import { GetFlightListParams } from "./getFlightList";

export type FlightPlanbyItem = {
    channelUuid: string;
    id: string;
    title: string;
    since: string;
    till: string;
    sinceTime: string;
    tillTime: string;
    status: string;
    flightNo: string;
    arrivalDate: string;
    departureDate: string;
    arrivalStatime: string;
    departureStdTime: string;
    airlineObj?: {
        code: string;
        name: string;
    };
};

export type GetFlightListPlanbyParams = {
    flightNo?: string;
    stationCodeList?: string[];
    dateStart: string;
    dateEnd: string;
    page?: number;
    perPage?: number;
};

export type GetFlightListPlanbyResponse = {
    message: string;
    responseData: FlightPlanbyItem[];
    page: number;
    perPage: number;
    total: number;
    totalAll: number;
    error: string;
};

const getFlightListPlanby = async (params: GetFlightListParams): Promise<GetFlightListPlanbyResponse> => {
    const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
        ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/flight/listdata-planby`
        : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/flight/listdata-planby';

    const res = await axios.post(apiUrl, params, {
        headers: { 'Content-Type': 'application/json' },
    });
    return res.data as GetFlightListPlanbyResponse;
};

export default getFlightListPlanby;
