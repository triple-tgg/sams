import axios from "@/lib/axios.config";
import type { AxiosError } from "axios";

// ทำ id เป็น optional เผื่อ backend สร้างให้
export interface FlightData {
  id?: number;
  airlinesCode: string;
  stationsCode: string;
  acReg: string;
  acType: string;
  arrivalFlightNo: string;
  arrivalDate: string;       // "YYYY-MM-DD"
  arrivalStaTime: string;    // "HH:mm" (ถ้า API ต้อง HHmm ให้แปลงก่อน)
  arrivalAtaTime: string;    // "HH:mm"
  departureFlightNo: string;
  departureDate: string;     // "YYYY-MM-DD"
  departureStdTime: string;  // "HH:mm"
  departureAtdTime: string;  // "HH:mm"
  bayNo: string;
  thfNo: string;
  statusCode: string;
  note: string;
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
    const res = await axios.post<AddFlightRes>("/flight/import", flightData, {
      signal: opts.signal,
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    });
    return res.data;
  } catch (e) {
    const err = e as AxiosError<{ message?: string }>;
    const msg = err.response?.data?.message ?? err.message ?? "Add flight failed";
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
