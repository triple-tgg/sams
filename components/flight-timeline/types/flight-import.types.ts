// Types for Excel import feature with preview, validation, and error handling

/**
 * Represents a single parsed Excel sheet
 */
export interface ParsedSheet {
    name: string;
    headers: string[];
    rows: Record<string, any>[];
    sheetDate?: string | null; // Parsed date from sheet name (YYYY-MM-DD format)
}

/**
 * Validation error for a specific cell
 */
export interface ValidationError {
    row: number;
    column: string;
    message: string;
}

/**
 * Row with validation result
 */
export interface ValidatedRow {
    originalIndex: number;
    data: Record<string, any>;
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[]; // Master data mismatch warnings (amber)
}

/**
 * Flight data structure matching API requirements
 */
export interface FlightImportData {
    id: number;
    airlinesCode: string;
    stationsCode: string;
    acReg: string;
    acTypeCode: string;
    arrivalFlightNo: string;
    arrivalDate: string;
    arrivalStaTime: string;
    arrivalAtaTime: string;
    departureFlightNo: string;
    departureDate: string;
    departureStdTime: string;
    departureAtdTime: string;
    bayNo: string;
    statusCode: string;
    note: string;
    csStaffIds: number[];  // CS staff IDs
    mechStaffIds: number[]; // MECH staff IDs
    checkStatusId: number;  // CHECK column - MaintenanceStatus ID
}

/**
 * Import state management
 */
export interface ImportState {
    isModalOpen: boolean;
    isParsing: boolean;
    isValidating: boolean;
    isUploading: boolean;
    sheets: ParsedSheet[];
    activeSheetIndex: number;
    validatedRows: ValidatedRow[];
    hasValidated: boolean;
}

/**
 * Excel column to API field mapping
 */
export const EXCEL_COLUMN_MAPPING: Record<string, keyof FlightImportData> = {
    'Airlines Code': 'airlinesCode',
    'airlinesCode': 'airlinesCode',
    'Station Code': 'stationsCode',
    'stationsCode': 'stationsCode',
    'A/C Reg': 'acReg',
    'acReg': 'acReg',
    'A/C Type': 'acTypeCode',
    'acType': 'acTypeCode',
    'acTypeCode': 'acTypeCode',
    'Arrival Flight No': 'arrivalFlightNo',
    'arrivalFlightNo': 'arrivalFlightNo',
    'Arrival Date': 'arrivalDate',
    'arrivalDate': 'arrivalDate',
    'Arrival STA (UTC)': 'arrivalStaTime',
    'arrivalStaTime': 'arrivalStaTime',
    'Arrival ATA (UTC)': 'arrivalAtaTime',
    'arrivalAtaTime': 'arrivalAtaTime',
    'Departure Flight No': 'departureFlightNo',
    'departureFlightNo': 'departureFlightNo',
    'Departure Date': 'departureDate',
    'departureDate': 'departureDate',
    'Departure STA (UTC)': 'departureStdTime',
    'departureStdTime': 'departureStdTime',
    'Departure ATA (UTC)': 'departureAtdTime',
    'departureAtdTime': 'departureAtdTime',
    'Bay': 'bayNo',
    'bayNo': 'bayNo',
    'Status': 'statusCode',
    'statusCode': 'statusCode',
    'Note': 'note',
    'note': 'note',
};

/**
 * API validate request item
 */
export interface FlightValidateRequestItem {
    rowId: number;
    airlinesId: number;
    acTypeId: number;
    acReg: string;
    arrivalFlightNo: string;
    departureFlightNo: string;
    routeFrom: string;
    routeTo: string;
    arrivalStaDate: string;
    departureStdDate: string;
    etaDate: string;
    bayNo: string;
    csIdList: number[];
    mechIdList: number[];
    checkStatusId: number;
    note: string;
    userName?: string;
}

/**
 * API validate response
 */
export interface FlightValidateResponse {
    message: string;
    responseData: {
        flagPass: boolean;
        validateFilghtList: {
            rowId: number;
            arrivalFlightNo: string;
            statusText: string;
        }[];
    };
    error: string;
}
