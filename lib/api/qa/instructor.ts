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
  /** Start of the instructor's validity period ("YYYY-MM-DDT00:00:00"); null when not set */
  validFrom: string | null;
  /** End of the instructor's validity period ("YYYY-MM-DDT00:00:00"); null when not set */
  validTo: string | null;
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
  /** Optional for older responses: when missing, treat the instructor as active unless isDelete */
  isActive?: boolean;
  /** Validity period (ISO date-time); null when not set */
  validFrom: string | null;
  validTo: string | null;
}

/** API date-time → "YYYY-MM-DD" for a date input ("" when not set). */
export const toDateInputValue = (value?: string | null): string =>
  value && /^\d{4}-\d{2}-\d{2}/.test(value) && !value.startsWith("0001-") ? value.slice(0, 10) : "";

/** Days before Valid To when an instructor is flagged as "expiring soon". */
export const VALIDITY_WARN_DAYS = 30;

export type ValidityStatus =
  | { state: "none" }
  | { state: "valid"; daysLeft: number }
  | { state: "expiring"; daysLeft: number }
  | { state: "expired"; daysAgo: number };

/** Local calendar date as "YYYY-MM-DD". */
export const todayDateValue = (now: Date = new Date()): string => {
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
};

/** Whole days from `a` to `b`, both "YYYY-MM-DD" (calendar days, no timezone drift). */
const daysBetween = (a: string, b: string): number => {
  const utc = (v: string) => Date.UTC(+v.slice(0, 4), +v.slice(5, 7) - 1, +v.slice(8, 10));
  return Math.round((utc(b) - utc(a)) / 86_400_000);
};

/**
 * Validity of an instructor on `today` ("YYYY-MM-DD"), from its Valid To date.
 * Valid To is the last valid day: expired from the day after it, "expiring"
 * within VALIDITY_WARN_DAYS before it.
 */
export const getValidityStatus = (
  validTo: string | null | undefined,
  today: string = todayDateValue(),
  warnDays: number = VALIDITY_WARN_DAYS
): ValidityStatus => {
  const to = toDateInputValue(validTo);
  if (!to) return { state: "none" };
  const daysLeft = daysBetween(today, to);
  if (daysLeft < 0) return { state: "expired", daysAgo: -daysLeft };
  if (daysLeft <= warnDays) return { state: "expiring", daysLeft };
  return { state: "valid", daysLeft };
};

/** "YYYY-MM-DD" from a date input → API date-time, without a timezone shift (null when empty). */
export const fromDateInputValue = (value: string): string | null =>
  value ? `${value}T00:00:00` : null;

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
