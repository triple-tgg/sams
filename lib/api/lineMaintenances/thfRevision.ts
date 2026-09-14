import axiosConfig from "@/lib/axios.config";

export interface RequestRevisionPayload {
  category: "Manpower" | "Parts & Tools" | "Fluid / Servicing" | "Attachments" | "General" | string;
  reason: string;
  requestedBy: string;
}

export interface RequestUnlockPayload {
  reason: string;
  requestedBy: string;
}

export interface ReviewUnlockPayload {
  action: "APPROVE" | "REJECT";
  reviewedBy: string;
  comment?: string;
}

export interface MasterStatusItem {
  id: number;
  code: string;
  name: string;
  color?: string;
  description?: string;
  sortOrder?: number;
  isdelete?: boolean;
}

/**
 * Request revision on a THF (from Accounting)
 */
export const requestRevisionApi = async (
  lineMaintenanceId: number | string,
  payload: RequestRevisionPayload
) => {
  const response = await axiosConfig.post(
    `/lineMaintenances/${lineMaintenanceId}/request-revision`,
    payload
  );
  return response.data;
};

/**
 * Request unlock to edit a submitted/mapped THF (from Engineer)
 */
export const requestUnlockApi = async (
  lineMaintenanceId: number | string,
  payload: RequestUnlockPayload
) => {
  const response = await axiosConfig.post(
    `/lineMaintenances/${lineMaintenanceId}/request-unlock`,
    payload
  );
  return response.data;
};

/**
 * Review unlock request (from Accounting)
 */
export const reviewUnlockApi = async (
  lineMaintenanceId: number | string,
  payload: ReviewUnlockPayload
) => {
  const response = await axiosConfig.post(
    `/lineMaintenances/${lineMaintenanceId}/review-unlock`,
    payload
  );
  return response.data;
};

/**
 * Fetch Mapping Statuses master data
 */
export const getMappingStatusesApi = async (): Promise<MasterStatusItem[]> => {
  const response = await axiosConfig.get("/master/MappingStatuses");
  return response.data?.responseData || [];
};

/**
 * Fetch THF States master data
 */
export const getThfStatesApi = async (): Promise<MasterStatusItem[]> => {
  const response = await axiosConfig.get("/master/ThfStates");
  return response.data?.responseData || [];
};
