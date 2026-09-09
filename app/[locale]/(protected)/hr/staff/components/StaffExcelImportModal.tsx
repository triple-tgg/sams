'use client';

import { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    AlertCircle,
    AlertTriangle,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    FileSpreadsheet,
    FileUp,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
    importStaff,
    buildImportStaffPayload,
    fetchKnownStaffIndex,
    buildStaffNameReference,
    findUnknownEmployeeIds,
    findNameMismatches,
    countImportStaffPayloadRows,
    normalizeKey,
    sectionForSheet,
    type ImportStaffSummary,
} from '@/lib/api/migration/importStaff';
import { useStaffDepartmentPositions } from '@/lib/api/master/organization.hooks';
import { useAircraftTypeLicenses } from '@/lib/api/master/aircraft-type-licenses.hooks';
import { useAmelCategories } from '@/lib/api/master/amel-categories.hooks';
import { useCourseList } from '@/lib/api/qa/course.hooks';
import type { CourseData } from '@/lib/api/qa/course';
import { useCombinations } from '@/lib/api/master/aircraft-engine/aircraftEngine.hooks';
import type { AircraftEngineCombination } from '@/lib/api/master/aircraft-engine/aircraftEngine.types';
import {
    parseAndSplitAircraftLicense,
    computeRowAircraftLicenseDisplay,
    type SplitAircraftCombinationItem,
} from '@/lib/utils/aircraftLicenseSplitter';

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
    initialFile?: File | null;
}

function findMatchingOption(
    val: string | undefined,
    options: Array<{ id: number; name: string; code?: string | null }>
) {
    if (!val || !val.trim()) return null;
    const clean = normalizeKey(val);
    return (
        options.find(
            (opt) =>
                normalizeKey(opt.name) === clean ||
                (opt.code && normalizeKey(opt.code) === clean) ||
                String(opt.id) === val.trim()
        ) || null
    );
}

function findMatchingCourse(
    val: string | undefined,
    courses: CourseData[]
) {
    if (!val || !val.trim()) return null;
    const clean = normalizeKey(val);
    if (!clean) return null;

    // 1. Exact normalized match
    const exact = courses.find(
        (c) =>
            normalizeKey(c.courseCode) === clean ||
            normalizeKey(c.courseName) === clean ||
            normalizeKey(`${c.courseCode} - ${c.courseName}`) === clean ||
            normalizeKey(`${c.courseCode} — ${c.courseName}`) === clean ||
            normalizeKey(`${c.courseCode} ${c.courseName}`) === clean ||
            String(c.id) === val.trim()
    );
    if (exact) return exact;

    // 2. Partial match if length >= 4
    if (clean.length >= 4) {
        const partial = courses.find((c) => {
            const codeKey = normalizeKey(c.courseCode);
            const nameKey = normalizeKey(c.courseName);
            return (
                codeKey === clean ||
                nameKey === clean ||
                (nameKey.length >= 6 && nameKey.includes(clean)) ||
                (clean.length >= 6 && clean.includes(nameKey))
            );
        });
        if (partial) return partial;
    }

    return null;
}

function isDateColumn(header: string): boolean {
    const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isDateMatch = (
        h.includes('date') ||
        h.includes('dob') ||
        h.includes('birth') ||
        h.includes('joined') ||
        h.includes('expire') ||
        h.includes('expiry') ||
        h.includes('issued') ||
        h.includes('validfrom') ||
        h.includes('validto') ||
        h.includes('validuntil') ||
        h.includes('valid') ||
        h.includes('periodfrom') ||
        h.includes('periodto')
    );

    if (!isDateMatch) return false;

    if (
        h.includes('number') ||
        h.includes('license') ||
        h.includes('code') ||
        h.includes('phone') ||
        h.includes('cardno')
    ) {
        if (
            !h.includes('date') &&
            !h.includes('dob') &&
            !h.includes('birth') &&
            !h.includes('expire') &&
            !h.includes('expiry') &&
            !h.includes('valid')
        ) {
            return false;
        }
    }

    return true;
}

function isTruncatedColumn(header: string): boolean {
    const h = header.toLowerCase();
    return (
        h.includes('position') ||
        h.includes('title') ||
        h.includes('course') ||
        h.includes('training') ||
        h.includes('category')
    );
}

