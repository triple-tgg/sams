import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

/** Single certificate item returned by GET /training/certificate/{enrollmentId} */
export interface CertificateData {
  enrollmentId: number;
  trainingScheduleId: number;
  staffId: number;
  employeeName: string;
  employeeId: string;
  department: string;
  courseName: string;
  courseCode: string;
  certificateNo: string;
  completedDate: string;
  score: number;
}

/** GET /training/certificate/{enrollmentId} — full response */
export interface CertificateResponse {
  message: string;
  responseData: CertificateData[];
  error: string;
}

// ──────────────────────────────────────────────────────────────
// API Function
// ──────────────────────────────────────────────────────────────

/** GET /training/certificate/{enrollmentId} */
export const getCertificate = async (
  enrollmentId: number,
): Promise<CertificateResponse> => {
  const res = await axiosConfig.get(
    `/training/certificate/${enrollmentId}`,
  );
  return res.data;
};
