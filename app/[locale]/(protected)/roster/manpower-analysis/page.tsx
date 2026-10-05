'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import '@/lib/dayjs';
import { Activity, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getWeekStart } from '@/components/flight-timeline/utils';
import { DEFAULT_ROSTER_STATION, useRosterFlights, useRosterStaff } from '@/lib/roster/useRosterData';
import {
    DEFAULT_MANPOWER_PARAMS,
    analyzeManpower,
    reliefFactor,
    staffPerPosition,
    typeEngineKey,
    type ManpowerParams,
    type ShortageRow,
} from '@/lib/roster/manpower';
import { EmptyBlock, LoadingBlock, Pill, RosterHeader, StatTile, StationSelect, WeekNav, td, th } from '../components/RosterUi';

const DAYS = 7;

const PARAM_FIELDS: { key: keyof ManpowerParams; label: string; unit: string }[] = [
    { key: 'receiveMinutes', label: 'Receive (overnight)', unit: 'min' },
    { key: 'releaseMinutes', label: 'Release (overnight)', unit: 'min' },
    { key: 'bufferMinutes', label: 'Walking buffer', unit: 'min' },
    { key: 'dayShiftStartHour', label: 'Day shift starts', unit: 'h' },
    { key: 'nightShiftStartHour', label: 'Night shift starts', unit: 'h' },
    { key: 'workDays', label: 'Work days in a row', unit: 'days' },
    { key: 'offDays', label: 'Days off in a row', unit: 'days' },
    { key: 'annualLeaveDays', label: 'Annual leave', unit: 'days/yr' },
    { key: 'sickLeaveDays', label: 'Sick leave', unit: 'days/yr' },
    { key: 'trainingDays', label: 'Training', unit: 'days/yr' },
];

