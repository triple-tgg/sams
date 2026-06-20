import axiosConfig from "@/lib/axios.config";

export interface DashboardSummaryRequest {
  year: number;
}

export interface MandatoryCourseStatus {
  courseCode: string;
  validCount: number;
  warningCount: number;
  expiredCount: number;
}

export interface OverallCompliance {
  valid: number;
  warning: number;
  expired: number;
  compliancePercentage: number;
}

export interface DashboardSummaryResponseData {
  mandatoryCourseStatus: MandatoryCourseStatus[];
  overallCompliance: OverallCompliance;
}

export interface DashboardSummaryResponse {
  message: string;
  responseData: DashboardSummaryResponseData;
  error: string;
}

export const getDashboardSummary = async (data: DashboardSummaryRequest): Promise<DashboardSummaryResponse> => {
  try {
    const res = await axiosConfig.post("/training/dashboard/summary", data);
    return res.data as DashboardSummaryResponse;
  } catch (error: any) {
    console.error("Error fetching dashboard summary:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch dashboard summary");
  }
};

export interface DashboardCalendarRequest {
  year: number;
  courseId: number | string;
}

export interface CalendarStaffList {
  staffId: number;
  staffName: string;
  courseCode: string;
  expiryDate: string;
  status: string;
  daysLeft: number;
}

export interface CalendarMonth {
  month: number;
  monthName: string;
  totalExpiring: number;
  staffList: CalendarStaffList[];
}

export interface DashboardCalendarResponseData {
  summary: {
    expiredCount: number;
    criticalCount: number;
    warningCount: number;
  };
  months: CalendarMonth[];
}

export interface DashboardCalendarResponse {
  message: string;
  responseData: DashboardCalendarResponseData;
  error: string;
}

export const getDashboardCalendar = async (data: DashboardCalendarRequest): Promise<DashboardCalendarResponse> => {
  try {
    const res = await axiosConfig.post("/training/dashboard/calendar", data);
    return res.data as DashboardCalendarResponse;
  } catch (error: any) {
    console.error("Error fetching dashboard calendar:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch dashboard calendar");
  }
};

export interface CourseGroupBreakdownItem {
  categoryId: number;
  categoryName: string;
  validCount: number;
  warningCount: number;
  expiredCount: number;
  notTakenCount: number;
}

export interface CourseGroupsBreakdownResponse {
  message: string;
  responseData: CourseGroupBreakdownItem[];
  error: string;
}

export const getCourseGroupsBreakdown = async (year: number): Promise<CourseGroupsBreakdownResponse> => {
  try {
    const res = await axiosConfig.get(`/training/course-groups/breakdown/${year}`);
    return res.data as CourseGroupsBreakdownResponse;
  } catch (error: any) {
    console.error("Error fetching course groups breakdown:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch course groups breakdown");
  }
};

export interface TrainingMonitoringRequest {
  searchText: string;
  month: number;
  status: string;
}

export interface TrainingMonitoringStaffCourse {
  courseId: number;
  courseCode: string;
  courseName: string;
  issueDate: string | null;
  expiryDate: string | null;
  daysLeft: number | null;
  status: string;
}

export interface TrainingMonitoringStaff {
  staffId: number;
  employeeId: string;
  staffName: string;
  positionName: string;
  nextExpiry: string | null;
  courses: TrainingMonitoringStaffCourse[];
}

export interface TrainingMonitoringCategory {
  categoryId: number;
  categoryName: string;
  courses: TrainingMonitoringStaffCourse[];
  staffList: TrainingMonitoringStaff[];
}

export interface TrainingMonitoringSummary {
  totalStaff: number;
  totalExpired: number;
  totalWarning: number;
  totalValid: number;
}

export interface TrainingMonitoringResponseData {
  summary: TrainingMonitoringSummary;
  courseCategories: TrainingMonitoringCategory[];
}

export interface TrainingMonitoringResponse {
  message: string;
  responseData: TrainingMonitoringResponseData;
  error: string;
}

export const getTrainingMonitoring = async (data: TrainingMonitoringRequest): Promise<TrainingMonitoringResponse> => {
  try {
    const res = await axiosConfig.post("/training/training-monitoring", data);
    return res.data as TrainingMonitoringResponse;
  } catch (error: any) {
    console.error("Error fetching training monitoring:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch training monitoring");
  }
};
