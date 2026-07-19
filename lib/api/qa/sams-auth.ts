import axiosConfig from "@/lib/axios.config";

export interface SamsAuthListRequest {
  searchKeyword: string;
  status: string;
  page: number;
  perPage: number;
}

export interface SamsAuthItem {
  authorizationSamsId: number | null;
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
  staffAircraftLicenseList: StaffAircraftLicense[];
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

export interface AuthorizationSamsRecord {
  id: number;
  staffId: number;
  authNo: string;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  expiryDate: string | null;
  staffAmelLicenseId: number | null;
  isCrs: boolean;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string | null;
  updatedby: string | null;
}

export interface AuthorizationSamsAircraftTypeLicense {
  id: number;
  authorizationSamsId: number;
  aircraftTypeId: number;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string | null;
  updatedby: string | null;
}

export interface SamsAuthStaff {
  id: number;
  code: string;
  name: string;
  staffstypeid: number;
  createddate: string;
  createdby: string;
  updateddate: string | null;
  updatedby: string | null;
  isAcive: boolean;
  title: string;
  jobTitle: string;
  email: string;
  fullNameEn: string;
  dateOfBirth: string | null;
  placeOfBirth: string;
  nationality: string;
  idCardNo: string;
  phone: string;
  address: string;
  employeeId: string;
  startDate: string | null;
  positionId: number;
  profileImagePath: string | null;
  staffDepartmentPositionId: number;
  airlines: unknown | null;
}

export interface SamsAuthDetail {
  authorizationSamses: AuthorizationSamsRecord;
  authorizationSamsAircraftTypeLicens: AuthorizationSamsAircraftTypeLicense[];
  staff: SamsAuthStaff;
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
  authorizationSamses: AuthorizationSamsRecord;
  authorizationSamsAircraftTypeLicenId: number[];
}

export interface SamsAuthUpsertResponse {
  message: string;
  responseData: string;
  error: string;
}

export const upsertSamsAuth = async (data: SamsAuthUpsertRequest): Promise<SamsAuthUpsertResponse> => {
  const res = await axiosConfig.post("/authorization/sams-auth/upsert", data);
  return res.data;
};
