import axiosConfig from "@/lib/axios.config";

export interface AuthorityListRequest {
  page?: number;
  perPage?: number;
  search?: string;
}

export interface AuthorityItem {
  id: number;
  // TODO: Add actual fields based on API response
  [key: string]: any;
}

export interface AuthorityListResponse {
  total: number;
  page: number;
  perPage: number;
  data: AuthorityItem[];
}

// POST authorization/authority/listdata
export const getAuthorityList = async (data: AuthorityListRequest) => {
  const res = await axiosConfig.post("/authorization/authority/listdata", data);
  return res.data;
};

// GET authorization/authority/list
export const getAuthorityAll = async () => {
  const res = await axiosConfig.get("/authorization/authority/list");
  return res.data;
};

// POST authorization/authority-license/upsert
export const upsertAuthorityLicense = async (data: any) => {
  const res = await axiosConfig.post("/authorization/authority-license/upsert", data);
  return res.data;
};

// GET authorization/authority/byid/{id}
export const getAuthorityById = async (id: number | string) => {
  const res = await axiosConfig.get(`/authorization/authority/byid/${id}`);
  return res.data;
};
