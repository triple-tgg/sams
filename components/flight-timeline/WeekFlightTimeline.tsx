'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { FlightItem } from '@/lib/api/flight/filghtlist.interface';
import dayjs, { Dayjs } from 'dayjs';
import '@/lib/dayjs'; // ensures utc + timezone plugins are registered
import { formatUtcToLocalDisplay } from '@/lib/utils/flightDatetime';
import { CornerDownLeft, CornerDownRight } from 'lucide-react';
import {
    formatFlightLabel as flightLabel,
    getFlightBarStyle,
    getFlightLocalRange as getFlightRange,
    getMissingStaff,
    isFlightCancelled,
    isFlightPlanning,
} from './utils';

interface WeekFlightTimelineProps {
    flights: FlightItem[]; // from /flight/listdata — one item per flight
    weekStart: Date; // local Monday 00:00
    isFullscreen: boolean;
}

const DAY_COL_WIDTH = 96;
const HEADER_HEIGHT = 36;
const LANE_HEIGHT = 46;
const BAR_HEIGHT = 40; // two text lines + airline badge
const ROW_PADDING = 8;
const MIN_ROW_HEIGHT = 72; // fits the day label (date / weekday / count)
const MIN_BAR_WIDTH = 28;
const LANE_GAP = 3;
const MIN_HOUR_WIDTH = 48;
const TOTAL_HOURS = 24;

interface DaySegment {
    key: string;
    flight: FlightItem;
    left: number;
    width: number;
    lane: number;
    continuesFromPrev: boolean;
    continuesToNext: boolean;
}

interface DayRow {
    date: Dayjs;
    segments: DaySegment[];
    laneCount: number;
    flightCount: number;
    cancelledCount: number;
}

