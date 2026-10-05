'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import '@/lib/dayjs';
import { CalendarRange } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WeekFlightTimeline } from '@/components/flight-timeline/WeekFlightTimeline';
import { getWeekStart, getMissingStaff, isFlightCancelled, formatFlightLabel, getFlightLocalRange } from '@/components/flight-timeline/utils';
import type { FlightItem } from '@/lib/api/flight/filghtlist.interface';
import { useStations } from '@/lib/api/hooks/useStations';
import { DEFAULT_ROSTER_STATION, useRosterFlights } from '@/lib/roster/useRosterData';
import { EmptyBlock, LoadingBlock, Pill, RosterHeader, StatTile, StationSelect, WeekNav, td, th } from '../components/RosterUi';

type View = 'gantt' | 'table';

function aircraftOf(f: FlightItem) {
    return f.acTypeObj?.code || f.acType || '—';
}

function statusOf(f: FlightItem) {
    return f.statusObj?.name || f.statusObj?.code || '—';
}

function Chip({
    active,
    onClick,
    label,
    count,
    dot,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
    dot?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}
        >
            {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
            {label}
            <span className="tabular-nums opacity-70">{count}</span>
        </button>
    );
}

/** Values to chips with counts; a chip filters when selected, none selected = all. */
function useChipFilter(flights: FlightItem[], keyOf: (f: FlightItem) => string) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const counts = useMemo(() => {
        const map = new Map<string, number>();
        flights.forEach((f) => map.set(keyOf(f), (map.get(keyOf(f)) ?? 0) + 1));
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flights]);
    const toggle = (key: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    const matches = (f: FlightItem) => selected.size === 0 || selected.has(keyOf(f));
    return { counts, selected, toggle, matches, reset: () => setSelected(new Set()) };
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            {children}
        </div>
    );
}

