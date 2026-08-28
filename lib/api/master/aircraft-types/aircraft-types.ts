import axiosConfig from "@/lib/axios.config";

// ── Types ────────────────────────────────────────────────────────

export interface AircraftType {
  id: number;
  code: string;             // ICAO code e.g. A19N, A20N
  name: string;
  modelName: string;        // Family e.g. A319, A320
  modelSubName: string;     // Model variant e.g. A319neo, A319-100
  classicOrNeo: string;     // "CLASSIC" | "NEO" | ""
  familyCode: string | null;
  // Engine flags (boolean)
  flagEnging1: boolean;
  flagEnging2: boolean;
  flagEnging3: boolean;
  flagEnging4: boolean;
  // CSD/Generator flags (boolean)
  flagCsd1: boolean;
  flagCsd2: boolean;
  flagCsd3: boolean;
  flagCsd4: boolean;
  // Hydraulic flags (boolean)
  flagHydrolicGreen: boolean;
  flagHydrolicBlue: boolean;
  flagHydrolicYellow: boolean;
  // APU
  flagApu: boolean;
  // Meta
  isDelete?: boolean;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string | null;
  updatedDate?: string | null;
}

export interface AircraftTypeUpsertRequest {
  id?: number;
  code: string;
  name: string;
  modelName: string;
  modelSubName: string;
  classicOrNeo: string;
  familyCode?: string | null;
  flagEnging1: boolean;
  flagEnging2: boolean;
  flagEnging3: boolean;
  flagEnging4: boolean;
  flagCsd1: boolean;
  flagCsd2: boolean;
  flagCsd3: boolean;
  flagCsd4: boolean;
  flagHydrolicGreen: boolean;
  flagHydrolicBlue: boolean;
  flagHydrolicYellow: boolean;
  flagApu: boolean;
}

// ── API Functions ────────────────────────────────────────────────

/** POST /master/aircraftTypes/list — fetch all (large perPage to avoid pagination) */
export async function fetchAircraftTypes(): Promise<AircraftType[]> {
  const res = await axiosConfig.post("/master/aircraftTypes/list", { page: 1, perPage: 500 });
  return res.data?.responseData ?? [];
}

/** GET /master/aircraftTypes/byid/{id} */
export async function fetchAircraftTypeById(id: number): Promise<AircraftType> {
  const res = await axiosConfig.get(`/master/aircraftTypes/byid/${id}`);
  return res.data?.responseData ?? res.data;
}

/** POST /master/aircraftTypes/upsert */
export async function upsertAircraftType(data: AircraftTypeUpsertRequest): Promise<void> {
  await axiosConfig.post("/master/aircraftTypes/upsert", data);
}

/** POST /master/aircraftTypes/delete */
export async function deleteAircraftType(id: number): Promise<void> {
  await axiosConfig.post("/master/aircraftTypes/delete", { id });
}
