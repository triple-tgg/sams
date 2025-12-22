import axios from "@/lib/axios.config";
import type { AxiosError } from "axios";
import type { ResAirlineItem } from "./airlines.interface";

const getAirlines = async (): Promise<ResAirlineItem> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
      ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/master/Airlines`
      : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/master/Airlines';

    const res = await axios.get(apiUrl, {
      headers: { 'Content-Type': 'application/json' },
    });

    return res.data as ResAirlineItem;
  } catch (error: any) {
    console.error('Error fetching airlines:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch airlines');
  }
};

export default getAirlines;
