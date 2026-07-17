import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface EmailLogRequest {
  trainingScheduleId: number;
  staffId: number;
}

export interface EmailLogItem {
  id: number;
  trainingScheduleId: number;
  staffId: number;
  trainingEnrollmentId: number;
  emailTo: string | null;
  emailCc: string | null;
  emailFrom: string | null;
  subject: string;
  emailType: string;
  isSuccess: boolean;
  errorMessage: string | null;
  sentDate: string;
  createdby: string;
  createddate: string;
}

// ──────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────

/** POST fetch email log datalist for a specific schedule + staff */
export const getEmailLogDatalist = async (data: EmailLogRequest): Promise<EmailLogItem[]> => {
  const res = await axiosConfig.post("/training/email-log-datalist", data);
  return res.data?.responseData ?? [];
};

// ──────────────────────────────────────────────────────────────
// Preview Email
// ──────────────────────────────────────────────────────────────

export interface PreviewEmailRequest {
  scheduleId: number;
  staffId: number;
}

/** POST preview confirmed-session email HTML for a specific schedule + staff */
export const previewEmailConfirmed = async (data: PreviewEmailRequest): Promise<string> => {
  const res = await axiosConfig.post("/training/preview-email-person", data);
  return res.data?.responseData ?? "";
};

// ──────────────────────────────────────────────────────────────
// Preview Email Department (Manager Report)
// ──────────────────────────────────────────────────────────────

export interface PreviewEmailDepartmentRequest {
  scheduleId: number;
}

/** POST preview department manager report email HTML */
export const previewEmailDepartment = async (data: PreviewEmailDepartmentRequest): Promise<string> => {
  const res = await axiosConfig.post("/training/preview-email-department", data);
  return res.data?.responseData ?? "";
};

// ──────────────────────────────────────────────────────────────
// Send Email Department (Manager Report)
// ──────────────────────────────────────────────────────────────

export interface SendEmailDepartmentRequest {
  scheduleId: number;
  subject: string;
  emailFrom: string | null;
  emailCc: string | null;
}

export interface SendEmailDepartmentDetail {
  email: string | null;
  isSuccess: boolean;
  errorMessage: string;
}

export interface SendEmailDepartmentResponse {
  message: string;
  responseData: {
    totalSent: number;
    totalFailed: number;
    details: SendEmailDepartmentDetail[];
    trainingSchedule: any;
  };
  error: string;
}

/** POST send department manager report email */
export const sendEmailDepartment = async (data: SendEmailDepartmentRequest): Promise<SendEmailDepartmentResponse> => {
  const res = await axiosConfig.post("/training/send-email-department-list", data);
  return res.data;
};
