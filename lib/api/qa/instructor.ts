import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

/** POST /master/courses-instructors/upsert body */
export interface InstructorUpsertRequest {
  id: number; // 0 = add new, >0 = update existing
  title: string;
  code: string;
  name: string;
  email: string;
  description: string;
  /** Signature file URL */
  licenseLink: string;
  /** Instructor Authorization / Approval Letter file URL */
  approvalLetterLink: string;
  /** true = internal instructor linked to a staff record via staffId; false = external */
  flagInternal: boolean;
  /** Linked staff id for internal instructors; null for external */
  staffId: number | null;
  /** Active/inactive toggle shown in Instructor Management */
  isActive: boolean;
}

export interface InstructorUpsertResponse {
  message: string;
  responseData: string;
  error: string;
}

export interface InstructorDeleteResponse {
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
  approvalLetterLink: string;
  isDelete: boolean;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
  email: string;
  /** true = internal instructor (SAMS staff, linked via staffId); false = external */
  flagInternal: boolean;
  staffId: number;
  /** Not in the current GET spec yet; when missing, treat the instructor as active unless isDelete */
  isActive?: boolean;
}

/** Active state used by the Active switch and summary cards. */
export const isInstructorActive = (inst: Pick<InstructorItem, "isActive" | "isDelete">): boolean =>
  inst.isActive ?? !inst.isDelete;

export interface InstructorListResponse {
  message: string;
  responseData: InstructorItem[];
  error: string;
}

export interface InstructorDetailResponse {
  message: string;
  responseData: InstructorItem;
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

/** GET instructor detail by id */
export const getInstructorById = async (id: number): Promise<InstructorDetailResponse> => {
  const res = await axiosConfig.get(`/master/courses-instructors/byid/${id}`);
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
): Promise<InstructorDeleteResponse> => {
  const res = await axiosConfig.post("/master/courses-instructors/delete", { id });
  return res.data;
};
