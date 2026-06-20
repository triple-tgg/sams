import axios from "@/lib/axios.config";
import type { ResStationItem } from "./stations.interface";

const getStations = async (): Promise<ResStationItem> => {
  try {
    const res = await axios.get('/master/Stations', {
      headers: { 'Content-Type': 'application/json' },
    });

    return res.data as ResStationItem;
  } catch (error: any) {
    console.error('Error fetching stations:', error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || 'Failed to fetch stations');
  }
};

export default getStations;
