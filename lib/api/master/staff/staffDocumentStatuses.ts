import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface StaffDocumentStatus {
  id: number;
  code: string;
  name: string;
}

export interface StaffDocumentStatusesResponse {
  message: string;
  responseData: StaffDocumentStatus[];
  error: string;
}

// ──────────────────────────────────────────────────────────────
// API Function
// ──────────────────────────────────────────────────────────────

/** GET /master/staff-document-statuses */
export const getStaffDocumentStatuses = async (): Promise<StaffDocumentStatusesResponse> => {
  const res = await axiosConfig.get("/master/staff-document-statuses");
  return res.data;
};