function ShortageCell({ value }: { value: number }) {
    return (
        <span className={cn('font-semibold tabular-nums', value > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
            {value > 0 ? `−${value}` : 'OK'}
        </span>
    );
}

/** Peak positions per day as a compact strip: day / night. */
function PeakStrip({ row, weekStart }: { row: ShortageRow; weekStart: Date }) {
    return (
        <div className="flex gap-1">
            {row.peaks.map((p, i) => (
                <div key={i} className="w-9 text-center" title={dayjs(weekStart).add(i, 'day').format('ddd DD MMM')}>
                    <div className="text-[10px] text-muted-foreground">{dayjs(weekStart).add(i, 'day').format('dd')}</div>
                    <div className="font-mono text-[11px] tabular-nums">
                        {p.day}/{p.night}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function ManpowerAnalysisPage() {
    const [stationCode, setStationCode] = useState(DEFAULT_ROSTER_STATION);
    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [params, setParams] = useState<ManpowerParams>(DEFAULT_MANPOWER_PARAMS);
    const [showParams, setShowParams] = useState(false);

    const { staff, stations, authAirlineIds, isLoading: staffLoading } = useRosterStaff();
    const { flights, isLoading: flightsLoading } = useRosterFlights(stationCode, weekStart);

    const stationStaff = useMemo(() => staff.filter((s) => s.stationCode === stationCode), [staff, stationCode]);
    const analysis = useMemo(
        () => analyzeManpower(flights, stationStaff, authAirlineIds, weekStart, DAYS, params),
        [flights, stationStaff, authAirlineIds, weekStart, params]
    );
    const licensedByType = useMemo(
        () => new Map(analysis.typeEngine.map((r) => [r.key, r.available])),
        [analysis.typeEngine]
    );

    const { overall } = analysis;
    const isLoading = staffLoading || flightsLoading;
    const typeShort = analysis.typeEngine.filter((r) => r.shortage > 0).length;
    const authShort = analysis.authorization.filter((r) => r.shortage > 0).length;

    const setParam = (key: keyof ManpowerParams, raw: string) => {
        const value = Number(raw);
        if (Number.isFinite(value) && value >= 0) setParams((p) => ({ ...p, [key]: value }));
    };

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <RosterHeader
                    icon={<Activity className="h-5 w-5" />}
                    title="Manpower Analysis"
                    subtitle="Certifying Staff needed vs available, by Type/Engine and Authorization"
                >
                    <StationSelect stations={stations} value={stationCode} onChange={setStationCode} />
                    <WeekNav weekStart={weekStart} onChange={setWeekStart} />
                    <button
                        type="button"
                        onClick={() => setShowParams((v) => !v)}
                        aria-expanded={showParams}
                        className={cn(
                            'inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium',
                            showParams ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Assumptions
                    </button>
                </RosterHeader>

                {showParams && (
                    <div className="border-b border-border bg-muted/30 px-5 py-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            {PARAM_FIELDS.map((f) => (
                                <label key={f.key} className="text-xs">
                                    <span className="mb-1 block font-medium text-muted-foreground">{f.label}</span>
                                    <span className="flex items-center gap-1.5">
                                        <input
                                            type="number"
                                            min={0}
                                            value={params[f.key] as number}
                                            onChange={(e) => setParam(f.key, e.target.value)}
                                            className="h-8 w-20 rounded-md border border-border bg-card px-2 text-sm tabular-nums"
                                        />
                                        <span className="text-muted-foreground">{f.unit}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={params.includePlanning}
                                    onChange={(e) => setParams((p) => ({ ...p, includePlanning: e.target.checked }))}
                                    className="h-4 w-4"
                                />
                                Include Planning flights
                            </label>
                            <span>
                                Staff per position <b className="text-foreground tabular-nums">{staffPerPosition(params).toFixed(2)}</b>
                            </span>
                            <span>
                                Relief factor <b className="text-foreground tabular-nums">{reliefFactor(params).toFixed(3)}</b>
                            </span>
                            <button type="button" onClick={() => setParams(DEFAULT_MANPOWER_PARAMS)} className="underline underline-offset-2 hover:text-foreground">
                                Reset to defaults
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-3 xl:grid-cols-6">
                    <StatTile label="Flights" value={overall.flightCount} unit="in scope" />
                    <StatTile label="Positions" value={overall.positions} unit={`${overall.dayPositions} day + ${overall.nightPositions} night`} />
                    <StatTile label="In roster" value={overall.rosterStaff} unit="people" />
                    <StatTile label="Required" value={overall.required} unit="with relief" />
                    <StatTile label="Available CS" value={overall.available} unit={stationCode} />
                    <StatTile
                        label="Shortage"
                        value={overall.shortage > 0 ? `−${overall.shortage}` : 'OK'}
                        tone={overall.shortage > 0 ? 'danger' : 'success'}
                    />
                </div>
            </Card>

            {isLoading ? (
                <Card><LoadingBlock label="Loading flights and staff..." /></Card>
            ) : overall.flightCount === 0 ? (
                <Card><EmptyBlock>No flights in scope for {stationCode} this week.</EmptyBlock></Card>
            ) : (
                <>
                    <Card className="overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border px-5 py-3">
                            <h2 className="text-sm font-semibold">Shortage by Type / Engine</h2>
                            <span className="text-xs text-muted-foreground">{typeShort} short</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] border-collapse">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className={th}>Type / Engine</th>
                                        <th className={cn(th, 'text-right')}>Flights</th>
                                        <th className={th}>Peak positions (day/night)</th>
                                        <th className={cn(th, 'text-right')}>Positions</th>
                                        <th className={cn(th, 'text-right')}>Required</th>
                                        <th className={cn(th, 'text-right')}>Available CS</th>
                                        <th className={cn(th, 'text-right')}>Shortage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.typeEngine.map((r) => (
                                        <tr key={r.key} className="border-t border-border">
                                            <td className={cn(td, 'font-medium')}>{r.label}</td>
                                            <td className={cn(td, 'text-right tabular-nums')}>{r.flightCount}</td>
                                            <td className={td}><PeakStrip row={r} weekStart={weekStart} /></td>
                                            <td className={cn(td, 'text-right tabular-nums')}>{r.positions}</td>
                                            <td className={cn(td, 'text-right tabular-nums')}>{r.required}</td>
                                            <td className={cn(td, 'text-right tabular-nums')}>{r.available}</td>
                                            <td className={cn(td, 'text-right')}><ShortageCell value={r.shortage} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border px-5 py-3">
                            <h2 className="text-sm font-semibold">Missing Authorization (Airline × Type / Engine)</h2>
                            <span className="text-xs text-muted-foreground">{authShort} short</span>
                        </div>
                        {analysis.authorization.length === 0 ? (
                            <EmptyBlock>No flights this week from airlines with a customer authorization scheme.</EmptyBlock>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[820px] border-collapse">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className={th}>Airline</th>
                                            <th className={th}>Type / Engine</th>
                                            <th className={cn(th, 'text-right')}>Flights</th>
                                            <th className={cn(th, 'text-right')}>Required</th>
                                            <th className={cn(th, 'text-right')}>Licensed CS</th>
                                            <th className={cn(th, 'text-right')}>Authorized CS</th>
                                            <th className={cn(th, 'text-right')}>Shortage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.authorization.map((r) => (
                                            <tr key={r.key} className="border-t border-border">
                                                <td className={cn(td, 'font-medium')}>{r.airlineCode || '—'}</td>
                                                <td className={td}>{r.label}</td>
                                                <td className={cn(td, 'text-right tabular-nums')}>{r.flightCount}</td>
                                                <td className={cn(td, 'text-right tabular-nums')}>{r.required}</td>
                                                <td className={cn(td, 'text-right tabular-nums text-muted-foreground')}>
                                                    {licensedByType.get(typeEngineKey(r.familyCode, r.engineCode)) ?? 0}
                                                </td>
                                                <td className={cn(td, 'text-right tabular-nums')}>{r.available}</td>
                                                <td className={cn(td, 'text-right')}><ShortageCell value={r.shortage} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <h2 className="text-sm font-semibold">Risk Flights — nobody at {stationCode} can certify</h2>
                            <span className="ml-auto text-xs text-muted-foreground">{analysis.riskFlights.length} flights</span>
                        </div>
                        {analysis.riskFlights.length === 0 ? (
                            <EmptyBlock>Every flight has at least one authorized Certifying Staff.</EmptyBlock>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[820px] border-collapse">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            {['Day', 'Flight', 'Airline', 'Type / Engine', 'STA – STD', 'Licensed CS', 'Reason'].map((h) => (
                                                <th key={h} className={th}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...analysis.riskFlights]
                                            .sort((a, b) => a.flight.start.getTime() - b.flight.start.getTime())
                                            .map(({ flight, licensed }) => (
                                                <tr key={flight.key} className="border-t border-border">
                                                    <td className={cn(td, 'whitespace-nowrap')}>{dayjs(flight.start).format('ddd DD')}</td>
                                                    <td className={cn(td, 'font-mono text-xs whitespace-nowrap')}>{flight.label}</td>
                                                    <td className={td}>{flight.airlineCode || '—'}</td>
                                                    <td className={td}>{flight.engineCode ? `${flight.familyCode} (${flight.engineCode})` : flight.familyCode || '—'}</td>
                                                    <td className={cn(td, 'font-mono text-xs whitespace-nowrap')}>
                                                        {dayjs(flight.start).format('HH:mm')} – {dayjs(flight.end).format('HH:mm')}
                                                    </td>
                                                    <td className={cn(td, 'tabular-nums')}>{licensed.length}</td>
                                                    <td className={td}>
                                                        {licensed.length === 0 ? (
                                                            <Pill tone="danger">No licence for type/engine</Pill>
                                                        ) : (
                                                            <Pill tone="warning">No airline authorization</Pill>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </>
            )}

            <p className="px-1 text-xs leading-relaxed text-muted-foreground">
                Positions = peak overlapping work blocks in the day shift + night shift (busiest day of the week). Required = positions ×
                staff per position × relief factor. A CS counts for a flight when they hold a licence for its type + engine, have a valid SAMS
                CRS, and — for airlines with a customer authorization scheme — are eligible for that airline. Staff are counted at their home
                station.
            </p>
        </div>
    );
}
