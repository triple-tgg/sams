'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Search, User, UserCheck, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCombinations, useSystemConfigs } from '@/lib/api/master/aircraft-engine/aircraftEngine.hooks';
import type { AircraftEngineCombination } from '@/lib/api/master/aircraft-engine/aircraftEngine.types';
import { cn } from '@/lib/utils';
import { groupCombinationDisplayLabels } from '@/lib/utils/aircraftEngineDisplay';
import { useRosterStaff } from '@/lib/roster/useRosterData';
import {
    getAmelCertifyingStaff,
    getAircraftLicenceStaff,
    type AmelStaffRow,
    type AmelGroupColumn,
    type AmelCertifyingStaffData,
    type AircraftLicenceStaffRow,
    type AircraftLicenceAirline,
    type AircraftLicenceStaffData,
} from '@/lib/api/roster/certifyingStaff';
import { useDebounce } from '@/hooks/useDebounce';
import { useConfig } from '@/hooks/use-config';
import { isValidCertifyingStaff, movementStatus, type MovementStatus, type RosterStaff } from '@/lib/roster/manpower';
import { EmptyBlock, LoadingBlock, Pill, RosterHeader, StatTile, StationSelect } from '../components/RosterUi';
import {
    CRS_STATUS_META,
    type CrsCellStatus,
} from './authMatrix';
import {
    AMEL_GROUPS,
    TOTAL_AMEL_COLUMNS,
    hasAmelQualification,
    getStaffAcTypeSummary,
    AC_COLOR_MAP,
} from './amelMatrix';

const UNASSIGNED = '__none__';
const NAME_COL_WIDTH = 220;
const LICENCE_COL_WIDTH = 200;

// AMEL Table Sticky Column Dimensions (100% opaque, strictly locked)
const AMEL_COL_NO = 64;
const AMEL_COL_NAME = 180;
const AMEL_COL_POS = 110;
const AMEL_COL_ACTYPE = 120;

const AMEL_LEFT_NAME = AMEL_COL_NO; // 64
const AMEL_LEFT_POS = AMEL_LEFT_NAME + AMEL_COL_NAME; // 244
const AMEL_LEFT_ACTYPE = AMEL_LEFT_POS + AMEL_COL_POS; // 354

function LicenceCell({ labels }: { labels: string[] }) {
    const [expanded, setExpanded] = useState(false);
    if (labels.length === 0) return <span className="text-muted-foreground">—</span>;
    const chip = 'rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300';
    const btn =
        'shrink-0 rounded border border-[#2c5282]/30 bg-[#2c5282]/5 px-1.5 py-0.5 text-[10px] font-bold text-[#2c5282] hover:bg-[#2c5282]/15 dark:text-sky-300';
    const extra = labels.length - 1;

    if (!expanded) {
        return (
            <div className="flex min-w-0 items-center gap-1">
                <span className={cn(chip, 'min-w-0 truncate')} title={labels.join(', ')}>
                    {labels[0]}
                </span>
                {extra > 0 && (
                    <button type="button" className={btn} onClick={() => setExpanded(true)} title="Show all licences">
                        +{extra}
                    </button>
                )}
            </div>
        );
    }
    return (
        <div className="flex flex-wrap items-center gap-1">
            {labels.map((l) => (
                <span key={l} className={chip}>
                    {l}
                </span>
            ))}
            <button type="button" className={btn} onClick={() => setExpanded(false)}>
                Less
            </button>
        </div>
    );
}

function licenceLabels(staff: RosterStaff): string[] {
    const combos = staff.licences.map((l) => ({ id: l.combinationId, familyCode: l.familyCode, series: l.series, engineCode: l.engineCode }));
    return groupCombinationDisplayLabels(combos.map((c) => c.id), combos);
}

function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    const d = dayjs(value);
    return d.isValid() ? d.format('DD MMM YYYY') : value;
}

const MOVEMENT_TONE: Record<MovementStatus, 'default' | 'info' | 'warning'> = {
    Permanent: 'default',
    Rotate: 'info',
    Transfer: 'warning',
};



function StatusDot({ status, size = 10 }: { status: CrsCellStatus; size?: number }) {
    const color = CRS_STATUS_META[status].dot;
    return (
        <span
            className="inline-block rounded-full"
            style={{
                width: size,
                height: size,
                background: color,
                boxShadow: status !== 'pending' ? `0 0 0 3px ${color}33` : undefined,
            }}
        />
    );
}



// ── AMEL Format Helper ──

function AmelAcTypeDisplay({ acType }: { acType: string }) {
    if (!acType || acType === '—') return <span className="text-muted-foreground">—</span>;
    const parts = acType.split('/');
    return (
        <span className="font-semibold text-xs tracking-tight">
            {parts.map((p, i) => {
                const colorClass = AC_COLOR_MAP[p] || 'text-slate-700 dark:text-slate-200';
                return (
                    <span key={p + i}>
                        {i > 0 && <span className="text-muted-foreground/60 font-normal">/</span>}
                        <span className={colorClass}>{p}</span>
                    </span>
                );
            })}
        </span>
    );
}

// ── Aircraft-Engine Filter Component (matching flight/create-project.tsx) ──

interface AircraftEngineFilterProps {
    familyCode: string;
    comboMode: 'combination' | 'manual';
    onComboModeChange: (mode: 'combination' | 'manual') => void;
    selectedComboId: string;
    onComboSelect: (comboId: string, combo?: AircraftEngineCombination) => void;
    series: string;
    onSeriesChange: (series: string) => void;
    engineCode: string;
    onEngineCodeChange: (engine: string) => void;
    combinations?: AircraftEngineCombination[];
    className?: string;
}

