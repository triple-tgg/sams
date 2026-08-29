import axiosConfig from "@/lib/axios.config";

// ─── Request ────────────────────────────────────────────────────────────────

export interface LogbookRecordsListRequest {
  staffId?: number;
  startDate?: string;       // "2026-08-29"
  endDate?: string;         // "2026-08-29"
  similarTechnology?: string;
  page?: number;
  perPage?: number;
}

// ─── Response ───────────────────────────────────────────────────────────────

export interface AircraftEngineCombinationObj {
  id: number;
  familyCode: string;
  series: string;
  engineCode: string;
  similarTechnology: string;
  validFrom: string;
  validTo: string;
  updatedBy: string;
  updatedAtUtc: string;
}

export interface LogbookRecordItem {
  id: number;
  nameSurname: string;
  employeeId: string;
  licenseCategory: string;
  dateToPerformTask: string;
  location: string;
  aircraftType: string;
  aircraftEngineCombinationObj: AircraftEngineCombinationObj | null;
  aircraftRegistration: string;
  privilegedUsed: string;
  ataChapter: string;
  typeOfMaintenanceRating: string;
  typeOfTask: string;
  typeOfActivity: string;
  maintenanceReferences: string;
  fileAttachmentUrl: string;
  performedDuration: string;
  authorizedStampNo: string;
}

export interface LogbookRecordsListResponse {
  message: string;
  responseData: LogbookRecordItem[];
  page: number;
  perPage: number;
  total: number;
  totalAll: number;
  error: string;
}

// ─── API Function ───────────────────────────────────────────────────────────

export const getLogbookRecordsList = async (
  data: LogbookRecordsListRequest
): Promise<LogbookRecordsListResponse> => {
  const res = await axiosConfig.post(
    "/staffs/maintenance-experiences/logbook-records/list",
    data
  );
  return res.data;
};