export default function FlightRosterPage() {
    const [stationCode, setStationCode] = useState(DEFAULT_ROSTER_STATION);
    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [view, setView] = useState<View>('gantt');

    const { data: stationsResp } = useStations();
    const stations = useMemo(() => (stationsResp?.responseData ?? []).filter((s) => !s.isdelete), [stationsResp]);
    const { raw: flights, isLoading } = useRosterFlights(stationCode, weekStart);

    const carrier = useChipFilter(flights, (f) => f.airlineObj?.code || '—');
    const aircraft = useChipFilter(flights, aircraftOf);
    const status = useChipFilter(flights, statusOf);

    const visible = useMemo(
        () => flights.filter((f) => carrier.matches(f) && aircraft.matches(f) && status.matches(f)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [flights, carrier.selected, aircraft.selected, status.selected]
    );

    const active = visible.filter((f) => !isFlightCancelled(f));
    const missingCs = active.filter((f) => getMissingStaff(f).includes('CS')).length;
    const missingMech = active.filter((f) => getMissingStaff(f).includes('MECH')).length;

    const airlineColor = useMemo(() => {
        const map = new Map<string, string>();
        flights.forEach((f) => f.airlineObj && map.set(f.airlineObj.code, f.airlineObj.colorBackground));
        return map;
    }, [flights]);

    const tableRows = useMemo(
        () =>
            [...visible].sort((a, b) => (a.arrivalStaDate ?? '').localeCompare(b.arrivalStaDate ?? '')),
        [visible]
    );

    const hasFilter = carrier.selected.size + aircraft.selected.size + status.selected.size > 0;

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <RosterHeader
                    icon={<CalendarRange className="h-5 w-5" />}
                    title="Flight Roster"
                    subtitle={`${stationCode || 'All stations'} · weekly`}
                >
                    <StationSelect stations={stations} value={stationCode} onChange={setStationCode} allowAll />
                    <WeekNav weekStart={weekStart} onChange={setWeekStart} />
                    <div className="flex overflow-hidden rounded-md border border-border">
                        {(['gantt', 'table'] as View[]).map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setView(v)}
                                className={cn(
                                    'px-3 py-1.5 text-sm font-medium capitalize',
                                    view === v ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </RosterHeader>

                <div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-4">
                    <StatTile label="Flights" value={active.length} unit="this week" />
                    <StatTile label="Carriers" value={carrier.counts.length} />
                    <StatTile label="Missing CS" value={missingCs} unit="flights" tone={missingCs > 0 ? 'danger' : 'success'} />
                    <StatTile label="Missing Mechanic" value={missingMech} unit="flights" tone={missingMech > 0 ? 'warning' : 'success'} />
                </div>

                <div className="space-y-2 border-t border-border px-5 py-3">
                    <ChipRow label="Carriers">
                        {carrier.counts.map(([code, count]) => (
                            <Chip
                                key={code}
                                label={code}
                                count={count}
                                dot={airlineColor.get(code)}
                                active={carrier.selected.has(code)}
                                onClick={() => carrier.toggle(code)}
                            />
                        ))}
                    </ChipRow>
                    <ChipRow label="Aircraft">
                        {aircraft.counts.map(([code, count]) => (
                            <Chip key={code} label={code} count={count} active={aircraft.selected.has(code)} onClick={() => aircraft.toggle(code)} />
                        ))}
                    </ChipRow>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <ChipRow label="Status">
                            {status.counts.map(([code, count]) => (
                                <Chip key={code} label={code} count={count} active={status.selected.has(code)} onClick={() => status.toggle(code)} />
                            ))}
                        </ChipRow>
                        {hasFilter && (
                            <button
                                type="button"
                                onClick={() => {
                                    carrier.reset();
                                    aircraft.reset();
                                    status.reset();
                                }}
                                className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden">
                {isLoading ? (
                    <LoadingBlock label="Loading flights..." />
                ) : visible.length === 0 ? (
                    <EmptyBlock>No flights for this station and week.</EmptyBlock>
                ) : view === 'gantt' ? (
                    <WeekFlightTimeline flights={visible} weekStart={weekStart} isFullscreen={false} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] border-collapse">
                            <thead className="bg-muted/50">
                                <tr>
                                    {['Day', 'Airline', 'Flight No.', 'Route', 'A/C Type', 'Engine', 'STA', 'STD', 'Ground', 'Certifying Staff', 'Mechanic', 'Status'].map((h) => (
                                        <th key={h} className={th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((f, i) => {
                                    const range = getFlightLocalRange(f);
                                    const ground = range ? range.end.diff(range.start, 'minute') : null;
                                    const cancelled = isFlightCancelled(f);
                                    const missing = getMissingStaff(f);
                                    return (
                                        <tr key={`${f.flightsId}-${i}`} className={cn('border-t border-border', cancelled && 'opacity-50')}>
                                            <td className={cn(td, 'whitespace-nowrap')}>{range ? range.start.format('ddd DD') : '—'}</td>
                                            <td className={cn(td, 'whitespace-nowrap')}>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full" style={{ background: f.airlineObj?.colorBackground || '#94a3b8' }} />
                                                    {f.airlineObj?.code || '—'}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'whitespace-nowrap font-mono text-xs')}>{formatFlightLabel(f)}</td>
                                            <td className={cn(td, 'whitespace-nowrap')}>
                                                {[f.routeFrom || f.routeForm, f.routeTo].filter(Boolean).join(' – ') || '—'}
                                            </td>
                                            <td className={td}>{aircraftOf(f)}</td>
                                            <td className={td}>{f.engineCode || '—'}</td>
                                            <td className={cn(td, 'font-mono text-xs')}>{range ? range.start.format('HH:mm') : '—'}</td>
                                            <td className={cn(td, 'font-mono text-xs')}>{f.departureStdDate && range ? range.end.format('HH:mm') : '—'}</td>
                                            <td className={cn(td, 'font-mono text-xs')}>
                                                {ground !== null ? `${Math.floor(ground / 60)}:${String(ground % 60).padStart(2, '0')}` : '—'}
                                            </td>
                                            <td className={td}>
                                                {f.csList?.length ? f.csList.map((s) => s.name).join(', ') : missing.includes('CS') ? <Pill tone="danger">Missing</Pill> : '—'}
                                            </td>
                                            <td className={td}>
                                                {f.mechList?.length ? f.mechList.map((s) => s.name).join(', ') : missing.includes('MECH') ? <Pill tone="warning">Missing</Pill> : '—'}
                                            </td>
                                            <td className={td}>
                                                <Pill tone={cancelled ? 'default' : f.statusObj?.code === 'Planning' ? 'info' : 'success'}>{statusOf(f)}</Pill>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            <p className="px-1 text-xs text-muted-foreground">
                Times are local. Week {dayjs(weekStart).format('DD MMM')} – {dayjs(weekStart).add(6, 'day').format('DD MMM YYYY')}.
            </p>
        </div>
    );
}
