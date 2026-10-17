'use client';

import { Fragment, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { ChevronRight, Search, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRosterStaff } from '@/lib/roster/useRosterData';
import { useCombinations } from '@/lib/api/master/aircraft-engine/aircraftEngine.hooks';
import type { AircraftEngineCombination } from '@/lib/api/master/aircraft-engine/aircraftEngine.types';
import {
    countByTypeEngine,
    normalizeCode,
    enginesMatch,
    type RosterStaff,
    type TypeEngineCount,
} from '@/lib/roster/manpower';
import { EmptyBlock, LoadingBlock } from '../components/RosterUi';

interface FamilyRow {
    familyCode: string;
    engines: TypeEngineCount[];
    licensed: number;
    certifying: number;
}

/** Distinct people across the engines of one family. */
function distinct(lists: RosterStaff[][]): number {
    return new Set(lists.flat().map((s) => s.staffId)).size;
}

/** Drawer component displaying the Aircraft Engine Combinations list for an expanded aircraft engine row */
function EngineCombinationsDrawer({
    familyCode,
    engineCode,
    allCombinations,
}: {
    familyCode: string;
    engineCode: string;
    allCombinations: AircraftEngineCombination[];
}) {
    const combos = useMemo(() => {
        const matches = allCombinations.filter(
            (c) =>
                normalizeCode(c.familyCode) === normalizeCode(familyCode) &&
                enginesMatch(c.engineCode, engineCode)
        );
        if (matches.length > 0) return matches;

        // Fallback display if not yet registered in master combination table
        return [
            {
                id: 0,
                familyCode,
                series: '',
                engineCode,
                displayLabel: `${familyCode} (${engineCode || 'All'})`,
                similarTechnology: 'Standard',
                updatedBy: 'system',
                updatedAtUtc: '',
            } as AircraftEngineCombination,
        ];
    }, [allCombinations, familyCode, engineCode]);

    return (
        <div className="space-y-2 py-1.5 px-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Aircraft Engine Combinations List ({combos.length})
                    </h4>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                    Family: <strong className="text-slate-700 dark:text-slate-300">{familyCode}</strong> · Engine:{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{engineCode || '—'}</strong>
                </span>
            </div>

            <ul className="space-y-1.5">
                {combos.map((c) => (
                    <li
                        key={c.id || `${c.familyCode}-${c.series}-${c.engineCode}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-slate-400 font-black">•</span>
                            <Icon icon="mdi:airplane" className="h-4 w-4 text-slate-500 shrink-0" />
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {c.displayLabel || `${c.familyCode}${c.series ? `-${c.series}` : ''} (${c.engineCode})`}
                                </span>
                                {c.series && (
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                        Series: {c.series}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                {c.engineCode}
                            </span>
                            {c.similarTechnology && (
                                <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                    {c.similarTechnology}
                                </span>
                            )}
                            {c.id > 0 && (
                                <span className="font-mono text-[11px] text-slate-400">
                                    #{c.id}
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function AircraftTypeSummaryPage() {
    const { staff, stations, isLoading, error } = useRosterStaff();
    const { data: allCombinations = [] } = useCombinations();
    const [stationCode, setStationCode] = useState('');
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const stationStaff = useMemo(
        () => (stationCode ? staff.filter((s) => s.stationCode === stationCode) : staff),
        [staff, stationCode]
    );
    const counts = useMemo(() => countByTypeEngine(stationStaff), [stationStaff]);

    const families = useMemo<FamilyRow[]>(() => {
        const map = new Map<string, TypeEngineCount[]>();
        counts.forEach((c) => map.set(c.familyCode, [...(map.get(c.familyCode) ?? []), c]));
        return Array.from(map.entries()).map(([familyCode, engines]) => ({
            familyCode,
            engines,
            licensed: distinct(engines.map((e) => e.licensed)),
            certifying: distinct(engines.map((e) => e.certifying)),
        }));
    }, [counts]);

    // KPI Metrics calculation
    const totalLicensedStaff = useMemo(() => distinct(counts.map((c) => c.licensed)), [counts]);
    const activeCS = useMemo(
        () => stationStaff.filter((s) => counts.some((c) => c.certifying.includes(s))).length,
        [stationStaff, counts]
    );
    const coveragePercentage = totalLicensedStaff > 0 ? Math.round((activeCS / totalLicensedStaff) * 100) : 0;

    // Filter families & engines based on search query
    const filteredFamilies = useMemo(() => {
        if (!search.trim()) return families;
        const q = search.trim().toLowerCase();
        return families
            .map((fam) => {
                const famMatch = fam.familyCode.toLowerCase().includes(q);
                const matchingEngines = fam.engines.filter(
                    (e) =>
                        famMatch ||
                        e.engineCode.toLowerCase().includes(q) ||
                        e.licensed.some(
                            (s) =>
                                s.name.toLowerCase().includes(q) ||
                                s.employeeId.toLowerCase().includes(q)
                        )
                );
                if (famMatch) return fam;
                if (matchingEngines.length > 0) {
                    return { ...fam, engines: matchingEngines };
                }
                return null;
            })
            .filter((fam): fam is FamilyRow => fam !== null);
    }, [families, search]);

    const toggle = (key: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    return (
        <div className="space-y-4">
            {/* Top Page Header & Quick Controls */}
            <Card className="overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner">
                            <Icon icon="mdi:engine" className="h-7 w-7 text-slate-800 dark:text-slate-100" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                                Engine Summary
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Manpower coverage and certifying staff authorization across fleet aircraft and engine types
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Station Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Station</span>
                            <select
                                value={stationCode}
                                onChange={(e) => setStationCode(e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">All Stations</option>
                                {stations.map((s) => (
                                    <option key={s.id} value={s.code}>
                                        {s.code}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Filter */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Filter..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 w-44 sm:w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>

                {/* KPI Overview Cards (Matching Example Image) */}
                <div className="grid grid-cols-2 gap-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* 1. Fleet Models */}
                    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Icon icon="mdi:airplane" className="h-4 w-4 text-slate-500" />
                            <span>Fleet Models</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                                {families.length}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Models</span>
                        </div>
                    </div>

                    {/* 2. Engine Variants */}
                    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Icon icon="mdi:cog-outline" className="h-4 w-4 text-slate-500" />
                            <span>Engine Variants</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                                {counts.length}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Types</span>
                        </div>
                    </div>

                    {/* 3. Licence Holders */}
                    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Icon icon="lucide:user" className="h-4 w-4 text-slate-500" />
                            <span>Licence Holders</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                                {totalLicensedStaff}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Staff</span>
                        </div>
                    </div>

                    {/* 4. Active CS */}
                    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <UserCheck className="h-4 w-4 text-slate-500" />
                            <span>Active CS</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                                {activeCS}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Authorized</span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {coveragePercentage}% Coverage
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Main Hierarchical Capability Matrix Table */}
            <Card className="overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                {isLoading ? (
                    <LoadingBlock label="Loading engine summary..." />
                ) : error ? (
                    <EmptyBlock>Failed to load staff: {(error as Error).message}</EmptyBlock>
                ) : filteredFamilies.length === 0 ? (
                    <EmptyBlock>No aircraft or engines match your filter criteria.</EmptyBlock>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[880px] border-collapse text-xs">
                            {/* Table Column Headers */}
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90">
                                    <th className="py-3 px-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[180px]">
                                        AIRCRAFT MODEL
                                    </th>
                                    <th className="py-3 px-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        ENGINE VARIANT
                                    </th>
                                    <th className="py-3 px-4 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[180px]">
                                        LICENCE HOLDERS (AMEL)
                                    </th>
                                    <th className="py-3 px-4 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[180px]">
                                        VALID CS (LINE RELEASE)
                                    </th>
                                    <th className="py-3 px-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[300px]">
                                        COVERAGE & READINESS STATUS
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFamilies.map((fam) => (
                                    <Fragment key={fam.familyCode}>
                                        {/* Family Model Header Row (e.g. A318, A319, A320, B777) */}
                                        <tr className="border-t border-b border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40">
                                            {/* Column 1: AIRCRAFT MODEL */}
                                            <td className="py-3 px-4 font-black text-sm text-slate-900 dark:text-slate-100">
                                                <div className="inline-flex items-center gap-2">
                                                    <span>{fam.familyCode}</span>
                                                    <Icon
                                                        icon="mdi:airplane"
                                                        className="h-4 w-4 text-slate-500 opacity-90 inline-block"
                                                    />
                                                </div>
                                            </td>

                                            {/* Column 2: ENGINE VARIANT (All engines) */}
                                            <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                                All engines
                                            </td>

                                            {/* Column 3: LICENCE HOLDERS */}
                                            <td className="py-3 px-4 text-right tabular-nums">
                                                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                                    {fam.licensed}
                                                </span>{' '}
                                                <span className="text-xs font-semibold text-slate-500">Staff</span>
                                            </td>

                                            {/* Column 4: VALID CS */}
                                            <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                                                {fam.certifying}
                                            </td>

                                            {/* Column 5: COVERAGE & READINESS STATUS */}
                                            <td className="py-3 px-4"></td>
                                        </tr>

                                        {/* Engine Variant Sub-rows */}
                                        {fam.engines.map((e) => {
                                            const open = expanded.has(e.key);
                                            const certCount = e.certifying.length;
                                            const licCount = e.licensed.length;

                                            // Determine status badge, progress bar color and readiness percentage
                                            let badgeLabel = 'Adequate';
                                            let badgeClass =
                                                'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50';
                                            let barClass = 'bg-emerald-500';
                                            let pct = 90;

                                            if (certCount === 0) {
                                                badgeLabel = 'No Authorised CS';
                                                badgeClass =
                                                    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50';
                                                barClass = 'bg-rose-500';
                                                pct = 0;
                                            } else if (certCount <= 2) {
                                                badgeLabel = 'Low Coverage ≤ 2';
                                                badgeClass =
                                                    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50';
                                                barClass = 'bg-amber-500';
                                                pct = Math.min(
                                                    45,
                                                    Math.max(
                                                        25,
                                                        Math.round((certCount / Math.max(1, licCount)) * 100)
                                                    )
                                                );
                                            } else {
                                                badgeLabel = 'Adequate';
                                                badgeClass =
                                                    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50';
                                                barClass = 'bg-emerald-500';
                                                pct = Math.min(
                                                    95,
                                                    Math.max(
                                                        60,
                                                        Math.round((certCount / Math.max(1, licCount)) * 100)
                                                    )
                                                );
                                            }

                                            return (
                                                <Fragment key={e.key}>
                                                    <tr
                                                        className="border-t border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                                                        onClick={() => toggle(e.key)}
                                                    >
                                                        {/* Column 1: Blank for sub-rows */}
                                                        <td className="py-2.5 px-4"></td>

                                                        {/* Column 2: Engine Variant with Chevron and Tag */}
                                                        <td className="py-2.5 px-4">
                                                            <div className="inline-flex items-center gap-1.5">
                                                                <ChevronRight
                                                                    className={cn(
                                                                        'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
                                                                        open && 'rotate-90 text-primary'
                                                                    )}
                                                                />
                                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                    {e.engineCode || '—'}
                                                                </span>
                                                                {e.engineCode && (
                                                                    <span className="ml-1.5 inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                                                        {e.engineCode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Column 3: Licence holders count */}
                                                        <td className="py-2.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                                                            {e.licensed.length}
                                                        </td>

                                                        {/* Column 4: Valid CS with 'Authorised' label */}
                                                        <td className="py-2.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                                                            <span>{e.certifying.length} Authorised</span>
                                                        </td>

                                                        {/* Column 5: Status Badge + Progress Bar + % */}
                                                        <td className="py-2.5 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    className={cn(
                                                                        'inline-flex min-w-[115px] items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold text-center',
                                                                        badgeClass
                                                                    )}
                                                                >
                                                                    {badgeLabel}
                                                                </span>

                                                                {/* Progress Bar */}
                                                                <div className="h-2 flex-1 max-w-[130px] rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            'h-full rounded-full transition-all duration-300',
                                                                            barClass
                                                                        )}
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>

                                                                {/* Percentage Text */}
                                                                <span className="w-9 text-right font-bold text-xs text-slate-700 dark:text-slate-300 tabular-nums">
                                                                    {pct}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Details: Aircraft Engine Combinations List */}
                                                    {open && (
                                                        <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-700">
                                                            <td className="py-3 px-4"></td>
                                                            <td className="py-3 px-4" colSpan={4}>
                                                                <EngineCombinationsDrawer
                                                                    familyCode={fam.familyCode}
                                                                    engineCode={e.engineCode}
                                                                    allCombinations={allCombinations}
                                                                />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
