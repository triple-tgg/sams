import axios from "@/lib/axios.config";
import type { AxiosError } from "axios";

// Flight Update Data Interface (matches /flight/update-v2 body)
export interface UpdateFlightData {
  id: number;
  airlinesCode: string;
  stationsCode: string;
  acReg: string;
  acTypeCode: string;
  arrivalFlightNo: string;
  arrivalStaDate: string;      // UTC datetime "YYYY-MM-DD HH:mm"
  arrivalAtaDate: string;      // UTC datetime "YYYY-MM-DD HH:mm"
  departureFlightNo: string;
  departureStdDate: string;    // UTC datetime "YYYY-MM-DD HH:mm"
  departureAtdDate: string;    // UTC datetime "YYYY-MM-DD HH:mm"
  bayNo: string;
  statusCode: string;
  note: string;
  routeFrom?: string;
  routeTo?: string;
  userName?: string;
  csIdList?: number[] | null;
  mechIdList?: number[] | null;
  maintenanceStatusId?: number;
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
    const res = await axios.post<UpdateFlightResponse>("/flight/update-v2", flightData, {
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
