import axiosConfig from "@/lib/axios.config";

export interface TrainingDataStatus {
  id: number;
  code: string;
  name: string;
}

export interface TrainingDataStatusesResponse {
  message: string;
  responseData: TrainingDataStatus[];
  error: string;
}

export const getTrainingDataStatuses = async (): Promise<TrainingDataStatusesResponse> => {
  const res = await axiosConfig.get("/master/training/datastatuses");
  return res.data;
};
