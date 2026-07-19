import axiosConfig from "@/lib/axios.config";

export interface CustomerAuthListRequest {
  searchKeyword: string;
  status: string | null;
  airlineId: number | null;
  page: number;
  perPage: number;
}

export interface CustomerAuthStaffItem {
  staffAuthorizationId: number | null;
  staffId: number;
  employeeName: string;
  employeeId: string;
  staff: {
    id: number;
    code: string;
    name: string;
    title: string;
    jobTitle: string;
    email: string;
    startDate: string;
    [key: string]: any;
  };
  airlineStatuses: Array<{
    airlineId: number;
    airlineCode: string;
    status: string; // e.g., "VAL", "NAP", ""
    airlineStatus: {
      id: number;
      code: string;
      name: string;
      [key: string]: any;
    } | null;
    airline: {
      id: number;
      code: string;
      name: string;
      colorForeground: string;
      colorBackground: string;
      [key: string]: any;
    };
  }>;
}

export interface CustomerAuthListResponse {
  message: string;
  responseData: CustomerAuthStaffItem[];
  total?: number;
  totalAll?: number;
}

export const getCustomerAuthList = async (data: CustomerAuthListRequest) => {
  const res = await axiosConfig.post<CustomerAuthListResponse>("/authorization/customer-auth/listdata", data);
  return res.data;
};

export interface UpdateCustomerAuthRequest {
  id: number;
  staffId: number;
  airlineId: number;
  staffAuthorizationAirlineStatusId: number;
  initialIssueDate: string;
  currentIssueDate: string;
  expiryDate: string;
  aircraftTypeIds: number[];
}

export const updateCustomerAuth = async (data: UpdateCustomerAuthRequest) => {
  const res = await axiosConfig.post("/authorization/customer-auth/upsert", data);
  return res.data;
};

export interface CustomerAuthDetailResponse {
  message: string;
  responseData: {
    id: number;
    staffAuthorizationId: number;
    staffId: number;
    staffName: string;
    employeeId: string;
    profileImagePath: string;
    amelLicenseNumber: string;
    airlineId: number;
    airlineCode: string;
    airlineName: string;
    staffAuthorizationAirlineStatusId: number;
    statusCode: string;
    statusName: string;
    initialIssueDate: string;
    currentIssueDate: string;
    expiryDate: string;
    aircrafts: Array<{ id: number; code: string; name: string; [key: string]: any }>;
    createddate: string;
    createdby: string;
    updateddate: string | null;
    updatedby: string | null;
  };
  error: string;
}

export interface CustomerAuthDetailRequest {
  staffId: number;
  airlineId: number;
}

export const getCustomerAuthById = async (data: CustomerAuthDetailRequest) => {
  const res = await axiosConfig.post<CustomerAuthDetailResponse>(`/authorization/customer-auth/byid`, data);
  return res.data;
};
