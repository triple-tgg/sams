import axiosConfig from "@/lib/axios.config";

export interface AttendanceType {
  id: number;
  code: string;
  name: string;
}

export interface AttendanceTypesResponse {
  message: string;
  responseData: AttendanceType[];
  error: string;
}

export const getAttendanceTypes = async (): Promise<AttendanceTypesResponse> => {
  const res = await axiosConfig.get("/master/training/attendance-types");
  return res.data;
};