export function WeekFlightTimeline({
    flights,
    weekStart,
    isFullscreen,
}: WeekFlightTimelineProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [now, setNow] = useState(() => dayjs());
    const [hoveredFlight, setHoveredFlight] = useState<string | null>(null);
    const [tooltipInfo, setTooltipInfo] = useState<{
        flight: FlightItem;
        x: number; // viewport coords
        y: number;
    } | null>(null);

    // Fit 24h into the visible width, with a floor so labels stay readable
    const HOUR_WIDTH = Math.max(
        MIN_HOUR_WIDTH,
        containerWidth > 0 ? (containerWidth - DAY_COL_WIDTH) / TOTAL_HOURS : 1280 / TOTAL_HOURS
    );
    const TOTAL_WIDTH = HOUR_WIDTH * TOTAL_HOURS;

    useEffect(() => {
        if (!scrollRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) setContainerWidth(entries[0].contentRect.width);
        });
        observer.observe(scrollRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const iv = setInterval(() => setNow(dayjs()), 30000);
        return () => clearInterval(iv);
    }, []);

    // Split each flight into per-day segments, then pack segments into lanes per day
    const dayRows: DayRow[] = useMemo(() => {
        const ranges = flights.flatMap((flight, idx) => {
            const range = getFlightRange(flight);
            return range ? [{ flight, key: String(flight.flightInfosId ?? `idx-${idx}`), ...range }] : [];
        });

        return Array.from({ length: 7 }, (_, i) => {
            const dayStart = dayjs(weekStart).startOf('day').add(i, 'day');
            const dayEnd = dayStart.add(1, 'day');

            const segments = ranges
                .filter(({ start, end }) => end.isAfter(dayStart) && start.isBefore(dayEnd))
                .map(({ flight, key, start, end }) => {
                    const continuesFromPrev = start.isBefore(dayStart);
                    const continuesToNext = end.isAfter(dayEnd);
                    const startMin = continuesFromPrev ? 0 : start.diff(dayStart, 'minute');
                    const endMin = continuesToNext ? TOTAL_HOURS * 60 : end.diff(dayStart, 'minute');
                    const left = (startMin / 60) * HOUR_WIDTH;
                    const width = Math.max(((endMin - startMin) / 60) * HOUR_WIDTH, MIN_BAR_WIDTH);
                    return { key, flight, left, width, lane: 0, continuesFromPrev, continuesToNext };
                })
                .sort((a, b) => a.left - b.left || b.width - a.width);

            // Greedy lane packing on rendered pixels so min-width bars never overlap
            const laneEnds: number[] = [];
            segments.forEach((seg) => {
                let lane = laneEnds.findIndex((endPx) => endPx + LANE_GAP <= seg.left);
                if (lane === -1) {
                    lane = laneEnds.length;
                    laneEnds.push(0);
                }
                laneEnds[lane] = seg.left + seg.width;
                seg.lane = lane;
            });

            return {
                date: dayStart,
                segments,
                laneCount: Math.max(1, laneEnds.length),
                flightCount: segments.length,
                cancelledCount: segments.filter((seg) => isFlightCancelled(seg.flight)).length,
            };
        });
    }, [flights, weekStart, HOUR_WIDTH]);

    const hours = useMemo(() => Array.from({ length: TOTAL_HOURS }, (_, i) => i), []);

    const handleBarMouseEnter = (e: React.MouseEvent, seg: DaySegment) => {
        setHoveredFlight(seg.key);
        setTooltipInfo({ flight: seg.flight, x: e.clientX, y: e.clientY });
    };

    const handleBarMouseLeave = () => {
        setHoveredFlight(null);
        setTooltipInfo(null);
    };

    return (
        <div
            className="relative overflow-hidden rounded-xl border-2 dark:border-slate-700/80 border-slate-200 bg-white dark:bg-slate-900 shadow-xl"
            style={{ height: isFullscreen ? 'calc(100vh - 80px)' : '720px' }}
        >
            <div ref={scrollRef} className="overflow-auto h-full custom-timeline-scroll">
                <div className="relative" style={{ minWidth: DAY_COL_WIDTH + TOTAL_WIDTH }}>
                    {/* ───── TIME HEADER (sticky top) ───── */}
                    <div className="sticky top-0 z-30 flex" style={{ height: HEADER_HEIGHT }}>
                        <div
                            className="sticky left-0 z-40 flex items-center px-3 border-b border-r dark:border-slate-700 border-slate-200 bg-slate-50 dark:bg-slate-800"
                            style={{ width: DAY_COL_WIDTH, minWidth: DAY_COL_WIDTH }}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Day
                            </span>
                        </div>
                        <div
                            className="relative flex border-b dark:border-slate-700 border-slate-200 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm"
                            style={{ width: TOTAL_WIDTH }}
                        >
                            {hours.map((h) => (
                                <div
                                    key={h}
                                    className="flex-shrink-0 flex items-end pb-1.5 pl-1.5 border-l dark:border-slate-700/60 border-slate-200"
                                    style={{ width: HOUR_WIDTH }}
                                >
                                    <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                                        {String(h).padStart(2, '0')}:00
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ───── DAY ROWS ───── */}
                    {dayRows.map((row) => {
                        const rowHeight = Math.max(MIN_ROW_HEIGHT, row.laneCount * LANE_HEIGHT + ROW_PADDING * 2);
                        const isToday = row.date.isSame(now, 'day');
                        const nowPos = isToday ? (now.diff(row.date, 'minute') / 60) * HOUR_WIDTH : null;

                        return (
                            <div
                                key={row.date.format('YYYY-MM-DD')}
                                className="flex border-b-2 dark:border-slate-700 border-slate-300"
                                style={{ height: rowHeight }}
                            >
                                {/* Day label (sticky left) */}
                                <div
                                    className={`sticky left-0 z-20 flex flex-col justify-center px-3 border-r dark:border-slate-700 border-slate-200
                                        ${isToday ? 'bg-sky-50 dark:bg-sky-950' : 'bg-slate-50 dark:bg-slate-800'}`}
                                    style={{ width: DAY_COL_WIDTH, minWidth: DAY_COL_WIDTH }}
                                >
                                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                        {row.date.format('DD MMM')}
                                    </span>
                                    <span className={`text-lg font-bold leading-tight ${isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                        {row.date.format('ddd')}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {row.flightCount} {row.flightCount === 1 ? 'flight' : 'flights'}
                                    </span>
                                    {row.cancelledCount > 0 && (
                                        <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
                                            {row.cancelledCount} cancelled
                                        </span>
                                    )}
                                </div>

                                {/* Grid + bars */}
                                <div
                                    className={`relative ${isToday ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''}`}
                                    style={{ width: TOTAL_WIDTH, height: rowHeight }}
                                >
                                    {hours.map((h) => (
                                        <div
                                            key={h}
                                            className="absolute top-0 h-full border-l border-dashed border-slate-200 dark:border-slate-700/40"
                                            style={{ left: h * HOUR_WIDTH }}
                                        />
                                    ))}

                                    {row.segments.map((seg) => {
                                        const { flight } = seg;
                                        const isHovered = hoveredFlight === seg.key;
                                        const cancelled = isFlightCancelled(flight);
                                        const missingStaff = getMissingStaff(flight);
                                        const staffNames = [...(flight.csList ?? []), ...(flight.mechList ?? [])]
                                            .map((s) => s.displayName || s.name)
                                            .join(', ');

                                        // "T233XX1 / T233XX2 · A320 · CFM56"
                                        const title = [flightLabel(flight, ' / '), flight.acTypeObj?.code, flight.engineCode]
                                            .filter(Boolean)
                                            .join(' · ');
                                        // "08:00–10:30" — dates are added when a side falls on another day than this row
                                        const range = getFlightRange(flight);
                                        const fmtTime = (t: Dayjs) => t.format(t.isSame(row.date, 'day') ? 'HH:mm' : 'DD MMM HH:mm');
                                        const timeRange = range ? `${fmtTime(range.start)}–${fmtTime(range.end)}` : '-';

                                        return (
                                            <div
                                                key={`${seg.key}-${row.date.format('YYYYMMDD')}`}
                                                className={`absolute flex items-center gap-1.5 overflow-hidden cursor-pointer px-1.5 transition-shadow
                                                    ${seg.continuesFromPrev ? 'rounded-l-none' : 'rounded-l'}
                                                    ${seg.continuesToNext ? 'rounded-r-none' : 'rounded-r'}
                                                    ${cancelled ? 'text-slate-600 dark:text-slate-300' : ''}
                                                    ${isHovered ? 'shadow-lg ring-2 ring-white/70 z-10' : cancelled ? '' : 'shadow-sm'}`}
                                                style={{
                                                    left: seg.left,
                                                    top: ROW_PADDING + seg.lane * LANE_HEIGHT + (LANE_HEIGHT - BAR_HEIGHT) / 2,
                                                    width: seg.width,
                                                    height: BAR_HEIGHT,
                                                    ...getFlightBarStyle(flight, {
                                                        clipLeft: seg.continuesFromPrev,
                                                        clipRight: seg.continuesToNext,
                                                    }),
                                                }}
                                                onMouseEnter={(e) => handleBarMouseEnter(e, seg)}
                                                onMouseLeave={handleBarMouseLeave}
                                            >
                                                {/* Missing staff marker */}
                                                {missingStaff.length > 0 && (
                                                    <span
                                                        className={`absolute top-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-white ${seg.continuesToNext ? 'right-5' : 'right-0.5'}`}
                                                    >
                                                        !
                                                    </span>
                                                )}
                                                {seg.continuesFromPrev && <CornerDownRight className="w-3 h-3 shrink-0 opacity-80" />}

                                                {/* Airline code badge */}
                                                {seg.width >= 110 && (
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-black/30 text-[8px] font-bold text-white">
                                                        {flight.airlineObj?.code || '—'}
                                                    </span>
                                                )}

                                                <div className="min-w-0 flex-1 flex flex-col leading-tight">
                                                    <span className={`truncate text-[11px] font-bold ${cancelled ? 'line-through decoration-2' : ''}`}>
                                                        {title}
                                                    </span>
                                                    <span className="truncate text-[9px] font-medium opacity-90">
                                                        {timeRange}
                                                        {' · '}
                                                        {cancelled ? (
                                                            <span className="font-bold uppercase text-red-600 dark:text-red-400">Cancelled</span>
                                                        ) : (
                                                            staffNames || 'No staff assigned'
                                                        )}
                                                    </span>
                                                </div>

                                                {seg.continuesToNext && <CornerDownLeft className="w-3 h-3 shrink-0 opacity-80" />}
                                            </div>
                                        );
                                    })}

                                    {nowPos !== null && (
                                        <div
                                            className="absolute top-0 z-20 h-full w-[2px] -translate-x-[1px] bg-red-500/80 pointer-events-none"
                                            style={{ left: nowPos }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ───── TOOLTIP (viewport-positioned, flips near edges) ───── */}
            {tooltipInfo && (() => {
                const { flight } = tooltipInfo;
                const flipX = tooltipInfo.x + 300 > window.innerWidth;
                const flipY = tooltipInfo.y + 240 > window.innerHeight;
                const csNames = flight.csList?.map((s) => s.displayName || s.name).join(', ');
                const mechNames = flight.mechList?.map((s) => s.displayName || s.name).join(', ');

                return (
                    <div
                        className="fixed z-[200] pointer-events-none"
                        // Anchor from the right/bottom edge when flipped — anchoring with `left` + translate
                        // lets the box shrink to the space left before the viewport edge and wrap its text.
                        style={{
                            ...(flipX
                                ? { right: window.innerWidth - tooltipInfo.x + 14 }
                                : { left: tooltipInfo.x + 14 }),
                            ...(flipY
                                ? { bottom: window.innerHeight - tooltipInfo.y + 14 }
                                : { top: tooltipInfo.y + 14 }),
                        }}
                    >
                        <div className="w-max max-w-[280px] bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-2xl px-3 py-2 text-[11px] border border-slate-600/50">
                            <div className="font-bold mb-1 flex items-center gap-2">
                                {flightLabel(flight)}
                                <span className="rounded bg-white/15 px-1.5 text-[9px] font-semibold uppercase">
                                    {isFlightPlanning(flight) ? 'Planning' : 'Current'}
                                </span>
                            </div>
                            <div className="space-y-0.5 text-slate-300">
                                <div>STA: {formatUtcToLocalDisplay(flight.arrivalStaDate) || '-'}</div>
                                <div>STD: {formatUtcToLocalDisplay(flight.departureStdDate) || '-'}</div>
                                {flight.airlineObj?.name && <div>Airline: {flight.airlineObj.name}</div>}
                                {flight.acTypeObj?.code && <div>Aircraft: {flight.acTypeObj.code}</div>}
                                {flight.stationObj?.code && <div>Station: {flight.stationObj.code}</div>}
                                {csNames && <div>CS: {csNames}</div>}
                                {mechNames && <div>MECH: {mechNames}</div>}
                                {getMissingStaff(flight).length > 0 && (
                                    <div className="font-semibold text-red-400">Missing staff: {getMissingStaff(flight).join(', ')}</div>
                                )}
                                <div>
                                    Status:{' '}
                                    <span className={isFlightCancelled(flight) ? 'font-bold text-red-400' : ''}>
                                        {flight.statusObj?.code || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
