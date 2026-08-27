import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────────────────────

export interface AuthorityMasterItem {
  id: number;
  code: string;
  name: string;
  country?: string;
  countryCode?: string;
  authorityType?: string;
  isdelete?: boolean;
  createddate?: string;
  createdby?: string | null;
  updateddate?: string;
  updatedby?: string | null;
}

export interface AuthorityMasterListResponse {
  message: string;
  responseData: AuthorityMasterItem[];
  error: string;
}

export interface AuthorityMasterUpsertRequest {
  id: number; // 0 = add, existing id = update
  code: string;
  name: string;
  country: string;
  countryCode: string;
  authorityType: string;
}

export interface AuthorityMasterUpsertResponse {
  message: string;
  responseData: AuthorityMasterItem | null;
  error: string;
}

export interface AuthorityMasterDeleteRequest {
  id: number;
  userName: string;
}

export interface AuthorityMasterDeleteResponse {
  message: string;
  responseData: null;
  error: string;
}

// ──────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────

/** GET list of authority masters */
export const getAuthorityMasterList = async (): Promise<AuthorityMasterListResponse> => {
  const res = await axiosConfig.get("/authorization/authority-master/list");
  return res.data;
};

/** POST upsert (create or update) an authority master */
export const upsertAuthorityMaster = async (
  data: AuthorityMasterUpsertRequest
): Promise<AuthorityMasterUpsertResponse> => {
  const res = await axiosConfig.post("/authorization/authority-master/upsert", data);
  return res.data;
};

/** POST delete an authority master */
export const deleteAuthorityMaster = async (
  data: AuthorityMasterDeleteRequest
): Promise<AuthorityMasterDeleteResponse> => {
  const res = await axiosConfig.post("/authorization/authority-master/delete", data);
  return res.data;
};
