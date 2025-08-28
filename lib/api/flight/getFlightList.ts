// '@/lib/api/fleght/getFlightList.ts'
import axios from "@/lib/axios.config";

export type GetFlightListParams = {
  flightNo?: string;
  stationCodeList?: string[];
  dateStart: string;
  dateEnd: string;
  page?: number;
  perPage?: number;
};

const getFlightList = async (params: GetFlightListParams) => {
  const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
    ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/flight/listdata`
    : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/flight/listdata';

  const res = await axios.post(apiUrl, params, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data as {
    responseData: any[]; // ใส่เป็น FlightItem[] ถ้าคุณมี type
    pagination?: { page: number; perPage: number; total: number };
  };
};

export default getFlightList;
