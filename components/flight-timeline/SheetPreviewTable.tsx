'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil, Check, X, AlertTriangle, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import dayjs from 'dayjs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ValidatedRow } from './types/flight-import.types';
import { useAirlineOptions } from '@/lib/api/hooks/useAirlines';
import { useAircraftTypes } from '@/lib/api/hooks/useAircraftTypes';
import { useStationsOptions } from '@/lib/api/hooks/useStations';
import { useStaffListForImport, StaffOption } from '@/lib/api/hooks/useStaffListForImport';
import { useMaintenanceStatus } from '@/lib/api/hooks/useMaintenanceStatus';

// Columns that should use Select dropdowns in edit mode
const AIRLINE_COLUMNS = ['AIRLINE'];
const AIRCRAFT_TYPE_COLUMNS = ['A/C TYPE'];
const STATION_COLUMNS = ['ROUTE FROM', 'ROUTE TO'];

// Staff columns that should use multi-select search dropdown
const STAFF_COLUMNS = ['CS', 'MECH'];

// CHECK column - MaintenanceStatus
const CHECK_COLUMNS = ['CHECK'];

// Time columns that should be formatted as HH:mm
const TIME_COLUMNS = ['STA', 'STD', 'ETA', 'ETD', 'ATA', 'ATD'];

// Option type for validation
interface SelectOption {
    value: string;
    label: string;
    id?: number;
}

/**
 * Check if a value exists in the given options
 * For airlines: match by label (name)
 * For aircraft types and stations: match by value (code)
 */
const findOptionMatch = (
    value: any,
    options: SelectOption[],
    matchBy: 'value' | 'label'
): SelectOption | undefined => {
    if (!value || !options?.length) return undefined;
    const normalizedValue = String(value).trim().toUpperCase();
    return options.find((opt) => {
        const compareValue = matchBy === 'label'
            ? String(opt.label).trim().toUpperCase()
            : String(opt.value).trim().toUpperCase();
        return compareValue === normalizedValue;
    });
};

/**
 * Format cell value based on column type
 * For time columns (STA, STD, ETA, etc.):
 * - Display: HH:mm only
 * - Tooltip: DD/MM/YYYY HH:mm (full datetime with sheet date)
 * - hasMismatch: true if value contains a date that differs from sheet date
 * - missingDateContext: true if time value has no date context (no valueDateStr and no sheetDate)
 */
const formatCellValue = (
    header: string,
    value: any,
    sheetDate?: string | null
): { display: string; tooltip: string | null; hasMismatch: boolean; missingDateContext: boolean } => {
    if (value === undefined || value === null || value === '') {
        return { display: '-', tooltip: null, hasMismatch: false, missingDateContext: false };
    }

    // Check if this is a time column
    const isTimeColumn = TIME_COLUMNS.some(
        (col) => header.toUpperCase().includes(col)
    );

    if (isTimeColumn) {
        let timeStr = '';
        let valueDateStr: string | null = null;

        // Handle Excel time format (decimal fraction of day)
        if (typeof value === 'number') {
            // Check if this is a datetime (has integer date part)
            if (value >= 1) {
                // This is a datetime, extract date and time
                const excelDate = Math.floor(value);
                const excelTime = value - excelDate;
                // Excel date serial number to JS Date (Excel starts from 1900-01-01)
                const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                valueDateStr = dayjs(jsDate).format('YYYY-MM-DD');

                const totalMinutes = Math.round(excelTime * 24 * 60);
                const hours = Math.floor(totalMinutes / 60) % 24;
                const minutes = totalMinutes % 60;
                timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            } else {
                // Just time (fraction of day)
                const totalMinutes = Math.round(value * 24 * 60);
                const hours = Math.floor(totalMinutes / 60) % 24;
                const minutes = totalMinutes % 60;
                timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
        }
        // Handle string time formats
        else if (typeof value === 'string') {
            const trimmed = value.trim();
            // Already in HH:mm format
            if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
                timeStr = trimmed;
            } else {
                // Try to parse with dayjs - might be datetime string
                const parsed = dayjs(trimmed);
                if (parsed.isValid()) {
                    timeStr = parsed.format('HH:mm');
                    // Check if it has a date component
                    const dateStr = parsed.format('YYYY-MM-DD');
                    if (dateStr !== '1970-01-01' && dateStr !== dayjs().format('YYYY-MM-DD')) {
                        valueDateStr = dateStr;
                    }
                } else {
                    timeStr = String(value);
                }
            }
        }

        // Check if date mismatches sheet date
        const hasMismatch = !!(valueDateStr && sheetDate && valueDateStr !== sheetDate);

        // Check if time value has no date context (warning condition)
        const missingDateContext = !!timeStr && !valueDateStr && !sheetDate;

        // Build tooltip with full datetime (DD/MM/YYYY HH:mm)
        // Use valueDateStr (from value) or sheetDate as fallback
        let tooltipValue: string | null = null;
        const effectiveDate = valueDateStr || sheetDate;
        if (timeStr && effectiveDate) {
            // Convert date from YYYY-MM-DD to DD/MM/YYYY
            const formattedDate = dayjs(effectiveDate).format('DD/MM/YYYY');
            tooltipValue = `${formattedDate} ${timeStr}`;
        }

        return { display: timeStr || String(value), tooltip: tooltipValue, hasMismatch, missingDateContext };
    }

    return { display: String(value), tooltip: null, hasMismatch: false, missingDateContext: false };
};

