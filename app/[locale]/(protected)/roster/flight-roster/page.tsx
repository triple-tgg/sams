'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import '@/lib/dayjs';
import { AlignStartVertical, CalendarRange, Check, RotateCcw, SlidersHorizontal, Table as TableIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WeekFlightTimeline } from '@/components/flight-timeline/WeekFlightTimeline';
import { CustomFlightTimeline } from '@/components/flight-timeline/CustomFlightTimeline';
import { TimelineLegend } from '@/components/flight-timeline/TimelineLegend';
import {
    getWeekStart,
    getMissingStaff,
    isFlightCancelled,
    formatFlightLabel,
    getFlightLocalRange,
    getFlightColors,
} from '@/components/flight-timeline/utils';
import type { FlightItem } from '@/lib/api/flight/filghtlist.interface';
import { useStations } from '@/lib/api/hooks/useStations';
import { DEFAULT_ROSTER_STATION, useRosterFlights } from '@/lib/roster/useRosterData';
import { EmptyBlock, LoadingBlock, Pill, RosterHeader, StatTile, StationSelect, WeekNav, td, th } from '../components/RosterUi';

/** Same 3 views as views-flight-timeline: week timeline, day timeline, table */
type View = 'week' | 'day' | 'table';

const VIEW_OPTIONS: { value: View; title: string; Icon: typeof CalendarRange }[] = [
    { value: 'week', title: 'Week timeline', Icon: CalendarRange },
    { value: 'day', title: 'Day timeline', Icon: AlignStartVertical },
    { value: 'table', title: 'Table', Icon: TableIcon },
];

const SCALE_OPTIONS = [
    { value: 240, label: '4 hr' },
    { value: 120, label: '2 hr' },
    { value: 60, label: '1 hr' },
    { value: 30, label: '30 mins' },
    { value: 15, label: '15 mins' },
];

/** Day index (0 = Mon) of today within the given week, or 0 if today is outside it */
function todayOffsetIn(weekStart: Date) {
    const diff = dayjs().startOf('day').diff(dayjs(weekStart).startOf('day'), 'day');
    return diff >= 0 && diff <= 6 ? diff : 0;
}

function aircraftOf(f: FlightItem) {
    return f.acTypeObj?.code || f.acType || '—';
}

function statusOf(f: FlightItem) {
    return f.statusObj?.name || f.statusObj?.code || '—';
}

type ChipColors = { background: string; color: string };

/**
 * Filter chip.
 *  - `fill`: chip painted with the same colours as the timeline bar (acts as a colour legend)
 *  - `dot`:  small colour dot (airline colour)
 * Selected = blue ring + check. When other chips in the row are selected, unselected ones are dimmed.
 */
