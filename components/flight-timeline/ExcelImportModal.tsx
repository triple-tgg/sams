'use client';

import { useState } from 'react';
import { AlertTriangle, CalendarIcon, Check, CheckCircle, ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, Pencil, Upload, X } from 'lucide-react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SheetPreviewTable } from './SheetPreviewTable';
import { ErrorTable } from './ErrorTable';
import { ParsedSheet, ValidatedRow } from './types/flight-import.types';
import { cn } from '@/lib/utils';

// Enable custom parse format plugin
dayjs.extend(customParseFormat);

/**
 * Format sheet name as date if it matches DDMMYYYY format
 * e.g., '13022026' -> '13/02/2026'
 */
const formatSheetName = (name: string): string => {
    // Check if name matches DDMMYYYY format (8 digits)
    if (/^\d{8}$/.test(name)) {
        const parsed = dayjs(name, 'DDMMYYYY');
        if (parsed.isValid()) {
            return parsed.format('DD/MM/YYYY');
        }
    }
    // Check if name matches DMYYYY or DDMYYYY etc. patterns
    if (/^\d{6,8}$/.test(name)) {
        // Try parsing as DDMMYYYY
        const parsed = dayjs(name.padStart(8, '0'), 'DDMMYYYY');
        if (parsed.isValid()) {
            return parsed.format('DD/MM/YYYY');
        }
    }
    return name;
};

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    sheets: ParsedSheet[];
    activeSheetIndex: number;
    onSheetChange: (index: number) => void;
    validatedRows: ValidatedRow[];
    validatedRowsBySheet: Record<number, ValidatedRow[]>;
    hasValidated: boolean;
    validRows: ValidatedRow[];
    invalidRows: ValidatedRow[];
    warningRows: ValidatedRow[];
    canUpload: boolean;
    isValidating: boolean;
    isUploading: boolean;
    onValidate: () => void;
    onUpload: () => void;
    onDeleteRow?: (rowIndex: number) => void;
    onEditRow?: (rowIndex: number, updatedData: Record<string, any>) => void;
    onUpdateSheetName?: (sheetIndex: number, newName: string) => void;
}

/**
 * Modal component for Excel import with multi-sheet preview and validation
 * Features:
 * - Multiple sheet tabs for navigation
 * - Preview table showing parsed data
 * - Validate button to check data against schema
 * - Error table showing invalid rows with detailed error notes
 * - Upload button (enabled only when validation passes)
 */
