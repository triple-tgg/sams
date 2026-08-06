import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface InstructorUpsertRequest {
  id: number; // 0 = add new, >0 = update existing
  title: string;
  code: string;
  name: string;
  description: string;
  licenseLink: string;
  email: string;
}

export interface InstructorUpsertResponse {
  message: string;
  responseData: {
    id: number;
  };
  error: string;
}

export interface InstructorItem {
  id: number;
  title: string;
  code: string;
  name: string;
  description: string;
  licenseLink: string;
  isDelete: boolean;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
  email: string;
}

export interface InstructorListResponse {
  message: string;
  responseData: InstructorItem[];
  error: string;
}

// ──────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────

/** GET list all instructors */
export const getInstructors = async (): Promise<InstructorListResponse> => {
  const res = await axiosConfig.get("/master/courses-instructors");
  return res.data;
};

/** POST upsert instructor (create or update) */
export const upsertInstructor = async (
  data: InstructorUpsertRequest
): Promise<InstructorUpsertResponse> => {
  const res = await axiosConfig.post(
    "/master/courses-instructors/upsert",
    data
  );
  return res.data;
};

/** POST delete instructor */
export const deleteInstructor = async (
  id: number
): Promise<InstructorUpsertResponse> => {
  const res = await axiosConfig.post("/master/courses-instructors/delete", { id });
  return res.data;
};
