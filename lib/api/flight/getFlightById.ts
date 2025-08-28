import axios from "axios";
import type { AxiosError } from "axios";
import type { ResFlightItem } from "./flight.interface";

const getFlightById = async (id: number | string): Promise<ResFlightItem> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
      ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/flight/${id}`
      : `https://sam-api-staging-triple-tcoth-production.up.railway.app/flight/${id}`;

    const res = await axios.get(apiUrl, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    return res.data as ResFlightItem;
  } catch (error: any) {
    console.error('Error fetching flight by ID:', error);
    throw new Error(error.response?.data?.message || `Failed to fetch flight with ID: ${id}`);
  }
};

export default getFlightById;
