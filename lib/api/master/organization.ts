import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface StaffDepartment {
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

export interface StaffDepartmentsResponse {
  message: string;
  responseData: StaffDepartment[];
  error: string;
}

export interface StaffDepartmentPosition {
  id: number;
  code: string;
  name: string;
  description: string | null;
  staffDepartmentId: number;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface StaffDepartmentPositionsResponse {
  message: string;
  responseData: StaffDepartmentPosition[];
  error: string;
}

// ──────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────

/** GET list of staff departments */
export const getStaffDepartments = async (): Promise<StaffDepartmentsResponse> => {
  const res = await axiosConfig.get("/master/staff-departments/list");
  return res.data;
};

/** GET list of staff department positions */
export const getStaffDepartmentPositions = async (): Promise<StaffDepartmentPositionsResponse> => {
  const res = await axiosConfig.get("/master/staff-department-positions/list");
  return res.data;
};

// ──────────────────────────────────────────────────────────────
// Department Chiefs (Manager Mapping)
// ──────────────────────────────────────────────────────────────

export interface StaffDepartmentChief {
  id: number;
  staffId: number;
  staffDepartmentId: number | null;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface StaffDepartmentChiefsResponse {
  message: string;
  responseData: StaffDepartmentChief[];
  error: string;
}

/** GET list of department chiefs */
export const getStaffDepartmentChiefs = async (): Promise<StaffDepartmentChiefsResponse> => {
  const res = await axiosConfig.get("/master/staff-department-chiefs");
  return res.data;
};

export interface UpsertStaffDepartmentChiefRequest {
  id: number; // 0 = add, existing id = edit
  staffId: number;
  staffDepartmentId: number;
  isdelete: boolean;
}

/** POST upsert (assign or update) a department chief */
export const upsertStaffDepartmentChief = async (data: UpsertStaffDepartmentChiefRequest) => {
  const res = await axiosConfig.post("/master/staff-department-chiefs-upsert", data);
  return res.data;
};

// ──────────────────────────────────────────────────────────────
// Single-item responses
// ──────────────────────────────────────────────────────────────

export interface StaffDepartmentDetailResponse {
  message: string;
  responseData: StaffDepartment;
  error: string;
}

export interface StaffDepartmentPositionDetailResponse {
  message: string;
  responseData: StaffDepartmentPosition;
  error: string;
}

// ──────────────────────────────────────────────────────────────
// Single-item API Functions
// ──────────────────────────────────────────────────────────────

/** GET a single staff department by ID */
export const getStaffDepartmentById = async (id: number): Promise<StaffDepartmentDetailResponse> => {
  const res = await axiosConfig.get(`/master/staff-departments/${id}`);
  return res.data;
};

/** GET a single staff department position by ID */
export const getStaffDepartmentPositionById = async (id: number): Promise<StaffDepartmentPositionDetailResponse> => {
  const res = await axiosConfig.get(`/master/staff-department-positions/${id}`);
  return res.data;
};

// ──────────────────────────────────────────────────────────────
// Upsert (Add / Edit)
// ──────────────────────────────────────────────────────────────

export interface UpsertStaffDepartmentRequest {
  id: number; // 0 = add, existing id = edit
  code: string;
  name: string;
  description: string;
}

/** POST upsert (add or edit) a staff department */
export const upsertStaffDepartment = async (data: UpsertStaffDepartmentRequest) => {
  const res = await axiosConfig.post("/master/staff-departments-upsert", data);
  return res.data;
};

export interface UpsertStaffDepartmentPositionRequest {
  id: number; // 0 = add, existing id = edit
  code: string;
  name: string;
  description: string;
  staffDepartmentId: number;
}

/** POST upsert (add or edit) a staff department position */
export const upsertStaffDepartmentPosition = async (data: UpsertStaffDepartmentPositionRequest) => {
  const res = await axiosConfig.post("/master/staff-department-positions-upsert", data);
  return res.data;
};

// ──────────────────────────────────────────────────────────────
// Delete
// ──────────────────────────────────────────────────────────────

/** POST delete a staff department */
export const deleteStaffDepartment = async (id: number) => {
  const res = await axiosConfig.post("/master/staff-departments-delete", { id });
  return res.data;
};

/** POST delete a staff department position */
export const deleteStaffDepartmentPosition = async (id: number) => {
  const res = await axiosConfig.post("/master/staff-department-positions-delete", { id });
  return res.data;
};
