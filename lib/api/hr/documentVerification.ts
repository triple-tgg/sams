import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

/** POST /staffs/documents/verification-list — request body */
export interface VerificationListRequest {
  search: string;
  staffDocumentTypeId: number;
  staffDocumentStatusId: number;
  page: number;
  perPage: number;
}

/** Single document row returned by the API */
export interface VerificationDocument {
  documentId: number;
  staffId: number;
  title: string | null;
  employeeName: string | null;
  employeeId: string | null;
  staffDocumentTypeId: number | null;
  documentTypeName: string | null;
  fileName: string | null;
  filePath: string | null;
  uploadDate: string | null;
  staffDocumentStatusId: number | null;
  statusName: string | null;
  approvedBy: string | null;
  approvedDate: string | null;
  rejectedReason: string | null;
}

/** POST /staffs/documents/verification-list — full response */
export interface VerificationListResponse {
  message: string;
  responseData: VerificationDocument[];
  page: number;
  perPage: number;
  total: number;
  totalAll: number;
  error: string;
}

// ──────────────────────────────────────────────────────────────
// API Function
// ──────────────────────────────────────────────────────────────

/** POST /staffs/documents/verification-list */
export const getVerificationList = async (
  params: VerificationListRequest,
): Promise<VerificationListResponse> => {
  const res = await axiosConfig.post(
    "/staffs/documents/verification-list",
    params,
  );
  return res.data;
};

// ──────────────────────────────────────────────────────────────
// Approve / Reject
// ──────────────────────────────────────────────────────────────

/** POST /staffs/{staffId}/documents/approve — request body */
export interface ApproveDocumentRequest {
  documentId: number;
  staffDocumentStatusId: number;
  rejectedReason: string | null; // null for approve, string for reject
}

/** POST /staffs/{staffId}/documents/approve — response */
export interface ApproveDocumentResponse {
  message: string;
  responseData: string;
  error: string;
}

/** POST /staffs/{staffId}/documents/approve */
export const approveDocument = async (
  staffId: number,
  data: ApproveDocumentRequest,
): Promise<ApproveDocumentResponse> => {
  const res = await axiosConfig.post(
    `/staffs/${staffId}/documents/approve`,
    data,
  );
  return res.data;
};
