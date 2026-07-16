import axiosConfig from "@/lib/axios.config";

export interface TrainingEnrollmentActionStatus {
  id: number;
  code: string;
  name: string;
}

export interface TrainingEnrollmentActionStatusesResponse {
  message: string;
  responseData: TrainingEnrollmentActionStatus[];
  error: string;
}

/** GET /master/training-enrollment-action-statuses */
export const getTrainingEnrollmentActionStatuses = async (): Promise<TrainingEnrollmentActionStatusesResponse> => {
  const res = await axiosConfig.get("/master/training-enrollment-action-statuses");
  return res.data;
};
