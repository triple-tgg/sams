// '@/lib/api/fleght/getFlightList.ts'
import axios from "@/lib/axios.config";
import type { ResFlightItem } from "./filghtlist.interface";
import dayjs from "dayjs";
import "@/lib/dayjs";

export type GetFlightListParams = {
  flightNo?: string;
  stationCodeList?: string[] | null;
  stationCode?: string | null;
  airlineId?: number | null;
  dateStart: string;
  dateEnd: string;
  page?: number;
  perPage?: number;
};

const getFlightList = async (params: GetFlightListParams): Promise<ResFlightItem> => {
  const apiUrl = process.env.NEXT_PUBLIC_ENVIRONTMENT !== "production"
    ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/flight/listdata`
    : `${process.env.NEXT_PUBLIC_PRODUCTION_API}/flight/listdata`;

  // Convert Local date range to UTC date-time before sending to API
  const utcParams = {
    ...params,
    dateStart: dayjs(params.dateStart).startOf('day').utc().format('YYYY-MM-DD HH:mm:ss'),
    dateEnd: dayjs(params.dateEnd).endOf('day').utc().format('YYYY-MM-DD HH:mm:ss'),
  };

  const res = await axios.post(apiUrl, utcParams, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data as ResFlightItem;
};

export default getFlightList;
