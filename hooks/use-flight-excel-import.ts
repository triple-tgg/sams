import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import axios from '@/lib/axios.config';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
    ParsedSheet,
    ValidatedRow,
    FlightImportData,
    EXCEL_COLUMN_MAPPING,
    FlightValidateRequestItem,
    FlightValidateResponse,
} from '@/components/flight-timeline/types/flight-import.types';
import { validateFlightRow } from '@/components/flight-timeline/schemas/flight-validation.schema';
import { useAirlineOptions } from '@/lib/api/hooks/useAirlines';
import { useAircraftTypes } from '@/lib/api/hooks/useAircraftTypes';
import { useStationsOptions } from '@/lib/api/hooks/useStations';
import { useStaffListForImport } from '@/lib/api/hooks/useStaffListForImport';
import { useMaintenanceStatus } from '@/lib/api/hooks/useMaintenanceStatus';

// Enable dayjs custom parse format plugin
dayjs.extend(customParseFormat);

/**
 * Custom hook for Excel import with preview, validation, and upload
 * Supports multi-sheet parsing, row-level validation, and error separation
 */
export const useFlightExcelImport = () => {
    // State management
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [sheets, setSheets] = useState<ParsedSheet[]>([]);
    const [activeSheetIndex, setActiveSheetIndex] = useState(0);
    const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
    const [hasValidated, setHasValidated] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    // Fetch options for validation and ID mapping
    const { options: airlineOptions } = useAirlineOptions();
    const { options: aircraftTypeOptions } = useAircraftTypes();
    const { options: stationOptions } = useStationsOptions();
    const { parseAndMatchStaff } = useStaffListForImport();
    const { options: checkStatusOptions } = useMaintenanceStatus();

    /**
     * Find option match and return the option with ID
     */
    const findOptionMatch = useCallback((
        value: any,
        options: Array<{ value: string; label: string; id?: number }>,
        matchBy: 'value' | 'label'
    ): { value: string; label: string; id?: number } | undefined => {
        if (!value || !options?.length) return undefined;
        const normalizedValue = String(value).trim().toUpperCase();
        return options.find((opt) => {
            const compareValue = matchBy === 'label'
                ? String(opt.label).trim().toUpperCase()
                : String(opt.value).trim().toUpperCase();
            return compareValue === normalizedValue;
        });
    }, []);

    /**
     * Parse sheet name as date (e.g., "05-02-2026", "2026-02-05", "05/02/2026")
     * Returns formatted date string (YYYY-MM-DD) if valid, otherwise null
     */
    const parseSheetNameDate = useCallback((sheetName: string): string | null => {
        if (!sheetName?.trim()) return null;

        const name = sheetName.trim();
        const formats = [
            'DD-MM-YYYY', 'DD/MM/YYYY', 'DD.MM.YYYY',
            'YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY.MM.DD',
            'MM-DD-YYYY', 'MM/DD/YYYY', 'MM.DD.YYYY',
            'DDMMYYYY', 'YYYYMMDD',
        ];

        for (const format of formats) {
            const parsed = dayjs(name, format, true);
            if (parsed.isValid()) {
                return parsed.format('YYYY-MM-DD');
            }
        }

        // Try flexible parsing
        const flexParsed = dayjs(name);
        if (flexParsed.isValid()) {
            return flexParsed.format('YYYY-MM-DD');
        }

        return null;
    }, []);

    /**
     * Format Excel date value to YYYY-MM-DD string
     */
    const formatDate = useCallback((dateValue: any): string => {
        if (!dateValue) return '';

        try {
            let parsedDate: dayjs.Dayjs | null = null;

            // Handle Excel date serial number
            if (typeof dateValue === 'number') {
                const excelDate = XLSX.SSF.parse_date_code(dateValue);
                if (excelDate) {
                    parsedDate = dayjs(new Date(excelDate.y, excelDate.m - 1, excelDate.d));
                }
            }
            // Handle Date object
            else if (dateValue instanceof Date) {
                parsedDate = dayjs(dateValue);
            }
            // Handle string
            else if (typeof dateValue === 'string' && dateValue.trim()) {
                const formats = [
                    'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY',
                    'DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY/MM/DD',
                ];
                for (const format of formats) {
                    const parsed = dayjs(dateValue.trim(), format, true);
                    if (parsed.isValid()) {
                        parsedDate = parsed;
                        break;
                    }
                }
                // Fallback to flexible parsing
                if (!parsedDate?.isValid()) {
                    parsedDate = dayjs(dateValue.trim());
                }
            }

            if (parsedDate?.isValid()) {
                return parsedDate.format('YYYY-MM-DD');
            }
        } catch (error) {
            console.warn('Date parsing error:', error, 'for value:', dateValue);
        }

        return String(dateValue);
    }, []);

    /**
     * Format Excel time value to HH:mm string
     */
    /**
     * Format time value - handles Excel time serial, HH:mm, and YYYY-MM-DD HH:mm formats
     * Returns just the time portion (HH:mm) - date context is handled separately
     */
    const formatTime = useCallback((timeValue: any): string => {
        if (!timeValue) return '';

        try {
            // Handle Excel time serial (fraction of day) - just time, no date
            if (typeof timeValue === 'number' && timeValue < 1) {
                const totalMinutes = Math.round(timeValue * 24 * 60);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }

            // Handle Excel datetime serial (integer date + fractional time)
            if (typeof timeValue === 'number' && timeValue >= 1) {
                const excelTime = timeValue - Math.floor(timeValue);
                const totalMinutes = Math.round(excelTime * 24 * 60);
                const hours = Math.floor(totalMinutes / 60) % 24;
                const minutes = totalMinutes % 60;
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }

            // Handle string time
            if (typeof timeValue === 'string' && timeValue.trim()) {
                const timeStr = timeValue.trim();

                // Already in HH:mm format
                if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
                    const parts = timeStr.split(':');
                    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                }

                // YYYY-MM-DD HH:mm format (from datetime picker edit)
                const datetimeMatch = timeStr.match(/^\d{4}-\d{2}-\d{2}\s+(\d{1,2}:\d{2})/);
                if (datetimeMatch) {
                    const timeParts = datetimeMatch[1].split(':');
                    return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
                }
            }
        } catch (error) {
            console.warn('Time parsing error:', error, 'for value:', timeValue);
        }

        return String(timeValue);
    }, []);

    /**
     * Format datetime value - combines date (from value or context) with time
     * If value contains datetime info, use it; otherwise use provided dateContext
     * Returns format: DD/MM/YYYY HH:mm
     */
    const formatDateTime = useCallback((timeValue: any, dateContext?: string | null): string => {
        if (!timeValue) return '';

        let dateStr = dateContext || '';
        let timeStr = '';

        try {
            // Handle Excel datetime serial (integer date + fractional time)
            if (typeof timeValue === 'number' && timeValue >= 1) {
                const excelDate = Math.floor(timeValue);
                const excelTime = timeValue - excelDate;
                // Excel date serial number to JS Date
                const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                dateStr = dayjs(jsDate).format('YYYY-MM-DD');

                const totalMinutes = Math.round(excelTime * 24 * 60);
                const hours = Math.floor(totalMinutes / 60) % 24;
                const minutes = totalMinutes % 60;
                timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
            // Handle Excel time serial (fraction of day) - just time
            else if (typeof timeValue === 'number' && timeValue < 1) {
                const totalMinutes = Math.round(timeValue * 24 * 60);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
            // Handle string formats
            else if (typeof timeValue === 'string' && timeValue.trim()) {
                const trimmed = timeValue.trim();

                // YYYY-MM-DD HH:mm format (from datetime picker edit)
                const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})/);
                if (isoMatch) {
                    dateStr = isoMatch[1];
                    const timeParts = isoMatch[2].split(':');
                    timeStr = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
                }
                // HH:mm format - use dateContext
                else if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
                    const parts = trimmed.split(':');
                    timeStr = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                }
            }

            // Combine date and time if both available
            if (dateStr && timeStr) {
                const formattedDate = dayjs(dateStr).format('DD/MM/YYYY');
                return `${formattedDate} ${timeStr}`;
            } else if (timeStr) {
                // If no date but have time, return just time
                return timeStr;
            }
        } catch (error) {
            console.warn('DateTime parsing error:', error, 'for value:', timeValue);
        }

        return String(timeValue);
    }, []);

    /**
     * Map Excel row to API format using column mapping
     * sheetDate is used as default date context for time fields
     */
    const mapRowToApiFormat = useCallback((row: Record<string, any>, sheetDate?: string | null): FlightImportData => {
        const mapped: Partial<FlightImportData> = { id: 0 };

        // Map each Excel column to API field
        Object.entries(row).forEach(([excelCol, value]) => {
            const apiField = EXCEL_COLUMN_MAPPING[excelCol];
            if (apiField) {
                let processedValue = String(value || '').trim();

                // Format dates and times appropriately
                if (apiField.includes('Date')) {
                    processedValue = formatDate(value);
                } else if (apiField.includes('Time')) {
                    // Use formatDateTime to create full datetime with sheet date context
                    processedValue = formatDateTime(value, sheetDate);
                }

                (mapped as any)[apiField] = processedValue;
            }
        });

        // Process CS column - match staff names to IDs
        const csValue = row['CS'] || row['cs'] || '';
        const csResult = parseAndMatchStaff(String(csValue), 'CS');
        const csStaffIds = csResult.found.map(staff => staff.id);

        // Process MECH column - match staff names to IDs
        const mechValue = row['MECH'] || row['Mech'] || row['mech'] || '';
        const mechResult = parseAndMatchStaff(String(mechValue), 'MECH');
        const mechStaffIds = mechResult.found.map(staff => staff.id);

        // Process CHECK column - match status code to ID
        const checkValue = row['CHECK'] || row['Check'] || row['check'] || '';
        const checkMatch = checkStatusOptions.find(opt =>
            opt.value.toUpperCase() === String(checkValue).trim().toUpperCase()
        );
        const checkStatusId = checkMatch?.id || 0;

        // Ensure all fields exist with defaults
        return {
            id: 0,
            airlinesCode: mapped.airlinesCode || '',
            stationsCode: mapped.stationsCode || '',
            acReg: mapped.acReg || '',
            acTypeCode: mapped.acTypeCode || '',
            arrivalFlightNo: mapped.arrivalFlightNo || '',
            arrivalDate: mapped.arrivalDate || '',
            arrivalStaTime: mapped.arrivalStaTime || '',
            arrivalAtaTime: mapped.arrivalAtaTime || '',
            departureFlightNo: mapped.departureFlightNo || '',
            departureDate: mapped.departureDate || '',
            departureStdTime: mapped.departureStdTime || '',
            departureAtdTime: mapped.departureAtdTime || '',
            bayNo: mapped.bayNo || '',
            statusCode: mapped.statusCode || '',
            note: mapped.note || '',
            csStaffIds,
            mechStaffIds,
            checkStatusId,
        };
    }, [formatDate, formatDateTime, parseAndMatchStaff, checkStatusOptions]);

    /**
     * Parse Excel file and extract all sheets
     * Excludes sheets that:
     * - Start with "_" (considered internal/hidden)
     * - Are protected
     */
    const parseExcelFile = useCallback(async (file: File): Promise<ParsedSheet[]> => {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const parsedSheets: ParsedSheet[] = workbook.SheetNames
            // Filter out sheets starting with "_" or protected sheets
            .filter((sheetName) => {
                // Skip sheets starting with "_"
                if (sheetName.startsWith('_')) {
                    console.log(`Skipping sheet "${sheetName}": starts with "_"`);
                    return false;
                }

                // Check if sheet is protected
                const worksheet = workbook.Sheets[sheetName];
                if (worksheet['!protect']) {
                    console.log(`Skipping sheet "${sheetName}": sheet is protected`);
                    return false;
                }

                return true;
            })
            .map((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: '',
                }) as any[][];

                // Extract headers and rows
                const headers = (jsonData[0] as string[]) || [];
                const rows = jsonData.slice(1)
                    // Filter out empty rows - rows with no meaningful data
                    .filter((row) => {
                        // Check if row has at least one cell with meaningful data
                        return row.some((cell) => {
                            if (cell === undefined || cell === null) return false;
                            if (typeof cell === 'number') return true; // Numbers are valid
                            if (typeof cell === 'string') {
                                const trimmed = cell.trim();
                                // Skip empty strings and common placeholder values
                                if (trimmed === '' || trimmed === '-' || trimmed === 'N/A' || trimmed === 'n/a') {
                                    return false;
                                }
                                return true;
                            }
                            return true; // Other types (dates, booleans) are valid
                        });
                    })
                    .map((row) => {
                        const obj: Record<string, any> = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index] ?? '';
                        });
                        return obj;
                    });

                // Parse sheet name as date
                const sheetDate = parseSheetNameDate(sheetName);

                return { name: sheetName, headers, rows, sheetDate };
            });

        return parsedSheets;
    }, []);

    /**
     * Handle file selection and parse Excel
     */
    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.error('Please select an Excel file (.xlsx or .xls)');
            return;
        }

        setIsParsing(true);
        setHasValidated(false);
        setValidatedRows([]);

        try {
            const parsedSheets = await parseExcelFile(file);

            if (parsedSheets.length === 0 || parsedSheets.every((s) => s.rows.length === 0)) {
                toast.error('The Excel file is empty or has no valid data');
                return;
            }

            setSheets(parsedSheets);
            setActiveSheetIndex(0);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error parsing Excel file:', error);
            toast.error('Failed to parse the Excel file. Please check the file format.');
        } finally {
            setIsParsing(false);
            // Reset file input for re-selection
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [parseExcelFile]);

    /**
     * Validate all rows in the active sheet via API
     * Sends data to backend for validation
     */
    const validateData = useCallback(async () => {
        if (sheets.length === 0) return;

        setIsValidating(true);

        try {
            const activeSheet = sheets[activeSheetIndex];
            const sheetDate = activeSheet.sheetDate;

            // Check if sheet name is a valid date
            if (!sheetDate) {
                toast.error(`Sheet name "${activeSheet.name}" is not a valid date format. Please rename the sheet to a date (e.g., "05-02-2026").`);
                setIsValidating(false);
                return;
            }

            // Build validation request data
            const validateRequestData: FlightValidateRequestItem[] = activeSheet.rows.map((row) => {
                // Get airline ID
                const airlineValue = row['AIRLINE'];
                const airlineMatch = findOptionMatch(airlineValue, airlineOptions, 'label');
                const airlinesId = airlineMatch?.id || 0;

                // Get A/C Type ID
                const acTypeValue = row['A/C TYPE'];
                const acTypeMatch = findOptionMatch(acTypeValue, aircraftTypeOptions, 'value');
                const acTypeId = acTypeMatch?.id || 0;

                // Get Route From (station code)
                const routeFromValue = row['ROUTE FROM'] || '';

                // Get Route To (station code)  
                const routeToValue = row['ROUTE TO'] || '';

                // Get staff IDs
                const csValue = row['CS'] || '';
                const csResult = parseAndMatchStaff(String(csValue), 'CS');
                const csIdList = csResult.found.map(staff => staff.id);

                const mechValue = row['MECH'] || '';
                const mechResult = parseAndMatchStaff(String(mechValue), 'MECH');
                const mechIdList = mechResult.found.map(staff => staff.id);

                // Get CHECK status ID
                const checkValue = row['CHECK'] || '';
                const checkMatch = checkStatusOptions.find(opt =>
                    opt.value.toUpperCase() === String(checkValue).trim().toUpperCase()
                );
                const checkStatusId = checkMatch?.id || 0;

                // Format dates - combine sheet date with time
                const formatFullDateTime = (timeValue: any): string => {
                    if (!timeValue) return '';

                    const dateFormatted = dayjs(sheetDate).format('YYYY-MM-DD');

                    // Handle Excel time serial number (decimal like 0.5625 = 13:30)
                    if (typeof timeValue === 'number' && timeValue < 1) {
                        const totalMinutes = Math.round(timeValue * 24 * 60);
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                        return `${dateFormatted} ${timeStr}`;
                    }

                    const timeStr = String(timeValue).trim();

                    // Already has date and time
                    if (timeStr.includes('/') || timeStr.includes('-')) {
                        // Parse existing datetime and reformat
                        const parsed = dayjs(timeStr, ['DD/MM/YYYY HH:mm', 'YYYY-MM-DD HH:mm', 'DD-MM-YYYY HH:mm']);
                        if (parsed.isValid()) {
                            return parsed.format('YYYY-MM-DD HH:mm');
                        }
                        return formatDateTime(timeValue, sheetDate);
                    }

                    // HH:mm format
                    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
                        const parts = timeStr.split(':');
                        const formattedTime = `${parts[0].padStart(2, '0')}:${parts[1]}`;
                        return `${dateFormatted} ${formattedTime}`;
                    }

                    return `${dateFormatted} ${timeStr}`;
                };

                return {
                    airlinesId,
                    acTypeId,
                    acReg: row['A/C REG'] || '',
                    arrivalFlightNo: row['ARR FLT'] || row['ARRIVAL FLT'] || '',
                    departureFlightNo: row['DEP FLT'] || row['DEPARTURE FLT'] || '',
                    routeFrom: routeFromValue,
                    routeTo: routeToValue,
                    arrivalStaDate: formatFullDateTime(row['STA'] || row['ETA']),
                    departureStdDate: formatFullDateTime(row['STD'] || row['ETD']),
                    etaDate: formatFullDateTime(row['ETA'] || row['STA']),
                    bayNo: row['BAY'] || row['PARKING'] || '',
                    csIdList,
                    mechIdList,
                    checkStatusId,
                    note: row['NOTE'] || row['REMARK'] || '',
                };
            });

            // Call validate API
            const response = await axios.post<FlightValidateResponse>(
                '/flight/importlist-filghtinfo-validate',
                validateRequestData
            );

            const validateResult = response.data.responseData;

            // Map API response to validated rows
            const validated: ValidatedRow[] = activeSheet.rows.map((row, index) => {
                const mappedRow = mapRowToApiFormat(row, sheetDate);
                const arrivalFlightNo = row['ARR FLT'] || row['ARRIVAL FLT'] || '';

                // Find validation result from API
                const apiValidation = validateResult.validateFilghtList.find(
                    v => v.arrivalFlightNo === arrivalFlightNo
                ) || validateResult.validateFilghtList[index];

                const errors: { row: number; column: string; message: string }[] = [];

                // Add API validation errors
                if (apiValidation && apiValidation.statusText) {
                    errors.push({
                        row: index + 2,
                        column: 'API',
                        message: apiValidation.statusText,
                    });
                }

                // Get matched IDs for upload
                const airlineMatch = findOptionMatch(row['AIRLINE'], airlineOptions, 'label');
                const acTypeMatch = findOptionMatch(row['A/C TYPE'], aircraftTypeOptions, 'value');

                const mappedWithIds = {
                    ...mappedRow,
                    airlineId: airlineMatch?.id,
                    acTypeId: acTypeMatch?.id,
                };

                const isValid = errors.length === 0;

                return {
                    originalIndex: index + 2,
                    data: { ...row, _mapped: mappedWithIds },
                    isValid,
                    errors,
                };
            });

            setValidatedRows(validated);
            setHasValidated(true);

            const validCount = validated.filter((r) => r.isValid).length;
            const invalidCount = validated.filter((r) => !r.isValid).length;

            if (validateResult.flagPass) {
                toast.success(`All ${validCount} rows passed validation!`);
            } else {
                toast.warning(`${validCount} valid, ${invalidCount} invalid rows found`);
            }
        } catch (error) {
            console.error('Validation error:', error);
            toast.error('An error occurred during validation');
        } finally {
            setIsValidating(false);
        }
    }, [sheets, activeSheetIndex, mapRowToApiFormat, findOptionMatch, airlineOptions, aircraftTypeOptions, stationOptions, parseAndMatchStaff, checkStatusOptions, formatDateTime]);

    /**
     * Upload valid rows to the API
     */
    const uploadData = useCallback(async () => {
        const validRows = validatedRows.filter((r) => r.isValid);
        if (validRows.length === 0) {
            toast.error('No valid rows to upload');
            return;
        }

        const activeSheet = sheets[activeSheetIndex];
        const sheetDate = activeSheet?.sheetDate;

        if (!sheetDate) {
            toast.error('Sheet date not found');
            return;
        }

        setIsUploading(true);

        try {
            // Build upload data in same format as validate API + userName
            const uploadRequestData = validRows.map((validRow) => {
                const row = validRow.data;

                // Get airline ID
                const airlineValue = row['AIRLINE'];
                const airlineMatch = findOptionMatch(airlineValue, airlineOptions, 'label');
                const airlinesId = airlineMatch?.id || 0;

                // Get A/C Type ID
                const acTypeValue = row['A/C TYPE'];
                const acTypeMatch = findOptionMatch(acTypeValue, aircraftTypeOptions, 'value');
                const acTypeId = acTypeMatch?.id || 0;

                // Get Route From/To
                const routeFromValue = row['ROUTE FROM'] || '';
                const routeToValue = row['ROUTE TO'] || '';

                // Get staff IDs
                const csValue = row['CS'] || '';
                const csResult = parseAndMatchStaff(String(csValue), 'CS');
                const csIdList = csResult.found.map(staff => staff.id);

                const mechValue = row['MECH'] || '';
                const mechResult = parseAndMatchStaff(String(mechValue), 'MECH');
                const mechIdList = mechResult.found.map(staff => staff.id);

                // Get CHECK status ID
                const checkValue = row['CHECK'] || '';
                const checkMatch = checkStatusOptions.find(opt =>
                    opt.value.toUpperCase() === String(checkValue).trim().toUpperCase()
                );
                const checkStatusId = checkMatch?.id || 0;

                // Format dates - same logic as validate
                const formatFullDateTime = (timeValue: any): string => {
                    if (!timeValue) return '';

                    const dateFormatted = dayjs(sheetDate).format('YYYY-MM-DD');

                    if (typeof timeValue === 'number' && timeValue < 1) {
                        const totalMinutes = Math.round(timeValue * 24 * 60);
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                        return `${dateFormatted} ${timeStr}`;
                    }

                    const timeStr = String(timeValue).trim();

                    if (timeStr.includes('/') || timeStr.includes('-')) {
                        const parsed = dayjs(timeStr, ['DD/MM/YYYY HH:mm', 'YYYY-MM-DD HH:mm', 'DD-MM-YYYY HH:mm']);
                        if (parsed.isValid()) {
                            return parsed.format('YYYY-MM-DD HH:mm');
                        }
                    }

                    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
                        const parts = timeStr.split(':');
                        const formattedTime = `${parts[0].padStart(2, '0')}:${parts[1]}`;
                        return `${dateFormatted} ${formattedTime}`;
                    }

                    return `${dateFormatted} ${timeStr}`;
                };

                return {
                    airlinesId,
                    acTypeId,
                    acReg: row['A/C REG'] || '',
                    arrivalFlightNo: row['ARR FLT'] || row['ARRIVAL FLT'] || '',
                    departureFlightNo: row['DEP FLT'] || row['DEPARTURE FLT'] || '',
                    routeFrom: routeFromValue,
                    routeTo: routeToValue,
                    arrivalStaDate: formatFullDateTime(row['STA'] || row['ETA']),
                    departureStdDate: formatFullDateTime(row['STD'] || row['ETD']),
                    etaDate: formatFullDateTime(row['ETA'] || row['STA']),
                    bayNo: row['BAY'] || row['PARKING'] || '',
                    csIdList,
                    mechIdList,
                    checkStatusId,
                    note: row['NOTE'] || row['REMARK'] || '',
                    userName: 'system', // TODO: Get from auth context
                };
            });

            // Call upload API
            await axios.post('/flight/importlist-filghtinfo', uploadRequestData);

            toast.success(`Successfully imported ${uploadRequestData.length} flight records`);

            // Refresh flight list data
            queryClient.invalidateQueries({ queryKey: ['flightList'] });

            // Close modal and reset state
            closeModal();
        } catch (error: any) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
            toast.error(errorMessage);
        } finally {
            setIsUploading(false);
        }
    }, [validatedRows, sheets, activeSheetIndex, queryClient, findOptionMatch, airlineOptions, aircraftTypeOptions, parseAndMatchStaff, checkStatusOptions]);

    /**
     * Open file picker
     */
    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    /**
     * Delete a row from the active sheet by index
     */
    const deleteRow = useCallback((rowIndex: number) => {
        setSheets((prevSheets) => {
            const updatedSheets = [...prevSheets];
            const activeSheet = { ...updatedSheets[activeSheetIndex] };
            activeSheet.rows = activeSheet.rows.filter((_, index) => index !== rowIndex);
            updatedSheets[activeSheetIndex] = activeSheet;
            return updatedSheets;
        });

        // Reset validation when rows change
        setValidatedRows([]);
        setHasValidated(false);
    }, [activeSheetIndex]);

    /**
     * Edit a row in the active sheet by index
     */
    const editRow = useCallback((rowIndex: number, updatedData: Record<string, any>) => {
        setSheets((prevSheets) => {
            const updatedSheets = [...prevSheets];
            const activeSheet = { ...updatedSheets[activeSheetIndex] };
            activeSheet.rows = activeSheet.rows.map((row, index) =>
                index === rowIndex ? { ...row, ...updatedData } : row
            );
            updatedSheets[activeSheetIndex] = activeSheet;
            return updatedSheets;
        });

        // Reset validation when rows change
        setValidatedRows([]);
        setHasValidated(false);

        toast.success('Row updated successfully');
    }, [activeSheetIndex]);

    /**
     * Update sheet name and re-parse as date
     */
    const updateSheetName = useCallback((sheetIndex: number, newName: string) => {
        // Parse the new name as a date
        const newSheetDate = parseSheetNameDate(newName);

        setSheets((prevSheets) => {
            const updatedSheets = [...prevSheets];
            updatedSheets[sheetIndex] = {
                ...updatedSheets[sheetIndex],
                name: newName,
                sheetDate: newSheetDate,
            };
            return updatedSheets;
        });

        // Reset validation when sheet name changes
        setValidatedRows([]);
        setHasValidated(false);

        if (newSheetDate) {
            toast.success(`Sheet date updated to ${newSheetDate}`);
        } else {
            toast.warning('Sheet name is still not a valid date format');
        }
    }, [parseSheetNameDate]);

    /**
     * Close modal and reset state
     */
    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSheets([]);
        setValidatedRows([]);
        setHasValidated(false);
        setActiveSheetIndex(0);
    }, []);

    // Computed values
    const activeSheet = sheets[activeSheetIndex] || null;
    const validRows = validatedRows.filter((r) => r.isValid);
    const invalidRows = validatedRows.filter((r) => !r.isValid);
    const canUpload = hasValidated && invalidRows.length === 0 && validRows.length > 0;

    return {
        // State
        isModalOpen,
        isParsing,
        isValidating,
        isUploading,
        sheets,
        activeSheetIndex,
        activeSheet,
        validatedRows,
        hasValidated,
        validRows,
        invalidRows,
        canUpload,

        // Actions
        fileInputRef,
        openFilePicker,
        handleFileSelect,
        setActiveSheetIndex,
        validateData,
        uploadData,
        closeModal,
        deleteRow,
        editRow,
        updateSheetName,
    };
};