export function ExcelImportModal({
    isOpen,
    onClose,
    sheets,
    activeSheetIndex,
    onSheetChange,
    validatedRows,
    validatedRowsBySheet,
    hasValidated,
    validRows,
    invalidRows,
    warningRows,
    canUpload,
    isValidating,
    isUploading,
    onValidate,
    onUpload,
    onDeleteRow,
    onEditRow,
    onUpdateSheetName,
}: ExcelImportModalProps) {
    const activeSheet = sheets[activeSheetIndex];

    // Helper to check if a sheet has errors or warnings
    const getSheetStatus = (sheetIndex: number): { hasErrors: boolean; hasWarnings: boolean } => {
        const sheetValidation = validatedRowsBySheet[sheetIndex] || [];
        const hasErrors = sheetValidation.some(v => !v.isValid);
        const hasWarnings = sheetValidation.some(v => v.warnings && v.warnings.length > 0);
        return { hasErrors, hasWarnings };
    };

    // Sheet name editing state
    const [isEditingSheetName, setIsEditingSheetName] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    // Row editing state - track when a row is being edited
    const [isEditingRow, setIsEditingRow] = useState(false);

    // View state - track whether to show errors or preview
    const [showErrorsView, setShowErrorsView] = useState(false);

    // Check if sheet name is a valid date
    const isSheetDateValid = activeSheet?.sheetDate !== null && activeSheet?.sheetDate !== undefined;

    // Handle date select from calendar
    const handleDateSelect = (date: Date | undefined) => {
        if (date && onUpdateSheetName) {
            const formattedDate = dayjs(date).format('DD/MM/YYYY');
            onUpdateSheetName(activeSheetIndex, formattedDate);
        }
        setIsEditingSheetName(false);
    };

    // Handle start editing - initialize with current date if valid
    const handleStartEditing = () => {
        if (activeSheet.sheetDate) {
            setSelectedDate(dayjs(activeSheet.sheetDate).toDate());
        } else {
            setSelectedDate(new Date());
        }
        setIsEditingSheetName(true);
    };

    if (!activeSheet) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent size="lg" className="max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        Import Excel Data
                    </DialogTitle>
                    <DialogDescription>
                        Review the data from your Excel file. Validate before uploading to ensure data integrity.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-between gap-2">
                    {/* Sheet Tabs with Arrow Navigation */}
                    <div className="flex items-center gap-1 flex-1">
                        {/* Left Arrow */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => !isEditingRow && activeSheetIndex > 0 && onSheetChange(activeSheetIndex - 1)}
                            disabled={activeSheetIndex === 0 || isEditingRow}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        {/* Tab List */}
                        <div className="flex items-center gap-1 overflow-x-auto flex-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            {sheets.map((sheet, index) => {
                                const isActive = activeSheetIndex === index && !showErrorsView;
                                const { hasErrors, hasWarnings } = hasValidated ? getSheetStatus(index) : { hasErrors: false, hasWarnings: false };

                                return (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (isEditingRow) return;
                                            setShowErrorsView(false);
                                            onSheetChange(index);
                                        }}
                                        disabled={isEditingRow}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-sm relative',
                                            isActive && 'bg-primary text-primary-foreground shadow-sm',
                                            !isActive && hasErrors && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50',
                                            !isActive && !hasErrors && hasWarnings && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50',
                                            !isActive && !hasErrors && !hasWarnings && 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400',
                                            isEditingRow && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        {/* Error/Warning indicator dot */}
                                        {hasErrors && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-800" />
                                        )}
                                        {!hasErrors && hasWarnings && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white dark:border-slate-800" />
                                        )}
                                        {formatSheetName(sheet.name)}
                                        <span className={cn(
                                            'text-xs px-1.5 py-0.5 rounded',
                                            isActive
                                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                                : hasErrors
                                                    ? 'bg-red-200 dark:bg-red-800'
                                                    : hasWarnings
                                                        ? 'bg-amber-200 dark:bg-amber-800'
                                                        : 'bg-slate-200 dark:bg-slate-600'
                                        )}>
                                            {sheet.rows.length}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Arrow */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => !isEditingRow && activeSheetIndex < sheets.length - 1 && onSheetChange(activeSheetIndex + 1)}
                            disabled={activeSheetIndex === sheets.length - 1 || isEditingRow}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Validation Errors Tab */}
                    {hasValidated && invalidRows.length > 0 && (
                        <button
                            onClick={() => !isEditingRow && setShowErrorsView(true)}
                            disabled={isEditingRow}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm',
                                'border border-red-200 dark:border-red-800',
                                showErrorsView && 'bg-red-600 text-white border-red-600',
                                !showErrorsView && 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
                                isEditingRow && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <X className="w-4 h-4" />
                            Errors
                            <Badge color="destructive">
                                {invalidRows.length}
                            </Badge>
                        </button>
                    )}
                </div>
                {/* Summary Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground py-2 px-1 ">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Sheet:</span>
                        {isEditingSheetName ? (
                            <div className="flex items-center gap-1">
                                <Popover open={isEditingSheetName} onOpenChange={setIsEditingSheetName}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-8 w-[140px] justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedDate ? dayjs(selectedDate).format('DD/MM/YYYY') : 'Select date...'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={handleDateSelect}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                                    onClick={() => setIsEditingSheetName(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <span className={cn(!isSheetDateValid && 'text-amber-600 font-medium')}>
                                    {formatSheetName(activeSheet.name)}
                                </span>
                                {!isSheetDateValid && (
                                    <span title="Sheet name is not a valid date format">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    </span>
                                )}
                                {onUpdateSheetName && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
                                        onClick={handleStartEditing}
                                        disabled={isEditingRow}
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Rows:</span>
                        <span>{activeSheet.rows.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Columns:</span>
                        <span>{activeSheet.headers.length}</span>
                    </div>
                    {hasValidated && (
                        <>
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>{validRows.length} valid</span>
                            </div>
                            {invalidRows.length > 0 && (
                                <div className="flex items-center gap-2 text-red-600">
                                    <X className="w-4 h-4" />
                                    <span>{invalidRows.length} invalid</span>
                                </div>
                            )}
                        </>
                    )}
                </div>



                {/* Data Content */}
                <div className="flex-1 overflow-hidden">
                    {/* Check if showing errors view */}
                    {showErrorsView && hasValidated && invalidRows.length > 0 ? (
                        <div className="h-full flex flex-col">
                            <ErrorTable
                                headers={activeSheet.headers}
                                invalidRows={invalidRows}
                                maxHeight="400px"
                            />
                        </div>
                    ) : (
                        <SheetPreviewTable
                            headers={activeSheet.headers}
                            rows={activeSheet.rows}
                            validatedRows={hasValidated ? validatedRows : undefined}
                            maxHeight="400px"
                            onDeleteRow={onDeleteRow}
                            onEditRow={onEditRow}
                            onEditingStateChange={setIsEditingRow}
                            sheetDate={activeSheet.sheetDate}
                        />
                    )}
                </div>

                {/* Footer Actions */}
                <DialogFooter className="flex items-center justify-between gap-4 pt-4 border-t">
                    {/* Warning message when rows have warnings */}
                    {hasValidated && warningRows.length > 0 && (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>
                                {warningRows.length} row(s) have warnings - please fix before uploading
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between gap-4 ">
                        <Button variant="outline" onClick={onClose} disabled={isValidating || isUploading}>
                            Cancel
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="soft"
                                color="info"
                                onClick={onValidate}
                                disabled={isValidating || isUploading || isEditingRow || activeSheet.rows.length === 0}
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Validate Data
                                    </>
                                )}
                            </Button>

                            <Button
                                color="success"
                                onClick={onUpload}
                                disabled={!canUpload || isUploading || isEditingRow}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload ({validRows.length} rows)
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
