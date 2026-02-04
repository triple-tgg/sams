'use client';

import { useState } from 'react';
import { AlertTriangle, CalendarIcon, Check, CheckCircle, FileSpreadsheet, Loader2, Pencil, Upload, X } from 'lucide-react';
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
    hasValidated: boolean;
    validRows: ValidatedRow[];
    invalidRows: ValidatedRow[];
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
    hasValidated,
    validRows,
    invalidRows,
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

    // Sheet name editing state
    const [isEditingSheetName, setIsEditingSheetName] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    // Row editing state - track when a row is being edited
    const [isEditingRow, setIsEditingRow] = useState(false);

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

                {/* Sheet Tabs */}
                {sheets.length > 1 && (
                    <Tabs
                        value={String(activeSheetIndex)}
                        onValueChange={(value) => !isEditingRow && onSheetChange(Number(value))}
                        className="w-full"
                    >
                        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            {sheets.map((sheet, index) => (
                                <TabsTrigger
                                    key={index}
                                    value={String(index)}
                                    disabled={isEditingRow}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-md transition-all',
                                        'data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700',
                                        'data-[state=active]:shadow-sm',
                                        isEditingRow && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    {formatSheetName(sheet.name)}
                                    <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">
                                        {sheet.rows.length}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}

                {/* Summary Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground py-2 px-1 border-b">
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

                {/* Data Preview Tabs */}
                <div className="flex-1 overflow-hidden">
                    <Tabs defaultValue="preview" className="h-full flex flex-col">
                        <TabsList className="w-fit bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-2">
                            <TabsTrigger
                                value="preview"
                                disabled={isEditingRow}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-md transition-all',
                                    'data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700',
                                    'data-[state=active]:shadow-sm',
                                    isEditingRow && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                Data Preview
                                <Badge color="secondary" className="ml-1">
                                    {activeSheet.rows.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="errors"
                                disabled={!hasValidated || invalidRows.length === 0 || isEditingRow}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-md transition-all',
                                    'data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700',
                                    'data-[state=active]:shadow-sm',
                                    hasValidated && invalidRows.length > 0 && 'text-red-600 dark:text-red-400',
                                    isEditingRow && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                Validation Errors
                                {hasValidated && invalidRows.length > 0 && (
                                    <Badge color="destructive" className="ml-1">
                                        {invalidRows.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="preview" className="flex-1 overflow-hidden mt-0">
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
                        </TabsContent>

                        <TabsContent value="errors" className="flex-1 overflow-hidden mt-0">
                            {hasValidated && invalidRows.length > 0 && (
                                <ErrorTable
                                    headers={activeSheet.headers}
                                    invalidRows={invalidRows}
                                    maxHeight="400px"
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Footer Actions */}
                <DialogFooter className="flex items-center justify-between gap-4 pt-4 border-t">
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
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