function AircraftEngineFilter({
    familyCode,
    comboMode,
    onComboModeChange,
    selectedComboId,
    onComboSelect,
    series,
    onSeriesChange,
    engineCode,
    onEngineCodeChange,
    combinations = [],
    className,
}: AircraftEngineFilterProps) {
    // Build combination options filtered by selected A/C Type (familyCode)
    const combinationOptions = useMemo(() => {
        if (!combinations || !familyCode) return [];
        return combinations
            .filter((c: AircraftEngineCombination) => c.familyCode === familyCode)
            .map((c: AircraftEngineCombination) => ({
                value: String(c.id),
                label: c.displayLabel,
                combo: c,
            }));
    }, [combinations, familyCode]);

    return (
        <div className={cn('space-y-2.5 pt-3 border-t border-border/70', className)}>
            {/* Mode toggle */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Aircraft-Engine :</span>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={comboMode === 'combination'}
                        onCheckedChange={(checked) => onComboModeChange(checked ? 'combination' : 'manual')}
                        color="primary"
                        size="sm"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Select Combination</span>
                </div>
            </div>

            {comboMode === 'combination' ? (
                /* ── Combination mode ── */
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
                    <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Combination</Label>
                        <Select
                            value={selectedComboId || undefined}
                            onValueChange={(val) => {
                                const found = combinationOptions.find((o) => o.value === val);
                                onComboSelect(val, found?.combo);
                            }}
                            disabled={!familyCode}
                        >
                            <SelectTrigger className="h-8.5 bg-background text-xs">
                                <SelectValue
                                    placeholder={familyCode ? 'Select Combination' : 'Select A/C Type first'}
                                />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {combinationOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Family Code</Label>
                        <Input
                            value={familyCode || ''}
                            readOnly
                            disabled
                            placeholder="Select A/C Type first"
                            className="h-8.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-80"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Series</Label>
                        <Input
                            value={series || ''}
                            readOnly
                            disabled
                            className="h-8.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-80"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Engine Code</Label>
                        <Input
                            value={engineCode || ''}
                            readOnly
                            disabled
                            className="h-8.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-80"
                        />
                    </div>
                </div>
            ) : (
                /* ── Manual mode ── */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Family Code</Label>
                        <Input
                            value={familyCode || ''}
                            readOnly
                            disabled
                            placeholder="Select A/C Type first"
                            className="h-8.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-80"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Series</Label>
                        <Input
                            value={series}
                            onChange={(e) => onSeriesChange(e.target.value)}
                            placeholder="e.g. NEO"
                            disabled={!familyCode}
                            className="h-8.5 bg-background text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Engine Code</Label>
                        <Input
                            value={engineCode}
                            onChange={(e) => onEngineCodeChange(e.target.value)}
                            placeholder="e.g. LEAP-1A"
                            disabled={!familyCode}
                            className="h-8.5 bg-background text-xs"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Page Component ──

type CertifyingStaffTab = 'amel' | 'licence';

export default function CertifyingStaffPage() {
    const live = useRosterStaff();
    const [config] = useConfig();
    const isSidebarLight = config.sidebarColor === 'light';
    const [activeTab, setActiveTab] = useState<CertifyingStaffTab>('amel');

    const staff = live.staff as (RosterStaff & { acType?: string; amelColKeys?: string[] })[];
    const { stations } = live;
    const isLoading = live.isLoading;
    const error = live.error;

    // Available positions for staff
    const positions = useMemo(() => {
        const set = new Set<string>();
        staff.forEach((s) => {
            const pos = s.jobTitle?.trim();
            if (pos) set.add(pos);
        });
        return Array.from(set).sort();
    }, [staff]);

    // Master data for Aircraft-Engine selector
    const { data: combinationsData } = useCombinations();
    const { data: systemConfigsData } = useSystemConfigs();

    const familyCodeOptions = useMemo(() => {
        const seen = new Set<string>();
        const options: { value: string; label: string }[] = [];

        if (systemConfigsData) {
            systemConfigsData.forEach((c) => {
                if (c.familyCode && !seen.has(c.familyCode)) {
                    seen.add(c.familyCode);
                    options.push({ value: c.familyCode, label: c.familyCode });
                }
            });
        }

        if (combinationsData) {
            combinationsData.forEach((c: AircraftEngineCombination) => {
                if (c.familyCode && !seen.has(c.familyCode)) {
                    seen.add(c.familyCode);
                    options.push({ value: c.familyCode, label: c.familyCode });
                }
            });
        }

        ['A318', 'A319', 'A320', 'A321', 'A330', 'A350', 'B737', 'B767', 'B777', 'B787'].forEach((t) => {
            if (!seen.has(t)) {
                seen.add(t);
                options.push({ value: t, label: t });
            }
        });

        return options.sort((a, b) => a.label.localeCompare(b.label));
    }, [systemConfigsData, combinationsData]);

    // ── AMEL API States & Query ──
    const [amelSearch, setAmelSearch] = useState('');
    const [amelStation, setAmelStation] = useState('');
    const [amelAircraftType, setAmelAircraftType] = useState('');
    const [amelComboMode, setAmelComboMode] = useState<'combination' | 'manual'>('combination');
    const [amelSelectedComboId, setAmelSelectedComboId] = useState<string>('');
    const [amelSeries, setAmelSeries] = useState<string>('');
    const [amelEngineCode, setAmelEngineCode] = useState<string>('');
    const [amelPage, setAmelPage] = useState(1);
    const [amelPageSize, setAmelPageSize] = useState(20);

    const debouncedAmelSearch = useDebounce(amelSearch, 400);
    const debouncedAmelSeries = useDebounce(amelSeries, 400);
    const debouncedAmelEngineCode = useDebounce(amelEngineCode, 400);

    const handleAmelAcTypeChange = (val: string) => {
        setAmelAircraftType(val);
        setAmelSelectedComboId('');
        setAmelSeries('');
        setAmelEngineCode('');
        setAmelPage(1);
    };

    const handleAmelComboModeChange = (mode: 'combination' | 'manual') => {
        setAmelComboMode(mode);
        setAmelSelectedComboId('');
        setAmelSeries('');
        setAmelEngineCode('');
    };

    const handleAmelComboSelect = (comboId: string, combo?: AircraftEngineCombination) => {
        setAmelSelectedComboId(comboId);
        if (combo) {
            setAmelSeries(combo.series || '');
            setAmelEngineCode(combo.engineCode || '');
        } else {
            setAmelSeries('');
            setAmelEngineCode('');
        }
        setAmelPage(1);
    };

    const amelQuery = useQuery({
        queryKey: [
            'roster',
            'certifying-staff',
            'amel',
            {
                search: debouncedAmelSearch,
                station: amelStation === UNASSIGNED ? '' : amelStation,
                aircraftType: amelAircraftType,
                page: amelPage,
                pageSize: amelPageSize,
            },
        ],
        queryFn: async () => {
            const res = await getAmelCertifyingStaff({
                search: debouncedAmelSearch,
                station: amelStation === UNASSIGNED ? '' : amelStation,
                aircraftType: amelAircraftType,
                page: amelPage,
                pageSize: amelPageSize,
            });
            return res.responseData;
        },
        staleTime: 60 * 1000,
        placeholderData: (previousData) => previousData,
    });

    const amelData = amelQuery.data;
    const amelColumns = amelData?.columns;
    const rawAmelRows = amelData?.rows ?? [];
    const amelPagination = amelData?.pagination ?? {
        page: amelPage,
        pageSize: amelPageSize,
        totalRecords: rawAmelRows.length,
        totalPages: Math.ceil(rawAmelRows.length / amelPageSize) || 1,
    };
    const rawAmelGroups: AmelGroupColumn[] = amelColumns?.groups ?? [];

    const amelGroups = useMemo(() => {
        let groups = rawAmelGroups;
        const sQuery = debouncedAmelSeries.toLowerCase().trim();
        const eQuery = debouncedAmelEngineCode.toLowerCase().trim();

        if (sQuery || eQuery) {
            groups = groups
                .map((g) => {
                    const matchesAircraft = sQuery ? g.aircraft.toLowerCase().includes(sQuery) : true;
                    const filteredCols = g.columns.filter((c) => {
                        const cLabel = (c.label || '').toLowerCase();
                        const cEngine = (c.engine || '').toLowerCase();
                        const cCode = (c.code || '').toLowerCase();

                        const matchesSeries = !sQuery || matchesAircraft || cLabel.includes(sQuery) || cCode.includes(sQuery);
                        const matchesEngine = !eQuery || cEngine.includes(eQuery) || cLabel.includes(eQuery) || cCode.includes(eQuery);

                        return matchesSeries && matchesEngine;
                    });

                    return {
                        ...g,
                        columns: filteredCols,
                    };
                })
                .filter((g) => g.columns.length > 0);
        }

        return groups;
    }, [rawAmelGroups, debouncedAmelSeries, debouncedAmelEngineCode]);

    const amelRows = useMemo(() => {
        const hasSeriesFilter = Boolean(debouncedAmelSeries.trim());
        const hasEngineFilter = Boolean(debouncedAmelEngineCode.trim());

        if (!hasSeriesFilter && !hasEngineFilter) {
            return rawAmelRows;
        }

        if (amelGroups.length === 0) {
            return [];
        }

        const activeColIds = new Set<string>();
        amelGroups.forEach((g) => g.columns.forEach((c) => activeColIds.add(c.id)));

        if (activeColIds.size === 0) {
            return [];
        }

        return rawAmelRows.filter((row) =>
            Array.from(activeColIds).some((colId) => row.qualifications?.[colId]?.qualified)
        );
    }, [rawAmelRows, amelGroups, debouncedAmelSeries, debouncedAmelEngineCode]);

    const isAmelClientFiltered = Boolean(debouncedAmelSeries.trim() || debouncedAmelEngineCode.trim());
    const effectiveAmelTotal = isAmelClientFiltered ? amelRows.length : amelPagination.totalRecords;
    const totalAmelColumns = amelGroups.reduce((acc, g) => acc + g.columns.length, 0);

    const isAmelFiltering =
        amelSearch !== '' ||
        amelStation !== '' ||
        amelAircraftType !== '' ||
        amelSeries !== '' ||
        amelEngineCode !== '' ||
        amelSelectedComboId !== '';

    const clearAmelFilters = () => {
        setAmelSearch('');
        setAmelStation('');
        setAmelAircraftType('');
        setAmelSelectedComboId('');
        setAmelSeries('');
        setAmelEngineCode('');
        setAmelPage(1);
    };

    // ── Aircraft Licence API States & Query ──
    const [licenceSearch, setLicenceSearch] = useState('');
    const [licenceStation, setLicenceStation] = useState('');
    const [licenceAircraftType, setLicenceAircraftType] = useState('');
    const [licenceComboMode, setLicenceComboMode] = useState<'combination' | 'manual'>('combination');
    const [licenceSelectedComboId, setLicenceSelectedComboId] = useState<string>('');
    const [licenceSeries, setLicenceSeries] = useState<string>('');
    const [licenceEngineCode, setLicenceEngineCode] = useState<string>('');
    const [licencePage, setLicencePage] = useState(1);
    const [licencePageSize, setLicencePageSize] = useState(20);

    const debouncedLicenceSearch = useDebounce(licenceSearch, 400);
    const debouncedLicenceSeries = useDebounce(licenceSeries, 400);
    const debouncedLicenceEngineCode = useDebounce(licenceEngineCode, 400);

    const handleLicenceAcTypeChange = (val: string) => {
        setLicenceAircraftType(val);
        setLicenceSelectedComboId('');
        setLicenceSeries('');
        setLicenceEngineCode('');
        setLicencePage(1);
    };

    const handleLicenceComboModeChange = (mode: 'combination' | 'manual') => {
        setLicenceComboMode(mode);
        setLicenceSelectedComboId('');
        setLicenceSeries('');
        setLicenceEngineCode('');
    };

    const handleLicenceComboSelect = (comboId: string, combo?: AircraftEngineCombination) => {
        setLicenceSelectedComboId(comboId);
        if (combo) {
            setLicenceSeries(combo.series || '');
            setLicenceEngineCode(combo.engineCode || '');
        } else {
            setLicenceSeries('');
            setLicenceEngineCode('');
        }
        setLicencePage(1);
    };

    const licenceQuery = useQuery({
        queryKey: [
            'roster',
            'certifying-staff',
            'aircraft-licence',
            {
                search: debouncedLicenceSearch,
                station: licenceStation === UNASSIGNED ? '' : licenceStation,
                aircraftType: licenceAircraftType,
                page: licencePage,
                pageSize: licencePageSize,
            },
        ],
        queryFn: async () => {
            const res = await getAircraftLicenceStaff({
                search: debouncedLicenceSearch,
                station: licenceStation === UNASSIGNED ? '' : licenceStation,
                aircraftType: licenceAircraftType,
                page: licencePage,
                pageSize: licencePageSize,
            });
            return res.responseData;
        },
        staleTime: 60 * 1000,
        placeholderData: (previousData) => previousData,
    });

    const licenceData = licenceQuery.data;
    const licenceColumns = licenceData?.columns;
    const rawLicenceAirlines: AircraftLicenceAirline[] = licenceColumns?.airlines ?? [];
    const rawLicenceRows: AircraftLicenceStaffRow[] = licenceData?.rows ?? [];
    const licencePagination = licenceData?.pagination ?? {
        page: licencePage,
        pageSize: licencePageSize,
        totalRecords: rawLicenceRows.length,
        totalPages: Math.ceil(rawLicenceRows.length / licencePageSize) || 1,
    };

    const licenceAirlines = useMemo(() => {
        let airlines = rawLicenceAirlines;
        const sQuery = debouncedLicenceSeries.toLowerCase().trim();
        const eQuery = debouncedLicenceEngineCode.toLowerCase().trim();

        if (sQuery || eQuery) {
            airlines = airlines
                .map((al) => {
                    const matchedAircraftTypes = al.aircraftTypes
                        .map((at) => {
                            const typeMatchesSeries = sQuery ? at.typeName.toLowerCase().includes(sQuery) : true;
                            const filteredSubtypes = at.subtypes.filter((st) => {
                                const stLabel = (st.label || '').toLowerCase();
                                const stEngine = (st.engine || '').toLowerCase();

                                const matchesSeries = !sQuery || typeMatchesSeries || stLabel.includes(sQuery) || stEngine.includes(sQuery);
                                const matchesEngine = !eQuery || stEngine.includes(eQuery) || stLabel.includes(eQuery);

                                return matchesSeries && matchesEngine;
                            });

                            return {
                                ...at,
                                subtypes: filteredSubtypes,
                            };
                        })
                        .filter((at) => at.subtypes.length > 0);

                    return {
                        ...al,
                        aircraftTypes: matchedAircraftTypes,
                    };
                })
                .filter((al) => al.aircraftTypes.length > 0);
        }

        return airlines;
    }, [rawLicenceAirlines, debouncedLicenceSeries, debouncedLicenceEngineCode]);

    const licenceRows = useMemo(() => {
        const hasSeriesFilter = Boolean(debouncedLicenceSeries.trim());
        const hasEngineFilter = Boolean(debouncedLicenceEngineCode.trim());

        if (!hasSeriesFilter && !hasEngineFilter) {
            return rawLicenceRows;
        }

        if (licenceAirlines.length === 0) {
            return [];
        }

        const activeColsByAirline = new Map<string, Set<string>>();
        licenceAirlines.forEach((al) => {
            const stSet = new Set<string>();
            al.aircraftTypes.forEach((at) => at.subtypes.forEach((st) => stSet.add(st.id)));
            if (stSet.size > 0) {
                activeColsByAirline.set(al.airlineId, stSet);
            }
        });

        return rawLicenceRows.filter((row) => {
            for (const [alId, stSet] of activeColsByAirline.entries()) {
                const alAuths = row.authorizations?.[alId];
                if (!alAuths) continue;
                for (const stId of stSet) {
                    const auth = alAuths[stId];
                    if (auth && (auth.status === 'true' || auth.status === 'pending' || auth.status === 'false')) {
                        return true;
                    }
                }
            }
            return false;
        });
    }, [rawLicenceRows, licenceAirlines, debouncedLicenceSeries, debouncedLicenceEngineCode]);

    const isLicenceClientFiltered = Boolean(debouncedLicenceSeries.trim() || debouncedLicenceEngineCode.trim());
    const effectiveLicenceTotal = isLicenceClientFiltered ? licenceRows.length : licencePagination.totalRecords;

    const totalLicenceSubtypes = useMemo(() => {
        return licenceAirlines.reduce(
            (sum, al) => sum + al.aircraftTypes.reduce((s2, at) => s2 + at.subtypes.length, 0),
            0
        );
    }, [licenceAirlines]);

    const isLicenceFiltering =
        licenceSearch !== '' ||
        licenceStation !== '' ||
        licenceAircraftType !== '' ||
        licenceSeries !== '' ||
        licenceEngineCode !== '' ||
        licenceSelectedComboId !== '';

    const clearLicenceFilters = () => {
        setLicenceSearch('');
        setLicenceStation('');
        setLicenceAircraftType('');
        setLicenceSelectedComboId('');
        setLicenceSeries('');
        setLicenceEngineCode('');
        setLicencePage(1);
    };

    // Overall KPI counts
    const certifying = staff.filter(isValidCertifyingStaff);
    const moving = certifying.filter((s) => movementStatus(s) !== 'Permanent').length;
    const unassigned = certifying.filter((s) => !s.stationCode).length;

    return (
        <div className="space-y-4">
            {/* ── Top Header & KPI Card ── */}
            <Card className="overflow-hidden">
                <RosterHeader
                    icon={<UserCheck className="h-5 w-5" />}
                    title="Certifying Staff"
                    subtitle="Aircraft licences and customer authorizations per person"
                />
                <div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-4">
                    <StatTile label="Valid CS" value={certifying.length} unit="people" />
                    <StatTile label="Licence holders" value={staff.length} unit="people" />
                    <StatTile label="Rotate / Transfer" value={moving} tone={moving > 0 ? 'warning' : 'default'} />
                    <StatTile label="No station" value={unassigned} tone={unassigned > 0 ? 'danger' : 'success'} />
                </div>
            </Card>

            {/* ── Main Tab Navigation & Content ── */}
            <Card className="overflow-hidden">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CertifyingStaffTab)} className="w-full">
                    {/* Tab Bar Header */}
                    <div className="border-b border-border bg-card px-5 pt-3">
                        <TabsList className="h-auto bg-transparent p-0 gap-6 border-b-0">
                            <TabsTrigger
                                value="amel"
                                className="relative pb-3 pt-2 text-sm font-semibold rounded-none border-b-2 border-transparent px-3 text-muted-foreground transition-all data-[state=active]:border-[#075CA2] data-[state=active]:text-[#075CA2] data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
                            >
                                AMEL
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                                    {amelPagination.totalRecords}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="licence"
                                className="relative pb-3 pt-2 text-sm font-semibold rounded-none border-b-2 border-transparent px-3 text-muted-foreground transition-all data-[state=active]:border-[#075CA2] data-[state=active]:text-[#075CA2] data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
                            >
                                Aircraft Licence
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                                    {licencePagination.totalRecords}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════
                        TAB 1: AMEL (Connected to /roster/certifying-staff/amel API)
                       ══════════════════════════════════════════════════════════════ */}
                    <TabsContent value="amel" className="m-0 focus-visible:outline-none">
                        {/* Filter bar for AMEL */}
                        <div className="border-b border-border bg-card px-4 py-3 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[200px] max-w-[300px] flex-1">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="search"
                                        value={amelSearch}
                                        onChange={(e) => {
                                            setAmelSearch(e.target.value);
                                            setAmelPage(1);
                                        }}
                                        placeholder="Search staff name, ID or position..."
                                        className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground/60 focus:border-[#075CA2]/40 focus:outline-none focus:ring-2 focus:ring-[#075CA2]/20"
                                    />
                                </div>
                                <StationSelect
                                    stations={stations}
                                    value={amelStation}
                                    onChange={(val) => {
                                        setAmelStation(val);
                                        setAmelPage(1);
                                    }}
                                    allowAll
                                    extraOptions={[{ value: UNASSIGNED, label: 'No station' }]}
                                />
                                <label className="flex items-center gap-1.5 text-xs">
                                    <span className="text-muted-foreground font-medium">A/C Type</span>
                                    <select
                                        value={amelAircraftType}
                                        onChange={(e) => handleAmelAcTypeChange(e.target.value)}
                                        className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:border-[#075CA2]/40 focus:outline-none focus:ring-2 focus:ring-[#075CA2]/20"
                                    >
                                        <option value="">All A/C Types</option>
                                        {familyCodeOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {isAmelFiltering && (
                                    <button
                                        type="button"
                                        onClick={clearAmelFilters}
                                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-500 transition-all hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800"
                                    >
                                        <X className="h-3 w-3" />
                                        Clear
                                    </button>
                                )}
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {amelRows.length} of {effectiveAmelTotal} staff · {amelGroups.length} Aircraft Series · {totalAmelColumns} Engine Columns
                                </span>
                            </div>

                            {/* Aircraft-Engine Filter matching example */}
                            <AircraftEngineFilter
                                familyCode={amelAircraftType}
                                comboMode={amelComboMode}
                                onComboModeChange={handleAmelComboModeChange}
                                selectedComboId={amelSelectedComboId}
                                onComboSelect={handleAmelComboSelect}
                                series={amelSeries}
                                onSeriesChange={(val) => {
                                    setAmelSeries(val);
                                    setAmelPage(1);
                                }}
                                engineCode={amelEngineCode}
                                onEngineCodeChange={(val) => {
                                    setAmelEngineCode(val);
                                    setAmelPage(1);
                                }}
                                combinations={combinationsData}
                            />
                        </div>

                        {/* Title Subheader matching Image 1 */}
                        <div className="flex items-center justify-between border-b border-border bg-slate-50 dark:bg-slate-800/50 px-4 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                                    SAMS AMEL CERTIFYING STAFFS
                                </span>
                                <span className="rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] font-bold px-1.5 py-0.5">
                                    Aircraft & Engine Licences
                                </span>
                            </div>
                            {amelQuery.isFetching && !amelQuery.isLoading && (
                                <span className="text-[11px] text-muted-foreground animate-pulse">Refreshing...</span>
                            )}
                        </div>

                        {amelQuery.isLoading ? (
                            <LoadingBlock label="Loading AMEL certifying staff data..." />
                        ) : amelQuery.error ? (
                            <EmptyBlock>Failed to load staff: {(amelQuery.error as Error).message}</EmptyBlock>
                        ) : amelRows.length === 0 || amelGroups.length === 0 ? (
                            <EmptyBlock>No staff match these filters.</EmptyBlock>
                        ) : (
                            <div className="max-h-[calc(100vh-320px)] overflow-auto">
                                <table className="w-full border-separate border-spacing-0 text-xs">
                                    <thead className="sticky top-0 z-30">
                                        {/* Row 1: Fixed ENGINE (sticky left colSpan 4) + Scrollable Aircraft Series */}
                                        <tr className={cn(config.sidebarColor !== 'light' && `dark theme-${config.sidebarColor}`)}>
                                            <th
                                                colSpan={4}
                                                className={cn(
                                                    'sticky left-0 z-40 border-b border-r-2 border-r-slate-300 dark:border-r-slate-600 bg-sidebar px-3 py-2 text-center text-sm font-extrabold uppercase tracking-wider shadow-[3px_0_8px_-1px_rgba(0,0,0,0.18)]',
                                                    isSidebarLight ? 'text-slate-900 dark:text-slate-100' : 'text-white'
                                                )}
                                                style={{
                                                    left: 0,
                                                    minWidth: AMEL_LEFT_ACTYPE + AMEL_COL_ACTYPE,
                                                    width: AMEL_LEFT_ACTYPE + AMEL_COL_ACTYPE,
                                                    maxWidth: AMEL_LEFT_ACTYPE + AMEL_COL_ACTYPE,
                                                }}
                                            >
                                                ENGINE
                                            </th>
                                            {amelGroups.map((group, gi) => (
                                                <th
                                                    key={group.id}
                                                    colSpan={group.columns.length}
                                                    className={cn(
                                                        'border-b border-l border-white/20 dark:border-slate-700 bg-sidebar py-2 px-1 text-center text-[11px] font-bold',
                                                        isSidebarLight ? 'text-slate-800 dark:text-slate-200' : 'text-white',
                                                        gi === 0 && 'border-l-transparent'
                                                    )}
                                                >
                                                    {group.aircraft}
                                                </th>
                                            ))}
                                        </tr>
                                        {/* Row 2: Fixed Column Headers (No, Name, Position, A/C Type) + Scrollable Engine Codes */}
                                        <tr>
                                            <th
                                                className="sticky left-0 z-40 border-b-2 border-r border-border bg-slate-100 dark:bg-slate-800 px-2 py-1.5 text-center text-[11px] font-bold text-slate-700 dark:text-slate-200"
                                                style={{ left: 0, minWidth: AMEL_COL_NO, width: AMEL_COL_NO, maxWidth: AMEL_COL_NO }}
                                            >
                                                No.
                                            </th>
                                            <th
                                                className="sticky z-40 border-b-2 border-r border-border bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-left text-[11px] font-bold text-slate-700 dark:text-slate-200"
                                                style={{ left: AMEL_LEFT_NAME, minWidth: AMEL_COL_NAME, width: AMEL_COL_NAME, maxWidth: AMEL_COL_NAME }}
                                            >
                                                SAMS Staffs Name
                                            </th>
                                            <th
                                                className="sticky z-40 border-b-2 border-r border-border bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 dark:text-slate-200"
                                                style={{ left: AMEL_LEFT_POS, minWidth: AMEL_COL_POS, width: AMEL_COL_POS, maxWidth: AMEL_COL_POS }}
                                            >
                                                Position
                                            </th>
                                            <th
                                                className="sticky z-40 border-b-2 border-r-2 border-r-slate-300 dark:border-r-slate-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-[3px_0_8px_-1px_rgba(0,0,0,0.18)]"
                                                style={{ left: AMEL_LEFT_ACTYPE, minWidth: AMEL_COL_ACTYPE, width: AMEL_COL_ACTYPE, maxWidth: AMEL_COL_ACTYPE }}
                                            >
                                                A/C Type
                                            </th>
                                            {amelGroups.flatMap((group) =>
                                                group.columns.map((col, ci) => (
                                                    <th
                                                        key={col.id}
                                                        className={cn(
                                                            'whitespace-nowrap border-b-2 border-l border-border/70 bg-white dark:bg-slate-900 px-2 py-1.5 text-center text-[10px] font-bold text-slate-600 dark:text-slate-300',
                                                            ci === 0 && 'border-l-border'
                                                        )}
                                                        style={{ minWidth: col.width || 140 }}
                                                    >
                                                        {col.label || col.engine}
                                                    </th>
                                                ))
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {amelRows.map((s, ri) => {
                                            const rowBg = ri % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-100 dark:bg-slate-900';
                                            const hoverBg = 'group-hover:bg-slate-200 dark:group-hover:bg-slate-800';
                                            const rowNumber = (amelPagination.page - 1) * amelPagination.pageSize + ri + 1;

                                            return (
                                                <tr key={s.id || s.staffNo || ri} className="group">
                                                    {/* No. */}
                                                    <td
                                                        className={cn(
                                                            'sticky left-0 z-20 h-12 border-b border-r border-border px-2 py-1 text-center align-middle text-xs font-medium text-muted-foreground',
                                                            rowBg,
                                                            hoverBg
                                                        )}
                                                        style={{ minWidth: AMEL_COL_NO, width: AMEL_COL_NO, maxWidth: AMEL_COL_NO }}
                                                    >
                                                        {rowNumber}
                                                    </td>
                                                    {/* Name */}
                                                    <td
                                                        className={cn(
                                                            'sticky z-20 h-12 border-b border-r border-border px-3 py-1 text-xs font-semibold text-foreground align-middle',
                                                            rowBg,
                                                            hoverBg
                                                        )}
                                                        style={{ left: AMEL_LEFT_NAME, minWidth: AMEL_COL_NAME, width: AMEL_COL_NAME, maxWidth: AMEL_COL_NAME }}
                                                    >
                                                        <div className="flex items-center gap-1.5 min-w-0 w-full overflow-hidden">
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="truncate font-semibold text-foreground" title={s.name}>
                                                                    {s.name}
                                                                </span>
                                                                {s.staffNo && (
                                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                                        {s.staffNo}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {s.station && (
                                                                <span className="shrink-0 rounded bg-slate-200 dark:bg-slate-700 px-1 py-0.2 text-[9px] font-mono font-medium text-slate-700 dark:text-slate-200">
                                                                    {s.station}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Position */}
                                                    <td
                                                        className={cn(
                                                            'sticky z-20 h-12 border-b border-r border-border px-2.5 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 align-middle',
                                                            rowBg,
                                                            hoverBg
                                                        )}
                                                        style={{ left: AMEL_LEFT_POS, minWidth: AMEL_COL_POS, width: AMEL_COL_POS, maxWidth: AMEL_COL_POS }}
                                                    >
                                                        {s.position || '-'}
                                                    </td>
                                                    {/* A/C Type */}
                                                    <td
                                                        className={cn(
                                                            'sticky z-20 h-12 border-b border-r-2 border-r-slate-300 dark:border-r-slate-600 px-2.5 py-1 text-xs shadow-[3px_0_8px_-1px_rgba(0,0,0,0.18)] align-middle',
                                                            rowBg,
                                                            hoverBg
                                                        )}
                                                        style={{ left: AMEL_LEFT_ACTYPE, minWidth: AMEL_COL_ACTYPE, width: AMEL_COL_ACTYPE, maxWidth: AMEL_COL_ACTYPE }}
                                                    >
                                                        <AmelAcTypeDisplay acType={s.aircraftType} />
                                                    </td>
                                                    {/* Engine Cells (UI styled matching Image 1: StatusDot + TRUE + mint background) */}
                                                    {amelGroups.flatMap((group) =>
                                                        group.columns.map((col, ci) => {
                                                            const qual = s.qualifications?.[col.id];
                                                            const isQual = Boolean(qual?.qualified);
                                                            return (
                                                                <td
                                                                    key={col.id}
                                                                    className={cn(
                                                                        'h-12 border-b border-l border-border/50 px-1 text-center align-middle',
                                                                        ci === 0 && 'border-l-border',
                                                                        isQual ? 'bg-[#f0fdf4] dark:bg-emerald-950/25' : rowBg
                                                                    )}
                                                                    style={{ minWidth: col.width || 140 }}
                                                                >
                                                                    {isQual ? (
                                                                        <div
                                                                            className="flex flex-col items-center justify-center gap-0.5 leading-none py-1"
                                                                            title={
                                                                                qual?.licenceNo
                                                                                    ? `Licence: ${qual.licenceNo}\nIssue: ${qual.issueDate || '-'}\nExpiry: ${qual.expiryDate || '-'}`
                                                                                    : undefined
                                                                            }
                                                                        >
                                                                            <div className="flex items-center gap-1">
                                                                                <StatusDot status="true" size={8} />
                                                                                <span className="text-[9px] font-bold uppercase text-[#15803d] dark:text-emerald-400">
                                                                                    TRUE
                                                                                </span>
                                                                            </div>
                                                                            {qual?.licenceNo && (
                                                                                <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[120px]">
                                                                                    {qual.licenceNo}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-muted-foreground">-</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* AMEL Legend & Pagination Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-4 py-2.5 text-xs text-muted-foreground bg-card">
                            {/* Legend */}
                            <div className="flex items-center gap-4 text-[11px]">
                                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                                    <StatusDot status="true" size={9} /> True (Qualified)
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="font-bold text-muted-foreground/60">-</span> Not qualified
                                </span>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center gap-4">
                                {/* Rows per page */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">Rows per page</span>
                                    <select
                                        value={amelPageSize}
                                        onChange={(e) => {
                                            setAmelPageSize(Number(e.target.value));
                                            setAmelPage(1);
                                        }}
                                        className="h-7 rounded border border-border bg-background px-2 text-xs text-foreground focus:border-[#075CA2] focus:outline-none"
                                    >
                                        {[10, 20, 50, 100].map((size) => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Page Range Display */}
                                <span>
                                    Showing{' '}
                                    <strong className="text-foreground">
                                        {effectiveAmelTotal === 0
                                            ? 0
                                            : (amelPagination.page - 1) * amelPagination.pageSize + 1}
                                    </strong>{' '}
                                    to{' '}
                                    <strong className="text-foreground">
                                        {Math.min(amelPagination.page * amelPagination.pageSize, effectiveAmelTotal)}
                                    </strong>{' '}
                                    of <strong className="text-foreground">{effectiveAmelTotal}</strong> records
                                </span>

                                {/* Page navigation buttons */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={amelPagination.page <= 1 || amelQuery.isLoading}
                                        onClick={() => setAmelPage(1)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                                        title="First page"
                                    >
                                        <ChevronsLeft className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={amelPagination.page <= 1 || amelQuery.isLoading}
                                        onClick={() => setAmelPage((p) => Math.max(1, p - 1))}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                                        title="Previous page"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="px-1 font-semibold text-foreground">
                                        {amelPagination.page} / {amelPagination.totalPages || 1}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={amelPagination.page >= amelPagination.totalPages || amelQuery.isLoading}
                                        onClick={() => setAmelPage((p) => Math.min(amelPagination.totalPages, p + 1))}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                                        title="Next page"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={amelPagination.page >= amelPagination.totalPages || amelQuery.isLoading}
                                        onClick={() => setAmelPage(amelPagination.totalPages)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                                        title="Last page"
                                    >
                                        <ChevronsRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ══════════════════════════════════════════════════════════════
                        TAB 2: Aircraft Licence (Reference Image 2 - Customer Auths)
                       ══════════════════════════════════════════════════════════════ */}
                    {/* ══════════════════════════════════════════════════════════════
                        TAB 2: Aircraft Licence (Connected to /roster/certifying-staff/aircraft-licence API)
                       ══════════════════════════════════════════════════════════════ */}
                    <TabsContent value="licence" className="m-0 focus-visible:outline-none">
                        {/* Filter bar for Aircraft Licence */}
                        <div className="border-b border-border bg-card px-4 py-3 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[200px] max-w-[300px] flex-1">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="search"
                                        value={licenceSearch}
                                        onChange={(e) => {
                                            setLicenceSearch(e.target.value);
                                            setLicencePage(1);
                                        }}
                                        placeholder="Search staff name, ID or position..."
                                        className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground/60 focus:border-[#075CA2]/40 focus:outline-none focus:ring-2 focus:ring-[#075CA2]/20"
                                    />
                                </div>
                                <StationSelect
                                    stations={stations}
                                    value={licenceStation}
                                    onChange={(val) => {
                                        setLicenceStation(val);
                                        setLicencePage(1);
                                    }}
                                    allowAll
                                    extraOptions={[{ value: UNASSIGNED, label: 'No station' }]}
                                />
                                <label className="flex items-center gap-1.5 text-xs">
                                    <span className="text-muted-foreground font-medium">A/C Type</span>
                                    <select
                                        value={licenceAircraftType}
                                        onChange={(e) => handleLicenceAcTypeChange(e.target.value)}
                                        className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:border-[#075CA2]/40 focus:outline-none focus:ring-2 focus:ring-[#075CA2]/20"
                                    >
                                        <option value="">All A/C Types</option>
                                        {familyCodeOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {isLicenceFiltering && (
                                    <button
                                        type="button"
                                        onClick={clearLicenceFilters}
                                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-500 transition-all hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800"
                                    >
                                        <X className="h-3 w-3" />
                                        Clear
                                    </button>
                                )}
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {licenceRows.length} of {effectiveLicenceTotal} staff · {licenceAirlines.length} Airlines · {totalLicenceSubtypes} Subtype Columns
                                </span>
                            </div>

                            {/* Aircraft-Engine Filter matching example */}
                            <AircraftEngineFilter
                                familyCode={licenceAircraftType}
                                comboMode={licenceComboMode}
                                onComboModeChange={handleLicenceComboModeChange}
                                selectedComboId={licenceSelectedComboId}
                                onComboSelect={handleLicenceComboSelect}
                                series={licenceSeries}
                                onSeriesChange={(val) => {
                                    setLicenceSeries(val);
                                    setLicencePage(1);
                                }}
                                engineCode={licenceEngineCode}
                                onEngineCodeChange={(val) => {
                                    setLicenceEngineCode(val);
                                    setLicencePage(1);
                                }}
                                combinations={combinationsData}
                            />
                        </div>

                        {/* Title Subheader matching Image 2 */}
                        <div className="flex items-center justify-between border-b border-border bg-slate-50 dark:bg-slate-800/50 px-4 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                                    SAMS AIRCRAFT LICENCE CERTIFYING STAFFS
                                </span>
                                <span className="rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] font-bold px-1.5 py-0.5">
                                    Customer & Airline Authorizations
                                </span>
                            </div>
                            {licenceQuery.isFetching && !licenceQuery.isLoading && (
                                <span className="text-[11px] text-muted-foreground animate-pulse">Refreshing...</span>
                            )}
                        </div>

                        {licenceQuery.isLoading ? (
                            <LoadingBlock label="Loading Aircraft Licence data..." />
                        ) : licenceQuery.error ? (
                            <EmptyBlock>Failed to load staff: {(licenceQuery.error as Error).message}</EmptyBlock>
                        ) : licenceRows.length === 0 || licenceAirlines.length === 0 ? (
                            <EmptyBlock>No staff match these filters.</EmptyBlock>
                        ) : (
                            <div className="max-h-[calc(100vh-320px)] overflow-auto">
                                <table className="w-full border-separate border-spacing-0 text-xs">
                                    <thead className="sticky top-0 z-30">
                                        {/* Row 1: Fixed Airlines (sticky left colSpan 4) + Airline Headers */}
                                        <tr className={cn(config.sidebarColor !== 'light' && `dark theme-${config.sidebarColor}`)}>
                                            <th
                                                colSpan={4}
                                                className={cn(
                                                    'sticky left-0 z-40 border-b border-r-2 border-r-slate-300 dark:border-r-slate-600 bg-sidebar px-3 py-2 text-center text-sm font-extrabold uppercase tracking-wider shadow-[3px_0_8px_-1px_rgba(0,0,0,0.18)]',
                                                    isSidebarLight ? 'text-slate-900 dark:text-slate-100' : 'text-white'
                                                )}
                                                style={{
                                                    left: 0,
                                                    minWidth: AMEL_LEFT_ACTYPE + AMEL_COL_ACTYPE,
                                                    width: AMEL_LEFT_ACTYPE + AMEL_COL_ACTYPE,
                                                    maxWidth: AMEL_LEFT_ACTYPE + AMEL_COL_ACTYPE,
                                                }}
                                            >
                                                AIRLINES
                                            </th>
                                            {licenceAirlines.map((al, ai) => {
                                                const subCount = al.aircraftTypes.reduce(
                                                    (sum, at) => sum + Math.max(at.subtypes.length, 1),
                                                    0
                                                );
                                                return (
                                                    <th
                                                        key={al.airlineId}
                                                        colSpan={Math.max(subCount, 1)}
                                                        className={cn(
                                                            'whitespace-nowrap border-b border-l border-white/20 dark:border-slate-700 bg-sidebar px-3 py-2 text-center text-xs font-bold uppercase tracking-wide align-middle',
                                                            isSidebarLight ? 'text-slate-800 dark:text-slate-200' : 'text-white',
                                                            ai === 0 && 'border-l-transparent'
                                                        )}
                                                    >
                                                        {al.airlineName} {al.airlineCode ? `(${al.airlineCode})` : ''}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                        {/* Row 2: Fixed Column Headers (No, Name, Position, A/C Type with rowSpan=2) + Aircraft Types */}
                                        <tr>
                                            <th
                                                rowSpan={2}
                                                className="sticky left-0 z-40 border-b-2 border-r border-border bg-slate-100 dark:bg-slate-800 px-2 py-1.5 text-center text-[11px] font-bold text-slate-700 dark:text-slate-200 align-middle"
                                                style={{ left: 0, minWidth: AMEL_COL_NO, width: AMEL_COL_NO, maxWidth: AMEL_COL_NO }}
                                            >
                                                No.
                                            </th>
                                            <th
                                                rowSpan={2}
                                                className="sticky z-40 border-b-2 border-r border-border bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-left text-[11px] font-bold text-slate-700 dark:text-slate-200 align-middle"
                                                style={{ left: AMEL_LEFT_NAME, minWidth: AMEL_COL_NAME, width: AMEL_COL_NAME, maxWidth: AMEL_COL_NAME }}
                                            >
                                                SAMS Staffs Name
                                            </th>
                                            <th
                                                rowSpan={2}
                                                className="sticky z-40 border-b-2 border-r border-border bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 dark:text-slate-200 align-middle"
                                                style={{ left: AMEL_LEFT_POS, minWidth: AMEL_COL_POS, width: AMEL_COL_POS, maxWidth: AMEL_COL_POS }}
                                            >
                                                Position
                                            </th>
                                            <th
                                                rowSpan={2}
                                                className="sticky z-40 border-b-2 border-r-2 border-r-slate-300 dark:border-r-slate-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-[3px_0_8px_-1px_rgba(0,0,0,0.18)] align-middle"
                                                style={{ left: AMEL_LEFT_ACTYPE, minWidth: AMEL_COL_ACTYPE, width: AMEL_COL_ACTYPE, maxWidth: AMEL_COL_ACTYPE }}
                                            >
                                                A/C Type
                                            </th>
                                            {licenceAirlines.flatMap((al) =>
                                                al.aircraftTypes.map((at) => (
                                                    <th
                                                        key={`${al.airlineId}-${at.typeId}`}
                                                        colSpan={Math.max(at.subtypes.length, 1)}
                                                        className="border-b border-l border-border bg-slate-50 dark:bg-slate-800/90 px-2 py-1.5 text-center text-[11px] font-bold text-slate-800 dark:text-slate-200 align-middle"
                                                    >
                                                        {at.typeName}
                                                    </th>
                                                ))
                                            )}
                                        </tr>
                                        {/* Row 3: Subtype / Engine Columns */}
                                        <tr>
                                            {licenceAirlines.flatMap((al) =>
                                                al.aircraftTypes.flatMap((at) =>
                                                    at.subtypes.length > 0 ? (
                                                        at.subtypes.map((st, si) => (
                                                            <th
                                                                key={st.id}
                                                                className={cn(
                                                                    'whitespace-nowrap border-b-2 border-l border-border/70 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-center text-[10px] font-bold text-slate-600 dark:text-slate-300 align-middle',
                                                                    si === 0 && 'border-l-border'
                                                                )}
                                                                style={{ minWidth: st.width || 140 }}
                                                            >
                                                                {st.label || st.engine}
                                                            </th>
                                                        ))
                                                    ) : (
                                                        <th
                                                            key={`${al.airlineId}-${at.typeId}-empty`}
                                                            className="whitespace-nowrap border-b-2 border-l border-border/70 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-center text-[10px] font-bold text-slate-600 dark:text-slate-300 align-middle"
                                                            style={{ minWidth: 100 }}
                                                        >
                                                            -
                                                        </th>
                                                    )
                                                )
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {licenceRows.map((s, ri) => {
                                            const rowBg = ri % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-100 dark:bg-slate-900';
                                            const hoverBg = 'group-hover:bg-slate-200 dark:group-hover:bg-slate-800';
                                            const rowNumber = (licencePagination.page - 1) * licencePagination.pageSize + ri + 1;

                                            return (
                                                <tr key={s.id || s.staffNo || ri} className="group">
                                                    {/* No. */}
                                                    <td
                                                        className={cn(
                                                            'sticky left-0 z-20 h-12 border-b border-r border-border px-2 py-1 text-center align-middle text-xs font-medium text-muted-foreground',
                                                            rowBg,
                                                            hoverBg
                                                        )}
                                                        style={{ minWidth: AMEL_COL_NO, width: AMEL_COL_NO, maxWidth: AMEL_COL_NO }}
                                                    >
                                                        {rowNumber}
                                                    </td>
                                                    {/* Name */}
                                                    <td
                                                        className={cn(
                                                            'sticky z-20 h-12 border-b border-r border-border px-3 py-1 text-xs font-semibold text-foreground align-middle',
                                                            rowBg,
                                                            hoverBg
                                                        )}
                                                        style={{ left: AMEL_LEFT_NAME, minWidth: AMEL_COL_NAME, width: AMEL_COL_NAME, maxWidth: AMEL_COL_NAME }}
                                                    >
                                                        <div className="flex items-center gap-1.5 min-w-0 w-full overflow-hidden">
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="truncate font-semibold text-foreground" title={s.name}>
                                                                    {s.name}
                                                                </span>
                                                                {s.staffNo && (
                                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                                        {s.staffNo}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {s.station && (
                                                                <span className="shrink-0 rounded bg-slate-200 dark:bg-slate-700 px-1 py-0.2 text-[9px] font-mono font-medium text-slate-700 dark:text-slate-200">
                                                                    {s.station}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Position */}
                                                    <td
                                                        className={cn(
                                                            'sticky z-20 h-12 border-b border-r border-border px-2.5 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 align-middle',
                                                            rowBg,
                                                            hoverBg
                                                        )}
                                                        style={{ left: AMEL_LEFT_POS, minWidth: AMEL_COL_POS, width: AMEL_COL_POS, maxWidth: AMEL_COL_POS }}
                                                    >
                                                        {s.position || '-'}
                                                    </td>
                                                    {/* A/C Type */}
                                                    <td
                                                        className={cn(
                                                            'sticky z-20 h-12 border-b border-r-2 border-r-slate-300 dark:border-r-slate-600 px-2.5 py-1 text-xs shadow-[3px_0_8px_-1px_rgba(0,0,0,0.18)] align-middle',
                                                            rowBg,
                                                            hoverBg
                                                        )}
                                                        style={{ left: AMEL_LEFT_ACTYPE, minWidth: AMEL_COL_ACTYPE, width: AMEL_COL_ACTYPE, maxWidth: AMEL_COL_ACTYPE }}
                                                    >
                                                        <AmelAcTypeDisplay acType={s.aircraftType} />
                                                    </td>
                                                    {/* Airline Subtype Authorizations */}
                                                    {licenceAirlines.flatMap((al) =>
                                                        al.aircraftTypes.flatMap((at) =>
                                                            at.subtypes.length > 0 ? (
                                                                at.subtypes.map((st, si) => {
                                                                    const auth = s.authorizations?.[al.airlineId]?.[st.id];
                                                                    const status = auth?.status;
                                                                    const isTrue = status === 'true';
                                                                    const isFalse = status === 'false';
                                                                    const isPending = status === 'pending';

                                                                    return (
                                                                        <td
                                                                            key={st.id}
                                                                            className={cn(
                                                                                'h-12 border-b border-l border-border/50 px-1 text-center align-middle',
                                                                                si === 0 && 'border-l-border',
                                                                                isTrue
                                                                                    ? 'bg-[#f0fdf4] dark:bg-emerald-950/25'
                                                                                    : isFalse
                                                                                      ? 'bg-rose-50/40 dark:bg-rose-950/20'
                                                                                      : isPending
                                                                                        ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                                                                        : rowBg
                                                                            )}
                                                                            style={{ minWidth: st.width || 140 }}
                                                                        >
                                                                            {auth ? (
                                                                                <div
                                                                                    className="flex flex-col items-center justify-center gap-0.5 leading-none py-1"
                                                                                    title={
                                                                                        auth.authNo || auth.expiryDate
                                                                                            ? `Auth No: ${auth.authNo || '-'}\nExpiry: ${auth.expiryDate || '-'}`
                                                                                            : undefined
                                                                                    }
                                                                                >
                                                                                    <div className="flex items-center gap-1">
                                                                                        {(isTrue || isFalse || isPending) && (
                                                                                            <StatusDot
                                                                                                status={isTrue ? 'true' : isFalse ? 'false' : 'pending'}
                                                                                                size={8}
                                                                                            />
                                                                                        )}
                                                                                        <span
                                                                                            className={cn(
                                                                                                'text-[9px] font-bold uppercase',
                                                                                                isTrue && 'text-[#15803d] dark:text-emerald-400',
                                                                                                isFalse && 'text-red-600 dark:text-red-400',
                                                                                                isPending && 'text-amber-600 dark:text-amber-400',
                                                                                                !isTrue && !isFalse && !isPending && 'text-muted-foreground'
                                                                                            )}
                                                                                        >
                                                                                            {isTrue ? 'TRUE' : isFalse ? 'FALSE' : isPending ? 'PENDING' : status}
                                                                                        </span>
                                                                                    </div>
                                                                                    {auth.authNo && (
                                                                                        <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[120px]">
                                                                                            {auth.authNo}
                                                                                        </span>
                                                                                    )}
                                                                                    {auth.expiryDate && (
                                                                                        <span className="text-[8px] text-muted-foreground/75 font-mono truncate max-w-[120px]">
                                                                                            Exp: {auth.expiryDate}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-xs text-muted-foreground">-</span>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })
                                                            ) : (
                                                                <td
                                                                    key={`${al.airlineId}-${at.typeId}-empty-td`}
                                                                    className={cn('h-12 border-b border-l border-border/50 text-center align-middle', rowBg)}
                                                                >
                                                                    <span className="text-xs text-muted-foreground">-</span>
                                                                </td>
                                                            )
                                                        )
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Aircraft Licence Legend & Pagination Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-4 py-2.5 text-xs text-muted-foreground bg-card">
                            {/* Legend */}
                            <div className="flex items-center gap-4 text-[11px]">
                                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                                    <StatusDot status="true" size={9} /> True (Authorized)
                                </span>
                                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                                    <StatusDot status="false" size={9} /> False (Inactive / Expired)
                                </span>
                                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                                    <StatusDot status="pending" size={9} /> Pending
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="font-bold text-muted-foreground/60">-</span> No authorization
                                </span>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center gap-4">
                                {/* Rows per page */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">Rows per page</span>
                                    <select
                                        value={licencePageSize}
                                        onChange={(e) => {
                                            setLicencePageSize(Number(e.target.value));
                                            setLicencePage(1);
                                        }}
                                        className="h-7 rounded border border-border bg-background px-2 text-xs text-foreground focus:border-[#075CA2] focus:outline-none"
                                    >
                                        {[10, 20, 50, 100].map((size) => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Page Range Display */}
                                <span>
                                    Showing{' '}
                                    <strong className="text-foreground">
                                        {effectiveLicenceTotal === 0
                                            ? 0
                                            : (licencePagination.page - 1) * licencePagination.pageSize + 1}
                                    </strong>{' '}
                                    to{' '}
                                    <strong className="text-foreground">
                                        {Math.min(licencePagination.page * licencePagination.pageSize, effectiveLicenceTotal)}
                                    </strong>{' '}
                                    of <strong className="text-foreground">{effectiveLicenceTotal}</strong> records
                                </span>

                                {/* Page navigation buttons */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={licencePagination.page <= 1 || licenceQuery.isLoading}
                                        onClick={() => setLicencePage(1)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                                        title="First page"
                                    >
                                        <ChevronsLeft className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={licencePagination.page <= 1 || licenceQuery.isLoading}
                                        onClick={() => setLicencePage((p) => Math.max(1, p - 1))}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                                        title="Previous page"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="px-1 font-semibold text-foreground">
                                        {licencePagination.page} / {licencePagination.totalPages || 1}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={licencePagination.page >= licencePagination.totalPages || licenceQuery.isLoading}
                                        onClick={() => setLicencePage((p) => Math.min(licencePagination.totalPages, p + 1))}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                                        title="Next page"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={licencePagination.page >= licencePagination.totalPages || licenceQuery.isLoading}
                                        onClick={() => setLicencePage(licencePagination.totalPages)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                                        title="Last page"
                                    >
                                        <ChevronsRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
