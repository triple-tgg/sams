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

export interface SchedulerSessionDetail {
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
  note: string | null;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
  courseObj?: {
    id: number;
    courseCode: string;
    courseName: string;
    courseCategoryId: number;
    courseType: string;
    recurrenceIntervalYears: number | null;
    additionalNote: string | null;
    isdelete: boolean;
    createddate: string;
    createdby: string | null;
    updateddate: string | null;
    updatedby: string | null;
    aircraftTypeLicenseId: number | null;
    courseObjective: string | null;
  };
  categoryObj?: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    isdelete: boolean;
    createddate: string;
    createdby: string | null;
    updateddate: string | null;
    updatedby: string | null;
  };
  requiredFor?: string[];
}

export interface SchedulerSessionDetailResponse {
  message: string;
  responseData: SchedulerSessionDetail;
  error: string;
}

export const getSchedulerById = async (id: number): Promise<SchedulerSessionDetailResponse> => {
  try {
    const res = await axiosConfig.get(`/training/scheduler/byid/${id}`);
    return res.data as SchedulerSessionDetailResponse;
  } catch (error: any) {
    console.error(`Error fetching scheduler session ${id}:`, error);
    throw new Error(error.response?.data?.message || "Failed to fetch scheduler session");
  }
};

export interface SchedulerUpsertRequest {
  trainingScheduleId: number;
  courseId: number;
  startDate: string;
  endDate: string;
  instructor: string;
  venue: string;
  targetDepartmentId: number;
  trainingDataStatusesId: number;
  maxParticipants: number;
  note: string;
  userName: string;
}

export interface SchedulerUpsertResponse {
  message: string;
  responseData: { scheduleId: number }[];
  error: string;
}

export const upsertScheduler = async (reqData: SchedulerUpsertRequest): Promise<{ message: string, responseData: { scheduleId: number }[], error: string }> => {
  try {
    const res = await axiosConfig.post('/training/scheduler/upsert', reqData);
    return res.data;
  } catch (error: any) {
    console.error("Error upserting scheduler session:", error);
    throw new Error(error.response?.data?.message || "Failed to upsert scheduler session");
  }
};

export const deleteScheduler = async (reqData: { id: number, userName: string }): Promise<{ message: string, responseData: string[], error: string }> => {
  try {
    const res = await axiosConfig.post('/training/scheduler/delete', reqData);
    return res.data;
  } catch (error: any) {
    console.error("Error deleting scheduler session:", error);
    throw new Error(error.response?.data?.message || "Failed to delete scheduler session");
  }
};
