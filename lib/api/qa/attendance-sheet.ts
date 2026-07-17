import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface AttendanceSheetStaff {
  no: number;
  function: string;
  staffId: string;
  name: string;
  position: string;
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
