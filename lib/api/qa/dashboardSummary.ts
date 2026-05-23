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
    throw new Error(error.response?.data?.message || "Failed to fetch dashboard summary");
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
    throw new Error(error.response?.data?.message || "Failed to fetch dashboard calendar");
  }
};