function Chip({
    active,
    dimmed = false,
    onClick,
    label,
    count,
    dot,
    fill,
}: {
    active: boolean;
    dimmed?: boolean;
    onClick: () => void;
    label: string;
    count?: number;
    dot?: string;
    fill?: ChipColors;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            style={fill ? { background: fill.background, color: fill.color } : undefined}
            className={cn(
                'inline-flex h-7 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075CA2]/60',
                fill
                    ? cn('border-black/10 hover:brightness-95', active && 'ring-2 ring-[#075CA2] ring-offset-1 ring-offset-card')
                    : active
                      ? 'border-[#075CA2] bg-[#075CA2]/10 text-[#075CA2] dark:text-sky-300'
                      : 'border-border bg-card text-muted-foreground hover:border-[#075CA2]/40 hover:text-foreground',
                dimmed && !active && 'opacity-45 hover:opacity-80'
            )}
        >
            {active ? (
                <Check className="h-3 w-3 shrink-0" strokeWidth={3} />
            ) : (
                dot && <span className="h-2 w-2 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: dot }} />
            )}
            {label}
            {count !== undefined && (
                <span
                    className={cn(
                        'rounded-full px-1.5 text-[10px] leading-4 tabular-nums',
                        fill ? 'bg-black/10' : active ? 'bg-[#075CA2]/15' : 'bg-muted'
                    )}
                >
                    {count}
                </span>
            )}
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

type ChipFilter = ReturnType<typeof useChipFilter>;

/** One filter row: fixed-width label, "All" chip, then one chip per value. */
function ChipRow({
    label,
    filter,
    total,
    chipProps,
}: {
    label: string;
    filter: ChipFilter;
    total: number;
    chipProps?: (key: string) => { dot?: string; fill?: ChipColors };
}) {
    const anySelected = filter.selected.size > 0;
    return (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[96px_1fr] sm:gap-3">
            <span className="pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
                {anySelected && <span className="ml-1 text-[#075CA2]">({filter.selected.size})</span>}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
                <Chip label="All" count={total} active={!anySelected} onClick={filter.reset} />
                <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
                {filter.counts.map(([key, count]) => (
                    <Chip
                        key={key}
                        label={key}
                        count={count}
                        active={filter.selected.has(key)}
                        dimmed={anySelected}
                        onClick={() => filter.toggle(key)}
                        {...chipProps?.(key)}
                    />
                ))}
            </div>
        </div>
    );
}

export default function FlightRosterPage() {
    const [stationCode, setStationCode] = useState(DEFAULT_ROSTER_STATION);
    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [view, setView] = useState<View>('week');
    /** Selected day for the Day view, as offset from weekStart (0 = Mon). Kept when changing week. */
    const [dayOffset, setDayOffset] = useState(() => todayOffsetIn(getWeekStart(new Date())));
    const [minuteScale, setMinuteScale] = useState(60);
    const selectedDate = useMemo(() => dayjs(weekStart).add(dayOffset, 'day').toDate(), [weekStart, dayOffset]);

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

    /** Aircraft chip colours = same as the timeline bars (acType colours, slate default when null) */
    const aircraftColor = useMemo(() => {
        const map = new Map<string, ChipColors>();
        flights.forEach((f) => {
            const key = aircraftOf(f);
            if (map.has(key)) return;
            const c = getFlightColors(f, 'acType');
            map.set(key, { background: c.background!, color: c.color! });
        });
        return map;
    }, [flights]);

    const tableRows = useMemo(
        () =>
            [...visible].sort((a, b) => (a.arrivalStaDate ?? '').localeCompare(b.arrivalStaDate ?? '')),
        [visible]
    );

    /** Flights touching each day of the week (for the Day view strip) */
    const dayCounts = useMemo(() => {
        const start = dayjs(weekStart).startOf('day');
        return Array.from({ length: 7 }, (_, i) => {
            const dayStart = start.add(i, 'day');
            const dayEnd = dayStart.add(1, 'day');
            return visible.filter((f) => {
                const r = getFlightLocalRange(f);
                return !!r && r.start.isBefore(dayEnd) && r.end.isAfter(dayStart);
            }).length;
        });
    }, [visible, weekStart]);

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
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-700 dark:text-white">View :</span>
                        <div className="flex items-center gap-1 rounded-lg bg-slate-200 p-1 dark:bg-slate-700">
                            {VIEW_OPTIONS.map(({ value, title, Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    title={title}
                                    aria-label={title}
                                    aria-pressed={view === value}
                                    onClick={() => setView(value)}
                                    className={cn(
                                        'flex cursor-pointer items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                        view === value
                                            ? 'bg-[#075CA2] text-white'
                                            : 'text-slate-700 hover:text-slate-500 dark:text-white'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </button>
                            ))}
                        </div>
                    </div>
                </RosterHeader>

                <div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-4">
                    <StatTile label="Flights" value={active.length} unit="this week" />
                    <StatTile label="Carriers" value={carrier.counts.length} />
                    <StatTile label="Missing CS" value={missingCs} unit="flights" tone={missingCs > 0 ? 'danger' : 'success'} />
                    <StatTile label="Missing Mechanic" value={missingMech} unit="flights" tone={missingMech > 0 ? 'warning' : 'success'} />
                </div>

                <div className="space-y-2.5 border-t border-border px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <SlidersHorizontal className="h-4 w-4 text-[#075CA2]" />
                            Filters
                            <span className="text-xs font-normal text-muted-foreground">
                                Showing <span className="font-semibold tabular-nums text-foreground">{visible.length}</span> of{' '}
                                <span className="tabular-nums">{flights.length}</span> flights
                            </span>
                        </div>
                        {hasFilter && (
                            <button
                                type="button"
                                onClick={() => {
                                    carrier.reset();
                                    aircraft.reset();
                                    status.reset();
                                }}
                                className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-[#075CA2]/40 hover:text-[#075CA2]"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset filters
                            </button>
                        )}
                    </div>
                    <ChipRow
                        label="Carriers"
                        filter={carrier}
                        total={flights.length}
                        chipProps={(code) => ({ dot: airlineColor.get(code) || '#94a3b8' })}
                    />
                    <ChipRow
                        label="Aircraft"
                        filter={aircraft}
                        total={flights.length}
                        chipProps={(code) => ({ fill: aircraftColor.get(code) })}
                    />
                    <ChipRow label="Status" filter={status} total={flights.length} />
                </div>
            </Card>

            <Card className="overflow-hidden">
                {view === 'day' && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {dayCounts.map((count, i) => {
                                const d = dayjs(weekStart).add(i, 'day');
                                const isSelected = i === dayOffset;
                                const isToday = d.isSame(dayjs(), 'day');
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setDayOffset(i)}
                                        aria-pressed={isSelected}
                                        className={cn(
                                            'flex min-w-[64px] flex-col items-center rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
                                            isSelected
                                                ? 'border-[#075CA2] bg-[#075CA2] text-white shadow-sm'
                                                : 'border-border bg-card text-muted-foreground hover:border-[#075CA2]/40 hover:text-foreground'
                                        )}
                                    >
                                        <span className={cn('font-semibold', !isSelected && isToday && 'text-[#075CA2]')}>
                                            {d.format('ddd')} {d.format('DD')}
                                        </span>
                                        <span className={cn('tabular-nums', isSelected ? 'text-white/80' : 'opacity-70')}>
                                            {count} flight{count === 1 ? '' : 's'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            Scale:
                            <select
                                value={minuteScale}
                                onChange={(e) => setMinuteScale(Number(e.target.value))}
                                className="h-9 cursor-pointer rounded-md border border-border bg-card px-2 text-sm text-foreground focus:ring-2 focus:ring-[#075CA2]"
                            >
                                {SCALE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}
                {isLoading ? (
                    <LoadingBlock label="Loading flights..." />
                ) : visible.length === 0 ? (
                    <EmptyBlock>No flights for this station and week.</EmptyBlock>
                ) : view === 'week' ? (
                    <WeekFlightTimeline flights={visible} weekStart={weekStart} isFullscreen={false} colorBy="acType" />
                ) : view === 'day' ? (
                    <CustomFlightTimeline
                        key={`${dayjs(selectedDate).format('YYYY-MM-DD')}-${minuteScale}`}
                        flights={visible}
                        selectedDate={selectedDate}
                        isFullscreen={false}
                        minuteScale={minuteScale}
                        colorBy="acType"
                    />
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
                                            <td className={td}>
                                                <span
                                                    className="inline-flex rounded-full border border-black/10 px-2 py-0.5 text-xs font-semibold"
                                                    style={aircraftColor.get(aircraftOf(f))}
                                                >
                                                    {aircraftOf(f)}
                                                </span>
                                            </td>
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
            {view !== 'table' && !isLoading && visible.length > 0 && <TimelineLegend />}
            <p className="px-1 text-xs text-muted-foreground">
                Times are local. Week {dayjs(weekStart).format('DD MMM')} – {dayjs(weekStart).add(6, 'day').format('DD MMM YYYY')}.
            </p>
        </div>
    );
}
