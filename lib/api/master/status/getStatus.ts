import axios from "@/lib/axios.config";
import type { ResStatusItem } from "./status.interface";

const getStatus = async (): Promise<ResStatusItem> => {
  try {
    const res = await axios.get('/master/Status', {
      headers: { 'Content-Type': 'application/json' },
    });

    return res.data as ResStatusItem;
  } catch (error: any) {
    console.error('Error fetching status:', error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to fetch status');
  }
};

export default getStatus;
