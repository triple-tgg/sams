import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface StaffDocumentType {
  id: number;
  code: string;
  name: string;
}

export interface StaffDocumentTypesResponse {
  message: string;
  responseData: StaffDocumentType[];
  error: string;
}

// ──────────────────────────────────────────────────────────────
// API Function
// ──────────────────────────────────────────────────────────────

/** GET /master/staff-document-types */
export const getStaffDocumentTypes = async (): Promise<StaffDocumentTypesResponse> => {
  const res = await axiosConfig.get("/master/staff-document-types");
  return res.data;
};
