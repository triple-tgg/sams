// '@/lib/api/fleght/getFlightList.ts'
import axios from "@/lib/axios.config";
import type { ResFlightItem } from "./filghtlist.interface";

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
  const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
    ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/flight/listdata`
    : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/flight/listdata';

  const res = await axios.post(apiUrl, params, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data as ResFlightItem;
};

export default getFlightList;
