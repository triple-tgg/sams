import axios from "@/lib/axios.config";
import type { AxiosError } from "axios";

// ทำ id เป็น optional เผื่อ backend สร้างให้
export interface FlightData {
  id?: number;
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
  thfNo: string;
  statusCode: string;
  note: string;

  routeForm?: string;          // NOTE: API uses "routeForm" not "routeFrom"
  routeTo?: string;

  userName: string;
  csId?: number | null;          // Single CS staff ID
  mechId?: number | null;        // Single MECH staff ID
  csIdList?: number[] | null;    // Array of CS staff IDs
  mechIdList?: number[] | null;  // Array of MECH staff IDs
}

// ถ้า API ห่อ response เป็น envelope อื่น ปรับให้ตรงได้
export type AddFlightRes = {
  message?: string;
  // แล้วแต่ backend คืนอะไรมา เช่น id ใหม่ ฯลฯ
  data?: unknown;
};

type ReqOpts = { signal?: AbortSignal; token?: string };

export async function addFlight(
  flightData: FlightData,
  opts: ReqOpts = {}
): Promise<AddFlightRes> {
  try {
    const res = await axios.post<AddFlightRes>("/flight/import-v2", flightData, {
      signal: opts.signal,
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    });
    return res.data;
  } catch (e) {
    const err = e as AxiosError<{ message?: string; error?: string }>;
    const msg = err.response?.data?.error ?? err.response?.data.message ?? "Add flight failed";
    // โยน Error ที่อ่านง่ายให้ UI แสดงผล
    throw new Error(msg);
  }
}

// กรณี bulk import (array)
export async function importFlights(
  flights: FlightData[],
  opts: ReqOpts = {}
): Promise<AddFlightRes> {
  try {
    const res = await axios.post<AddFlightRes>("/flight/import", flights, {
      signal: opts.signal,
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    });
    return res.data;
  } catch (e) {
    const err = e as AxiosError<{ message?: string }>;
    const msg = err.response?.data?.message ?? err.message ?? "Import flights failed";
    throw new Error(msg);
  }
}
