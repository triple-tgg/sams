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

export const getAuthorityList = async (data: AuthorityListRequest) => {
  const res = await axiosConfig.post("/authorization/authority/listdata", data);
  return res.data;
};
