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
    arrivalStaDate: string;      // UTC datetime "YYYY-MM-DD HH:mm"
    arrivalAtaDate: string;      // UTC datetime "YYYY-MM-DD HH:mm"
    departureFlightNo: string;
    departureStdDate: string;    // UTC datetime "YYYY-MM-DD HH:mm"
    departureAtdDate: string;    // UTC datetime "YYYY-MM-DD HH:mm"
    bayNo: string;
    statusCode: string;
    note: string;
    csStaffIds: number[];  // CS staff IDs
    mechStaffIds: number[]; // MECH staff IDs
    maintenanceStatusId?: number;  // CHECK column - MaintenanceStatus ID (optional)
    // Internal: intermediate fields for Excel mapping (date + time separate before combine)
    _arrivalDate?: string;
    _arrivalStaTime?: string;
    _arrivalAtaTime?: string;
    _departureDate?: string;
    _departureStdTime?: string;
    _departureAtdTime?: string;
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
/** Flight-status column shown in the import preview (right after CHECK). */
export const STATUS_COLUMN = 'STATUS';
/** Used when the Excel file has no Status column, or a Status cell is empty. */
export const DEFAULT_FLIGHT_STATUS = 'Normal';

/**
 * Normalise the flight-status column of a parsed sheet:
 * - Accepts "STATUS" / "Status" / "status" (any case) and renames it to STATUS.
 * - Adds the column when missing. Empty values default to "Normal".
 * - Places STATUS right after CHECK (or last when there is no CHECK column).
 */
export function withStatusColumn(headers: string[], rows: Record<string, any>[]) {
    const existing = headers.find((h) => String(h).trim().toLowerCase() === 'status');
    const otherHeaders = headers.filter((h) => h !== existing);
    const checkIndex = otherHeaders.findIndex((h) => String(h).trim().toUpperCase() === 'CHECK');
    const nextHeaders = [...otherHeaders];
    nextHeaders.splice(checkIndex >= 0 ? checkIndex + 1 : nextHeaders.length, 0, STATUS_COLUMN);

    const nextRows = rows.map((row) => {
        const next = { ...row };
        const raw = existing !== undefined ? row[existing] : '';
        if (existing !== undefined && existing !== STATUS_COLUMN) delete next[existing];
        next[STATUS_COLUMN] = String(raw ?? '').trim() || DEFAULT_FLIGHT_STATUS;
        return next;
    });

    return { headers: nextHeaders, rows: nextRows };
}

export const EXCEL_COLUMN_MAPPING: Record<string, string> = {
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
    'Arrival Date': '_arrivalDate',
    'arrivalDate': '_arrivalDate',
    'Arrival STA (UTC)': '_arrivalStaTime',
    'arrivalStaTime': '_arrivalStaTime',
    'Arrival ATA (UTC)': '_arrivalAtaTime',
    'arrivalAtaTime': '_arrivalAtaTime',
    'Departure Flight No': 'departureFlightNo',
    'departureFlightNo': 'departureFlightNo',
    'Departure Date': '_departureDate',
    'departureDate': '_departureDate',
    'Departure STA (UTC)': '_departureStdTime',
    'departureStdTime': '_departureStdTime',
    'Departure ATA (UTC)': '_departureAtdTime',
    'departureAtdTime': '_departureAtdTime',
    'Bay': 'bayNo',
    'bayNo': 'bayNo',
    'STATUS': 'statusCode',
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
    stationId: number;
    acTypeId: number;
    /** Aircraft-Engine combination id (0 when not resolved). */
    aircraftEngineId: number;
    familyCode: string;
    series: string;
    engineCode: string;
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
    maintenanceStatusId?: number;
    /** Flight status code from /master/Status (e.g. "Normal"). */
    statusCode?: string;
    note: string;
    datasource?: string;
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
