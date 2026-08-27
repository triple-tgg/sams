'use client';

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileUp, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ParsedStaffRow {
    rowIndex: number;
    data: Record<string, string>;
}

interface ParsedSheet {
    name: string;
    headers: string[];
    rows: ParsedStaffRow[];
}

interface StaffExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess?: () => void;
}

export function StaffExcelImportModal({ isOpen, onClose, onImportSuccess }: StaffExcelImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>('');
    const [sheets, setSheets] = useState<ParsedSheet[]>([]);
    const [activeSheetIndex, setActiveSheetIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [hasFile, setHasFile] = useState(false);

    const activeSheet = sheets[activeSheetIndex];
    const totalRows = sheets.reduce((sum, s) => sum + s.rows.length, 0);

    const resetState = useCallback(() => {
        setFileName('');
        setSheets([]);
        setActiveSheetIndex(0);
        setHasFile(false);
        setIsLoading(false);
        setIsImporting(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [resetState, onClose]);

    const parseSheet = (worksheet: XLSX.WorkSheet, sheetName: string): ParsedSheet | null => {
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        if (jsonData.length === 0) return null;

        const headers = Object.keys(jsonData[0]);
        const rows: ParsedStaffRow[] = jsonData.map((row, index) => ({
            rowIndex: index + 1,
            data: headers.reduce((acc, header) => {
                acc[header] = String(row[header] ?? '');
                return acc;
            }, {} as Record<string, string>),
        }));

        return { name: sheetName, headers, rows };
    };

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setFileName(file.name);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });

            const parsedSheets: ParsedSheet[] = [];
            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                const parsed = parseSheet(worksheet, sheetName);
                if (parsed) {
                    parsedSheets.push(parsed);
                }
            }

            if (parsedSheets.length === 0) {
                toast.error('ไฟล์ Excel ไม่มีข้อมูล');
                resetState();
                return;
            }

            setSheets(parsedSheets);
            setActiveSheetIndex(0);
            setHasFile(true);
        } catch (error) {
            console.error('Failed to parse Excel file:', error);
            toast.error('ไม่สามารถอ่านไฟล์ Excel ได้');
            resetState();
        } finally {
            setIsLoading(false);
        }
    }, [resetState]);

    const handleImport = useCallback(async () => {
        setIsImporting(true);
        try {
            // TODO: Call API to import staff data
            // await importStaffFromExcel(sheets);
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success(`นำเข้าข้อมูลสำเร็จ ${totalRows} รายการ`);
            onImportSuccess?.();
            handleClose();
        } catch (error) {
            console.error('Import failed:', error);
            toast.error('นำเข้าข้อมูลล้มเหลว');
        } finally {
            setIsImporting(false);
        }
    }, [totalRows, onImportSuccess, handleClose]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent size="lg" className="max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        Import Staff from Excel
                    </DialogTitle>
                    <DialogDescription>
                        เลือกไฟล์ Excel (.xlsx) เพื่อนำเข้าข้อมูล Staff ตรวจสอบข้อมูลก่อนทำการ Import
                    </DialogDescription>
                </DialogHeader>

                {/* File Upload Area */}
                {!hasFile && (
                    <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <FileUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">คลิกเพื่อเลือกไฟล์ Excel</p>
                            <p className="text-sm text-muted-foreground mt-1">รองรับไฟล์ .xlsx, .xls</p>
                        </div>
                        {isLoading && (
                            <div className="flex items-center gap-2 text-primary">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">กำลังอ่านไฟล์...</span>
                            </div>
                        )}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {/* Preview */}
                {hasFile && activeSheet && (
                    <>
                        {/* File Info & Sheet Tabs */}
                        <div className="flex items-center justify-between gap-4 text-sm py-2 px-1 border-b">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="font-medium truncate max-w-[180px]">{fileName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span>{totalRows} total rows</span>
                                <span>·</span>
                                <span>{sheets.length} sheet{sheets.length > 1 ? 's' : ''}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground shrink-0"
                                onClick={() => {
                                    resetState();
                                    fileInputRef.current?.click();
                                }}
                            >
                                เปลี่ยนไฟล์
                            </Button>
                        </div>

                        {/* Sheet Tabs */}
                        {sheets.length > 1 && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => activeSheetIndex > 0 && setActiveSheetIndex(activeSheetIndex - 1)}
                                    disabled={activeSheetIndex === 0}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                <div className="flex items-center gap-1 overflow-x-auto flex-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    {sheets.map((sheet, index) => {
                                        const isActive = activeSheetIndex === index;
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => setActiveSheetIndex(index)}
                                                className={cn(
                                                    'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-sm',
                                                    isActive && 'bg-primary text-primary-foreground shadow-sm',
                                                    !isActive && 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                )}
                                            >
                                                {sheet.name}
                                                <span className={cn(
                                                    'text-xs px-1.5 py-0.5 rounded',
                                                    isActive
                                                        ? 'bg-primary-foreground/20 text-primary-foreground'
                                                        : 'bg-slate-200 dark:bg-slate-600'
                                                )}>
                                                    {sheet.rows.length}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => activeSheetIndex < sheets.length - 1 && setActiveSheetIndex(activeSheetIndex + 1)}
                                    disabled={activeSheetIndex === sheets.length - 1}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {/* Active Sheet Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground px-1">
                            <span className="font-medium">Sheet: {activeSheet.name}</span>
                            <Badge color="default">{activeSheet.rows.length} rows</Badge>
                            <Badge color="default">{activeSheet.headers.length} columns</Badge>
                        </div>

                        {/* Scrollable Table */}
                        <div className="flex-1 overflow-auto border rounded-lg" style={{ maxHeight: '400px' }}>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[50px] text-center sticky left-0 bg-muted/50 z-10">#</TableHead>
                                        {activeSheet.headers.map((header, idx) => (
                                            <TableHead key={idx} className="whitespace-nowrap min-w-[120px]">
                                                {header}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeSheet.rows.map((row) => (
                                        <TableRow key={row.rowIndex}>
                                            <TableCell className="text-center text-muted-foreground sticky left-0 bg-background z-10 font-mono text-xs">
                                                {row.rowIndex}
                                            </TableCell>
                                            {activeSheet.headers.map((header, idx) => (
                                                <TableCell key={idx} className="whitespace-nowrap text-sm">
                                                    {row.data[header] || '-'}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}

                {/* Footer Actions */}
                <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                        Cancel
                    </Button>
                    {hasFile && (
                        <Button
                            color="success"
                            onClick={handleImport}
                            disabled={isImporting || totalRows === 0}
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import ({totalRows} rows)
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