function isValidDateValue(d: number, m: number, y: number): boolean {
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return false;
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function formatExcelDate(value: any, isDateCol: boolean): string {
    if (value === null || value === undefined || value === '') return '';

    if (!isDateCol && !(value instanceof Date)) {
        return String(value);
    }

    if (value instanceof Date) {
        if (isNaN(value.getTime())) return String(value);
        const d = value.getDate();
        const m = value.getMonth() + 1;
        let y = value.getFullYear();
        if (y > 2400) y -= 543;
        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }

    if (typeof value === 'number') {
        if (isDateCol) {
            try {
                const parsed = XLSX.SSF.parse_date_code(value);
                if (parsed && parsed.y && parsed.m && parsed.d) {
                    let y = parsed.y;
                    if (y > 2400) y -= 543;
                    if (isValidDateValue(parsed.d, parsed.m, y)) {
                        return `${String(parsed.d).padStart(2, '0')}/${String(parsed.m).padStart(2, '0')}/${y}`;
                    }
                }
            } catch {
                // fallback
            }
        }
        return String(value);
    }

    const str = String(value).trim();
    if (!str) return '';

    if (str.toLowerCase() === 'never' || str.toLowerCase() === 'never expire' || str.toLowerCase() === 'n/a') {
        return 'Never';
    }

    if (isDateCol && /^\d{4,5}(\.\d+)?$/.test(str)) {
        const num = Number(str);
        try {
            const parsed = XLSX.SSF.parse_date_code(num);
            if (parsed && parsed.y && parsed.m && parsed.d) {
                let y = parsed.y;
                if (y > 2400) y -= 543;
                if (isValidDateValue(parsed.d, parsed.m, y)) {
                    return `${String(parsed.d).padStart(2, '0')}/${String(parsed.m).padStart(2, '0')}/${y}`;
                }
            }
        } catch {
            // fallback
        }
    }

    if (isDateCol) {
        const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
        if (ymdMatch) {
            let [, yStr, mStr, dStr] = ymdMatch;
            let y = parseInt(yStr, 10);
            let m = parseInt(mStr, 10);
            let d = parseInt(dStr, 10);
            if (y > 2400) y -= 543;
            if (isValidDateValue(d, m, y)) {
                return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
            }
        }
    }

    if (isDateCol) {
        const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
        if (dmyMatch) {
            let [, dStr, mStr, yStr] = dmyMatch;
            let d = parseInt(dStr, 10);
            let m = parseInt(mStr, 10);
            let y = parseInt(yStr, 10);
            if (y > 2400) y -= 543;

            if (m > 12 && d <= 12) {
                const temp = d;
                d = m;
                m = temp;
            }

            if (isValidDateValue(d, m, y)) {
                return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
            }
        }
    }

    if (isDateCol) {
        const dj = dayjs(str);
        if (dj.isValid()) {
            let y = dj.year();
            if (y > 2400) y -= 543;
            if (y >= 1900 && y <= 2100) {
                return `${dj.format('DD/MM/')}${y}`;
            }
        }
    }

    return str;
}

interface CombinationSearchSelectProps {
    value: number | null;
    onChange: (combinationId: number | null) => void;
    combinations: AircraftEngineCombination[];
    isMatched: boolean;
    disabled?: boolean;
}

function CombinationSearchSelect({
    value,
    onChange,
    combinations,
    isMatched,
    disabled = false,
}: CombinationSearchSelectProps) {
    const [open, setOpen] = useState(false);
    const selectedComb = combinations.find((c) => c.id === value);

    if (disabled) {
        return (
            <div
                className={cn(
                    'w-full h-8 px-2.5 py-1 text-xs rounded-md flex items-center justify-between gap-1.5 select-none border',
                    isMatched
                        ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-foreground'
                        : 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
                )}
            >
                <span className={cn('truncate', !selectedComb && 'italic font-medium text-red-600 dark:text-red-400')}>
                    {selectedComb ? selectedComb.displayLabel : 'Unmapped'}
                </span>
            </div>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full h-8 px-2.5 py-1 text-xs bg-background border rounded-md focus:outline-none focus:ring-2 font-normal transition-all flex items-center justify-between gap-1.5 text-left cursor-pointer',
                        !isMatched
                            ? 'border-red-400 dark:border-red-500 bg-red-50/20 text-red-700 dark:text-red-300 focus:ring-red-400/40'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-blue-400/40 text-foreground'
                    )}
                >
                    <span className={cn('truncate', !selectedComb && 'text-red-600 dark:text-red-400 font-medium')}>
                        {selectedComb ? selectedComb.displayLabel : '-- Select Master Combination (Required) --'}
                    </span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-60" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[360px] z-[9999]" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search combination (e.g. A320, B737, CFM56)..."
                        className="h-8 text-xs"
                    />
                    <CommandList className="max-h-[260px] overflow-y-auto">
                        <CommandEmpty className="py-3 text-xs text-muted-foreground text-center">
                            No combination found.
                        </CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="-- select master combination clear none --"
                                onSelect={() => {
                                    onChange(null);
                                    setOpen(false);
                                }}
                                className="flex items-center gap-2 text-xs py-1.5 px-2 cursor-pointer text-muted-foreground italic border-b mb-1"
                            >
                                <span className="w-3.5 h-3.5 shrink-0" />
                                <span>-- Select Master Combination --</span>
                            </CommandItem>
                            {combinations.map((comb) => {
                                const isSelected = value === comb.id;
                                return (
                                    <CommandItem
                                        key={comb.id}
                                        value={`${comb.displayLabel} ${comb.familyCode} ${comb.series} ${comb.engineCode}`}
                                        onSelect={() => {
                                            onChange(comb.id);
                                            setOpen(false);
                                        }}
                                        className="flex items-center gap-2 text-xs py-1.5 px-2 cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                'w-3.5 h-3.5 shrink-0',
                                                isSelected ? 'opacity-100 text-blue-600 dark:text-blue-400' : 'opacity-0'
                                            )}
                                        />
                                        <span className={cn('truncate', isSelected && 'font-semibold text-blue-600 dark:text-blue-400')}>
                                            {comb.displayLabel}
                                        </span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export function StaffExcelImportModal({
    isOpen,
    onClose,
    onImportSuccess,
    initialFile,
}: StaffExcelImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>('');
    const [sheets, setSheets] = useState<ParsedSheet[]>([]);
    const [activeSheetIndex, setActiveSheetIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [hasFile, setHasFile] = useState(false);
    const [importResult, setImportResult] = useState<ImportStaffSummary | null>(null);
    const [mappingWarnings, setMappingWarnings] = useState<string[]>([]);

    // Master data lookups
    const { data: positionsResp } = useStaffDepartmentPositions();
    const { data: aircraftLicenses } = useAircraftTypeLicenses();
    const { data: combinationsData = [] } = useCombinations();
    const combinationsList = useMemo(() => {
        return [...combinationsData]
            .filter((c) => !c.validTo)
            .sort((a, b) => {
                const famA = a.familyCode || '';
                const famB = b.familyCode || '';
                const famCompare = famA.localeCompare(famB, undefined, { numeric: true, sensitivity: 'base' });
                if (famCompare !== 0) return famCompare;

                const seriesA = a.series || '';
                const seriesB = b.series || '';
                const seriesCompare = seriesA.localeCompare(seriesB, undefined, { numeric: true, sensitivity: 'base' });
                if (seriesCompare !== 0) return seriesCompare;

                return (a.displayLabel || '').localeCompare(b.displayLabel || '', undefined, { numeric: true, sensitivity: 'base' });
            });
    }, [combinationsData]);
    const { data: amelCategories } = useAmelCategories();
    const { data: coursesResp } = useCourseList();

    // Aircraft License split combinations mapping & expand state
    const [aircraftRowMappings, setAircraftRowMappings] = useState<Record<number, SplitAircraftCombinationItem[]>>({});
    const [aircraftOriginalRawMap, setAircraftOriginalRawMap] = useState<Record<number, string>>({});
    const aircraftOriginalRawMapRef = useRef<Record<number, string>>({});
    aircraftOriginalRawMapRef.current = aircraftOriginalRawMap;
    const sheetsRef = useRef<ParsedSheet[]>([]);
    sheetsRef.current = sheets;
    const editingRowIndexRef = useRef<number | null>(null);
    const aircraftRowMappingsRef = useRef<Record<number, SplitAircraftCombinationItem[]>>({});
    aircraftRowMappingsRef.current = aircraftRowMappings;
    const [expandedAircraftRows, setExpandedAircraftRows] = useState<Set<number>>(new Set());

    const toggleRowExpand = useCallback((rowIndex: number) => {
        setExpandedAircraftRows((prev) => {
            const next = new Set(prev);
            if (next.has(rowIndex)) {
                next.delete(rowIndex);
            } else {
                next.add(rowIndex);
            }
            return next;
        });
    }, []);

    const positionsList = useMemo(() => {
        const list = positionsResp?.responseData ?? [];
        return list.filter((p) => !p.isdelete);
    }, [positionsResp]);

    const amelCategoriesList = useMemo(() => {
        const list = amelCategories ?? [];
        return list.filter((c) => !c.isdelete);
    }, [amelCategories]);

    const coursesList = useMemo(() => {
        return coursesResp?.responseData ?? [];
    }, [coursesResp]);

    // Employee ids already in the system. A child sheet may reference a staff
    // member this workbook does not create, and that is legitimate as long as
    // the person exists.
    const { data: knownStaffIndex, isSuccess: employeeIdsLoaded } = useQuery({
        queryKey: ['staff-employee-index'],
        queryFn: () => fetchKnownStaffIndex(),
        enabled: isOpen,
    });

    const knownEmployeeIds = useMemo(
        () => new Set(knownStaffIndex ? knownStaffIndex.keys() : []),
        [knownStaffIndex]
    );

    /**
     * Child-sheet rows pointing at an Employee ID that is neither added in the
     * Staff Info tab nor already in the system. Held back until the system list
     * has loaded, so a slow request cannot flash false errors.
     */
    const unknownEmployeeIssues = useMemo(() => {
        if (!employeeIdsLoaded) return [];
        return findUnknownEmployeeIds(sheets, knownEmployeeIds);
    }, [sheets, knownEmployeeIds, employeeIdsLoaded]);

    /**
     * Child-sheet name cells that disagree with the staff their Employee ID
     * points at, which usually means the row was pasted against the wrong
     * person.
     */
    const nameMismatchIssues = useMemo(() => {
        if (!employeeIdsLoaded || !knownStaffIndex) return [];
        return findNameMismatches(sheets, buildStaffNameReference(sheets, knownStaffIndex));
    }, [sheets, knownStaffIndex, employeeIdsLoaded]);

    /** sheet name -> row -> the name columns flagged on that row. */
    const nameMismatchCells = useMemo(() => {
        const bySheet = new Map<string, Map<number, Set<'fullNameTh' | 'fullNameEn'>>>();
        for (const issue of nameMismatchIssues) {
            const rows = bySheet.get(issue.sheetName) ?? new Map<number, Set<'fullNameTh' | 'fullNameEn'>>();
            const cols = rows.get(issue.rowIndex) ?? new Set<'fullNameTh' | 'fullNameEn'>();
            cols.add(issue.column);
            rows.set(issue.rowIndex, cols);
            bySheet.set(issue.sheetName, rows);
        }
        return bySheet;
    }, [nameMismatchIssues]);

    const unknownEmployeeRowsBySheet = useMemo(() => {
        const bySheet = new Map<string, Set<number>>();
        for (const issue of unknownEmployeeIssues) {
            const rows = bySheet.get(issue.sheetName) ?? new Set<number>();
            rows.add(issue.rowIndex);
            bySheet.set(issue.sheetName, rows);
        }
        return bySheet;
    }, [unknownEmployeeIssues]);

    // Auto-match Training Records: if no Course Code, check Training Course if it matches courseName
    useEffect(() => {
        if (!coursesList.length || !sheets.length) return;

        let hasAnyChanges = false;
        const newSheets = sheets.map((sheet) => {
            const section = sectionForSheet(sheet.name);
            if (section !== 'trainingRecords') return sheet;

            let courseCodeHeader = sheet.headers.find((h) => normalizeKey(h) === 'coursecode');
            const trainingCourseHeader = sheet.headers.find((h) => {
                const nh = normalizeKey(h);
                return nh === 'trainingcourse' || nh === 'coursename';
            });
            const validUntilHeader = sheet.headers.find((h) => {
                const nh = normalizeKey(h);
                return nh === 'validuntil' || nh === 'validto';
            });

            let updatedHeaders = [...sheet.headers];
            let headerAdded = false;
            if (!courseCodeHeader && trainingCourseHeader) {
                courseCodeHeader = 'Course Code';
                const tcIdx = updatedHeaders.indexOf(trainingCourseHeader);
                if (tcIdx >= 0) {
                    updatedHeaders.splice(tcIdx, 0, 'Course Code');
                } else {
                    updatedHeaders.unshift('Course Code');
                }
                headerAdded = true;
            }

            const codeHeader = courseCodeHeader;

            let rowsChanged = false;
            const updatedRows = sheet.rows.map((row) => {
                const currentCode = codeHeader ? row.data[codeHeader]?.trim() ?? '' : '';
                const currentCourseName = trainingCourseHeader ? row.data[trainingCourseHeader]?.trim() ?? '' : '';

                let newCode = currentCode;
                let newCourseName = currentCourseName;

                // Requirement: If no Course Code, check Training Course if it matches courseName
                if (codeHeader) {
                    if (!currentCode && currentCourseName) {
                        const matched = findMatchingCourse(currentCourseName, coursesList);
                        if (matched) {
                            newCode = matched.courseCode;
                            if (!newCourseName) newCourseName = matched.courseName;
                        }
                    } else if (currentCode && trainingCourseHeader && !currentCourseName) {
                        const matched = findMatchingCourse(currentCode, coursesList);
                        if (matched) {
                            newCourseName = matched.courseName;
                        }
                    }
                }

                // Check Valid Until date formatting
                let validUntilChanged = false;
                let newValidUntil = '';
                if (validUntilHeader) {
                    const curValidUntil = row.data[validUntilHeader]?.trim() ?? '';
                    if (curValidUntil && curValidUntil.toLowerCase() !== 'never') {
                        const formatted = formatExcelDate(curValidUntil, true);
                        if (formatted && formatted !== curValidUntil) {
                            validUntilChanged = true;
                            newValidUntil = formatted;
                        }
                    }
                }

                const courseChanged = codeHeader && (newCode !== currentCode || newCourseName !== currentCourseName);
                if (courseChanged || validUntilChanged) {
                    rowsChanged = true;
                    return {
                        ...row,
                        data: {
                            ...row.data,
                            ...(codeHeader ? { [codeHeader]: newCode } : {}),
                            ...(trainingCourseHeader ? { [trainingCourseHeader]: newCourseName } : {}),
                            ...(validUntilChanged && validUntilHeader ? { [validUntilHeader]: newValidUntil } : {}),
                        },
                    };
                }
                return row;
            });

            if (headerAdded || rowsChanged) {
                hasAnyChanges = true;
                return {
                    ...sheet,
                    headers: updatedHeaders,
                    rows: updatedRows,
                };
            }
            return sheet;
        });

        if (hasAnyChanges) {
            setSheets(newSheets);
        }
    }, [coursesList, sheets]);

    // Initialize & sync aircraft license split mappings
    useEffect(() => {
        if (!sheets.length || !combinationsList.length) return;

        const licenseSheet = sheets.find((s) => sectionForSheet(s.name) === 'aircraftLicense');
        if (!licenseSheet) return;

        const licHeader = licenseSheet.headers.find((h) => normalizeKey(h) === 'aircraftlicense');
        if (!licHeader) return;

        setAircraftOriginalRawMap((prev) => {
            const updated = { ...prev };
            let changed = false;
            licenseSheet.rows.forEach((row) => {
                if (updated[row.rowIndex] === undefined) {
                    updated[row.rowIndex] = row.data[licHeader]?.trim() ?? '';
                    changed = true;
                }
            });
            return changed ? updated : prev;
        });

        setAircraftRowMappings((prev) => {
            let changed = false;
            const updated = { ...prev };

            licenseSheet.rows.forEach((row) => {
                const rawVal = row.data[licHeader]?.trim() ?? '';
                // Seed a row once and leave it alone after that. Re-seeding an
                // empty list would resurrect combinations the user deleted,
                // since the display text falls back to the original raw value.
                // A genuine edit to the raw text is re-split by saveEditRow.
                if (updated[row.rowIndex] === undefined) {
                    const split = parseAndSplitAircraftLicense(rawVal, combinationsList, `row-${row.rowIndex}`);
                    updated[row.rowIndex] = split;
                    changed = true;
                }
            });

            return changed ? updated : prev;
        });
    }, [sheets, combinationsList]);

    /**
     * Push the recomputed Aircraft License text into every place that holds it.
     *
     * The open row editor keeps its own copy of the row (editingRowData), and
     * saving writes that copy back over the row. Without updating it here the
     * cell would keep showing the pre-edit text, and saving would re-split from
     * it and throw the mapping away.
     */
    const syncAircraftLicenseDisplay = useCallback(
        (rowIndex: number, updatedList: SplitAircraftCombinationItem[]) => {
            const licenseSheet = sheetsRef.current.find(
                (sheet) => sectionForSheet(sheet.name) === 'aircraftLicense'
            );
            const licHeader = licenseSheet?.headers.find((h) => normalizeKey(h) === 'aircraftlicense');
            if (!licenseSheet || !licHeader) return;

            const rowObj = licenseSheet.rows.find((r) => r.rowIndex === rowIndex);
            const originalRaw =
                aircraftOriginalRawMapRef.current[rowIndex] || rowObj?.data[licHeader] || '';
            const newDisplayText = computeRowAircraftLicenseDisplay(
                updatedList,
                combinationsList,
                originalRaw
            );

            setSheets((prevSheets) =>
                prevSheets.map((sheet) => {
                    if (sectionForSheet(sheet.name) !== 'aircraftLicense') return sheet;
                    return {
                        ...sheet,
                        rows: sheet.rows.map((r) =>
                            r.rowIndex === rowIndex
                                ? { ...r, data: { ...r.data, [licHeader]: newDisplayText } }
                                : r
                        ),
                    };
                })
            );

            if (editingRowIndexRef.current === rowIndex) {
                setEditingRowData((prev) =>
                    prev[licHeader] === newDisplayText
                        ? prev
                        : { ...prev, [licHeader]: newDisplayText }
                );
            }
        },
        [combinationsList]
    );

    const handleUpdateSplitItemCombination = useCallback(
        (rowIndex: number, itemId: string, combinationId: number | null) => {
            const selectedComb = combinationsList.find((c) => c.id === combinationId);
            const currentList = aircraftRowMappingsRef.current[rowIndex] ?? [];
            const updated = currentList.map((item) => {
                if (item.id !== itemId) return item;
                return {
                    ...item,
                    family: selectedComb ? selectedComb.familyCode : item.family,
                    series: selectedComb ? selectedComb.series : item.series,
                    engine: selectedComb ? selectedComb.engineCode : item.engine,
                    combinationId: combinationId,
                    displayLabel: selectedComb ? selectedComb.displayLabel : null,
                    matched: Boolean(combinationId),
                };
            });

            setAircraftRowMappings((prev) => ({ ...prev, [rowIndex]: updated }));
            syncAircraftLicenseDisplay(rowIndex, updated);
        },
        [combinationsList, syncAircraftLicenseDisplay]
    );

    const handleDeleteSplitItem = useCallback((rowIndex: number, itemId: string) => {
        const currentList = aircraftRowMappingsRef.current[rowIndex] ?? [];
        const updated = currentList.filter((item) => item.id !== itemId);

        setAircraftRowMappings((prev) => ({ ...prev, [rowIndex]: updated }));
        syncAircraftLicenseDisplay(rowIndex, updated);
    }, [syncAircraftLicenseDisplay]);

    const handleAddSplitItem = useCallback((rowIndex: number) => {
        const currentList = aircraftRowMappingsRef.current[rowIndex] ?? [];
        const newItem: SplitAircraftCombinationItem = {
            id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            originalText: 'New Combination',
            family: '',
            series: '',
            engine: null,
            combinationId: null,
            displayLabel: null,
            matched: false,
        };
        const updated = [...currentList, newItem];

        setAircraftRowMappings((prev) => ({ ...prev, [rowIndex]: updated }));
        syncAircraftLicenseDisplay(rowIndex, updated);
        setExpandedAircraftRows((prev) => new Set(prev).add(rowIndex));
    }, [syncAircraftLicenseDisplay]);

    const renderExpandedAircraftRow = (
        row: ParsedSheet['rows'][number],
        mappings: SplitAircraftCombinationItem[],
        isEditable: boolean = false
    ) => {
        return (
            <tr key={`expanded-${row.rowIndex}`} className="bg-slate-100/60 dark:bg-slate-900/60 border-b">
                <td colSpan={activeSheet.headers.length + 2} className="p-0">
                    <div className="p-3 bg-slate-100/80 dark:bg-slate-900/80 border-y border-slate-200 dark:border-slate-800">
                        {/* Nested card container with left accent border */}
                        <div className="border border-blue-200/90 dark:border-blue-900/60 rounded-lg bg-white dark:bg-slate-950 shadow-sm border-l-4 border-l-blue-500">
                            {/* Sticky header bar of the expanded section - sticks at top-[41px] directly under main table thead */}
                            <div className="sticky top-[41px] z-30 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-md px-3.5 h-9 flex items-center justify-between gap-3 shadow-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs text-blue-900 dark:text-blue-300">
                                        Row #{row.rowIndex} Aircraft License Combinations
                                    </span>
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-[11px]">
                                        {mappings.length} {mappings.length === 1 ? 'Record' : 'Records'}
                                    </Badge>
                                    {isEditable ? (
                                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-semibold border border-amber-300">
                                            Editing Mode
                                        </Badge>
                                    ) : (
                                        <Badge className="text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 text-[10px]">
                                            View Only
                                        </Badge>
                                    )}
                                    {mappings.some((m) => !m.combinationId) ? (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] text-red-700 dark:text-red-300 font-semibold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                            {mappings.filter((m) => !m.combinationId).length} combination(s) unmapped
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            All combinations mapped
                                        </span>
                                    )}
                                </div>
                                {isEditable ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddSplitItem(row.rowIndex)}
                                        className="h-6 px-2 text-xs gap-1 border-dashed hover:border-primary hover:text-primary bg-white dark:bg-slate-900 cursor-pointer"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Combination
                                    </Button>
                                ) : (
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                        Click Edit row in Actions to modify
                                    </span>
                                )}
                            </div>

                            {/* Combinations Table with sticky column headers - sticks at top-[77px] */}
                            <table className="w-full text-xs border-separate border-spacing-0">
                                <thead className="sticky top-[77px] z-20 bg-slate-200/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-300 shadow-xs backdrop-blur-xs">
                                    <tr className="border-b border-slate-300 dark:border-slate-700">
                                        <th className="w-12 px-3 py-1.5 text-center font-semibold border-b border-slate-300 dark:border-slate-700">#</th>
                                        <th className="px-3 py-1.5 text-left font-semibold border-b border-slate-300 dark:border-slate-700 min-w-[110px]">Family</th>
                                        <th className="px-3 py-1.5 text-left font-semibold border-b border-slate-300 dark:border-slate-700 min-w-[80px]">Series</th>
                                        <th className="px-3 py-1.5 text-left font-semibold border-b border-slate-300 dark:border-slate-700 min-w-[120px]">Engine</th>
                                        <th className="px-3 py-1.5 text-left font-semibold border-b border-slate-300 dark:border-slate-700 min-w-[280px]">
                                            System Combination (/master/aircraft-engine-combination)
                                        </th>
                                        <th className="px-3 py-1.5 text-left font-semibold border-b border-slate-300 dark:border-slate-700 w-40">Status</th>
                                        <th className="px-3 py-1.5 text-center font-semibold border-b border-slate-300 dark:border-slate-700 w-16">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {mappings.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">
                                                No combinations. Click &quot;Add Combination&quot; to add one.
                                            </td>
                                        </tr>
                                    ) : (
                                        mappings.map((item, itemIdx) => {
                                            const isMatched = Boolean(item.combinationId);
                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={cn(
                                                        'transition-colors',
                                                        !isMatched
                                                            ? 'bg-red-50/40 dark:bg-red-950/20'
                                                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/40'
                                                    )}
                                                >
                                                    <td className="px-3 py-2 text-center font-mono text-muted-foreground">
                                                        {row.rowIndex}.{itemIdx + 1}
                                                    </td>
                                                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                                                            {item.family || item.originalText || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                                                            {item.series || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                                                            {item.engine || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <CombinationSearchSelect
                                                            value={item.combinationId}
                                                            onChange={(val) => {
                                                                handleUpdateSplitItemCombination(
                                                                    row.rowIndex,
                                                                    item.id,
                                                                    val
                                                                );
                                                            }}
                                                            combinations={combinationsList}
                                                            isMatched={isMatched}
                                                            disabled={!isEditable}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {isMatched ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                Mapped (ID: {item.combinationId})
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                                                                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                                                Unmapped (Required)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        {isEditable ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSplitItem(row.rowIndex, item.id)}
                                                                className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors cursor-pointer"
                                                                title="Remove this combination"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-300 dark:text-slate-700 font-mono">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        );
    };

    // Row editing state
    const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
    const [editingRowData, setEditingRowData] = useState<Record<string, string>>({});
    editingRowIndexRef.current = editingRowIndex;

    const activeSheet = sheets[activeSheetIndex];
    const activeSheetSection = activeSheet ? sectionForSheet(activeSheet.name) : null;
    const totalRows = useMemo(() => {
        return sheets.reduce((sum, s) => {
            const sec = sectionForSheet(s.name);
            if (sec === 'aircraftLicense') {
                let count = 0;
                s.rows.forEach((r) => {
                    const mappings = aircraftRowMappings[r.rowIndex];
                    count += mappings && mappings.length > 0 ? mappings.length : 1;
                });
                return sum + count;
            }
            return sum + s.rows.length;
        }, 0);
    }, [sheets, aircraftRowMappings]);

    const resetState = useCallback(() => {
        setFileName('');
        setSheets([]);
        setActiveSheetIndex(0);
        setHasFile(false);
        setIsLoading(false);
        setIsImporting(false);
        setEditingRowIndex(null);
        setEditingRowData({});
        setAircraftRowMappings({});
        setAircraftOriginalRawMap({});
        setExpandedAircraftRows(new Set());
        setImportResult(null);
        setMappingWarnings([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [resetState, onClose]);

    const startEditRow = useCallback((row: ParsedStaffRow) => {
        if (activeSheetSection === 'aircraftLicense') {
            setExpandedAircraftRows((prev) => {
                const next = new Set(prev);
                if (editingRowIndex !== null && editingRowIndex !== row.rowIndex) {
                    next.delete(editingRowIndex);
                }
                next.add(row.rowIndex);
                return next;
            });
        }
        setEditingRowIndex(row.rowIndex);
        const data = { ...row.data };
        Object.keys(data).forEach((k) => {
            if (isDateColumn(k) && data[k] && data[k].trim().toLowerCase() !== 'never' && data[k].trim().toLowerCase() !== 'never expire') {
                data[k] = formatExcelDate(data[k], true);
            }
        });
        setEditingRowData(data);
    }, [activeSheetSection, editingRowIndex]);

    const cancelEditRow = useCallback(() => {
        if (editingRowIndex !== null && activeSheetSection === 'aircraftLicense') {
            setExpandedAircraftRows((prev) => {
                const next = new Set(prev);
                next.delete(editingRowIndex);
                return next;
            });
        }
        setEditingRowIndex(null);
        setEditingRowData({});
    }, [editingRowIndex, activeSheetSection]);

    const saveEditRow = useCallback(() => {
        if (editingRowIndex === null) return;
        setSheets((prevSheets) => {
            return prevSheets.map((sheet, sIdx) => {
                if (sIdx !== activeSheetIndex) return sheet;
                const normalizedData = { ...editingRowData };
                Object.keys(normalizedData).forEach((k) => {
                    const val = normalizedData[k];
                    if (val && typeof val === 'string') {
                        if (val.trim().toLowerCase() === 'never' || val.trim().toLowerCase() === 'never expire') {
                            normalizedData[k] = 'Never';
                        } else if (isDateColumn(k)) {
                            normalizedData[k] = formatExcelDate(val, true);
                        }
                    }
                });

                if (sectionForSheet(sheet.name) === 'aircraftLicense') {
                    const licHeader = sheet.headers.find((h) => normalizeKey(h) === 'aircraftlicense');
                    if (licHeader) {
                        const oldVal = sheet.rows.find((r) => r.rowIndex === editingRowIndex)?.data[licHeader];
                        const newVal = normalizedData[licHeader];
                        if (oldVal !== newVal) {
                            const split = parseAndSplitAircraftLicense(newVal ?? '', combinationsList, `row-${editingRowIndex}`);
                            setAircraftRowMappings((prev) => ({
                                ...prev,
                                [editingRowIndex]: split,
                            }));
                            setAircraftOriginalRawMap((prev) => ({
                                ...prev,
                                [editingRowIndex]: newVal ?? '',
                            }));
                        }
                    }
                }

                return {
                    ...sheet,
                    rows: sheet.rows.map((r) => {
                        if (r.rowIndex !== editingRowIndex) return r;
                        return {
                            ...r,
                            data: normalizedData,
                        };
                    }),
                };
            });
        });
        if (activeSheetSection === 'aircraftLicense' && editingRowIndex !== null) {
            setExpandedAircraftRows((prev) => {
                const next = new Set(prev);
                next.delete(editingRowIndex);
                return next;
            });
        }
        toast.success(`Row ${editingRowIndex} updated successfully`);
        setEditingRowIndex(null);
        setEditingRowData({});
    }, [editingRowIndex, editingRowData, activeSheetIndex, combinationsList, activeSheetSection]);

    const deleteRow = useCallback((rowIndex: number) => {
        setSheets((prevSheets) => {
            return prevSheets.map((sheet, sIdx) => {
                if (sIdx !== activeSheetIndex) return sheet;
                const updatedRows = sheet.rows
                    .filter((r) => r.rowIndex !== rowIndex)
                    .map((r, idx) => ({
                        ...r,
                        rowIndex: idx + 1,
                    }));

                if (sectionForSheet(sheet.name) === 'aircraftLicense') {
                    setAircraftRowMappings((prev) => {
                        const next: Record<number, SplitAircraftCombinationItem[]> = {};
                        let newIdx = 1;
                        sheet.rows.forEach((r) => {
                            if (r.rowIndex !== rowIndex) {
                                if (prev[r.rowIndex]) {
                                    next[newIdx] = prev[r.rowIndex];
                                }
                                newIdx++;
                            }
                        });
                        return next;
                    });
                    setAircraftOriginalRawMap((prev) => {
                        const next: Record<number, string> = {};
                        let newIdx = 1;
                        sheet.rows.forEach((r) => {
                            if (r.rowIndex !== rowIndex) {
                                if (prev[r.rowIndex] !== undefined) {
                                    next[newIdx] = prev[r.rowIndex];
                                }
                                newIdx++;
                            }
                        });
                        return next;
                    });
                    setExpandedAircraftRows((prev) => {
                        const next = new Set<number>();
                        let newIdx = 1;
                        sheet.rows.forEach((r) => {
                            if (r.rowIndex !== rowIndex) {
                                if (prev.has(r.rowIndex)) {
                                    next.add(newIdx);
                                }
                                newIdx++;
                            }
                        });
                        return next;
                    });
                }

                return {
                    ...sheet,
                    rows: updatedRows,
                };
            });
        });
        if (editingRowIndex === rowIndex) {
            setEditingRowIndex(null);
            setEditingRowData({});
        }
        toast.success(`Row ${rowIndex} deleted successfully`);
    }, [activeSheetIndex, editingRowIndex]);

    const handleAddRow = useCallback(() => {
        if (!activeSheet) return;
        const newRowIndex = activeSheet.rows.length + 1;
        const emptyData: Record<string, string> = {};
        activeSheet.headers.forEach((h) => {
            emptyData[h] = '';
        });
        const newRow: ParsedStaffRow = {
            rowIndex: newRowIndex,
            data: emptyData,
        };
        setSheets((prevSheets) => {
            return prevSheets.map((sheet, sIdx) => {
                if (sIdx !== activeSheetIndex) return sheet;
                return {
                    ...sheet,
                    rows: [...sheet.rows, newRow],
                };
            });
        });
        setEditingRowIndex(newRowIndex);
        setEditingRowData(emptyData);
    }, [activeSheet, activeSheetIndex]);

    const parseSheet = (worksheet: XLSX.WorkSheet, sheetName: string): ParsedSheet | null => {
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        if (jsonData.length === 0) return null;

        let headers = Object.keys(jsonData[0]);
        const section = sectionForSheet(sheetName);
        if (section === 'trainingRecords') {
            const hasCourseCode = headers.some((h) => normalizeKey(h) === 'coursecode');
            if (!hasCourseCode) {
                const tcIdx = headers.findIndex((h) => {
                    const nh = normalizeKey(h);
                    return nh === 'trainingcourse' || nh === 'coursename';
                });
                if (tcIdx >= 0) {
                    headers = [
                        ...headers.slice(0, tcIdx),
                        'Course Code',
                        ...headers.slice(tcIdx),
                    ];
                } else {
                    headers = ['Course Code', ...headers];
                }
            }
        }

        const rows: ParsedStaffRow[] = jsonData.map((row, index) => ({
            rowIndex: index + 1,
            data: headers.reduce((acc, header) => {
                const isDate = isDateColumn(header);
                acc[header] = formatExcelDate(row[header] ?? '', isDate);
                return acc;
            }, {} as Record<string, string>),
        }));

        return { name: sheetName, headers, rows };
    };

    const processFile = useCallback(async (file: File) => {
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
                toast.error('Excel file contains no data');
                resetState();
                return;
            }

            setSheets(parsedSheets);
            setActiveSheetIndex(0);
            setHasFile(true);
        } catch (error) {
            console.error('Failed to parse Excel file:', error);
            toast.error('Failed to read Excel file');
            resetState();
        } finally {
            setIsLoading(false);
        }
    }, [resetState]);

    useEffect(() => {
        if (initialFile && isOpen) {
            processFile(initialFile);
        }
    }, [initialFile, isOpen, processFile]);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await processFile(file);
    }, [processFile]);

    // Validation helpers
    /**
     * Rows in a sheet that carry any blocking problem.
     *
     * Counted as distinct rows, so a row that is both missing a Category and
     * pointing at an unknown Employee ID is reported once.
     */
    const getSheetErrors = useCallback(
        (sheet: ParsedSheet): number => {
            const section = sectionForSheet(sheet.name);
            const badRows = new Set<number>(unknownEmployeeRowsBySheet.get(sheet.name) ?? []);
            for (const rowIndex of nameMismatchCells.get(sheet.name)?.keys() ?? []) {
                badRows.add(rowIndex);
            }

            if (section === 'staffInfo') {
                const posHeader = sheet.headers.find((h) => normalizeKey(h) === 'position');
                if (posHeader) {
                    sheet.rows.forEach((r) => {
                        const val = r.data[posHeader];
                        if (!val || !findMatchingOption(val, positionsList)) badRows.add(r.rowIndex);
                    });
                }
            }

            if (section === 'amelLicense') {
                const catHeader = sheet.headers.find((h) => normalizeKey(h) === 'category');
                if (catHeader) {
                    sheet.rows.forEach((r) => {
                        const val = r.data[catHeader];
                        if (!val || !findMatchingOption(val, amelCategoriesList)) badRows.add(r.rowIndex);
                    });
                }
            }

            if (section === 'trainingRecords') {
                const courseCodeHeader = sheet.headers.find((h) => normalizeKey(h) === 'coursecode');
                const trainingCourseHeader = sheet.headers.find((h) => {
                    const nh = normalizeKey(h);
                    return nh === 'trainingcourse' || nh === 'coursename';
                });
                sheet.rows.forEach((r) => {
                    const codeVal = courseCodeHeader ? r.data[courseCodeHeader] : '';
                    const nameVal = trainingCourseHeader ? r.data[trainingCourseHeader] : '';
                    const matched =
                        findMatchingCourse(codeVal, coursesList) ||
                        findMatchingCourse(nameVal, coursesList);
                    if (!matched) badRows.add(r.rowIndex);
                });
            }

            if (section === 'aircraftLicense') {
                sheet.rows.forEach((r) => {
                    const mappings = aircraftRowMappings[r.rowIndex] || [];
                    if (mappings.length === 0 || mappings.some((m) => !m.combinationId)) {
                        badRows.add(r.rowIndex);
                    }
                });
            }

            return badRows.size;
        },
        [positionsList, amelCategoriesList, coursesList, aircraftRowMappings, unknownEmployeeRowsBySheet, nameMismatchCells]
    );

    const activeSheetUnknownEmployeeIds = useMemo(() => {
        if (!activeSheet) return [];
        const ids = unknownEmployeeIssues
            .filter((issue) => issue.sheetName === activeSheet.name)
            .map((issue) => issue.employeeId);
        return Array.from(new Set(ids));
    }, [activeSheet, unknownEmployeeIssues]);

    const activeSheetNameMismatches = useMemo(() => {
        if (!activeSheet) return [];
        return nameMismatchIssues.filter((issue) => issue.sheetName === activeSheet.name);
    }, [activeSheet, nameMismatchIssues]);

    const activeSheetErrors = useMemo(() => {
        if (!activeSheet) return 0;
        return getSheetErrors(activeSheet);
    }, [activeSheet, getSheetErrors]);

    const handleImport = useCallback(async () => {
        // Validate Position, Category, Course Code, and Aircraft License before submitting
        const invalidPositionRows: string[] = [];
        const invalidCategoryRows: string[] = [];
        const invalidCourseRows: string[] = [];
        const invalidAircraftRows: string[] = [];

        sheets.forEach((sheet) => {
            const section = sectionForSheet(sheet.name);
            if (section === 'staffInfo') {
                const posHeader = sheet.headers.find((h) => normalizeKey(h) === 'position');
                if (posHeader) {
                    sheet.rows.forEach((r) => {
                        const val = r.data[posHeader];
                        if (!val || !findMatchingOption(val, positionsList)) {
                            invalidPositionRows.push(`Row ${r.rowIndex}: "${val || '(empty)'}"`);
                        }
                    });
                }
            }
            if (section === 'amelLicense') {
                const catHeader = sheet.headers.find((h) => normalizeKey(h) === 'category');
                if (catHeader) {
                    sheet.rows.forEach((r) => {
                        const val = r.data[catHeader];
                        if (!val || !findMatchingOption(val, amelCategoriesList)) {
                            invalidCategoryRows.push(`Row ${r.rowIndex}: "${val || '(empty)'}"`);
                        }
                    });
                }
            }
            if (section === 'trainingRecords') {
                const courseCodeHeader = sheet.headers.find((h) => normalizeKey(h) === 'coursecode');
                const trainingCourseHeader = sheet.headers.find((h) => {
                    const nh = normalizeKey(h);
                    return nh === 'trainingcourse' || nh === 'coursename';
                });
                sheet.rows.forEach((r) => {
                    const codeVal = courseCodeHeader ? r.data[courseCodeHeader] : '';
                    const nameVal = trainingCourseHeader ? r.data[trainingCourseHeader] : '';
                    const matched =
                        findMatchingCourse(codeVal, coursesList) ||
                        findMatchingCourse(nameVal, coursesList);
                    if (!matched) {
                        invalidCourseRows.push(
                            `Row ${r.rowIndex}: "${codeVal || nameVal || '(empty)'}"`
                        );
                    }
                });
            }
            if (section === 'aircraftLicense') {
                sheet.rows.forEach((r) => {
                    const mappings = aircraftRowMappings[r.rowIndex] || [];
                    if (mappings.length === 0 || mappings.some((m) => !m.combinationId)) {
                        invalidAircraftRows.push(`Row ${r.rowIndex}`);
                    }
                });
            }
        });

        // The system list has to be in hand before we can judge an Employee ID.
        if (!employeeIdsLoaded) {
            toast.error('Still checking existing staff. Please try again in a moment.');
            return;
        }

        if (unknownEmployeeIssues.length > 0) {
            const ids = Array.from(new Set(unknownEmployeeIssues.map((i) => i.employeeId)));
            const shown = ids.slice(0, 5).map((id) => `"${id}"`).join(', ');
            const rest = ids.length > 5 ? ` and ${ids.length - 5} more` : '';
            toast.error(
                `Cannot import: Employee ID ${shown}${rest} ${ids.length > 1 ? 'are' : 'is'} not in the Staff Info tab and ${ids.length > 1 ? 'were' : 'was'} not found in the system. Add the staff to Staff Info, or correct the Employee ID.`
            );
            return;
        }

        if (nameMismatchIssues.length > 0) {
            const first = nameMismatchIssues[0];
            const label = first.column === 'fullNameTh' ? 'Full Name (Thai)' : 'Full Name (English)';
            const rest =
                nameMismatchIssues.length > 1 ? ` (and ${nameMismatchIssues.length - 1} more)` : '';
            toast.error(
                `Cannot import: ${first.sheetName} row ${first.rowIndex} has ${label} "${first.value}" but Employee ID "${first.employeeId}" is on file as "${first.expected}"${rest}. Correct the name, or check that the row belongs to the right person.`
            );
            return;
        }

        if (invalidPositionRows.length > 0) {
            toast.error(
                `Cannot import: ${invalidPositionRows.length} row(s) in Staff Info have invalid or unselected Position options. Please fix them before importing.`
            );
            return;
        }

        if (invalidCategoryRows.length > 0) {
            toast.error(
                `Cannot import: ${invalidCategoryRows.length} row(s) in AMEL License have invalid or unselected Category options. Please fix them before importing.`
            );
            return;
        }

        if (invalidCourseRows.length > 0) {
            toast.error(
                `Cannot import: ${invalidCourseRows.length} row(s) in Training Records have invalid or unselected Course Code options. Please fix them before importing.`
            );
            return;
        }

        if (invalidAircraftRows.length > 0) {
            toast.error(
                `Cannot import: ${invalidAircraftRows.length} row(s) in Aircraft License have unmapped or incomplete aircraft combinations. Please expand the row(s) to select a valid combination.`
            );
            return;
        }

        setIsImporting(true);
        try {
            const { payload, warnings } = buildImportStaffPayload(sheets, {
                positions: positionsList,
                aircraftLicenses: aircraftLicenses ?? [],
                aircraftCombinations: combinationsList,
                aircraftRowMappings: aircraftRowMappings,
                amelCategories: amelCategoriesList,
                courses: coursesList,
            });
            setMappingWarnings(warnings);

            if (countImportStaffPayloadRows(payload) === 0) {
                toast.error('No importable data found. Please check sheet names and column headers.');
                return;
            }
            if (payload.staffInfo.length === 0) {
                toast.error('No data found in "Staff Info" sheet');
                return;
            }

            const res = await importStaff(payload);
            setImportResult(res.responseData);
            toast.success(
                res.responseData?.isNewStaff
                    ? `New staff created successfully (${res.responseData.employeeId})`
                    : `Staff updated successfully (${res.responseData?.employeeId ?? ''})`
            );
            onImportSuccess?.();
        } catch (error: any) {
            console.error('Import failed:', error);
            toast.error(error?.message || 'Failed to import staff');
        } finally {
            setIsImporting(false);
        }
    }, [sheets, positionsList, aircraftLicenses, combinationsList, aircraftRowMappings, amelCategoriesList, coursesList, onImportSuccess, unknownEmployeeIssues, nameMismatchIssues, employeeIdsLoaded]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent size="lg" className="max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        Import Staff from Excel
                    </DialogTitle>
                    <DialogDescription>
                        Select an Excel file (.xlsx) to import staff data. Review and edit data before importing.
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
                            <p className="font-medium">Click to select Excel file</p>
                            <p className="text-sm text-muted-foreground mt-1">Supports .xlsx, .xls</p>
                        </div>
                        {isLoading && (
                            <div className="flex items-center gap-2 text-primary">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Reading file...</span>
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
                {!importResult && hasFile && activeSheet && (
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
                                Change File
                            </Button>
                        </div>

                        {/* Sheet Tabs */}
                        {sheets.length > 1 && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => {
                                        if (activeSheetIndex > 0) {
                                            cancelEditRow();
                                            setActiveSheetIndex(activeSheetIndex - 1);
                                        }
                                    }}
                                    disabled={activeSheetIndex === 0}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                <div className="flex items-center gap-1 overflow-x-auto flex-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    {sheets.map((sheet, index) => {
                                        const isActive = activeSheetIndex === index;
                                        const errors = getSheetErrors(sheet);
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    cancelEditRow();
                                                    setActiveSheetIndex(index);
                                                }}
                                                className={cn(
                                                    'flex items-center gap-2 px-2.5 py-1 rounded-md transition-all whitespace-nowrap text-xs',
                                                    isActive && 'bg-primary text-primary-foreground shadow-sm',
                                                    !isActive && 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                )}
                                            >
                                                <span>{sheet.name}</span>
                                                <span
                                                    className={cn(
                                                        'text-xs px-1.5 py-0.5 rounded',
                                                        isActive
                                                            ? 'bg-primary-foreground/20 text-primary-foreground'
                                                            : 'bg-slate-200 dark:bg-slate-600'
                                                    )}
                                                >
                                                    {sheet.rows.length}
                                                </span>
                                                {errors > 0 && (
                                                    <span
                                                        className="w-2 h-2 rounded-full bg-red-500 shrink-0"
                                                        title={`${errors} row(s) require attention`}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => {
                                        if (activeSheetIndex < sheets.length - 1) {
                                            cancelEditRow();
                                            setActiveSheetIndex(activeSheetIndex + 1);
                                        }
                                    }}
                                    disabled={activeSheetIndex === sheets.length - 1}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {/* Active Sheet Info & Controls */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground px-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="font-semibold text-foreground">Sheet: {activeSheet.name}</span>
                                    <Badge color="default">{activeSheet.rows.length} rows</Badge>
                                    {activeSheetSection === 'aircraftLicense' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (expandedAircraftRows.size === activeSheet.rows.length) {
                                                    setExpandedAircraftRows(new Set());
                                                } else {
                                                    setExpandedAircraftRows(new Set(activeSheet.rows.map((r) => r.rowIndex)));
                                                }
                                            }}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                                            title="Click to toggle expand all / collapse all combination records"
                                        >
                                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", expandedAircraftRows.size === activeSheet.rows.length && "rotate-180")} />
                                            <span>
                                                {Object.values(aircraftRowMappings).reduce((acc, curr) => acc + curr.length, 0)} combinations to import
                                            </span>
                                            <span className="text-[10px] font-normal text-blue-600/80 dark:text-blue-400/80">
                                                ({expandedAircraftRows.size === activeSheet.rows.length ? 'collapse all' : 'expand all'})
                                            </span>
                                        </button>
                                    )}
                                    <Badge color="default">{activeSheet.headers.length} columns</Badge>
                                    <span className="text-xs text-muted-foreground/70 hidden md:inline">
                                        {activeSheetSection === 'aircraftLicense'
                                            ? '(Click chevron or badge to expand and manage split combinations)'
                                            : '(Double-click row to edit or use Actions)'}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs font-medium border-dashed hover:border-primary hover:text-primary"
                                    onClick={handleAddRow}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Row
                                </Button>
                            </div>

                            {/* Employee IDs that exist neither in the Staff Info tab nor in the system */}
                            {activeSheetUnknownEmployeeIds.length > 0 && (
                                <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <span>
                                        Employee ID {activeSheetUnknownEmployeeIds.map((id) => `"${id}"`).join(', ')}{' '}
                                        {activeSheetUnknownEmployeeIds.length > 1 ? 'are' : 'is'} not in the Staff Info
                                        tab and {activeSheetUnknownEmployeeIds.length > 1 ? 'were' : 'was'} not found in
                                        the system. Add the staff to the Staff Info tab, or correct the Employee ID.
                                    </span>
                                </div>
                            )}

                            {/* Name cells that disagree with the staff the Employee ID points at */}
                            {activeSheetNameMismatches.length > 0 && (
                                <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <div className="flex flex-col gap-0.5">
                                        <span>
                                            {activeSheetNameMismatches.length} name
                                            {activeSheetNameMismatches.length > 1 ? 's do' : ' does'} not match the staff
                                            the Employee ID refers to:
                                        </span>
                                        <ul className="ml-1">
                                            {activeSheetNameMismatches.slice(0, 5).map((issue, i) => (
                                                <li key={`name-mismatch-${i}`} className="font-normal">
                                                    • Row {issue.rowIndex} ({issue.employeeId}):{' '}
                                                    {issue.column === 'fullNameTh' ? 'Full Name (Thai)' : 'Full Name (English)'}{' '}
                                                    is "{issue.value}" but the staff on file is "{issue.expected}"
                                                </li>
                                            ))}
                                            {activeSheetNameMismatches.length > 5 && (
                                                <li className="font-normal">
                                                    • and {activeSheetNameMismatches.length - 5} more
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Error notification banner for invalid Position / Category / Course Code / Aircraft License */}
                            {activeSheetErrors > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                                    <span>
                                        {activeSheetErrors} row{activeSheetErrors > 1 ? 's have' : ' has'} invalid or
                                        unmapped{' '}
                                        {activeSheetSection === 'staffInfo'
                                            ? 'Position'
                                            : activeSheetSection === 'amelLicense'
                                                ? 'Category'
                                                : activeSheetSection === 'aircraftLicense'
                                                    ? 'Aircraft License combination'
                                                    : 'Course Code'}{' '}
                                        values. Please edit or expand the row to map valid options from the master list.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Scrollable Table with Fixed Header */}
                        <TooltipProvider delayDuration={0}>
                            <div className="flex-1 overflow-auto border rounded-lg" style={{ maxHeight: '450px' }}>
                                <table className="w-full text-xs caption-bottom border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-40 bg-slate-100 dark:bg-slate-800 shadow-sm">
                                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                            <th className={cn(
                                                "text-center sticky top-0 left-0 bg-slate-100 dark:bg-slate-800 z-50 px-2 py-2 font-semibold text-[11px] text-muted-foreground uppercase whitespace-nowrap border-r border-b border-slate-200 dark:border-slate-700 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]",
                                                activeSheetSection === 'aircraftLicense' ? 'w-[70px] min-w-[70px]' : 'w-[50px]'
                                            )}>
                                                #
                                            </th>
                                            {activeSheet.headers.map((header, idx) => {
                                                const isTruncated = isTruncatedColumn(header);
                                                return (
                                                    <th
                                                        key={idx}
                                                        className={cn(
                                                            'sticky top-0 bg-slate-100 dark:bg-slate-800 z-40 px-3 py-2 text-left font-semibold text-[11px] text-muted-foreground uppercase whitespace-nowrap border-b border-slate-200 dark:border-slate-700',
                                                            isTruncated ? 'w-[220px] max-w-[260px]' : 'min-w-[140px]'
                                                        )}
                                                    >
                                                        {header}
                                                    </th>
                                                );
                                            })}
                                            <th className="w-[96px] min-w-[96px] text-center sticky top-0 right-0 bg-slate-100 dark:bg-slate-800 z-50 px-2 py-2 font-semibold text-[11px] text-muted-foreground uppercase whitespace-nowrap border-l border-b border-slate-200 dark:border-slate-700 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0 divide-y">
                                        {activeSheet.rows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={activeSheet.headers.length + 2}
                                                    className="text-center py-8 text-muted-foreground text-xs"
                                                >
                                                    No data in this sheet (click &quot;Add Row&quot; to add data)
                                                </td>
                                            </tr>
                                        ) : (
                                            activeSheet.rows.map((row) => {
                                                const isEditing = editingRowIndex === row.rowIndex;
                                                const section = activeSheetSection;
                                                const isExpanded = expandedAircraftRows.has(row.rowIndex);
                                                const mappings = aircraftRowMappings[row.rowIndex] || [];

                                                if (isEditing) {
                                                    return (
                                                        <Fragment key={row.rowIndex}>
                                                            <tr
                                                                className="bg-blue-50/80 dark:bg-blue-950/40 ring-1 ring-blue-500/40 transition-colors"
                                                            >
                                                                <td className="text-center text-blue-600 dark:text-blue-400 font-semibold sticky left-0 bg-blue-100 dark:bg-blue-900 z-10 font-mono text-xs px-2 py-2 border-r border-b shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                                                                    {section === 'aircraftLicense' ? (
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleRowExpand(row.rowIndex)}
                                                                                className="p-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 cursor-pointer transition-colors"
                                                                                title={isExpanded ? "Collapse combinations" : "Expand combinations"}
                                                                            >
                                                                                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-90 text-blue-800 dark:text-blue-200")} />
                                                                            </button>
                                                                            <span>{row.rowIndex}</span>
                                                                        </div>
                                                                    ) : (
                                                                        row.rowIndex
                                                                    )}
                                                                </td>
                                                                {activeSheet.headers.map((header, idx) => {
                                                                    const isTruncated = isTruncatedColumn(header);
                                                                    const normH = normalizeKey(header);
                                                                    const isPositionCol =
                                                                        section === 'staffInfo' && normH === 'position';
                                                                    const isCategoryCol =
                                                                        section === 'amelLicense' && normH === 'category';
                                                                    const isCourseCodeCol =
                                                                        section === 'trainingRecords' && normH === 'coursecode';
                                                                    const isTrainingCourseCol =
                                                                        section === 'trainingRecords' &&
                                                                        (normH === 'trainingcourse' || normH === 'coursename');
                                                                    const isValidUntilCol =
                                                                        section === 'trainingRecords' &&
                                                                        (normH === 'validuntil' || normH === 'validto');

                                                                    if (isPositionCol) {
                                                                        const currentVal = editingRowData[header] ?? '';
                                                                        const matchedPos = findMatchingOption(
                                                                            currentVal,
                                                                            positionsList
                                                                        );
                                                                        const isInvalid = !currentVal || !matchedPos;

                                                                        return (
                                                                            <td
                                                                                key={idx}
                                                                                className={cn(
                                                                                    'text-xs px-2 py-1 border-b',
                                                                                    isTruncated
                                                                                        ? 'min-w-[200px]'
                                                                                        : 'min-w-[140px]'
                                                                                )}
                                                                            >
                                                                                <select
                                                                                    value={
                                                                                        matchedPos
                                                                                            ? matchedPos.name
                                                                                            : currentVal
                                                                                    }
                                                                                    onChange={(e) =>
                                                                                        setEditingRowData((prev) => ({
                                                                                            ...prev,
                                                                                            [header]: e.target.value,
                                                                                        }))
                                                                                    }
                                                                                    className={cn(
                                                                                        'w-full h-8 px-2 py-1 text-xs bg-background border rounded-md focus:outline-none focus:ring-2 font-normal transition-all',
                                                                                        isInvalid
                                                                                            ? 'border-red-400 dark:border-red-500 focus:ring-red-400/40 text-red-600 dark:text-red-400'
                                                                                            : 'border-blue-400 dark:border-blue-600 focus:ring-blue-400/40'
                                                                                    )}
                                                                                >
                                                                                    <option value="" disabled>
                                                                                        -- Select Position --
                                                                                    </option>
                                                                                    {currentVal && !matchedPos && (
                                                                                        <option value={currentVal} disabled>
                                                                                            {currentVal} (Invalid - please
                                                                                            select)
                                                                                        </option>
                                                                                    )}
                                                                                    {positionsList.map((pos) => (
                                                                                        <option key={pos.id} value={pos.name}>
                                                                                            {pos.name}
                                                                                            {pos.code ? ` (${pos.code})` : ''}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </td>
                                                                        );
                                                                    }

                                                                    if (isCategoryCol) {
                                                                        const currentVal = editingRowData[header] ?? '';
                                                                        const matchedCat = findMatchingOption(
                                                                            currentVal,
                                                                            amelCategoriesList
                                                                        );
                                                                        const isInvalid = !currentVal || !matchedCat;

                                                                        return (
                                                                            <td
                                                                                key={idx}
                                                                                className={cn(
                                                                                    'text-xs px-2 py-1 border-b',
                                                                                    isTruncated
                                                                                        ? 'min-w-[200px]'
                                                                                        : 'min-w-[140px]'
                                                                                )}
                                                                            >
                                                                                <select
                                                                                    value={
                                                                                        matchedCat
                                                                                            ? matchedCat.name
                                                                                            : currentVal
                                                                                    }
                                                                                    onChange={(e) =>
                                                                                        setEditingRowData((prev) => ({
                                                                                            ...prev,
                                                                                            [header]: e.target.value,
                                                                                        }))
                                                                                    }
                                                                                    className={cn(
                                                                                        'w-full h-8 px-2 py-1 text-xs bg-background border rounded-md focus:outline-none focus:ring-2 font-normal transition-all',
                                                                                        isInvalid
                                                                                            ? 'border-red-400 dark:border-red-500 focus:ring-red-400/40 text-red-600 dark:text-red-400'
                                                                                            : 'border-blue-400 dark:border-blue-600 focus:ring-blue-400/40'
                                                                                    )}
                                                                                >
                                                                                    <option value="" disabled>
                                                                                        -- Select Category --
                                                                                    </option>
                                                                                    {currentVal && !matchedCat && (
                                                                                        <option value={currentVal} disabled>
                                                                                            {currentVal} (Invalid - please
                                                                                            select)
                                                                                        </option>
                                                                                    )}
                                                                                    {amelCategoriesList.map((cat) => (
                                                                                        <option key={cat.id} value={cat.name}>
                                                                                            {cat.code
                                                                                                ? `${cat.code} — `
                                                                                                : ''}
                                                                                            {cat.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </td>
                                                                        );
                                                                    }

                                                                    if (isCourseCodeCol) {
                                                                        const currentVal = editingRowData[header] ?? '';
                                                                        const matchedCourse = findMatchingCourse(
                                                                            currentVal,
                                                                            coursesList
                                                                        );
                                                                        const isInvalid = !currentVal || !matchedCourse;

                                                                        return (
                                                                            <td
                                                                                key={idx}
                                                                                className={cn(
                                                                                    'text-xs px-2 py-1 border-b',
                                                                                    isTruncated
                                                                                        ? 'min-w-[240px]'
                                                                                        : 'min-w-[160px]'
                                                                                )}
                                                                            >
                                                                                <select
                                                                                    value={
                                                                                        matchedCourse
                                                                                            ? matchedCourse.courseCode
                                                                                            : currentVal
                                                                                    }
                                                                                    onChange={(e) => {
                                                                                        const selectedCode = e.target.value;
                                                                                        const matched = coursesList.find(
                                                                                            (c) => c.courseCode === selectedCode
                                                                                        );
                                                                                        const tcHeader = activeSheet.headers.find((h) => {
                                                                                            const nh = normalizeKey(h);
                                                                                            return nh === 'trainingcourse' || nh === 'coursename';
                                                                                        });
                                                                                        setEditingRowData((prev) => ({
                                                                                            ...prev,
                                                                                            [header]: selectedCode,
                                                                                            ...(matched && tcHeader
                                                                                                ? { [tcHeader]: matched.courseName }
                                                                                                : {}),
                                                                                        }));
                                                                                    }}
                                                                                    className={cn(
                                                                                        'w-full h-8 px-2 py-1 text-xs bg-background border rounded-md focus:outline-none focus:ring-2 font-normal transition-all',
                                                                                        isInvalid
                                                                                            ? 'border-red-400 dark:border-red-500 focus:ring-red-400/40 text-red-600 dark:text-red-400'
                                                                                            : 'border-blue-400 dark:border-blue-600 focus:ring-blue-400/40'
                                                                                    )}
                                                                                >
                                                                                    <option value="" disabled>
                                                                                        -- Select Course Code --
                                                                                    </option>
                                                                                    {currentVal && !matchedCourse && (
                                                                                        <option value={currentVal} disabled>
                                                                                            {currentVal} (Invalid - please
                                                                                            select)
                                                                                        </option>
                                                                                    )}
                                                                                    {coursesList.map((c) => (
                                                                                        <option
                                                                                            key={c.id}
                                                                                            value={c.courseCode}
                                                                                        >
                                                                                            {c.courseCode} — {c.courseName}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </td>
                                                                        );
                                                                    }

                                                                    if (isValidUntilCol) {
                                                                        const rawVal = editingRowData[header] ?? '';
                                                                        const isNever = rawVal.trim().toLowerCase() === 'never';

                                                                        return (
                                                                            <td
                                                                                key={idx}
                                                                                className={cn(
                                                                                    'text-xs px-2 py-1 border-b min-w-[210px]'
                                                                                )}
                                                                            >
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <select
                                                                                        value={isNever ? 'Never' : 'date'}
                                                                                        onChange={(e) => {
                                                                                            if (e.target.value === 'Never') {
                                                                                                setEditingRowData((prev) => ({
                                                                                                    ...prev,
                                                                                                    [header]: 'Never',
                                                                                                }));
                                                                                            } else {
                                                                                                setEditingRowData((prev) => ({
                                                                                                    ...prev,
                                                                                                    [header]:
                                                                                                        prev[header]?.trim().toLowerCase() === 'never'
                                                                                                            ? ''
                                                                                                            : prev[header] || '',
                                                                                                }));
                                                                                            }
                                                                                        }}
                                                                                        className="h-8 px-2 text-xs bg-background border border-blue-400 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400/40 shrink-0 font-medium cursor-pointer"
                                                                                    >
                                                                                        <option value="Never">Never</option>
                                                                                        <option value="date">Date</option>
                                                                                    </select>

                                                                                    {isNever ? (
                                                                                        <span className="flex-1 h-8 flex items-center px-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md whitespace-nowrap">
                                                                                            Never Expires
                                                                                        </span>
                                                                                    ) : (
                                                                                        <input
                                                                                            type="text"
                                                                                            value={editingRowData[header] ?? ''}
                                                                                            onChange={(e) =>
                                                                                                setEditingRowData((prev) => ({
                                                                                                    ...prev,
                                                                                                    [header]: e.target.value,
                                                                                                }))
                                                                                            }
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') saveEditRow();
                                                                                                if (e.key === 'Escape') cancelEditRow();
                                                                                            }}
                                                                                            placeholder="DD/MM/YYYY"
                                                                                            className="flex-1 h-8 px-2.5 py-1 text-xs bg-background border border-blue-400 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400/40 font-normal transition-all"
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <td
                                                                            key={idx}
                                                                            className={cn(
                                                                                'text-xs px-2 py-1 border-b',
                                                                                isTruncated
                                                                                    ? 'min-w-[200px]'
                                                                                    : 'min-w-[140px]'
                                                                            )}
                                                                        >
                                                                            <input
                                                                                type="text"
                                                                                value={editingRowData[header] ?? ''}
                                                                                onChange={(e) => {
                                                                                    const newVal = e.target.value;
                                                                                    if (isTrainingCourseCol) {
                                                                                        const matched = findMatchingCourse(newVal, coursesList);
                                                                                        const ccHeader = activeSheet.headers.find(
                                                                                            (h) => normalizeKey(h) === 'coursecode'
                                                                                        );
                                                                                        setEditingRowData((prev) => ({
                                                                                            ...prev,
                                                                                            [header]: newVal,
                                                                                            ...(matched && ccHeader
                                                                                                ? { [ccHeader]: matched.courseCode }
                                                                                                : {}),
                                                                                        }));
                                                                                    } else {
                                                                                        setEditingRowData((prev) => ({
                                                                                            ...prev,
                                                                                            [header]: newVal,
                                                                                        }));
                                                                                    }
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') saveEditRow();
                                                                                    if (e.key === 'Escape') cancelEditRow();
                                                                                }}
                                                                                placeholder={header}
                                                                                className="w-full h-8 px-2.5 py-1 text-xs bg-background border border-blue-400 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400/40 font-normal transition-all"
                                                                            />
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className="w-[96px] min-w-[96px] text-center sticky right-0 bg-blue-100 dark:bg-blue-900 z-10 px-2 py-1.5 border-l border-b whitespace-nowrap shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={saveEditRow}
                                                                            className="inline-flex items-center justify-center w-7 h-7 rounded text-emerald-600 hover:bg-emerald-200/60 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                                                                            title="Save (Enter)"
                                                                        >
                                                                            <Check className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={cancelEditRow}
                                                                            className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                                                                            title="Cancel (Esc)"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {section === 'aircraftLicense' && isExpanded && renderExpandedAircraftRow(row, mappings, true)}
                                                        </Fragment>
                                                    );
                                                }

                                                return (
                                                    <Fragment key={row.rowIndex}>
                                                        <tr
                                                            className={cn(
                                                                "group/row transition-colors",
                                                                isExpanded ? "bg-blue-50/40 dark:bg-blue-950/20" : "hover:bg-muted/40"
                                                            )}
                                                            onDoubleClick={() => {
                                                                if (section === 'aircraftLicense') {
                                                                    toggleRowExpand(row.rowIndex);
                                                                } else {
                                                                    startEditRow(row);
                                                                }
                                                            }}
                                                        >
                                                            <td className={cn(
                                                                "text-center sticky left-0 z-10 font-mono text-xs px-2 py-1.5 border-r border-b transition-colors shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]",
                                                                isExpanded
                                                                    ? "bg-blue-100/60 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold"
                                                                    : "text-muted-foreground bg-white dark:bg-slate-900 group-hover/row:bg-slate-100 dark:group-hover/row:bg-slate-800"
                                                            )}>
                                                                {section === 'aircraftLicense' ? (
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleRowExpand(row.rowIndex);
                                                                            }}
                                                                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-foreground cursor-pointer transition-colors"
                                                                            title={isExpanded ? "Collapse combinations" : "Expand combinations"}
                                                                        >
                                                                            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-90 text-blue-600 dark:text-blue-400")} />
                                                                        </button>
                                                                        <span>{row.rowIndex}</span>
                                                                    </div>
                                                                ) : (
                                                                    row.rowIndex
                                                                )}
                                                            </td>
                                                            {activeSheet.headers.map((header, idx) => {
                                                                const isTruncated = isTruncatedColumn(header);
                                                                const rawVal = row.data[header];
                                                                const normH = normalizeKey(header);
                                                                const isPositionCol =
                                                                    section === 'staffInfo' && normH === 'position';
                                                                const isCategoryCol =
                                                                    section === 'amelLicense' && normH === 'category';
                                                                const isCourseCodeCol =
                                                                    section === 'trainingRecords' && normH === 'coursecode';
                                                                const isTrainingCourseCol =
                                                                    section === 'trainingRecords' &&
                                                                    (normH === 'trainingcourse' || normH === 'coursename');
                                                                const isValidUntilCol =
                                                                    section === 'trainingRecords' &&
                                                                    (normH === 'validuntil' || normH === 'validto');
                                                                const isUnknownEmployeeCell =
                                                                    normH === 'employeeid' &&
                                                                    (unknownEmployeeRowsBySheet
                                                                        .get(activeSheet.name)
                                                                        ?.has(row.rowIndex) ?? false);

                                                                const mismatchedNameColumn =
                                                                    normH === 'fullnamethai' || normH === 'fullnameth'
                                                                        ? ('fullNameTh' as const)
                                                                        : normH === 'fullnameenglish' || normH === 'fullnameen'
                                                                            ? ('fullNameEn' as const)
                                                                            : null;
                                                                const nameMismatch = mismatchedNameColumn
                                                                    ? nameMismatchIssues.find(
                                                                        (issue) =>
                                                                            issue.sheetName === activeSheet.name &&
                                                                            issue.rowIndex === row.rowIndex &&
                                                                            issue.column === mismatchedNameColumn
                                                                    )
                                                                    : undefined;

                                                                if (nameMismatch) {
                                                                    return (
                                                                        <td
                                                                            key={idx}
                                                                            className="text-xs px-3 py-1.5 border-b whitespace-nowrap"
                                                                        >
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <span
                                                                                        onClick={() => startEditRow(row)}
                                                                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-100 transition-colors"
                                                                                    >
                                                                                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                                                        <span className="max-w-[200px] truncate">{rawVal || '-'}</span>
                                                                                    </span>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent
                                                                                    side="top"
                                                                                    className="z-[9999] max-w-sm text-xs bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded shadow-md"
                                                                                >
                                                                                    {`Employee ID "${nameMismatch.employeeId}" is on file as "${nameMismatch.expected}". Correct the name, or check that this row belongs to the right person.`}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </td>
                                                                    );
                                                                }

                                                                if (isUnknownEmployeeCell) {
                                                                    return (
                                                                        <td
                                                                            key={idx}
                                                                            className="text-xs px-3 py-1.5 border-b whitespace-nowrap"
                                                                        >
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <span
                                                                                        onClick={() => startEditRow(row)}
                                                                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-100 transition-colors"
                                                                                    >
                                                                                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                                                        <span className="max-w-[160px] truncate">{rawVal || '-'}</span>
                                                                                    </span>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent
                                                                                    side="top"
                                                                                    className="z-[9999] max-w-sm text-xs bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded shadow-md"
                                                                                >
                                                                                    {`Employee ID "${rawVal}" is not in the Staff Info tab and was not found in the system. Add the staff to Staff Info, or correct this Employee ID.`}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </td>
                                                                    );
                                                                }

                                                                if (isPositionCol) {
                                                                    const matchedPos = findMatchingOption(
                                                                        rawVal,
                                                                        positionsList
                                                                    );
                                                                    const isInvalid = !rawVal || !matchedPos;

                                                                    if (isInvalid) {
                                                                        return (
                                                                            <td
                                                                                key={idx}
                                                                                className="text-xs px-3 py-1.5 border-b whitespace-nowrap"
                                                                            >
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <span
                                                                                            onClick={() => startEditRow(row)}
                                                                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-100 transition-colors"
                                                                                        >
                                                                                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                                                            <span className="max-w-[180px] truncate">
                                                                                                {rawVal || 'Missing Position'}
                                                                                            </span>
                                                                                        </span>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent
                                                                                        side="top"
                                                                                        className="z-[9999] max-w-sm text-xs bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded shadow-md"
                                                                                    >
                                                                                        {rawVal
                                                                                            ? `Invalid Position: "${rawVal}" not found in master data. Click to select a valid position.`
                                                                                            : 'Position is required. Click to select.'}
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </td>
                                                                        );
                                                                    }

                                                                    const displayVal = matchedPos
                                                                        ? `${matchedPos.name}${matchedPos.code ? ` (${matchedPos.code})` : ''}`
                                                                        : rawVal;

                                                                    return (
                                                                        <td
                                                                            key={idx}
                                                                            className="text-xs px-3 py-1.5 border-b max-w-[220px] whitespace-nowrap"
                                                                        >
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <span className="cursor-default block max-w-[220px] truncate">
                                                                                        {displayVal}
                                                                                    </span>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent
                                                                                    side="top"
                                                                                    className="z-[9999] max-w-sm text-xs bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded shadow-md"
                                                                                >
                                                                                    {displayVal}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </td>
                                                                    );
                                                                }

                                                                if (isCategoryCol) {
                                                                    const matchedCat = findMatchingOption(
                                                                        rawVal,
                                                                        amelCategoriesList
                                                                    );
                                                                    const isInvalid = !rawVal || !matchedCat;

                                                                    if (isInvalid) {
                                                                        return (
                                                                            <td
                                                                                key={idx}
                                                                                className="text-xs px-3 py-1.5 border-b whitespace-nowrap"
                                                                            >
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <span
                                                                                            onClick={() => startEditRow(row)}
                                                                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-100 transition-colors"
                                                                                        >
                                                                                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                                                            <span className="max-w-[180px] truncate">
                                                                                                {rawVal || 'Missing Category'}
                                                                                            </span>
                                                                                        </span>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent
                                                                                        side="top"
                                                                                        className="z-[9999] max-w-sm text-xs bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded shadow-md"
                                                                                    >
                                                                                        {rawVal
                                                                                            ? `Invalid Category: "${rawVal}" not found in master AMEL categories. Click to select a valid category.`
                                                                                            : 'Category is required. Click to select.'}
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </td>
                                                                        );
                                                                    }

                                                                    const displayVal = matchedCat
                                                                        ? `${matchedCat.code ? `${matchedCat.code} — ` : ''}${matchedCat.name}`
                                                                        : rawVal;

                                                                    return (
                                                                        <td
                                                                            key={idx}
                                                                            className="text-xs px-3 py-1.5 border-b max-w-[220px] whitespace-nowrap"
                                                                        >
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <span className="cursor-default block max-w-[220px] truncate">
                                                                                        {displayVal}
                                                                                    </span>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent
                                                                                    side="top"
                                                                                    className="z-[9999] max-w-sm text-xs bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded shadow-md"
                                                                                >
                                                                                    {displayVal}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </td>
                                                                    );
                                                                }

                                                                if (isCourseCodeCol) {
                                                                    const matchedCourse = findMatchingCourse(
                                                                        rawVal,
                                                                        coursesList
                                                                    );
                                                                    const isInvalid = !rawVal || !matchedCourse;

                                                                    if (isInvalid) {
                                                                        return (
                                                                            <td
                                                                                key={idx}
                                                                                className="text-xs px-3 py-1.5 border-b whitespace-nowrap"
                                                                            >
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <span
                                                                                            onClick={() => startEditRow(row)}
                                                                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-100 transition-colors"
                                                                                        >
                                                                                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                                                            <span className="max-w-[200px] truncate">
                                                                                                {rawVal || 'Missing Course Code'}
                                                                                            </span>
                                                                                        </span>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent
                                                                                        side="top"
                                                                                        className="z-[9999] max-w-sm text-xs bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded shadow-md"
                                                                                    >
                                                                                        {rawVal
                                                                                            ? `Invalid Course Code: "${rawVal}" not found in master courses. Click to select a valid course.`
                                                                                            : 'Course Code is required. Click to select.'}
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </td>
                                                                        );
                                                                    }

                                                                    const displayVal = matchedCourse
                                                                        ? matchedCourse.courseCode
                                                                        : rawVal;
                                                                    const fullTooltip = matchedCourse
                                                                        ? `${matchedCourse.courseCode} — ${matchedCourse.courseName}`
                                                                        : rawVal;

                                                                    return (
                                                                        <td
                                                                            key={idx}
                                                                            className="text-xs px-3 py-1.5 border-b max-w-[260px] whitespace-nowrap"
                                                                        >
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <span className="cursor-default block max-w-[260px] truncate font-medium">
                                                                                        {displayVal}
                                                                                    </span>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent
                                                                                    side="top"
                                                                                    className="z-[9999] max-w-sm text-xs bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded shadow-md"
                                                                                >
                                                                                    {fullTooltip}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </td>
                                                                    );
                                                                }

                                                                if (isValidUntilCol) {
                                                                    const isNever =
                                                                        rawVal &&
                                                                        (rawVal.trim().toLowerCase() === 'never' ||
                                                                            rawVal.trim().toLowerCase() === 'never expire');
                                                                    if (isNever) {
                                                                        return (
                                                                            <td
                                                                                key={idx}
                                                                                className="text-xs px-3 py-1.5 border-b whitespace-nowrap"
                                                                            >
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                                    Never
                                                                                </span>
                                                                            </td>
                                                                        );
                                                                    }

                                                                    const formattedDate = formatExcelDate(rawVal, true);
                                                                    const displayDate = formattedDate || rawVal || '-';

                                                                    return (
                                                                        <td
                                                                            key={idx}
                                                                            className="text-xs px-3 py-1.5 border-b whitespace-nowrap"
                                                                        >
                                                                            <span className="cursor-default">
                                                                                {displayDate}
                                                                            </span>
                                                                        </td>
                                                                    );
                                                                }

                                                                if (section === 'aircraftLicense' && normH === 'aircraftlicense') {
                                                                    const rowMappings = aircraftRowMappings[row.rowIndex] || [];
                                                                    const unmatchedCount = rowMappings.filter((m) => !m.combinationId).length;
                                                                    const hasUnmatched = unmatchedCount > 0;

                                                                    const originalRaw = aircraftOriginalRawMap[row.rowIndex] || rawVal || '';
                                                                    const displayAircraftLicense = computeRowAircraftLicenseDisplay(
                                                                        rowMappings,
                                                                        combinationsList,
                                                                        originalRaw || '-'
                                                                    );

                                                                    return (
                                                                        <td
                                                                            key={idx}
                                                                            className="text-xs px-3 py-1.5 border-b min-w-[240px]"
                                                                        >
                                                                            <div className="flex flex-col gap-1 items-start">
                                                                                <span className="font-medium text-foreground">
                                                                                    {displayAircraftLicense}
                                                                                </span>
                                                                                {rowMappings.length > 0 ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleRowExpand(row.rowIndex);
                                                                                        }}
                                                                                        className={cn(
                                                                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer",
                                                                                            hasUnmatched
                                                                                                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-300 hover:bg-red-100"
                                                                                                : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-100"
                                                                                        )}
                                                                                        title="Click to toggle expanded combination records"
                                                                                    >
                                                                                        {hasUnmatched ? (
                                                                                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                                                                        ) : (
                                                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                                        )}
                                                                                        <span>
                                                                                            {rowMappings.length} {rowMappings.length === 1 ? 'combination' : 'combinations'}
                                                                                            {hasUnmatched ? ` (${unmatchedCount} unmapped — Error)` : ' (all mapped)'}
                                                                                        </span>
                                                                                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", hasUnmatched ? "text-red-600" : "text-muted-foreground", isExpanded && "rotate-180")} />
                                                                                    </button>
                                                                                ) : (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleAddSplitItem(row.rowIndex);
                                                                                        }}
                                                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer"
                                                                                    >
                                                                                        <AlertCircle className="w-3 h-3 text-red-500" />
                                                                                        <span>No combinations — Click to add</span>
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                }

                                                                const val = rawVal || '-';
                                                                const hasTooltip = Boolean(
                                                                    rawVal && rawVal.trim() !== '' && rawVal !== '-'
                                                                );

                                                                return (
                                                                    <td
                                                                        key={idx}
                                                                        className={cn(
                                                                            'text-xs px-3 py-1.5 border-b',
                                                                            isTruncated
                                                                                ? 'max-w-[220px] whitespace-nowrap'
                                                                                : 'whitespace-nowrap'
                                                                        )}
                                                                    >
                                                                        {hasTooltip ? (
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <span
                                                                                        className={cn(
                                                                                            'cursor-default',
                                                                                            isTruncated &&
                                                                                            'block max-w-[220px] truncate'
                                                                                        )}
                                                                                    >
                                                                                        {val}
                                                                                    </span>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent
                                                                                    side="top"
                                                                                    className="z-[9999] max-w-sm text-xs font-normal bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 shadow-md px-2.5 py-1.5 rounded"
                                                                                >
                                                                                    {val}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        ) : (
                                                                            <span
                                                                                className={cn(
                                                                                    isTruncated &&
                                                                                    'block max-w-[220px] truncate'
                                                                                )}
                                                                            >
                                                                                {val}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="w-[96px] min-w-[96px] text-center sticky right-0 bg-white dark:bg-slate-900 group-hover/row:bg-slate-100 dark:group-hover/row:bg-slate-800 z-10 px-2 py-1.5 border-l border-b transition-colors whitespace-nowrap shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                                                                <div className="flex items-center justify-center gap-1 opacity-70 group-hover/row:opacity-100 transition-opacity">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            startEditRow(row);
                                                                        }}
                                                                        className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer transition-colors"
                                                                        title="Edit row (or double-click)"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            deleteRow(row.rowIndex);
                                                                        }}
                                                                        className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 cursor-pointer transition-colors"
                                                                        title="Delete row"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {section === 'aircraftLicense' && isExpanded && renderExpandedAircraftRow(row, mappings, false)}
                                                    </Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TooltipProvider>
                    </>
                )}

                {/* Import Result */}
                {importResult && (
                    <div className="flex-1 overflow-auto space-y-4 py-2">
                        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                            <div>
                                <p className="font-medium text-emerald-800 dark:text-emerald-200">
                                    {importResult.isNewStaff
                                        ? 'New staff created successfully'
                                        : 'Staff updated successfully'}
                                </p>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                    Employee ID {importResult.employeeId} · Staff ID {importResult.staffId}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {(
                                [
                                    ['AMEL License', importResult.amelLicenseCount],
                                    ['Aircraft License', importResult.aircraftLicenseCount],
                                    ['Previous Training', importResult.previousTrainingCount],
                                    ['Training Records', importResult.trainingRecordCount],
                                    ['Work Experience', importResult.workExperienceCount],
                                    ['Education', importResult.educationCount],
                                ] as const
                            ).map(([label, count]) => (
                                <div key={label} className="rounded-lg border bg-muted/40 p-3 text-center">
                                    <p className="text-2xl font-bold">{count}</p>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Warnings */}
                        {[...mappingWarnings, ...(importResult.warnings ?? [])].length > 0 && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                        Warnings ({[...mappingWarnings, ...(importResult.warnings ?? [])].length})
                                    </span>
                                </div>
                                <ul className="space-y-1 max-h-48 overflow-auto">
                                    {[...mappingWarnings, ...(importResult.warnings ?? [])].map((w, i) => (
                                        <li key={`warning-${i}`} className="text-xs text-amber-700 dark:text-amber-300">
                                            • {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Actions */}
                <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                        {importResult ? 'Close' : 'Cancel'}
                    </Button>
                    {hasFile && !importResult && (
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
