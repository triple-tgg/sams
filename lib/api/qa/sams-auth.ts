import axiosConfig from "@/lib/axios.config";

export interface SamsAuthListRequest {
  searchKeyword: string;
  status: string;
  page: number;
  perPage: number;
}

export interface SamsAuthItem {
  staffAuthorizationId: number | null;
  staffId: number;
  employeeName: string;
  employeeId: string;
  authorizationNo: string;
  ratingAmel: string[];
  amelExpiryDate: string | null;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  samsExpiryDate: string | null;
  samsAuthStatus: string;
  daysToExpiry: number;
  profileImagePath?: string | null;
}

export interface SamsAuthListResponse {
  message: string;
  responseData: SamsAuthItem[];
  page: number;
  perPage: number;
  total: number;
  totalAll: number;
  error: string;
}

export const getSamsAuthList = async (data: SamsAuthListRequest): Promise<SamsAuthListResponse> => {
  const res = await axiosConfig.post("/authorization/sams-auth/listdata", data);
  return res.data;
};

// ── Detail by ID ──────────────────────────────────────────────

export interface AircraftTypeLicenseObj {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string | null;
  updatedby: string | null;
}

export interface StaffAircraftLicense {
  id: number;
  staffId: number;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string | null;
  updatedby: string | null;
  aircraftTypeLicensId: number;
  aircraftTypeLicensObj: AircraftTypeLicenseObj | null;
}

export interface SamsAuthDetail {
  id: number;
  staffId: number;
  staffName: string;
  employeeId: string;
  profileImagePath: string | null;
  authNo: string;
  staffAmelLicenseId: number | null;
  amelLicenseNumber: string;
  amelExpiryDate: string | null;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  expiryDate: string | null;
  isCrs: boolean;
  aircrafts: string[];
  staffAircraftLicenseList?: StaffAircraftLicense[];
  createddate: string;
  createdby: string;
  updateddate: string | null;
  updatedby: string | null;
}

export interface SamsAuthDetailResponse {
  message: string;
  responseData: SamsAuthDetail;
  error: string;
}

export const getSamsAuthById = async (id: number): Promise<SamsAuthDetailResponse> => {
  const res = await axiosConfig.get(`/authorization/sams-auth/byid/${id}`);
  return res.data;
};

export interface SamsAuthUpsertRequest {
  id: number;
  staffId: number;
  authNo: string;
  staffAmelLicenseId: number;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  expiryDate: string | null;
  isCrs: boolean;
  aircraftTypeIds: number[];
}

export const upsertSamsAuth = async (data: SamsAuthUpsertRequest) => {
  const res = await axiosConfig.post("/authorization/sams-auth/upsert", data);
  return res.data;
};