interface SheetPreviewTableProps {
    headers: string[];
    rows: Record<string, any>[];
    validatedRows?: ValidatedRow[];
    maxHeight?: string;
    showRowNumbers?: boolean;
    onDeleteRow?: (rowIndex: number) => void;
    onEditRow?: (rowIndex: number, updatedData: Record<string, any>) => void;
    onEditingStateChange?: (isEditing: boolean) => void; // Notify parent when editing state changes
    sheetDate?: string | null; // Date parsed from sheet name (YYYY-MM-DD)
}

/**
 * Reusable table component for displaying Excel sheet data
 * Supports validation state highlighting, row numbers, and row deletion with confirmation
 */
export function SheetPreviewTable({
    headers,
    rows,
    validatedRows,
    maxHeight = '400px',
    showRowNumbers = true,
    onDeleteRow,
    onEditRow,
    onEditingStateChange,
    sheetDate,
}: SheetPreviewTableProps) {
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [rowToDelete, setRowToDelete] = useState<number | null>(null);

    // Edit mode state
    const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
    const [editData, setEditData] = useState<Record<string, any>>({});

    // Fetch options for select dropdowns
    const { options: airlineOptions } = useAirlineOptions();
    const { options: aircraftTypeOptions } = useAircraftTypes();
    const { options: stationOptions } = useStationsOptions();

    // Fetch staff options for CS/MECH columns
    const {
        csStaffOptions,
        mechStaffOptions,
        parseAndMatchStaff,
        isLoading: isLoadingStaff
    } = useStaffListForImport();

    // Fetch CHECK column options (MaintenanceStatus)
    const { options: checkStatusOptions } = useMaintenanceStatus();

    // Create a map of row index to validation status for quick lookup
    const validationMap = new Map<number, ValidatedRow>();
    validatedRows?.forEach((vr) => {
        // originalIndex is Excel row number (2 = first data row)
        validationMap.set(vr.originalIndex - 2, vr);
    });

    const hasValidation = validatedRows && validatedRows.length > 0;

    // Calculate colSpan for empty state
    const getColSpan = () => {
        let span = headers.length;
        if (showRowNumbers) span++;
        if (hasValidation) span++;
        if (onDeleteRow || onEditRow) span++;
        return span;
    };

    // Handle delete button click - open confirmation dialog
    const handleDeleteClick = (rowIndex: number) => {
        setRowToDelete(rowIndex);
        setDeleteConfirmOpen(true);
    };

    // Handle confirmed delete
    const handleConfirmDelete = () => {
        if (rowToDelete !== null && onDeleteRow) {
            onDeleteRow(rowToDelete);
        }
        setDeleteConfirmOpen(false);
        setRowToDelete(null);
    };

    // Handle cancel delete
    const handleCancelDelete = () => {
        setDeleteConfirmOpen(false);
        setRowToDelete(null);
    };

    // Handle edit button click - enter edit mode
    const handleEditClick = (rowIndex: number) => {
        setEditingRowIndex(rowIndex);
        setEditData({ ...rows[rowIndex] });
        onEditingStateChange?.(true);
    };

    // Handle input change in edit mode
    const handleEditChange = (header: string, value: string) => {
        setEditData(prev => ({ ...prev, [header]: value }));
    };

    // Handle save edit
    const handleSaveEdit = () => {
        if (editingRowIndex !== null && onEditRow) {
            onEditRow(editingRowIndex, editData);
        }
        setEditingRowIndex(null);
        setEditData({});
        onEditingStateChange?.(false);
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingRowIndex(null);
        setEditData({});
        onEditingStateChange?.(false);
    };

    return (
        <>
            <div
                className="rounded-md border overflow-auto"
                style={{ maxHeight }}
            >
                <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-20 bg-card">
                        <tr className="border-b">
                            {showRowNumbers && (
                                <th className="h-10 px-3 text-center text-muted-foreground font-medium w-12 whitespace-nowrap bg-card">
                                    #
                                </th>
                            )}
                            {hasValidation && (
                                <th className="h-10 px-3 text-center text-muted-foreground font-medium w-20 whitespace-nowrap bg-card">
                                    Status
                                </th>
                            )}
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    className="h-10 px-3 text-left text-muted-foreground font-medium whitespace-nowrap bg-card"
                                >
                                    {header}
                                </th>
                            ))}
                            {(onDeleteRow || onEditRow) && (
                                <th className="h-10 px-3 text-center text-muted-foreground font-medium w-20 whitespace-nowrap sticky right-0 bg-card shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.15)] z-30">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {rows.length === 0 ? (
                            <tr className="border-b">
                                <td
                                    colSpan={getColSpan()}
                                    className="h-16 text-center text-muted-foreground"
                                >
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, rowIndex) => {
                                const validation = validationMap.get(rowIndex);
                                const isValid = validation?.isValid ?? true;

                                return (
                                    <tr
                                        key={rowIndex}
                                        className={cn(
                                            'border-b transition-colors hover:bg-muted/50',
                                            hasValidation && !isValid && 'bg-red-50 dark:bg-red-950/20'
                                        )}
                                    >
                                        {showRowNumbers && (
                                            <td className="p-3 text-center text-muted-foreground font-mono text-xs bg-card">
                                                {rowIndex + 1}
                                            </td>
                                        )}
                                        {hasValidation && (
                                            <td className="p-3 text-center bg-card">
                                                <Badge
                                                    color={isValid ? 'success' : 'destructive'}
                                                    className="text-xs"
                                                >
                                                    {isValid ? 'Valid' : 'Error'}
                                                </Badge>
                                            </td>
                                        )}
                                        {headers.map((header, colIndex) => {
                                            // Check if this cell has a validation error
                                            const cellHasError = validation?.errors.some(
                                                (e) => e.column === header ||
                                                    // Check against mapped field names
                                                    e.column.toLowerCase().includes(header.toLowerCase().replace(/[^a-z]/gi, ''))
                                            );

                                            const isEditing = editingRowIndex === rowIndex;

                                            // Determine column type for edit mode
                                            const isAirlineColumn = AIRLINE_COLUMNS.includes(header.toUpperCase());
                                            const isAircraftTypeColumn = AIRCRAFT_TYPE_COLUMNS.includes(header.toUpperCase());
                                            const isStationColumn = STATION_COLUMNS.includes(header.toUpperCase());
                                            const isStaffColumn = STAFF_COLUMNS.includes(header.toUpperCase());
                                            const staffType = header.toUpperCase() === 'CS' ? 'CS' : 'MECH';
                                            const isTimeColumn = TIME_COLUMNS.some(col => header.toUpperCase().includes(col));
                                            const isCheckColumn = CHECK_COLUMNS.includes(header.toUpperCase());

                                            // Render edit input based on column type
                                            const renderEditInput = () => {
                                                if (isAirlineColumn) {
                                                    // Find selected airline option to show label
                                                    const selectedAirline = airlineOptions.find(
                                                        opt => opt.value === editData[header] || opt.label === editData[header]
                                                    );
                                                    return (
                                                        <Select
                                                            value={selectedAirline?.label ?? editData[header] ?? ''}
                                                            onValueChange={(selectedLabel) => {
                                                                // Store the label (name) when selected
                                                                handleEditChange(header, selectedLabel);
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-7 min-w-[120px] text-sm">
                                                                <SelectValue placeholder="Select Airline..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {airlineOptions.map((option) => (
                                                                    <SelectItem key={option.value} value={option.label}>
                                                                        {option.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    );
                                                }

                                                if (isAircraftTypeColumn) {
                                                    return (
                                                        <Select
                                                            value={editData[header] ?? ''}
                                                            onValueChange={(value) => handleEditChange(header, value)}
                                                        >
                                                            <SelectTrigger className="h-7 min-w-[100px] text-sm">
                                                                <SelectValue placeholder="Select A/C Type..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {aircraftTypeOptions.map((option) => (
                                                                    <SelectItem key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    );
                                                }

                                                if (isStationColumn) {
                                                    return (
                                                        <Select
                                                            value={editData[header] ?? ''}
                                                            onValueChange={(value) => handleEditChange(header, value)}
                                                        >
                                                            <SelectTrigger className="h-7 min-w-[80px] text-sm">
                                                                <SelectValue placeholder="Select Station..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {stationOptions.map((option) => (
                                                                    <SelectItem key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    );
                                                }

                                                // Time columns: use date picker + time input
                                                if (isTimeColumn) {
                                                    // Parse current value to get date and time
                                                    let timeValue = '';
                                                    let dateValue: Date | undefined = sheetDate ? dayjs(sheetDate).toDate() : undefined;
                                                    const currentValue = editData[header];

                                                    if (typeof currentValue === 'number') {
                                                        // Excel datetime format
                                                        if (currentValue >= 1) {
                                                            const excelDate = Math.floor(currentValue);
                                                            const excelTime = currentValue - excelDate;
                                                            const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                                                            dateValue = jsDate;

                                                            const totalMinutes = Math.round(excelTime * 24 * 60);
                                                            const hours = Math.floor(totalMinutes / 60) % 24;
                                                            const minutes = totalMinutes % 60;
                                                            timeValue = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                                        } else {
                                                            const totalMinutes = Math.round(currentValue * 24 * 60);
                                                            const hours = Math.floor(totalMinutes / 60) % 24;
                                                            const minutes = totalMinutes % 60;
                                                            timeValue = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                                        }
                                                    } else if (typeof currentValue === 'string') {
                                                        const trimmed = currentValue.trim();
                                                        // Check if already in datetime format (YYYY-MM-DD HH:mm or DD/MM/YYYY HH:mm)
                                                        if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
                                                            timeValue = trimmed.length === 4 ? `0${trimmed}` : trimmed;
                                                        } else {
                                                            const parsed = dayjs(trimmed);
                                                            if (parsed.isValid()) {
                                                                timeValue = parsed.format('HH:mm');
                                                                // If parsed date is different from default, use it
                                                                const parsedDate = parsed.format('YYYY-MM-DD');
                                                                if (parsedDate !== '1970-01-01') {
                                                                    dateValue = parsed.toDate();
                                                                }
                                                            }
                                                        }
                                                    }

                                                    // Handle datetime change (combine date + time)
                                                    const handleDateTimeChange = (newDate?: Date, newTime?: string) => {
                                                        const finalDate = newDate || dateValue || new Date();
                                                        const finalTime = newTime || timeValue || '00:00';
                                                        // Store as ISO-like format: YYYY-MM-DD HH:mm
                                                        const combined = `${dayjs(finalDate).format('YYYY-MM-DD')} ${finalTime}`;
                                                        handleEditChange(header, combined);
                                                    };

                                                    return (
                                                        <div className="flex items-center gap-1">
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 w-[100px] justify-start text-left font-normal text-xs"
                                                                    >
                                                                        <CalendarIcon className="mr-1 h-3 w-3" />
                                                                        {dateValue ? dayjs(dateValue).format('DD/MM/YY') : 'Date'}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={dateValue}
                                                                        onSelect={(date) => handleDateTimeChange(date, timeValue)}
                                                                        initialFocus
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                            <Input
                                                                type="time"
                                                                value={timeValue}
                                                                onChange={(e) => handleDateTimeChange(dateValue, e.target.value)}
                                                                className="h-7 w-[85px] text-sm"
                                                            />
                                                        </div>
                                                    );
                                                }

                                                // Staff columns: multi-select search dropdown
                                                if (isStaffColumn) {
                                                    const options = staffType === 'CS' ? csStaffOptions : mechStaffOptions;
                                                    const currentValue = String(editData[header] || '');
                                                    const selectedNames = currentValue.split(',').map(n => n.trim()).filter(Boolean);

                                                    return (
                                                        <div className="flex flex-col gap-1 min-w-[180px]">
                                                            <Select
                                                                value=""
                                                                onValueChange={(value) => {
                                                                    // Add staff name to the list
                                                                    const newNames = [...selectedNames, value].join(', ');
                                                                    handleEditChange(header, newNames);
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-7 text-sm">
                                                                    <SelectValue placeholder={`Add ${staffType} staff...`} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {options
                                                                        .filter(opt => !selectedNames.some(n =>
                                                                            n.toUpperCase() === opt.name.toUpperCase()
                                                                        ))
                                                                        .map((option) => (
                                                                            <SelectItem key={option.id} value={option.name}>
                                                                                {option.name} ({option.code})
                                                                            </SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                            {/* Selected staff chips */}
                                                            {selectedNames.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {selectedNames.map((name, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                                                                        >
                                                                            {name}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newNames = selectedNames.filter((_, idx) => idx !== i).join(', ');
                                                                                    handleEditChange(header, newNames);
                                                                                }}
                                                                                className="ml-1 text-blue-600 dark:text-blue-300 hover:text-red-500"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // CHECK column: Select dropdown
                                                if (isCheckColumn) {
                                                    return (
                                                        <Select
                                                            value={editData[header] ?? ''}
                                                            onValueChange={(value) => handleEditChange(header, value)}
                                                        >
                                                            <SelectTrigger className="h-7 min-w-[120px] text-sm">
                                                                <SelectValue placeholder="Select Status..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {checkStatusOptions.map((option) => (
                                                                    <SelectItem key={option.id} value={option.value}>
                                                                        {option.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    );
                                                }

                                                // Default: Input field with placeholder
                                                return (
                                                    <Input
                                                        value={editData[header] ?? ''}
                                                        onChange={(e) => handleEditChange(header, e.target.value)}
                                                        placeholder={header}
                                                        className="h-7 min-w-[100px] text-sm"
                                                    />
                                                );
                                            };

                                            // Check if value exists in options (for validation display)
                                            const cellValue = row[header];
                                            let optionWarning: string | null = null;

                                            if (cellValue && !isEditing) {
                                                if (isAirlineColumn) {
                                                    const match = findOptionMatch(cellValue, airlineOptions, 'label');
                                                    if (!match) {
                                                        optionWarning = `Airline "${cellValue}" not found in database`;
                                                    }
                                                } else if (isAircraftTypeColumn) {
                                                    const match = findOptionMatch(cellValue, aircraftTypeOptions, 'value');
                                                    if (!match) {
                                                        optionWarning = `A/C Type "${cellValue}" not found in database`;
                                                    }
                                                } else if (isStationColumn) {
                                                    const match = findOptionMatch(cellValue, stationOptions, 'value');
                                                    if (!match) {
                                                        optionWarning = `Station "${cellValue}" not found in database`;
                                                    }
                                                } else if (isStaffColumn) {
                                                    // Check each staff name in the comma-separated list
                                                    const result = parseAndMatchStaff(String(cellValue), staffType as 'CS' | 'MECH');
                                                    if (result.notFound.length > 0) {
                                                        optionWarning = `Staff not found: ${result.notFound.join(', ')}`;
                                                    }
                                                } else if (isCheckColumn) {
                                                    // Check if CHECK value exists in MaintenanceStatus options
                                                    const match = findOptionMatch(cellValue, checkStatusOptions, 'value');
                                                    if (!match) {
                                                        optionWarning = `Status "${cellValue}" not found in database`;
                                                    }
                                                }
                                            }

                                            const hasWarning = optionWarning !== null;

                                            return (
                                                <td
                                                    key={colIndex}
                                                    className={cn(
                                                        'p-3 whitespace-nowrap',
                                                        cellHasError && 'text-red-600 dark:text-red-400 font-medium',
                                                        hasWarning && !cellHasError && 'bg-amber-50 dark:bg-amber-900/20'
                                                    )}
                                                >
                                                    {isEditing ? (
                                                        renderEditInput()
                                                    ) : (() => {
                                                        const formatted = formatCellValue(header, cellValue, sheetDate);

                                                        // Show warning for option mismatch or missing date context
                                                        if (hasWarning || formatted.missingDateContext) {
                                                            const warningTitle = optionWarning ||
                                                                (formatted.missingDateContext ? 'Missing date context: Sheet name is not a valid date' : '');
                                                            return (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span
                                                                        title={formatted.tooltip || undefined}
                                                                        className={cn(
                                                                            formatted.missingDateContext && 'text-amber-600 dark:text-amber-400'
                                                                        )}
                                                                    >
                                                                        {formatted.display}
                                                                    </span>
                                                                    <span
                                                                        className="text-amber-500 cursor-help"
                                                                        title={warningTitle}
                                                                    >
                                                                        <AlertTriangle className="h-4 w-4" />
                                                                    </span>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <span
                                                                title={formatted.tooltip || undefined}
                                                                className={cn(
                                                                    formatted.tooltip && 'cursor-help',
                                                                    formatted.hasMismatch && 'text-orange-500 dark:text-orange-400 font-medium'
                                                                )}
                                                            >
                                                                {formatted.display}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            );
                                        })}
                                        {(onDeleteRow || onEditRow) && (
                                            <td className="p-3 text-center sticky right-0 bg-card shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.15)]">
                                                {editingRowIndex === rowIndex ? (
                                                    <div className="flex items-center gap-1 justify-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-green-500 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                                                            onClick={handleSaveEdit}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/30"
                                                            onClick={handleCancelEdit}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 justify-center">
                                                        {onEditRow && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                onClick={() => handleEditClick(rowIndex)}
                                                                disabled={editingRowIndex !== null}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {onDeleteRow && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                onClick={() => handleDeleteClick(rowIndex)}
                                                                disabled={editingRowIndex !== null}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบข้อมูล</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>คุณต้องการลบแถวที่ {rowToDelete !== null ? rowToDelete + 1 : ''} ใช่หรือไม่?</p>

                                {/* Row Data Preview */}
                                {rowToDelete !== null && rows[rowToDelete] && (
                                    <div className="mt-3 p-3 bg-muted/50 rounded-lg border max-h-48 overflow-auto">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">ข้อมูลที่จะถูกลบ:</p>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {headers.slice(0, 8).map((header, index) => {
                                                const value = rows[rowToDelete][header];
                                                return (
                                                    <div key={index} className="flex gap-2">
                                                        <span className="text-muted-foreground font-medium min-w-[100px]">{header}:</span>
                                                        <span className="text-foreground truncate">
                                                            {value !== undefined && value !== '' ? String(value) : '-'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {headers.length > 8 && (
                                                <div className="col-span-2 text-xs text-muted-foreground">
                                                    ... และอีก {headers.length - 8} columns
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <p className="text-destructive text-xs">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelDelete}>
                            ยกเลิก
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            ลบข้อมูล
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
