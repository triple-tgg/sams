import axios from "@/lib/axios.config";
import type { AxiosError } from "axios";

export interface FlightServiceListItem {
  code: string;
  subTypes: string[];
}

export interface FlightAircraftTowingItemPayload {
  id?: string | null;
  bayForm: string;
  bayTo: string;
  aircraftOnDate: string;
  aircraftOffDate: string;
}

// Flight Update Data Interface (matches /flight/update-v2 body)
export interface UpdateFlightData {
  id: number;
  airlinesCode: string;
  stationsCode: string;
  acReg: string;
  acTypeCode: string;
  series?: string;
  engineCode?: string;
  arrivalFlightNo: string;
  arrivalStaDate: string;      // UTC datetime "YYYY-MM-DD HH:mm"
  arrivalAtaDate: string;      // UTC datetime "YYYY-MM-DD HH:mm"
  departureFlightNo: string;
  departureAtdDate: string;    // UTC datetime "YYYY-MM-DD HH:mm"
  departureStdDate: string;    // UTC datetime "YYYY-MM-DD HH:mm"
  bayNo: string;
  statusCode: string;
  note: string;
  routeFrom?: string;
  routeTo?: string;
  csIdList?: number[] | null;
  mechIdList?: number[] | null;
  maintenanceStatusId?: number;
  etaDate?: string | null;
  flightServiceLists?: FlightServiceListItem[];
  flightAircraftTowingsLists?: FlightAircraftTowingItemPayload[];

  // Legacy/optional fields
  thfNo?: string;
  userName?: string;
  aircraftEngineCode?: string;
  familyCode?: string;
  aircraftCheckType?: FlightAircraftCheckPayload[];
  isAircraftTowing?: boolean;
  aircraftTowing?: {
    onDate?: string;
    offDate?: string;
    bayFrom?: string;
    bayTo?: string;
  }[];
}

export interface FlightAircraftCheckPayload {
  checkType: string;
  checkSubType: string[];
}

// API Response Interface
export interface UpdateFlightResponse {
  message: string;
  responseData: null;
  error: string;
}

// Request Options
type ReqOpts = { signal?: AbortSignal; token?: string };

/**
 * Update Flight Information
 * 
 * @param flightData - The flight data to update
 * @param opts - Request options (signal, token)
 * @returns Promise with update response
 */
export async function updateFlight(
  flightData: UpdateFlightData,
  opts: ReqOpts = {}
): Promise<UpdateFlightResponse> {
  try {
    const payload: UpdateFlightData = {
      id: flightData.id,
      airlinesCode: flightData.airlinesCode,
      stationsCode: flightData.stationsCode,
      acReg: flightData.acReg,
      acTypeCode: flightData.acTypeCode,
      series: flightData.series ?? "",
      engineCode: flightData.engineCode ?? "",
      arrivalFlightNo: flightData.arrivalFlightNo,
      arrivalStaDate: flightData.arrivalStaDate,
      arrivalAtaDate: flightData.arrivalAtaDate ?? "",
      departureFlightNo: flightData.departureFlightNo,
      departureAtdDate: flightData.departureAtdDate ?? "",
      departureStdDate: flightData.departureStdDate ?? "",
      bayNo: flightData.bayNo ?? "",
      statusCode: flightData.statusCode ?? "Normal",
      note: flightData.note ?? "",
      routeFrom: flightData.routeFrom ?? "",
      routeTo: flightData.routeTo ?? "",
      csIdList: flightData.csIdList ?? [],
      mechIdList: flightData.mechIdList ?? [],
      maintenanceStatusId: flightData.maintenanceStatusId ?? 0,
      etaDate: flightData.etaDate ?? "",
      flightServiceLists: flightData.flightServiceLists ?? [],
      flightAircraftTowingsLists: flightData.flightAircraftTowingsLists?.map((item) => ({
        id: item.id ?? null,
        bayForm: item.bayForm,
        bayTo: item.bayTo,
        aircraftOnDate: item.aircraftOnDate,
        aircraftOffDate: item.aircraftOffDate,
      })) ?? [],
    };
    const res = await axios.post<UpdateFlightResponse>("/flight/update-v2", payload, {
      signal: opts.signal,
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    });
    return res.data;
  } catch (e) {
    const err = e as AxiosError<{ message?: string; error?: string }>;
    const msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? "Update flight failed";
    // Throw Error with readable message for UI display
    throw new Error(msg);
  }
}

/**
 * Update Multiple Flights (Batch Update)
 * 
 * @param flights - Array of flight data to update
 * @param opts - Request options (signal, token)
 * @returns Promise with batch update response
 */
export async function updateFlights(
  flights: UpdateFlightData[],
  opts: ReqOpts = {}
): Promise<UpdateFlightResponse> {
  try {
    const res = await axios.put<UpdateFlightResponse>("/flight/update/batch", flights, {
      signal: opts.signal,
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    });
    return res.data;
  } catch (e) {
    const err = e as AxiosError<{ message?: string; error?: string }>;
    const msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message ?? "Batch update flights failed";
    throw new Error(msg);
  }
}

// Helper function to validate required fields
export function validateUpdateFlightData(data: Partial<UpdateFlightData>): data is UpdateFlightData {
  return !!(
    data.id &&
    data.airlinesCode &&
    data.stationsCode &&
    data.arrivalFlightNo &&
    data.arrivalStaDate &&
    data.statusCode
  );
}

// Export types for external use
export type { UpdateFlightData as FlightUpdateData };
export default updateFlight;
