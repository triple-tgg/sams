import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface StaffDepartmentAmo145 {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface StaffDepartmentAmo145ListResponse {
  message: string;
  responseData: StaffDepartmentAmo145[];
  error: string;
}

export interface StaffDepartmentAmo145DetailResponse {
  message: string;
  responseData: StaffDepartmentAmo145;
  error: string;
}

export interface UpsertStaffDepartmentAmo145Request {
  id: number; // 0 = add, existing id = edit
  code: string;
  name: string;
  description: string;
}

export interface StaffDepartmentPositionAmo145 {
  id: number;
  code: string;
  name: string;
  description: string | null;
  staffDepartmentAmo145Id: number | null;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface StaffDepartmentPositionAmo145ListResponse {
  message: string;
  responseData: StaffDepartmentPositionAmo145[];
  error: string;
}

export interface StaffDepartmentPositionAmo145DetailResponse {
  message: string;
  responseData: StaffDepartmentPositionAmo145;
  error: string;
}

export interface UpsertStaffDepartmentPositionAmo145Request {
  id: number; // 0 = add, existing id = edit
  code: string;
  name: string;
  description: string;
  staffDepartmentAmo145Id: number;
}

// ──────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────

/** GET list of AMO145 staff departments */
export const getStaffDepartmentAmo145s =
  async (): Promise<StaffDepartmentAmo145ListResponse> => {
    const res = await axiosConfig.get("/master/staffDepartmentAmo145s/listdata");
    return res.data;
  };

/** GET a single AMO145 staff department by ID */
export const getStaffDepartmentAmo145ById = async (
  id: number
): Promise<StaffDepartmentAmo145DetailResponse> => {
  const res = await axiosConfig.get(`/master/staffDepartmentAmo145s/${id}`);
  return res.data;
};

/** POST upsert (add or edit) an AMO145 staff department */
export const upsertStaffDepartmentAmo145 = async (
  data: UpsertStaffDepartmentAmo145Request
): Promise<StaffDepartmentAmo145DetailResponse> => {
  const res = await axiosConfig.post("/master/staffDepartmentAmo145s/upsert", data);
  return res.data;
};

/** GET list of AMO145 staff department positions */
export const getStaffDepartmentPositionAmo145s =
  async (): Promise<StaffDepartmentPositionAmo145ListResponse> => {
    const res = await axiosConfig.get(
      "/master/staffDepartmentPositionAmo145s/listdata"
    );
    return res.data;
  };

/** GET a single AMO145 staff department position by ID */
export const getStaffDepartmentPositionAmo145ById = async (
  id: number
): Promise<StaffDepartmentPositionAmo145DetailResponse> => {
  const res = await axiosConfig.get(
    `/master/staffDepartmentPositionAmo145s/${id}`
  );
  return res.data;
};

/** POST upsert (add or edit) an AMO145 staff department position */
export const upsertStaffDepartmentPositionAmo145 = async (
  data: UpsertStaffDepartmentPositionAmo145Request
): Promise<StaffDepartmentPositionAmo145DetailResponse> => {
  const res = await axiosConfig.post(
    "/master/staffDepartmentPositionAmo145s/upsert",
    data
  );
  return res.data;
};
