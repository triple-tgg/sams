import axios from "@/lib/axios.config";
import type { AxiosError } from "axios";

// Flight Update Data Interface
export interface UpdateFlightData {
  id: number;
  airlinesCode: string;
  stationsCode: string;
  acReg: string;
  acTypeCode: string;
  arrivalFlightNo: string;
  arrivalDate: string;       // "YYYY-MM-DD"
  arrivalStaTime: string;    // "HH:mm"
  arrivalAtaTime: string;    // "HH:mm"
  departureFlightNo: string;
  departureDate: string;     // "YYYY-MM-DD"
  departureStdTime: string;  // "HH:mm"
  departureAtdTime: string;  // "HH:mm"
  bayNo: string;
  thfNo: string;
  statusCode: string;
  note: string;
  maintenanceStatusCode?: string;
  checkStatusId?: number;
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
    data.arrivalDate &&
    data.arrivalStaTime &&
    data.statusCode
  );
}

// Export types for external use
export type { UpdateFlightData as FlightUpdateData };
export default updateFlight;
