import axiosConfig from "@/lib/axios.config";

export type MonitoringCrsCoverageStatus = "FULL" | "PARTIAL" | "NONE";
export type MonitoringCrsEligibilityStatus = "ELIGIBLE" | "AT_RISK" | "INELIGIBLE" | "NOT_IN_SCOPE";

export type MonitoringCrsReasonCode =
  | "STAFF_INACTIVE"
  | "SAMS_AUTH_NOT_ISSUED"
  | "SAMS_AUTH_NOT_CRS"
  | "SAMS_AUTH_EXPIRED"
  | "SAMS_AUTH_EXPIRY_MISSING"
  | "SAMS_AUTH_EXPIRING"
  | "CUSTOMER_AUTH_NOT_ISSUED"
  | "CUSTOMER_AUTH_PENDING"
  | "CUSTOMER_AUTH_NOT_APPROVED"
  | "CUSTOMER_AUTH_NOT_COMPLETE"
  | "CUSTOMER_AUTH_SUSPENDED"
  | "CUSTOMER_AUTH_EXPIRED"
  | "CUSTOMER_AUTH_EXPIRY_MISSING"
  | "CUSTOMER_AUTH_EXPIRING"
  | "AUTH_SCOPE_MISMATCH"
  | "AIRLINE_NOT_IN_SCOPE"
  | "DATA_CONFLICT"
  | (string & {});

export interface MonitoringCrsListRequest {
  searchKeyword: string;
  coverageStatus: "" | MonitoringCrsCoverageStatus;
  samsStatus: string;
  airlineId: number | null;
  hasIssues: boolean;
  expiryWarningDays: number;
  page: number;
  perPage: number;
}

export interface MonitoringCrsAircraftType {
  id: number;
  code: string;
  name: string;
}

export interface MonitoringCrsSamsAuthorization {
  authorizationSamsId: number;
  authNo: string;
  statusCode: string;
  statusName: string;
  isCrs: boolean;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  expiryDate: string | null;
  daysToExpiry: number | null;
  aircraftTypes: MonitoringCrsAircraftType[];
}

export interface MonitoringCrsAirlineEligibility {
  airlineId: number;
  airlineCode: string;
  isInScope: boolean;
  eligibilityStatus: MonitoringCrsEligibilityStatus;
  isEligible: boolean;
  customerAuthorizationId: number | null;
  customerStatusCode: string;
  customerStatusName: string;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  expiryDate: string | null;
  daysToExpiry: number | null;
  eligibleAircraftTypes: MonitoringCrsAircraftType[];
  reasonCodes: MonitoringCrsReasonCode[];
}

export interface MonitoringCrsStaffRow {
  staffId: number;
  employeeId: string;
  staffName: string;
  jobTitle: string;
  isActive: boolean;
  samsAuthorization: MonitoringCrsSamsAuthorization | null;
  coverageStatus: MonitoringCrsCoverageStatus;
  hasAnyCrsEligibility: boolean;
  eligibleAirlineCount: number;
  inScopeAirlineCount: number;
  atRiskAirlineCount: number;
  blockingReasonCodes: MonitoringCrsReasonCode[];
  airlineEligibilities: MonitoringCrsAirlineEligibility[];
}

export interface MonitoringCrsAirline {
  airlineId: number;
  code: string;
  name: string;
  colorForeground: string | null;
  colorBackground: string | null;
  displayOrder: number;
}

export interface MonitoringCrsSummary {
  totalStaff: number;
  fullCrs: number;
  partialCrs: number;
  noCrs: number;
  eligibleStaff: number;
  atRiskStaff: number;
  eligibleAirlineCells: number;
  inScopeAirlineCells: number;
  coveragePercent: number;
}

export interface MonitoringCrsListData {
  evaluatedAtUtc: string;
  expiryWarningDays: number;
  summary: MonitoringCrsSummary;
  airlines: MonitoringCrsAirline[];
  staffRows: MonitoringCrsStaffRow[];
}

export interface MonitoringCrsListResponse {
  message: string;
  responseData: MonitoringCrsListData;
  page: number;
  perPage: number;
  total: number;
  totalAll: number;
  error: string;
}

export interface MonitoringCrsDetailResponse {
  message: string;
  responseData: {
    evaluatedAtUtc: string;
    staffRow: MonitoringCrsStaffRow;
  };
  error: string;
}

export interface MonitoringCrsSummaryResponse {
  message: string;
  responseData: {
    evaluatedAtUtc: string;
    expiryWarningDays: number;
  } & MonitoringCrsSummary;
  error: string;
}

export async function getMonitoringCrsList(data: MonitoringCrsListRequest): Promise<MonitoringCrsListResponse> {
  const response = await axiosConfig.post<MonitoringCrsListResponse>("/authorization/monitoring-crs/listdata", data);
  return response.data;
}

export async function getMonitoringCrsDetail(staffId: number, expiryWarningDays = 90): Promise<MonitoringCrsDetailResponse> {
  const response = await axiosConfig.get<MonitoringCrsDetailResponse>(`/authorization/monitoring-crs/byid/${staffId}`, {
    params: { expiryWarningDays },
  });
  return response.data;
}

export async function getMonitoringCrsSummary(expiryWarningDays = 90): Promise<MonitoringCrsSummaryResponse> {
  const response = await axiosConfig.get<MonitoringCrsSummaryResponse>("/authorization/monitoring-crs/summary", {
    params: { expiryWarningDays },
  });
  return response.data;
}
