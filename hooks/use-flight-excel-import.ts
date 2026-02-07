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
    const [validatedRowsBySheet, setValidatedRowsBySheet] = useState<Record<number, ValidatedRow[]>>({});
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
        setValidatedRowsBySheet({});

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
     * Validate all rows in ALL sheets via API
     * Sends data from all sheets to backend for validation
     */
    const validateData = useCallback(async () => {
        if (sheets.length === 0) return;

        setIsValidating(true);

        try {
            // Check all sheets have valid dates first
            const invalidSheets = sheets.filter(sheet => !sheet.sheetDate);
            if (invalidSheets.length > 0) {
                const names = invalidSheets.map(s => `"${s.name}"`).join(', ');
                toast.error(`Sheet names ${names} are not valid date formats. Please rename them to dates (e.g., "05-02-2026").`);
                setIsValidating(false);
                return;
            }

            // Helper function to build request item from row
            const buildRequestItem = (row: Record<string, any>, sheetDate: string, rowId: number): FlightValidateRequestItem => {
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

                // Format datetime with sheet date context
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
                        if (parsed.isValid()) return parsed.format('YYYY-MM-DD HH:mm');
                        return formatDateTime(timeValue, sheetDate);
                    }

                    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
                        const parts = timeStr.split(':');
                        return `${dateFormatted} ${parts[0].padStart(2, '0')}:${parts[1]}`;
                    }

                    return `${dateFormatted} ${timeStr}`;
                };

                return {
                    rowId,
                    airlinesId,
                    acTypeId,
                    acReg: row['A/C REG'] || '',
                    arrivalFlightNo: row['FLT NO. ARRIVAL'] || row['ARR FLT'] || row['ARRIVAL FLT'] || '',
                    departureFlightNo: row['FLT NO. DEOARTURE'] || row['DEP FLT'] || row['DEPARTURE FLT'] || '',
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
            };

            // Build combined request data from ALL sheets with global rowId (1-indexed)
            const allRequestData: FlightValidateRequestItem[] = [];
            const rowToSheetMap: { sheetIndex: number; rowIndex: number; rowId: number }[] = [];
            let globalRowId = 1;

            sheets.forEach((sheet, sheetIndex) => {
                sheet.rows.forEach((row, rowIndex) => {
                    allRequestData.push(buildRequestItem(row, sheet.sheetDate!, globalRowId));
                    rowToSheetMap.push({ sheetIndex, rowIndex, rowId: globalRowId });
                    globalRowId++;
                });
            });

            // Call validate API with all rows
            const response = await axios.post<FlightValidateResponse>(
                '/flight/importlist-filghtinfo-validate',
                allRequestData
            );

            const validateResult = response.data.responseData;

            // Build validated rows grouped by sheet
            const newValidatedRowsBySheet: Record<number, ValidatedRow[]> = {};

            sheets.forEach((sheet, sheetIndex) => {
                newValidatedRowsBySheet[sheetIndex] = sheet.rows.map((row, rowIndex) => {
                    const mappedRow = mapRowToApiFormat(row, sheet.sheetDate);

                    // Find the rowId for this row from the map
                    const rowMapping = rowToSheetMap.find(
                        m => m.sheetIndex === sheetIndex && m.rowIndex === rowIndex
                    );
                    const rowId = rowMapping?.rowId || 0;

                    // Find validation result using rowId for accurate matching
                    const apiValidation = validateResult.validateFilghtList.find(
                        v => v.rowId === rowId
                    );

                    const errors: { row: number; column: string; message: string }[] = [];
                    const warnings: { row: number; column: string; message: string }[] = [];

                    if (apiValidation && apiValidation.statusText) {
                        errors.push({
                            row: rowId,
                            column: 'API',
                            message: apiValidation.statusText,
                        });
                    }

                    // Check master data matches and collect warnings
                    const airlineMatch = findOptionMatch(row['AIRLINE'], airlineOptions, 'label');
                    const acTypeMatch = findOptionMatch(row['A/C TYPE'], aircraftTypeOptions, 'value');
                    const routeFromMatch = findOptionMatch(row['ROUTE FROM'], stationOptions, 'value');
                    const routeToMatch = findOptionMatch(row['ROUTE TO'], stationOptions, 'value');
                    const checkMatch = findOptionMatch(row['CHECK'], checkStatusOptions, 'value');

                    // Add warnings for missing master data
                    if (row['AIRLINE'] && !airlineMatch) {
                        warnings.push({
                            row: rowId,
                            column: 'AIRLINE',
                            message: `Airline "${row['AIRLINE']}" not found in database`,
                        });
                    }
                    if (row['A/C TYPE'] && !acTypeMatch) {
                        warnings.push({
                            row: rowId,
                            column: 'A/C TYPE',
                            message: `A/C Type "${row['A/C TYPE']}" not found in database`,
                        });
                    }
                    if (row['ROUTE FROM'] && !routeFromMatch) {
                        warnings.push({
                            row: rowId,
                            column: 'ROUTE FROM',
                            message: `Station "${row['ROUTE FROM']}" not found in database`,
                        });
                    }
                    if (row['ROUTE TO'] && !routeToMatch) {
                        warnings.push({
                            row: rowId,
                            column: 'ROUTE TO',
                            message: `Station "${row['ROUTE TO']}" not found in database`,
                        });
                    }
                    if (row['CHECK'] && !checkMatch) {
                        warnings.push({
                            row: rowId,
                            column: 'CHECK',
                            message: `Status "${row['CHECK']}" not found in database`,
                        });
                    }

                    // Check staff columns
                    if (row['CS']) {
                        const csResult = parseAndMatchStaff(String(row['CS']), 'CS');
                        if (csResult.notFound.length > 0) {
                            warnings.push({
                                row: rowId,
                                column: 'CS',
                                message: `Staff not found: ${csResult.notFound.join(', ')}`,
                            });
                        }
                    }
                    if (row['MECH']) {
                        const mechResult = parseAndMatchStaff(String(row['MECH']), 'MECH');
                        if (mechResult.notFound.length > 0) {
                            warnings.push({
                                row: rowId,
                                column: 'MECH',
                                message: `Staff not found: ${mechResult.notFound.join(', ')}`,
                            });
                        }
                    }

                    const mappedWithIds = {
                        ...mappedRow,
                        airlineId: airlineMatch?.id,
                        acTypeId: acTypeMatch?.id,
                    };

                    return {
                        originalIndex: rowIndex + 2,
                        data: { ...row, _mapped: mappedWithIds, _sheetIndex: sheetIndex },
                        isValid: errors.length === 0,
                        errors,
                        warnings,
                    };
                });
            });

            setValidatedRowsBySheet(newValidatedRowsBySheet);
            setHasValidated(true);

            // Count totals across all sheets
            const allValidated = Object.values(newValidatedRowsBySheet).flat();
            const validCount = allValidated.filter((r) => r.isValid).length;
            const invalidCount = allValidated.filter((r) => !r.isValid).length;
            const totalSheets = sheets.length;

            if (validateResult.flagPass) {
                toast.success(`All ${validCount} rows from ${totalSheets} sheet(s) passed validation!`);
            } else {
                toast.warning(`${validCount} valid, ${invalidCount} invalid rows found across ${totalSheets} sheet(s)`);
            }
        } catch (error) {
            console.error('Validation error:', error);
            toast.error('An error occurred during validation');
        } finally {
            setIsValidating(false);
        }
    }, [sheets, mapRowToApiFormat, findOptionMatch, airlineOptions, aircraftTypeOptions, stationOptions, parseAndMatchStaff, checkStatusOptions, formatDateTime]);

    /**
     * Upload valid rows from ALL sheets to the API
     */
    const uploadData = useCallback(async () => {
        // Collect valid rows from ALL sheets
        const allValidatedRows = Object.values(validatedRowsBySheet).flat();
        const allValidRows = allValidatedRows.filter((r) => r.isValid);

        if (allValidRows.length === 0) {
            toast.error('No valid rows to upload');
            return;
        }

        setIsUploading(true);

        try {
            // Build upload data from all valid rows across all sheets
            const uploadRequestData = allValidRows.map((validRow, index) => {
                const row = validRow.data;
                // Use index+1 as rowId (1-indexed)
                const rowId = index + 1;
                // Get sheet date from the row's _sheetIndex
                const sheetIndex = row._sheetIndex ?? 0;
                const sheetDate = sheets[sheetIndex]?.sheetDate || '';

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

                // Format dates - use the row's specific sheet date
                const formatFullDateTime = (timeValue: any): string => {
                    if (!timeValue || !sheetDate) return '';

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
                    rowId,
                    airlinesId,
                    acTypeId,
                    acReg: row['A/C REG'] || '',
                    arrivalFlightNo: row['FLT NO. ARRIVAL'] || row['ARR FLT'] || row['ARRIVAL FLT'] || '',
                    departureFlightNo: row['FLT NO. DEPARTURE'] || row['DEP FLT'] || row['DEPARTURE FLT'] || '',
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

            const sheetsCount = Object.keys(validatedRowsBySheet).length;
            toast.success(`Successfully imported ${uploadRequestData.length} flight records from ${sheetsCount} sheet(s)`);

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
    }, [validatedRowsBySheet, sheets, queryClient, findOptionMatch, airlineOptions, aircraftTypeOptions, parseAndMatchStaff, checkStatusOptions]);

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

        // Update validation state: remove deleted row and adjust indices
        setValidatedRowsBySheet((prev) => {
            const updated = { ...prev };
            const sheetValidation = updated[activeSheetIndex];
            if (sheetValidation) {
                // Filter out the deleted row and adjust originalIndex for remaining rows
                updated[activeSheetIndex] = sheetValidation
                    .filter((v) => v.originalIndex !== rowIndex + 2) // originalIndex is Excel row (2-based)
                    .map((v) => ({
                        ...v,
                        originalIndex: v.originalIndex > rowIndex + 2
                            ? v.originalIndex - 1
                            : v.originalIndex,
                    }));
            }
            return updated;
        });
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

        // Recalculate validation for the edited row only, preserving other rows' validation
        setValidatedRowsBySheet((prev) => {
            const updated = { ...prev };
            const sheetValidation = updated[activeSheetIndex];
            if (sheetValidation) {
                // Find and update the edited row's validation
                updated[activeSheetIndex] = sheetValidation.map((v) => {
                    if (v.originalIndex === rowIndex + 2) {
                        // Recalculate warnings for the edited row
                        const warnings: { row: number; column: string; message: string }[] = [];
                        const rowId = v.originalIndex;

                        // Check master data matches (simplified check based on column values)
                        const airlineMatch = findOptionMatch(updatedData['AIRLINE'], airlineOptions, 'label');
                        const acTypeMatch = findOptionMatch(updatedData['A/C TYPE'], aircraftTypeOptions, 'value');
                        const routeFromMatch = findOptionMatch(updatedData['ROUTE FROM'], stationOptions, 'value');
                        const routeToMatch = findOptionMatch(updatedData['ROUTE TO'], stationOptions, 'value');
                        const checkMatch = findOptionMatch(updatedData['CHECK'], checkStatusOptions, 'value');

                        if (updatedData['AIRLINE'] && !airlineMatch) {
                            warnings.push({ row: rowId, column: 'AIRLINE', message: `Airline "${updatedData['AIRLINE']}" not found in database` });
                        }
                        if (updatedData['A/C TYPE'] && !acTypeMatch) {
                            warnings.push({ row: rowId, column: 'A/C TYPE', message: `A/C Type "${updatedData['A/C TYPE']}" not found in database` });
                        }
                        if (updatedData['ROUTE FROM'] && !routeFromMatch) {
                            warnings.push({ row: rowId, column: 'ROUTE FROM', message: `Station "${updatedData['ROUTE FROM']}" not found in database` });
                        }
                        if (updatedData['ROUTE TO'] && !routeToMatch) {
                            warnings.push({ row: rowId, column: 'ROUTE TO', message: `Station "${updatedData['ROUTE TO']}" not found in database` });
                        }
                        if (updatedData['CHECK'] && !checkMatch) {
                            warnings.push({ row: rowId, column: 'CHECK', message: `Status "${updatedData['CHECK']}" not found in database` });
                        }

                        // Check staff columns
                        if (updatedData['CS']) {
                            const csResult = parseAndMatchStaff(String(updatedData['CS']), 'CS');
                            if (csResult.notFound.length > 0) {
                                warnings.push({ row: rowId, column: 'CS', message: `Staff not found: ${csResult.notFound.join(', ')}` });
                            }
                        }
                        if (updatedData['MECH']) {
                            const mechResult = parseAndMatchStaff(String(updatedData['MECH']), 'MECH');
                            if (mechResult.notFound.length > 0) {
                                warnings.push({ row: rowId, column: 'MECH', message: `Staff not found: ${mechResult.notFound.join(', ')}` });
                            }
                        }

                        return {
                            ...v,
                            data: { ...v.data, ...updatedData },
                            warnings,
                        };
                    }
                    return v;
                });
            }
            return updated;
        });

        toast.success('Row updated successfully');
    }, [activeSheetIndex, findOptionMatch, airlineOptions, aircraftTypeOptions, stationOptions, checkStatusOptions, parseAndMatchStaff]);

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
        setValidatedRowsBySheet({});
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
        setValidatedRowsBySheet({});
        setHasValidated(false);
        setActiveSheetIndex(0);
    }, []);

    // Computed values
    const activeSheet = sheets[activeSheetIndex] || null;
    // Aggregate validated rows from all sheets
    const allValidatedRows = Object.values(validatedRowsBySheet).flat();
    const validatedRows = validatedRowsBySheet[activeSheetIndex] || [];
    const validRows = allValidatedRows.filter((r) => r.isValid);
    const invalidRows = allValidatedRows.filter((r) => !r.isValid);
    // Rows with warnings (master data mismatches)
    const warningRows = allValidatedRows.filter((r) => r.warnings && r.warnings.length > 0);
    // Block upload if there are errors OR warnings
    const canUpload = hasValidated && invalidRows.length === 0 && warningRows.length === 0 && validRows.length > 0;

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
        validatedRowsBySheet,
        hasValidated,
        validRows,
        invalidRows,
        warningRows,
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

