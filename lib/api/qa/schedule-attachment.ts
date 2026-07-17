import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface ScheduleAttachmentUpsertRequest {
  id: number;
  trainingScheduleId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

export interface ScheduleAttachmentUpsertResponse {
  message: string;
  responseData: { attachmentId: number }[];
  error: string;
}

// ──────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────

/** POST upsert a schedule attachment record */
export const upsertScheduleAttachment = async (
  data: ScheduleAttachmentUpsertRequest
): Promise<ScheduleAttachmentUpsertResponse> => {
  const res = await axiosConfig.post("/training/schedule-attachment/upsert", data);
  return res.data;
};
