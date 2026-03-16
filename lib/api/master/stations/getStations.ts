import axios from "axios";
import type { AxiosError } from "axios";
import type { ResStationItem } from "./stations.interface";

const getStations = async (): Promise<ResStationItem> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_ENVIRONTMENT !== "production"
      ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/master/Stations`
      : `${process.env.NEXT_PUBLIC_PRODUCTION_API}/master/Stations`;

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

