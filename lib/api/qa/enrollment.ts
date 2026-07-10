import axios from "axios";
import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface StaffForEnrollmentItem {
  staffId: number;
  code: string;
  name: string;
  title: string;
  fullNameEn: string | null;
  departmentName: string;
  employeeId: string | null;
  status: string;
}

export interface EnrolledStaffItem {
  enrollmentId: number;
  staffId: number;
  employeeName: string;
  employeeId: string;
  license: string;
  department: string;
  enrolledDate: string;
  status: string;
  result: string;
  trainingEnrollmentActionStatus: { id: number; code: string; name: string };
  trainingEnrollmentStatus: { id: number; code: string; name: string };
}

export interface EnrollRequest {
  trainingScheduleId: number;
  staffId: number;
  note: string;
  trainingEnrollmentActionStatusId: number;
  trainingEnrollmentStatusId: number;
}

export interface UnenrollRequest {
  enrollmentId: number;
}

export interface StaffListRequest {
  scheduleId: number;
  searchKeyword: string;
  page: number;
  perPage: number;
}

export interface SendEmailListRequest {
  scheduleId: number;
  staffIdList: number[];
  subject: string;
  emailFrom: string | null;
  emailCc: string | null;
}

export interface SendEmailResult {
  totalSent: number;
  totalFailed: number;
  details: { email: string | null; isSuccess: boolean; errorMessage: string }[];
}

// ──────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────

/** GET available staff for enrollment */
export const getStaffForEnrollment = async (scheduleId: number): Promise<StaffForEnrollmentItem[]> => {
  const res = await axiosConfig.get(`/training/enrollment/staff-for-enrollment/${scheduleId}`);
  return res.data?.responseData ?? [];
};

/** POST enrolled staff list (paginated) */
export const getEnrolledStaffList = async (data: StaffListRequest): Promise<{ list: EnrolledStaffItem[]; total: number }> => {
  const res = await axiosConfig.post("/training/enrollment/staff-list", data);
  return {
    list: res.data?.responseData ?? [],
    total: res.data?.total ?? 0,
  };
};

/** POST enroll a staff member */
export const enrollStaff = async (data: EnrollRequest): Promise<any> => {
  const res = await axiosConfig.post("/training/enrollment/enroll", data);
  return res.data;
};

/** POST unenroll a staff member */
export const unenrollStaff = async (data: UnenrollRequest): Promise<any> => {
  const res = await axiosConfig.post("/training/enrollment/unenroll", data);
  return res.data;
};

/** POST send email to selected enrolled staff */
export const sendEmailList = async (data: SendEmailListRequest): Promise<SendEmailResult> => {
  const res = await axiosConfig.post("/training/send-email-list", data);
  return res.data?.responseData;
};

// ──────────────────────────────────────────────────────────────
// Confirm Attendance (public — no auth required)
// ──────────────────────────────────────────────────────────────

export interface ConfirmAttendanceCourseObj {
  id: number;
  courseCode: string;
  courseName: string;
  courseCategoryId: number;
  courseType: string;
  recurrenceIntervalYears: number;
  additionalNote: string;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string;
  updatedby: string;
  aircraftTypeLicenseId: number;
  courseObjective: string | null;
}

export interface ConfirmAttendanceSchedule {
  id: number;
  courseId: number;
  startDate: string;
  endDate: string;
  instructor: string;
  venue: string;
  targetDepartmentId: number;
  trainingDataStatusesId: number;
  maxParticipants: number;
  enrolledCount: number;
  note: string;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string;
  updatedby: string;
  trainingAttendanceTypeId: number;
  courseObj: ConfirmAttendanceCourseObj;
  categoryObj: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
  };
  requiredFor: string[];
  trainingAttendanceTypeObj: {
    id: number;
    name: string;
    description: string | null;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string | null;
    updatedby: string | null;
  };
}

export interface ConfirmAttendanceItem {
  confirmed: boolean;
  trainingEnrollmentId: number;
  trainingScheduleId: number;
  staffId: number;
  trainingSchedule: ConfirmAttendanceSchedule;
}

export interface ConfirmAttendanceResponse {
  message: string;
  responseData: ConfirmAttendanceItem[];
  error: string;
}

/** POST confirm attendance via JWT token (public, no auth) */
export const confirmAttendance = async (token: string): Promise<ConfirmAttendanceResponse> => {
  const baseURL = process.env.NEXT_PUBLIC_ENVIRONTMENT !== "production"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_API
    : process.env.NEXT_PUBLIC_PRODUCTION_API;
  const res = await axios.post(`${baseURL}/training/enrollment/confirmed`, { token });
  return res.data;
};

/** POST send confirmed-registration email (public, no auth) */
export const sendEmailConfirmedList = async (data: SendEmailListRequest): Promise<{ message: string; result?: SendEmailResult }> => {
  const baseURL = process.env.NEXT_PUBLIC_ENVIRONTMENT !== "production"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_API
    : process.env.NEXT_PUBLIC_PRODUCTION_API;
  const res = await axios.post(`${baseURL}/training/send-email-confirmed-list`, data);
  return {
    message: res.data?.message ?? "",
    result: res.data?.responseData,
  };
};

/** GET attendance types (public, no auth) */
export const getAttendanceTypesPublic = async (): Promise<{ id: number; code: string; name: string }[]> => {
  const baseURL = process.env.NEXT_PUBLIC_ENVIRONTMENT !== "production"
    ? process.env.NEXT_PUBLIC_DEVELOPMENT_API
    : process.env.NEXT_PUBLIC_PRODUCTION_API;
  const res = await axios.get(`${baseURL}/master/training/attendance-types`);
  return res.data?.responseData ?? [];
};
