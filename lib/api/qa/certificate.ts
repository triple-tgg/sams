import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface CertificateData {
  enrollmentId: number;
  trainingScheduleId: number;
  staffId: number;
  employeeName: string;
  employeeId: string;
  department: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  certificateNo: string;
  completedDate: string;
  score: number | null;
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

/** POST /training/certificate/list — fetch multiple certificates */
export const getCertificateList = async (
  enrollmentIds: number[],
): Promise<CertificateResponse> => {
  const res = await axiosConfig.post("/training/certificate/list", {
    enrollmentId: enrollmentIds,
  });
  return res.data;
};
