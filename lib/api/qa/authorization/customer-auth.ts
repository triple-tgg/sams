import axiosConfig from "@/lib/axios.config";

export interface CustomerAuthListRequest {
  searchKeyword: string;
  status: number | null;
  airlineId: number | null;
  page: number;
  perPage: number;
}

export interface CustomerAuthRecordsRequest {
  searchKeyword: string;
  status: number | null;
  airlineId: number | null;
}

export interface CustomerAuthRecord {
  authorizationCustomerId: number;
  staffId: number;
  airlineId: number;
  authorizationStatusId: number;
  isdelete: boolean;
  initialIssueDate: string | null;
  currentIssueDate: string | null;
  expiryDate: string | null;
  staff: CustomerAuthStaffItem['staff'];
  airline: {
    id: number;
    code: string;
    name: string;
    colorForeground: string;
    colorBackground: string;
    [key: string]: any;
  };
  authorizationStatus: {
    id: number;
    code: string;
    name: string;
    color: string | null;
    [key: string]: any;
  };
  authorizationCustomerAircraftTypeLicenses: Array<{
    id: number;
    authorizationCustomerId: number;
    aircraftTypeLicensId: number;
    isdelete: boolean;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface CustomerAuthRecordsResponse {
  message: string;
  responseData: Array<{ authorizationCustomer: CustomerAuthRecord }>;
  error: string;
}

export interface CustomerAuthStaffItem {
  id: number | null;
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
    id?: number | null;
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
    color: string | null;
    initialIssueDate: string | null;
    currentIssueDate: string | null;
    expiryDate: string | null;
    aircrafts: Array<{
      id: number;
      aircraftTypeLicensId: number;
      code: string;
      name: string;
    }>;
  }>;
}

export interface CustomerAuthListResponse {
  message: string;
  responseData: CustomerAuthStaffItem[];
  page: number;
  perPage: number;
  total: number;
  totalAll: number;
  error: string;
}

export const getCustomerAuthList = async (data: CustomerAuthListRequest) => {
  const res = await axiosConfig.post<CustomerAuthListResponse>("/authorization/customer-auth/listdata", data);
  return res.data;
};

export const getCustomerAuthRecords = async (data: CustomerAuthRecordsRequest) => {
  const res = await axiosConfig.post<CustomerAuthRecordsResponse>("/authorization/customer-auth/list", data);
  return res.data;
};

export interface UpdateCustomerAuthRequest {
  id: number;
  staffId: number;
  airlineId: number;
  authorizationStatusId: number;
  initialIssueDate: string;
  currentIssueDate: string;
  expiryDate: string;
  aircraftTypeIds: number[];
}

export interface UpdateCustomerAuthResponse {
  message: string;
  responseData: string;
  error: string;
}

export const updateCustomerAuth = async (data: UpdateCustomerAuthRequest) => {
  const res = await axiosConfig.post<UpdateCustomerAuthResponse>("/authorization/customer-auth/upsert", data);
  return res.data;
};
