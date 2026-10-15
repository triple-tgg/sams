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
  // Display colors (hex)
  colorForeground?: string | null;
  colorBackground?: string | null;
  // Meta
  isDelete?: boolean;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string | null;
  updatedDate?: string | null;
}

/** Body of POST /master/aircraftTypes/upsert — `id: 0` creates, `id > 0` updates. */
export interface AircraftTypeUpsertRequest {
  id?: number;
  code: string;
  name: string;
  modelName: string;
  modelSubName: string;
  classicOrNeo: string;
  familyCode?: string | null;
  /** Hex text color, e.g. "#FFFFFF" */
  colorForeground?: string | null;
  /** Hex background color, e.g. "#1F2937" */
  colorBackground?: string | null;
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

export interface AircraftTypeListResponse {
  message: string;
  responseData: AircraftType[];
  page: number;
  perPage: number;
  total: number;
  totalAll: number;
  error: string;
}

const LIST_PER_PAGE = 999;
const LIST_MAX_PAGES = 50; // safety guard against endless paging

/**
 * POST /master/aircraftTypes/list — body `{ page, perPage: 999 }`.
 * If the backend caps the page size (e.g. returns perPage 20 while totalAll is larger),
 * keep requesting the next pages until all `totalAll` rows are loaded.
 */
export async function fetchAircraftTypes(): Promise<AircraftType[]> {
  const all: AircraftType[] = [];
  let page = 1;

  while (page <= LIST_MAX_PAGES) {
    const res = await axiosConfig.post<AircraftTypeListResponse>("/master/aircraftTypes/list", {
      page,
      perPage: LIST_PER_PAGE,
    });
    const data = res.data;
    const rows = Array.isArray(data?.responseData) ? data.responseData : [];
    all.push(...rows);

    const totalAll = Number(data?.totalAll ?? 0);
    if (rows.length === 0 || !totalAll || all.length >= totalAll) break;
    page += 1;
  }

  // De-dupe by id in case pages overlap
  const seen = new Set<number>();
  return all.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

export interface AircraftTypeByIdResponse {
  message: string;
  responseData: AircraftType | null;
  error: string;
}

/** GET /master/aircraftTypes/byid/{id} — returns the single record from `responseData`. */
export async function fetchAircraftTypeById(id: number): Promise<AircraftType> {
  const res = await axiosConfig.get<AircraftTypeByIdResponse>(`/master/aircraftTypes/byid/${id}`);
  const record = res.data?.responseData;
  if (!record) {
    throw new Error(res.data?.error || res.data?.message || `Aircraft type #${id} not found`);
  }
  return record;
}

/** POST /master/aircraftTypes/upsert — body normalized to the exact backend contract. */
export async function upsertAircraftType(data: AircraftTypeUpsertRequest): Promise<void> {
  const body = {
    id: data.id ?? 0,
    code: data.code ?? "",
    name: data.name ?? "",
    modelName: data.modelName ?? "",
    modelSubName: data.modelSubName ?? "",
    classicOrNeo: data.classicOrNeo ?? "",
    familyCode: data.familyCode ?? "",
    colorForeground: data.colorForeground ?? "",
    colorBackground: data.colorBackground ?? "",
    flagEnging1: !!data.flagEnging1,
    flagEnging2: !!data.flagEnging2,
    flagEnging3: !!data.flagEnging3,
    flagEnging4: !!data.flagEnging4,
    flagCsd1: !!data.flagCsd1,
    flagCsd2: !!data.flagCsd2,
    flagCsd3: !!data.flagCsd3,
    flagCsd4: !!data.flagCsd4,
    flagHydrolicGreen: !!data.flagHydrolicGreen,
    flagHydrolicBlue: !!data.flagHydrolicBlue,
    flagHydrolicYellow: !!data.flagHydrolicYellow,
    flagApu: !!data.flagApu,
  };
  await axiosConfig.post("/master/aircraftTypes/upsert", body);
}

/** POST /master/aircraftTypes/delete */
export async function deleteAircraftType(id: number): Promise<void> {
  await axiosConfig.post("/master/aircraftTypes/delete", { id });
}
