// '@/lib/api/flight/getFlightListPlanby.ts'
import axios from "@/lib/axios.config";
import { GetFlightListParams } from "./getFlightList";
import dayjs from "dayjs";
import "@/lib/dayjs";

export type FlightPlanbyItem = {
    channelUuid: string;
    id: string;
    title: string;
    since: string;       // UTC ISO — may be 7h behind actual STA due to backend offset bug
    till: string;        // UTC ISO — may be 7h behind actual STD due to backend offset bug
    sinceTime?: string;
    tillTime?: string;
    status: string;
    flightNo: string;
    arrivalDate: string;
    departureDate: string;
    arrivalStatime: string;
    departureStdTime: string;
    arrivalFlightNo: string;
    departureFlightNo: string;
    /** Correct UTC ISO for STA — use this for bar positioning instead of `since` */
    arrivalStaDate?: string;
    /** Correct UTC ISO for STD — use this for bar positioning instead of `till` */
    departureStdDate?: string;
    aircraftTypeCode?: string;
    csList?: { displayName?: string; name?: string }[] | null;
    mechList?: { displayName?: string; name?: string }[] | null;
    color: {
        foreground: string;
        background: string;
    };
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
