import axiosConfig from "@/lib/axios.config";

// ── Nested Object Interfaces ──

export interface StaffTypeObj {
    id: number;
    code: string;
    name: string;
    description: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

export interface PositionObj {
    id: number;
    name: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string | null;
    updatedby: string | null;
}

export interface DepartmentObj {
    id: number;
    name: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string | null;
    updatedby: string | null;
}

// ── Staff Management Item ──

export interface QAStaffItem {
    id: number;
    code: string;
    title: string;
    name: string;
    fullNameEn: string | null;
    dateOfBirth: string | null;
    placeOfBirth: string | null;
    nationality: string | null;
    idCardNo: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    employeeId: string | null;
    startDate: string | null;
    positionObj: PositionObj | null;
    departmentObj: DepartmentObj | null;
    staffstypeObj: StaffTypeObj | null;
    jobTitle: string | null;
    profileImagePath: string | null;
    isActive: boolean;
    educations: unknown[] | null;
    workExperiences: unknown[] | null;
    staffDocumentList: unknown[];
    staffAircraftLicenseList: unknown[];
    staffAmelLicenseList: unknown[];
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

// ── Request / Response ──

export interface QAStaffListRequest {
    name: string;
    employeeId: string;
    positionId: number;
    departmentId: number;
    staffstypeId: number;
    page: number;
    perPage: number;
}

export interface QAStaffListResponse {
    message: string;
    responseData: QAStaffItem[];
    page: number;
    perPage: number;
    total: number;
    totalAll: number;
    error: string;
}

// ── API Function ──

/**
 * Get QA staff management list data
 * POST /master/staff-management/listdata
 */
export const getQAStaffList = async (
    params: QAStaffListRequest
): Promise<QAStaffListResponse> => {
    try {
        const res = await axiosConfig.post("/master/staff-management/listdata", params);
        return res.data as QAStaffListResponse;
    } catch (error: any) {
        console.error("Error fetching QA staff list:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to fetch staff list"
        );
    }
};

// ── Upsert (Create/Update) Staff ──

export interface UpsertEducation {
    id: number;
    degree: string;
    institution: string;
    fieldOfStudy: string;
    year: number;
}

export interface UpsertWorkExperience {
    id: number;
    jobTitle: string;
    company: string;
    periodFrom: string;
    periodTo: string;
    description: string;
}

export interface UpsertStaffDocument {
    id: number;
    fileName: string;
    filePath: string;
    staffDocumentStatusId: number;
    staffDocumentTypeId: number;
}

export interface UpsertAircraftLicense {
    id: number;
    aircraftTypeId: string | number;
}

export interface UpsertAmelLicense {
    id: number;
    licenseNumber: string;
    categoryId: number;
    issuedDate: string;
    expiryDate: string;
    limitations: string;
    aircraftRatings: string;
    attachmentFilePath: string;
    attachmentFileName: string;
}

export interface UpsertStaffRequest {
    staffId: number; // 0 for new, existing id for update
    title: string;
    fullNameTh: string;
    fullNameEn: string;
    dateOfBirth: string;
    placeOfBirth: string;
    nationality: string;
    idCardNo: string;
    phone: string;
    email: string;
    address: string;
    employeeId: string;
    startDate: string;
    positionId: number;
    departmentId: number;
    staffstypeid: number;
    jobTitle: string;
    profileImagePath: string;
    educations: UpsertEducation[];
    workExperiences: UpsertWorkExperience[];
    staffDocumentList: UpsertStaffDocument[];
    staffAircraftLicenseList: UpsertAircraftLicense[];
    staffAmelLicenseList: UpsertAmelLicense[];
}

export interface UpsertStaffResponse {
    message: string;
    responseData: { staffId: number }[];
    error: string;
}

/**
 * Create or update a staff member
 * POST /master/staff-management/upsert
 */
export const upsertStaff = async (
    data: UpsertStaffRequest
): Promise<UpsertStaffResponse> => {
    try {
        const res = await axiosConfig.post("/master/staff-management/upsert", data);
        return res.data as UpsertStaffResponse;
    } catch (error: any) {
        console.error("Error upserting staff:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to save staff"
        );
    }
};

// ── Upload File ──

export interface UploadFileRequest {
    FileBase64: string;
    FileType: string;
    ExtensionFile: string;
    FileName: string;
}

export interface UploadFileResponseItem {
    filePath: string;
    fileName: string;
    fileType: string;
}

export interface UploadFileResponse {
    message: string;
    responseData: UploadFileResponseItem[];
    error: string | null;
}

/**
 * Upload a staff profile file
 * POST /master/staff-management/uploadfile
 */
export const uploadStaffFile = async (
    data: UploadFileRequest
): Promise<UploadFileResponse> => {
    try {
        const res = await axiosConfig.post("/master/staff-management/uploadfile", data);
        return res.data as UploadFileResponse;
    } catch (error: any) {
        console.error("Error uploading file:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to upload file"
        );
    }
};

// ── Get Staff By ID ──

export interface StaffEducation {
    id: number;
    staffId: number;
    degree: string;
    institution: string;
    fieldOfStudy: string;
    year: number;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

export interface StaffWorkExperience {
    id: number;
    staffId: number;
    jobTitle: string;
    company: string;
    periodFrom: string | null;
    periodTo: string | null;
    description: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

export interface StaffDocumentItem {
    id: number;
    staffId: number;
    documentType: string;
    staffDocumentTypeId: number | null;
    fileName: string;
    filePath: string;
    uploadDate: string;
    staffDocumentStatusId: number | null;
    rejectedReason: string | null;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

export interface StaffAircraftLicenseItem {
    id: number;
    staffId: number;
    aircraftTypeId?: string | number; // TODO: Migrate to string groupId based on new API spec
    aircraftTypeLicensId: number;
    aircraftTypeLicensObj?: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        isdelete: boolean;
        createddate: string;
        createdby: string;
        updateddate: string | null;
        updatedby: string | null;
    };
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

export interface StaffAmelLicenseItem {
    id: number;
    staffId: number;
    licenseNumber: string;
    categoryId: number;
    issuedDate: string;
    expiryDate: string;
    limitations: string;
    aircraftRatings: string;
    attachmentFilePath: string;
    attachmentFileName: string;
    isdelete: boolean;
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

export interface StaffByIdData {
    id: number;
    code: string;
    title: string;
    name: string;
    fullNameEn: string | null;
    dateOfBirth: string | null;
    placeOfBirth: string | null;
    nationality: string | null;
    idCardNo: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    employeeId: string | null;
    startDate: string | null;
    positionObj: PositionObj | null;
    departmentObj: DepartmentObj | null;
    staffstypeObj: StaffTypeObj | null;
    jobTitle: string | null;
    profileImagePath: string | null;
    isActive: boolean;
    educations: StaffEducation[] | null;
    workExperiences: StaffWorkExperience[] | null;
    staffDocumentList: StaffDocumentItem[];
    staffAircraftLicenseList: StaffAircraftLicenseItem[];
    staffAmelLicenseList: StaffAmelLicenseItem[];
    createddate: string;
    createdby: string;
    updateddate: string;
    updatedby: string;
}

export interface StaffByIdResponse {
    message: string;
    responseData: StaffByIdData;
    error: string;
}

/**
 * Build a complete staff upsert payload from the by-ID response. Staff upsert is
 * a full aggregate write, so callers changing one field must preserve every
 * nested collection instead of sending a partial object.
 */
export const buildStaffUpsertRequest = (
    data: StaffByIdData,
    overrides: Partial<UpsertStaffRequest> = {}
): UpsertStaffRequest => ({
    staffId: data.id,
    title: data.title || "",
    fullNameTh: data.name || "",
    fullNameEn: data.fullNameEn || "",
    dateOfBirth: data.dateOfBirth || "",
    placeOfBirth: data.placeOfBirth || "",
    nationality: data.nationality || "",
    idCardNo: data.idCardNo || "",
    phone: data.phone || "",
    email: data.email || "",
    address: data.address || "",
    employeeId: data.employeeId || "",
    startDate: data.startDate || "",
    positionId: data.positionObj?.id || 0,
    departmentId: data.departmentObj?.id || 0,
    staffstypeid: data.staffstypeObj?.id || 0,
    jobTitle: data.jobTitle || "",
    profileImagePath: data.profileImagePath || "",
    educations: (data.educations || []) as UpsertEducation[],
    workExperiences: (data.workExperiences || []) as UpsertWorkExperience[],
    staffDocumentList: (data.staffDocumentList || [])
        .filter((document) => !document.isdelete)
        .map((document) => ({
            id: document.id,
            staffDocumentTypeId: document.staffDocumentTypeId || 0,
            fileName: document.fileName,
            filePath: document.filePath,
            staffDocumentStatusId: document.staffDocumentStatusId ?? 1,
        })),
    staffAircraftLicenseList: (data.staffAircraftLicenseList || [])
        .filter((license) => !license.isdelete)
        .map((license) => ({
            id: license.id,
            aircraftTypeId: Number(license.aircraftTypeLicensId ?? license.aircraftTypeId ?? 0),
        })),
    staffAmelLicenseList: (data.staffAmelLicenseList || [])
        .filter((license) => !license.isdelete)
        .map((license) => ({
            id: license.id,
            licenseNumber: license.licenseNumber,
            categoryId: license.categoryId,
            issuedDate: license.issuedDate || "",
            expiryDate: license.expiryDate || "",
            limitations: license.limitations || "",
            aircraftRatings: license.aircraftRatings || "",
            attachmentFilePath: license.attachmentFilePath || "",
            attachmentFileName: license.attachmentFileName || "",
        })),
    ...overrides,
});

/**
 * Get staff details by ID
 * GET /master/staff-management/byid/{staffId}
 */
export const getStaffById = async (
    staffId: number
): Promise<StaffByIdResponse> => {
    try {
        const res = await axiosConfig.get(`/master/staff-management/byid/${staffId}`);
        return res.data as StaffByIdResponse;
    } catch (error: any) {
        console.error("Error fetching staff by ID:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to fetch staff details"
        );
    }
};

// ── Training Dashboard ──

export interface TrainingDashboardCurrentTraining {
    id: number;
    courseName: string;
    dateFrom: string;
    dateTo: string;
    validUntil: string;
    providedBy: string;
    status: string;
}

export interface TrainingDashboardPreviousTraining {
    id: number;
    courseName: string;
    academyName: string;
    dateFrom: string;
    dateTo: string;
}

export interface TrainingDashboardNeedsMatrixCourse {
    courseId: number;
    name: string;
    status: string;
    completed: boolean;
}

export interface TrainingDashboardNeedsMatrix {
    totalRequired: number;
    validCount: number;
    completionPercentage: number;
    courses: TrainingDashboardNeedsMatrixCourse[];
}

export interface TrainingDashboardStats {
    totalCourses: number;
    expired: number;
    permanent: number;
    expiringSoon: number;
}

export interface TrainingDashboardResponseData {
    summary: TrainingDashboardStats;
    records: TrainingDashboardCurrentTraining[];
    histories: TrainingDashboardPreviousTraining[];
    needsMatrix: TrainingDashboardNeedsMatrix;
}

export interface TrainingDashboardResponse {
    message: string;
    responseData: TrainingDashboardResponseData;
    error: string;
}

/**
 * Get staff training dashboard
 * GET /staffs/{staffId}/trainings/dashboard
 */
export const getStaffTrainingDashboard = async (
    staffId: number
): Promise<TrainingDashboardResponse> => {
    try {
        const res = await axiosConfig.get(`/staffs/${staffId}/trainings/dashboard`);
        return res.data as TrainingDashboardResponse;
    } catch (error: any) {
        console.error("Error fetching staff training dashboard:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to fetch training dashboard"
        );
    }
};

export interface WorkExperiencePreviewResponse {
    message: string;
    responseData: {
        profile: StaffByIdData;
        training: TrainingDashboardResponseData;
    };
    error: string;
}

/**
 * Get work experience preview
 * GET /staffs/{staffId}/work-experience-preview
 */
export const getWorkExperiencePreview = async (
    staffId: number
): Promise<WorkExperiencePreviewResponse> => {
    try {
        const res = await axiosConfig.get(`/staffs/${staffId}/work-experience-preview`);
        return res.data as WorkExperiencePreviewResponse;
    } catch (error: any) {
        console.error("Error fetching work experience preview:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to fetch work experience preview"
        );
    }
};

// ── Training History CRUD ──

export interface UpsertTrainingHistoryRequest {
    courseName: string;
    academyName: string;
    dateFrom: string;
    dateTo: string;
}

export interface TrainingHistoryMutationResponse {
    message: string;
    responseData: any;
    error: string;
}

/**
 * Create a new training history
 * POST /staffs/{staffId}/trainings/histories
 */
export const createTrainingHistory = async (
    staffId: number,
    data: UpsertTrainingHistoryRequest
): Promise<TrainingHistoryMutationResponse> => {
    try {
        const res = await axiosConfig.post(`/staffs/${staffId}/trainings/histories`, data);
        return res.data as TrainingHistoryMutationResponse;
    } catch (error: any) {
        console.error("Error creating training history:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to create training history"
        );
    }
};

/**
 * Update an existing training history
 * PUT /staffs/{staffId}/trainings/histories/{historyId}
 */
export const updateTrainingHistory = async (
    staffId: number,
    historyId: number,
    data: UpsertTrainingHistoryRequest
): Promise<TrainingHistoryMutationResponse> => {
    try {
        const res = await axiosConfig.put(`/staffs/${staffId}/trainings/histories/${historyId}`, data);
        return res.data as TrainingHistoryMutationResponse;
    } catch (error: any) {
        console.error("Error updating training history:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to update training history"
        );
    }
};

/**
 * Delete a training history
 * DEL /staffs/{staffId}/trainings/histories/{historyId}
 */
export const deleteTrainingHistory = async (
    staffId: number,
    historyId: number
): Promise<TrainingHistoryMutationResponse> => {
    try {
        const res = await axiosConfig.delete(`/staffs/${staffId}/trainings/histories/${historyId}`);
        return res.data as TrainingHistoryMutationResponse;
    } catch (error: any) {
        console.error("Error deleting training history:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to delete training history"
        );
    }
};

// ── Logbook APIs ──

export interface LogbookSummaryData {
    totalEntries: number;
    totalHours: number;
    pendingSignOff: number;
}

export interface LogbookSummaryResponse {
    message: string;
    responseData: LogbookSummaryData;
    error: string;
}

/**
 * Get logbook summary
 * GET /staffs/{staffId}/logbooks/summary
 */
export const getLogbookSummary = async (
    staffId: number
): Promise<LogbookSummaryResponse> => {
    try {
        const res = await axiosConfig.get(`/staffs/${staffId}/logbooks/summary`);
        return res.data as LogbookSummaryResponse;
    } catch (error: any) {
        console.error("Error fetching logbook summary:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to fetch logbook summary"
        );
    }
};

export interface LogbookRecordData {
    id: number;
    date: string;
    aircraft: string;
    regNo: string;
    taskType: string;
    thfNo: string;
    description: string;
    hours: number;
    signOffStatus: string;
}

export interface LogbookRecordsRequest {
    formDate: string;
    aircraftTypeId: number | null;
    thfNo: string;
    page: number;
    perPage: number;
}

export interface LogbookRecordsResponse {
    message: string;
    responseData: LogbookRecordData[];
    total?: number;
    page?: number;
    perPage?: number;
    error: string;
}

/**
 * Get logbook records
 * POST /staffs/{staffId}/logbooks/maintenance
 */
export const getLogbookRecords = async (
    staffId: number,
    params: LogbookRecordsRequest
): Promise<LogbookRecordsResponse> => {
    try {
        const res = await axiosConfig.post(`/staffs/${staffId}/logbooks/maintenance`, params);
        return res.data as LogbookRecordsResponse;
    } catch (error: any) {
        console.error("Error fetching logbook records:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to fetch logbook records"
        );
    }
};

export interface LogbookPendingDefectItem {
    defectId: string;
    ataCode: string;
    description: string;
    status: string;
}

export interface LogbookPendingRecordData {
    logbookId: number;
    date: string;
    aircraft: string;
    regNo: string;
    taskType: string;
    thfNo: string;
    defectProgress: string;
    lineMaintenanceId?: number;
    defectItems: LogbookPendingDefectItem[];
}

export interface LogbookPendingResponse {
    message: string;
    responseData: LogbookPendingRecordData[];
    error: string;
}

/**
 * Get logbook pending sign-off records
 * GET /staffs/{staffId}/logbooks/pending
 */
export const getLogbookPending = async (
    staffId: number
): Promise<LogbookPendingResponse> => {
    try {
        const res = await axiosConfig.get(`/staffs/${staffId}/logbooks/pending`);
        return res.data as LogbookPendingResponse;
    } catch (error: any) {
        console.error("Error fetching logbook pending records:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to fetch logbook pending records"
        );
    }
};

export interface UpsertLogbookAttachment {
    id: number;
    fileName: string;
    filePath: string;
    fileType: string;
}

export interface UpsertLogbookRecordRequest {
    id: number;
    lineMaintenanceId: number;
    additionalDefectId: string;
    licenseCategoryId: number;
    dateToPerformTask: string;
    stationId: number;
    aircraftTypeId: number;
    aircraftRegistration: string;
    privilegeId: number;
    ataChapterId: number;
    flagTransitCheck: boolean;
    flagDailyCheck: boolean;
    flagAcheck: boolean;
    flagEngineChange: boolean;
    flagApuchange: boolean;
    flagEngineBorescope: boolean;
    flagCrs: boolean;
    flagInspinspection: boolean;
    flagTstroubleshooting: boolean;
    flagRemovalInstallation: boolean;
    flagDefectRectification: boolean;
    flagTraining: boolean;
    flagSghservicing: boolean;
    flagFotfunctionalOperational: boolean;
    flagReprepair: boolean;
    flagSupervising: boolean;
    flagBorescopeInspection: boolean;
    flagOther: boolean;
    typeOfActivity: string;
    maintenanceReference: string;
    performedDurationHrs: number;
    authorizedStampNo: string;
    description: string;
    statusId: number;
    attachments: UpsertLogbookAttachment[] | null;
}

export interface UpsertLogbookRecordResponse {
    message: string;
    responseData: string;
    error: string;
}

/**
 * Upsert logbook record
 * POST /staffs/{staffId}/logbooks/record/upsert
 */
export const upsertLogbookRecord = async (
    staffId: number,
    data: UpsertLogbookRecordRequest
): Promise<UpsertLogbookRecordResponse> => {
    try {
        const res = await axiosConfig.post(`/staffs/${staffId}/logbooks/record/upsert`, data);
        return res.data as UpsertLogbookRecordResponse;
    } catch (error: any) {
        console.error("Error upserting logbook record:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to upsert logbook record"
        );
    }
};

// ── Print Preview ──

export interface StaffPrintPreviewResponse {
    message: string;
    responseData: {
        profile: QAStaffItem;
        training: {
            summary: {
                totalCourses: number;
                expired: number;
                permanent: number;
                expiringSoon: number;
            };
            records: any[];
            needsMatrix: any;
            histories: any[];
        };
    };
    error: string;
}

/**
 * Get Staff Print Preview
 * GET /staffs/{staffId}/print-preview
 */
export const getStaffPrintPreview = async (staffId: number): Promise<StaffPrintPreviewResponse> => {
    try {
        const res = await axiosConfig.get(`/staffs/${staffId}/print-preview`);
        return res.data as StaffPrintPreviewResponse;
    } catch (error: any) {
        console.error("Error fetching staff print preview:", error);
        throw new Error(
            error.response?.data?.error || error.response?.data?.message || "Failed to fetch staff print preview"
        );
    }
};
