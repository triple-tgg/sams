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
    code: string;
    name: string;
}

export interface DepartmentObj {
    id: number;
    code: string;
    name: string;
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
            error.response?.data?.message || "Failed to fetch staff list"
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
    userName: string;
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
            error.response?.data?.message || "Failed to save staff"
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
            error.response?.data?.message || "Failed to upload file"
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
            error.response?.data?.message || "Failed to fetch staff details"
        );
    }
};
