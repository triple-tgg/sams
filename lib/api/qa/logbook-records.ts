import axiosConfig from "@/lib/axios.config";

// ─── Request ────────────────────────────────────────────────────────────────

export interface LogbookRecordsListRequest {
  staffId?: number | null;
  startDate?: string | null;       // "2023-11-01"
  endDate?: string | null;         // "2026-11-30"
  similarTechnology?: string | null;
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
  const payload = {
    staffId: data.staffId ? Number(data.staffId) : null,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    similarTechnology: data.similarTechnology ?? null,
    page: data.page ?? 1,
    perPage: data.perPage ?? 20,
  };
  const res = await axiosConfig.post(
    "/staffs/maintenance-experiences/logbook-records/list",
    payload
  );
  return res.data;
};

/**
 * Every logbook record that matches the filter, fetched page by page (for printed forms,
 * which must not stop at one page). Stops at `maxRecords` as a safety limit.
 */
export const getAllLogbookRecords = async (
  filter: Omit<LogbookRecordsListRequest, "page" | "perPage">,
  { perPage = 500, maxRecords = 10000 }: { perPage?: number; maxRecords?: number } = {}
): Promise<LogbookRecordItem[]> => {
  const all: LogbookRecordItem[] = [];
  for (let page = 1; ; page += 1) {
    const res = await getLogbookRecordsList({ ...filter, page, perPage });
    const rows = res.responseData ?? [];
    all.push(...rows);
    const total = res.total || res.totalAll || 0;
    if (rows.length < perPage || all.length >= total || all.length >= maxRecords) break;
  }
  return all.slice(0, maxRecords);
};
