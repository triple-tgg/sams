import axiosConfig from "@/lib/axios.config";

export interface AuthorityAuthListRequest {
  searchKeyword: string;
  authorityId: number | null;
  status: string;
  page: number;
  perPage: number;
}

export interface AuthorityColumnHeader {
  authorizationAuthorityMasterId: number;
  code: string;
  name: string;
}

export interface AviationAuthorityLicense {
  id: number;
  staffId: number | null;
  aviationAuthorityId: number | null;
  licenseNo: string | null;
  licenseLevel: string | null;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  expireDate: string | null;
  isdelete: boolean;
  createddate: string | null;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
  authorizationStatusId: number | null;
}

export interface AviationAuthorityLicenseAircraft {
  id: number;
  authorizationAuthoritieId: number | null;
  aircraftTypeLicenseId: number | null;
  isdelete: boolean;
  createddate: string | null;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface AuthorizationStatusObj {
  id: number;
  code: string;
  name: string;
}

export interface AuthorizationAuthorityMasterObj {
  id: number;
  code: string;
  name: string;
}

export interface AuthorityLicenseCell {
  // New API fields
  authorizationAuthorityId: number;
  staffId: number;
  authorizationAuthorityMasterId: number;
  authorizationAuthorityMaster?: AuthorizationAuthorityMasterObj | null;
  authorizationStatusId: number;
  authorizationStatus?: AuthorizationStatusObj | null;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  expireDate: string | null;
  isdelete: boolean;
  licenseNo: string | null;
  licenseLevel: string | null;
  createdby: string | null;
  createddate: string | null;
  updatedby: string | null;
  updateddate: string | null;
  // Legacy fields (kept for backward compat)
  authorityId?: number;
  aviationAuthorityId?: number;
  authorityCode?: string;
  status?: string | null;
  aviationAuthorityLicense?: AviationAuthorityLicense | null;
  aviationAuthorityLicenseAircrafts?: AviationAuthorityLicenseAircraft[] | null;
}

export interface AuthorityStaffRow {
  staffId: number;
  staffName: string;
  employeeId: string;
  profileImagePath: string | null;
  licenses: AuthorityLicenseCell[];
}

export interface AuthorityAuthListData {
  authorities: AuthorityColumnHeader[];
  staffRows: AuthorityStaffRow[];
  page: number;
  perPage: number;
  total: number;
  totalAll: number;
}

export interface AuthorityAuthResponse {
  message: string;
  responseData: AuthorityAuthListData;
  error: string;
}

export interface AuthorityLicenseDetailAircraft {
  id: number;
  aircraftTypeLicenseId: number;
  code: string | null;
  name: string | null;
}

export interface AuthorityLicenseDetail {
  id: number;
  staffId: number;
  staffName: string | null;
  employeeId: string | null;
  aviationAuthorityId: number;
  aviationAuthorityCode: string | null;
  aviationAuthorityName: string | null;
  licenseNo: string | null;
  licenseLevel: string | null;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  expireDate: string | null;
  aircrafts: AuthorityLicenseDetailAircraft[];
  createddate: string | null;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface AuthorityLicenseDetailResponse {
  message: string;
  responseData: AuthorityLicenseDetail;
  error: string;
}

export interface AuthorityLicenseUpsertRequest {
  authorizationAuthorityId: number;
  staffId: number;
  authorizationAuthorityMasterId: number;
  licenseNo: string | null;
  licenseLevel: string | null;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  expireDate: string | null;
  aircraftTypeLicenseIds: number[];
  authorizationStatusId: number | null;
}

export interface AuthorityActionResponse {
  message: string;
  responseData: string;
  error: string;
}

export const DEFAULT_AUTHORITY_AUTH_LIST_REQUEST: AuthorityAuthListRequest = {
  searchKeyword: "",
  authorityId: null,
  status: "",
  page: 1,
  perPage: 20,
};

export async function getAuthorityAuthList(
  data: AuthorityAuthListRequest = DEFAULT_AUTHORITY_AUTH_LIST_REQUEST,
): Promise<AuthorityAuthResponse> {
  const response = await axiosConfig.post<AuthorityAuthResponse>("/authorization/authority/listdata", data);
  return response.data;
}

export async function getAuthorityLicenseDetail(id: number): Promise<AuthorityLicenseDetailResponse> {
  const response = await axiosConfig.get<AuthorityLicenseDetailResponse>(`/authorization/authority/byid/${id}`);
  return response.data;
}

export async function upsertAuthorityLicense(data: AuthorityLicenseUpsertRequest): Promise<AuthorityActionResponse> {
  const response = await axiosConfig.post<AuthorityActionResponse>("/authorization/authority-license/upsert", data);
  return response.data;
}
