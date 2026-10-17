import axiosConfig from "@/lib/axios.config";

export interface AmelCertifyingStaffRequest {
    search: string;
    station: string;
    aircraftType: string;
    page: number;
    pageSize: number;
}

export interface AmelFixedColumn {
    id: string;
    label: string;
    width: number;
    sticky: boolean;
}

export interface AmelEngineColumn {
    id: string;
    label: string;
    code: string;
    engine: string;
    width: number;
}

export interface AmelGroupColumn {
    id: string;
    aircraft: string;
    columns: AmelEngineColumn[];
}

export interface AmelColumns {
    fixedColumns: AmelFixedColumn[];
    groups: AmelGroupColumn[];
}

export interface AmelQualification {
    qualified: boolean;
    licenceNo: string | null;
    issueDate: string | null;
    expiryDate: string | null;
}

export interface AmelStaffRow {
    id: string;
    staffNo: string;
    name: string;
    position: string;
    aircraftType: string;
    station: string | null;
    qualifications: Record<string, AmelQualification>;
}

export interface AmelPagination {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
}

export interface AmelCertifyingStaffData {
    columns: AmelColumns;
    rows: AmelStaffRow[];
    pagination: AmelPagination;
}

export interface AmelCertifyingStaffResponse {
    message: string;
    responseData: AmelCertifyingStaffData;
    error?: string;
}

export const getAmelCertifyingStaff = async (
    data: AmelCertifyingStaffRequest
): Promise<AmelCertifyingStaffResponse> => {
    const res = await axiosConfig.post<AmelCertifyingStaffResponse>(
        "/roster/certifying-staff/amel",
        data
    );
    return res.data;
};

// ── Aircraft Licence Tab Types & API ──

export interface AircraftLicenceRequest {
    search: string;
    station: string;
    aircraftType: string;
    page: number;
    pageSize: number;
}

export interface AircraftLicenceSubtype {
    id: string;
    label: string;
    engine: string;
    width: number;
}

export interface AircraftLicenceAircraftType {
    typeId: string;
    typeName: string;
    subtypes: AircraftLicenceSubtype[];
}

export interface AircraftLicenceAirline {
    airlineId: string;
    airlineName: string;
    airlineCode: string;
    aircraftTypes: AircraftLicenceAircraftType[];
}

export interface AircraftLicenceColumns {
    fixedColumns: AmelFixedColumn[];
    airlines: AircraftLicenceAirline[];
}

export interface AircraftLicenceAuth {
    status: string;
    authNo: string | null;
    expiryDate: string | null;
}

export interface AircraftLicenceStaffRow {
    id: string;
    staffNo: string;
    name: string;
    position: string;
    aircraftType: string;
    station: string | null;
    authorizations: Record<string, Record<string, AircraftLicenceAuth>>;
}

export interface AircraftLicencePagination {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
}

export interface AircraftLicenceStaffData {
    columns: AircraftLicenceColumns;
    rows: AircraftLicenceStaffRow[];
    pagination: AircraftLicencePagination;
}

export interface AircraftLicenceStaffResponse {
    message: string;
    responseData: AircraftLicenceStaffData;
    error?: string;
}

export const getAircraftLicenceCertifyingStaff = async (
    data: AircraftLicenceRequest
): Promise<AircraftLicenceStaffResponse> => {
    const res = await axiosConfig.post<AircraftLicenceStaffResponse>(
        "/roster/certifying-staff/aircraft-licence",
        data
    );
    return res.data;
};

export const getAircraftLicenceStaff = getAircraftLicenceCertifyingStaff;


