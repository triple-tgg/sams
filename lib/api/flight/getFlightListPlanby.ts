// '@/lib/api/flight/getFlightListPlanby.ts'
import axios from "@/lib/axios.config";
import { GetFlightListParams } from "./getFlightList";
import dayjs from "dayjs";
import "@/lib/dayjs";

export type FlightPlanbyItem = {
    channelUuid: string;
    id: string;
    title: string;
    since: string;
    till: string;
    sinceTime?: string;
    tillTime?: string;
    status: string;
    flightNo: string;
    arrivalDate: string;
    departureDate: string;
    arrivalStatime: string;
    departureStdTime: string;
    arrivalFlightNo: string,
    departureFlightNo: string,
    color: {
        foreground: string;
        background: string;
    },
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
    const apiUrl = process.env.NEXT_PUBLIC_ENVIRONTMENT !== "production"
        ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/flight/listdata-planby`
        : `${process.env.NEXT_PUBLIC_PRODUCTION_API}/flight/listdata-planby`;

    // Convert Local date range to UTC date-time before sending to API
    const utcParams = {
        ...params,
        dateStart: dayjs(params.dateStart).startOf('day').utc().format('YYYY-MM-DD HH:mm:ss'),
        dateEnd: dayjs(params.dateEnd).endOf('day').utc().format('YYYY-MM-DD HH:mm:ss'),
    };

    const res = await axios.post(apiUrl, utcParams, {
        headers: { 'Content-Type': 'application/json' },
    });
    return res.data as GetFlightListPlanbyResponse;
};

export default getFlightListPlanby;
