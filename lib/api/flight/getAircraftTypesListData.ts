import axios from "@/lib/axios.config";

export interface FlightAircraftTypesListDataRequest {
  airlineId: number;
  stationCode: string;
}

export interface FlightAircraftTypeItem {
  id: number;
  code: string;
  name: string;
  color: string;
}

export interface FlightAircraftTypesListDataResponse {
  message: string;
  responseData: FlightAircraftTypeItem[] | null;
  error: string;
}

/** POST /flight/aircraftTypes-listdata — A/C Types available for an airline at a station. */
export const getAircraftTypesListData = async (
  body: FlightAircraftTypesListDataRequest,
): Promise<FlightAircraftTypeItem[]> => {
  const res = await axios.post<FlightAircraftTypesListDataResponse>("/flight/aircraftTypes-listdata", body);
  if (res.data?.message === "error") {
    throw new Error(res.data.error || "Failed to load A/C Types");
  }
  return res.data?.responseData ?? [];
};
