import axiosConfig from "@/lib/axios.config";

// ── Types ────────────────────────────────────────────────────────
export interface AircraftFamilyCode {
  id: number;
  code: string;
  name: string;
  description?: string;
  isDelete?: boolean;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string | null;
  updatedDate?: string | null;
}

export interface AircraftFamilyUpsertRequest {
  id?: number;
  code: string;
  name: string;
  description?: string;
}

// ── API Functions ────────────────────────────────────────────────

/** GET /master/aircraft-family-codes-list */
export async function fetchAircraftFamilyCodes(): Promise<AircraftFamilyCode[]> {
  const res = await axiosConfig.get("/master/aircraft-family-codes-list");
  return res.data?.responseData ?? [];
}

/** POST /master/aircraft-family-codes-upsert */
export async function upsertAircraftFamilyCode(data: AircraftFamilyUpsertRequest): Promise<void> {
  await axiosConfig.post("/master/aircraft-family-codes-upsert", {
    id: data.id ?? 0,
    code: data.code,
    name: data.name,
    description: data.description ?? "",
  });
}

/** DELETE /master/aircraft-family-codes/{id} */
export async function deleteAircraftFamilyCode(id: number): Promise<void> {
  await axiosConfig.delete(`/master/aircraft-family-codes/${id}`);
}
