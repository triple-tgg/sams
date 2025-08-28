import axios from "axios";
import type { AxiosError } from "axios";
import type { ResStatusItem } from "./status.interface";

const getStatus = async (): Promise<ResStatusItem> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
      ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/master/Status`
      : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/master/Status';

    const res = await axios.get(apiUrl, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    return res.data as ResStatusItem;
  } catch (error: any) {
    console.error('Error fetching status:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch status');
  }
};

export default getStatus;
