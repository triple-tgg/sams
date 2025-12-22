import axios from "axios";
import type { AxiosError } from "axios";
import type { ResStationItem } from "./stations.interface";

const getStations = async (): Promise<ResStationItem> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
      ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/master/Stations`
      : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/master/Stations';

    const res = await axios.get(apiUrl, {
      headers: { 'Content-Type': 'application/json' },
    });

    return res.data as ResStationItem;
  } catch (error: any) {
    console.error('Error fetching stations:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch stations');
  }
};

export default getStations;

