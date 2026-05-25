import axiosConfig from "@/lib/axios.config";

export interface SchedulerCalendarRequest {
  month: number | null;
  year: number;
}

export interface SchedulerCalendarResponseData {
  totalSessions: number;
  scheduled: number;
  upcoming: number;
  completed: number;
  full: number;
}

export interface SchedulerCalendarResponse {
  message: string;
  responseData: SchedulerCalendarResponseData;
  error: string;
}

export const getSchedulerDashboardCalendar = async (data: SchedulerCalendarRequest): Promise<SchedulerCalendarResponse> => {
  try {
    const res = await axiosConfig.post("/training/scheduler/dashboard/calendar", data);
    return res.data as SchedulerCalendarResponse;
  } catch (error: any) {
    console.error("Error fetching scheduler calendar dashboard:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch scheduler calendar dashboard");
  }
};

export interface SchedulerSessionData {
  id: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  startDate: string;
  endDate: string;
  instructorName: string;
  venueName: string;
  targetDepartmentId: number;
  targetDepartmentName: string;
  trainingDataStatusesId: number;
  statusName: string;
  maxParticipants: number;
  enrolledCount: number;
  note: string;
  createddate: string;
  createdby: string;
  updateddate: string;
  updatedby: string;
}

export interface SchedulerSessionsResponse {
  message: string;
  responseData: SchedulerSessionData[];
  error: string;
}

export const getSchedulerCalendar = async (data: SchedulerCalendarRequest): Promise<SchedulerSessionsResponse> => {
  try {
    const res = await axiosConfig.post("/training/scheduler/calendar", data);
    return res.data as SchedulerSessionsResponse;
  } catch (error: any) {
    console.error("Error fetching scheduler calendar:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch scheduler calendar");
  }
};
