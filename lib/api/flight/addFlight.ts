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

// ทำ id เป็น optional เผื่อ backend สร้างให้ (0 เมื่อสร้างใหม่)
export interface FlightData {
  id?: number;
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
  etaDate?: string;
  flightServiceLists?: FlightServiceListItem[];
  flightAircraftTowingsLists?: FlightAircraftTowingItemPayload[];

  // Legacy/optional fields
  thfNo?: string;
  routeForm?: string;
  userName?: string;
  csId?: number | null;
  mechId?: number | null;
  aircraftEngineCode?: string;
  familyCode?: string;
  aircraftCheckType?: { checkType: string; checkSubType: string[] }[];
  isAircraftTowing?: boolean;
  aircraftTowing?: {
    onDate?: string;
    offDate?: string;
    bayFrom?: string;
    bayTo?: string;
  }[];
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

