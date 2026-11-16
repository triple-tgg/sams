import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface AttendanceSheetStaff {
  no: number;
  /** Regular department (not printed; the sheet uses the AMO 145 department) */
  function: string;
  staffId: string;
  name: string;
  /** Regular position (not printed; the sheet uses the AMO 145 position) */
  position: string;
  departmentCode?: string | null;
  positionCode?: string | null;
  staffDepartmentCode?: string | null;
  staffDepartmentName?: string | null;
  staffDepartmentPositionCode?: string | null;
  staffDepartmentPositionName?: string | null;
  /** AMO 145 department — printed in the Function column */
  staffDepartmentAmo145Code?: string | null;
  staffDepartmentAmo145Name?: string | null;
  /** AMO 145 position — printed in the Position column */
  staffDepartmentPositionAmo145Code?: string | null;
  staffDepartmentPositionAmo145Name?: string | null;
}

export interface AttendanceSheetData {
  courseName: string;
  courseCode: string;
  courseObjective: string;
  trainingDate: string;
  trainingTime: string;
  totalHours: string;
  venue: string;
  instructorName: string;
  staffList: AttendanceSheetStaff[];
}

export interface AttendanceSheetResponse {
  message: string;
  responseData: AttendanceSheetData;
  error: string;
}

// ──────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────

/** POST print attendance sheet data */
export const getAttendanceSheet = async (scheduleId: number): Promise<AttendanceSheetData> => {
  const res = await axiosConfig.post("/training/print-attendance-sheet", { scheduleId });
  return res.data?.responseData;
};
