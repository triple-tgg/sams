'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { FlightItem } from '@/lib/api/flight/filghtlist.interface';
import dayjs, { Dayjs } from 'dayjs';
import '@/lib/dayjs'; // ensures utc + timezone plugins are registered
import { splitUtcDateTimeToLocal, formatUtcToLocalDisplay } from '@/lib/utils/flightDatetime';
import { ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import {
    formatFlightLabel,
    getFlightBarStyle,
    getFlightLocalRange,
    getMissingStaff,
    isFlightCancelled,
    isFlightPlanning,
} from './utils';


interface CustomFlightTimelineProps {
    flights: FlightItem[]; // from /flight/listdata — one item per flight
    selectedDate: Date;
    isFullscreen: boolean;
    minuteScale?: number; // 1, 5, 10, 15, 20, 30, 60
}

const ROW_HEIGHT = 100;
const HEADER_HEIGHT = 44;
const SIDEBAR_WIDTH = 0;
const TOTAL_HOURS = 24;

export function CustomFlightTimeline({
    flights,
    selectedDate,
    isFullscreen,
    minuteScale = 60,
}: CustomFlightTimelineProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [currentTimePos, setCurrentTimePos] = useState<number | null>(null);
    const [hoveredFlight, setHoveredFlight] = useState<string | null>(null);

    const hoursPerTick = minuteScale >= 60 ? minuteScale / 60 : 1;
    const TICK_WIDTH = minuteScale < 60 ? 45 : 150;
    const ticksPerHour = minuteScale < 60 ? Math.max(1, Math.floor(60 / minuteScale)) : 1;

    // When scale is 1hr or more, fit the 24 hours exactly into the container width (if >= 1200px)
    // otherwise fallback to a minimum width of 50px per hour
    const HOUR_WIDTH = minuteScale >= 60
        ? Math.max(50, containerWidth > 0 ? containerWidth / 24 : 1280 / 24)
        : ticksPerHour * TICK_WIDTH;

    const TOTAL_WIDTH = HOUR_WIDTH * TOTAL_HOURS;
    const [tooltipInfo, setTooltipInfo] = useState<{
        flight: FlightItem;
        x: number;   // cursor x relative to scroll container
        y: number;   // cursor y relative to scroll container
    } | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Track container width for responsive 1hr scale
    useEffect(() => {
        if (!scrollRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                setContainerWidth(entries[0].contentRect.width);
            }
        });
        observer.observe(scrollRef.current);
        return () => observer.disconnect();
    }, []);

    // Pixel position of a local time relative to local midnight of the selected date
    const getPos = useCallback(
        (t: Dayjs) => {
            const start = dayjs(selectedDate).startOf('day');
            return (t.diff(start, 'minute') / 60) * HOUR_WIDTH;
        },
        [selectedDate, HOUR_WIDTH]
    );

    // Pack flights into rows so bars that overlap in time never render on top of each other
    const rows = useMemo(() => {
        const placed = flights
            .flatMap((flight, idx) => {
                const range = getFlightLocalRange(flight);
                if (!range) return [];
                const rawLeft = getPos(range.start);
                const rawRight = getPos(range.end);
                if (rawRight <= 0 || rawLeft >= TOTAL_WIDTH) return [];
                const left = Math.max(0, rawLeft);
                const right = Math.max(Math.min(TOTAL_WIDTH, rawRight), left + 36);
                return [{ flight, key: String(flight.flightInfosId ?? `idx-${idx}`), rawLeft, rawRight, left, right }];
            })
            .sort((a, b) => a.left - b.left || b.right - a.right);

        type PlacedFlight = (typeof placed)[number];
        const lanes: { end: number; items: PlacedFlight[] }[] = [];
        placed.forEach((p) => {
            let lane = lanes.find((l) => l.end + 4 <= p.left);
            if (!lane) {
                lane = { end: 0, items: [] };
                lanes.push(lane);
            }
            lane.end = p.right;
            lane.items.push(p);
        });
        return lanes.map((l, i) => [String(i), l.items] as const);
    }, [flights, getPos, TOTAL_WIDTH]);

    // Current time indicator
    useEffect(() => {
        const update = () => {
            const now = dayjs();
            const start = dayjs(selectedDate).startOf('day');
            const mins = now.diff(start, 'minute');
            if (mins >= 0 && mins <= 24 * 60) {
                setCurrentTimePos((mins / 60) * HOUR_WIDTH);
            } else {
                setCurrentTimePos(null);
            }
        };
        update();
        const iv = setInterval(update, 30000);
        return () => clearInterval(iv);
    }, [selectedDate, HOUR_WIDTH]);

    // Auto-scroll to current time on mount
    useEffect(() => {
        if (scrollRef.current) {
            const now = dayjs();
            const start = dayjs(selectedDate).startOf('day');
            const mins = now.diff(start, 'minute');
            if (mins >= 0 && mins <= 24 * 60) {
                const pos = (mins / 60) * HOUR_WIDTH;
                scrollRef.current.scrollLeft = Math.max(0, pos - 300);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [HOUR_WIDTH]);

    const hours = useMemo(() => Array.from({ length: TOTAL_HOURS }, (_, i) => i), []);
    const totalContentHeight = rows.length * ROW_HEIGHT;

    const handleBarMouseEnter = (
        e: React.MouseEvent,
        flight: FlightItem,
        key: string
    ) => {
        const rect = scrollRef.current?.getBoundingClientRect();
        if (!rect) return;
        setHoveredFlight(key);
        setTooltipInfo({
            flight,
            x: e.clientX - rect.left + scrollRef.current!.scrollLeft,
            y: e.clientY - rect.top + scrollRef.current!.scrollTop,
        });
    };

    const handleBarMouseLeave = () => {
        setHoveredFlight(null);
        setTooltipInfo(null);
    };

    const renderTooltipTime = (utcDateStr: string | null | undefined) => {
        if (!utcDateStr) return '-';
        const local = splitUtcDateTimeToLocal(utcDateStr);
        if (!local.date) return '-';
        
        // Check if it's the same day as selectedDate
        if (local.date === dayjs(selectedDate).format('YYYY-MM-DD')) {
            return local.time; // just HH:mm
        }
        return formatUtcToLocalDisplay(utcDateStr); // DD-MMM-YYYY HH:mm
    };

    return (
        <div
            className="relative overflow-hidden rounded-xl border-2 dark:border-slate-700/80 border-slate-200 bg-white dark:bg-slate-900 shadow-xl"
            style={{ height: isFullscreen ? 'calc(100vh - 80px)' : '600px' }}
        >
            <div ref={scrollRef} className="overflow-auto h-full custom-timeline-scroll">
                <div
                    className="relative"
                    style={{ minWidth: SIDEBAR_WIDTH + TOTAL_WIDTH, minHeight: HEADER_HEIGHT + totalContentHeight }}
                >
                    {/* ───── TIME HEADER (sticky top) ───── */}
                    <div
                        className="sticky top-0 z-20 flex"
                        style={{ height: HEADER_HEIGHT }}
                    >
                        {/* Sidebar corner */}
                        {/* <div
                            className="sticky left-0 z-30 flex items-center justify-center border-b border-r dark:border-slate-700 border-slate-200 bg-slate-50 dark:bg-slate-800"
                            style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH }}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Row
                            </span>
                        </div> */}

                        {/* Hour labels */}
                        <div
                            className="relative flex border-b dark:border-slate-700 border-slate-200 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm"
                            style={{ width: TOTAL_WIDTH }}
                        >
                            {hours.map((h) => {
                                if (minuteScale >= 60) {
                                    if (h % hoursPerTick !== 0) return null;
                                    return (
                                        <div
                                            key={h}
                                            className="flex-shrink-0 flex border-l dark:border-slate-700/60 border-slate-200"
                                            style={{ width: HOUR_WIDTH * hoursPerTick }}
                                        >
                                            <div className="flex items-end pb-2 pl-2 w-full h-full">
                                                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                                                    {String(h).padStart(2, '0')}:00
                                                </span>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div
                                            key={h}
                                            className="flex-shrink-0 flex border-l dark:border-slate-700/60 border-slate-200"
                                            style={{ width: HOUR_WIDTH }}
                                        >
                                            {Array.from({ length: ticksPerHour }).map((_, i) => {
                                                const mins = i * minuteScale;
                                                return (
                                                    <div
                                                        key={i}
                                                        className="flex items-end pb-1 pl-1 border-r border-slate-200/50 dark:border-slate-700/30 h-full last:border-r-0"
                                                        style={{ width: TICK_WIDTH }}
                                                    >
                                                        <span className="text-[9px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                                                            {String(h).padStart(2, '0')}:{String(mins).padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>

                    {/* ───── ROWS ───── */}
                    <div className="relative" style={{ height: totalContentHeight }}>
                        {/* Sidebar labels (sticky left) */}
                        {/* {rows.map(([channelId], rowIdx) => (
                            <div
                                key={channelId}
                                className={`sticky left-0 z-10 flex items-center px-2 border-b border-r dark:border-slate-700 border-slate-200
                                    ${rowIdx % 2 === 0
                                        ? 'bg-white dark:bg-slate-900'
                                        : 'bg-slate-50/60 dark:bg-slate-800/40'
                                    }`}
                                style={{
                                    width: SIDEBAR_WIDTH,
                                    minWidth: SIDEBAR_WIDTH,
                                    height: ROW_HEIGHT,
                                    position: 'absolute',
                                    top: rowIdx * ROW_HEIGHT,
                                }}
                            >
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate leading-tight">
                                    {channelId}
                                </span>
                            </div>
                        ))} */}

                        {/* Main grid area */}
                        <div
                            className="absolute top-0"
                            style={{
                                left: SIDEBAR_WIDTH,
                                width: TOTAL_WIDTH,
                                height: totalContentHeight,
                            }}
                        >
                            {/* Dashed vertical lines */}
                            {hours.map((h) => {
                                if (minuteScale >= 60) {
                                    if (h % hoursPerTick !== 0) return null;
                                    return (
                                        <div
                                            key={h}
                                            className="absolute top-0 border-l border-dashed border-slate-300/80 dark:border-slate-600/35"
                                            style={{
                                                left: h * HOUR_WIDTH,
                                                height: totalContentHeight,
                                            }}
                                        />
                                    );
                                }
                                return Array.from({ length: ticksPerHour }).map((_, i) => {
                                    const isHour = i === 0;
                                    return (
                                        <div
                                            key={`${h}-${i}`}
                                            className={`absolute top-0 border-l ${isHour ? 'border-dashed border-slate-300/80 dark:border-slate-600/35' : 'border-dotted border-slate-200/50 dark:border-slate-700/20'}`}
                                            style={{
                                                left: h * HOUR_WIDTH + i * TICK_WIDTH,
                                                height: totalContentHeight,
                                            }}
                                        />
                                    );
                                });
                            })}

                            {/* Row backgrounds */}
                            {rows.map(([channelId], rowIdx) => (
                                <div
                                    key={channelId}
                                    className={`absolute w-full border-b dark:border-slate-700/40 border-slate-100
                                        ${rowIdx % 2 === 0
                                            ? 'bg-transparent'
                                            : 'bg-slate-50/40 dark:bg-slate-800/20'
                                        }`}
                                    style={{
                                        top: rowIdx * ROW_HEIGHT,
                                        height: ROW_HEIGHT,
                                    }}
                                />
                            ))}

                            {/* Flight bars */}
                            {rows.map(([, rowFlights], rowIdx) =>
                                rowFlights.map(({ flight, key, rawLeft, rawRight, left, right }) => {
                                    // Bars run STA → STD (local); clipped ends continue to the previous/next day
                                    const isNextDay = rawRight >= TOTAL_WIDTH;
                                    const isPreviousDay = rawLeft < 0;
                                    const width = right - left;

                                    const cancelled = isFlightCancelled(flight);
                                    const missingStaff = getMissingStaff(flight);
                                    const staffNames = [...(flight.csList ?? []), ...(flight.mechList ?? [])]
                                        .map((s) => s.displayName || s.name)
                                        .join(', ');

                                    // "TG101 · A320 · CFM56"
                                    const title = [formatFlightLabel(flight, ' / '), flight.acTypeObj?.code, flight.engineCode]
                                        .filter(Boolean)
                                        .join(' · ');
                                    // "08:00–10:30" — dates are added when a side falls on another day
                                    const range = getFlightLocalRange(flight);
                                    const fmtTime = (t: Dayjs) => t.format(t.isSame(selectedDate, 'day') ? 'HH:mm' : 'DD MMM HH:mm');
                                    const timeRange = range ? `${fmtTime(range.start)}–${fmtTime(range.end)}` : '-';

                                    const isHovered = hoveredFlight === key;
                                    const barTop = rowIdx * ROW_HEIGHT + 4;
                                    const barHeight = ROW_HEIGHT - 8;

                                    return (
                                        <div
                                            key={key}
                                            className={`absolute overflow-hidden cursor-pointer transition-all duration-150
                                                ${isPreviousDay && isNextDay ? 'rounded-none' : isPreviousDay ? 'rounded-r-lg rounded-l-none' : isNextDay ? 'rounded-l-lg rounded-r-none' : 'rounded-lg'}
                                                ${cancelled ? 'text-slate-600 dark:text-slate-300' : ''}
                                                ${isHovered ? 'shadow-xl scale-[1.02] z-10' : cancelled ? '' : 'shadow-md hover:shadow-lg'}`}
                                            style={{
                                                left,
                                                top: barTop,
                                                width,
                                                height: barHeight,
                                                ...getFlightBarStyle(flight, { clipLeft: isPreviousDay, clipRight: isNextDay }),
                                            }}
                                            onMouseEnter={(e) => handleBarMouseEnter(e, flight, key)}
                                            onMouseLeave={handleBarMouseLeave}
                                        >
                                            {/* Missing staff marker */}
                                            {missingStaff.length > 0 && (
                                                <span
                                                    className={`absolute top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white ${isNextDay ? 'right-5' : 'right-1'}`}
                                                >
                                                    !
                                                </span>
                                            )}
                                            {/* Indicators for spanning flights */}
                                            {isPreviousDay && (
                                                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/30 to-transparent flex items-center justify-start opacity-90 z-0">
                                                    <ChevronLeft className="w-3 h-3 text-white ml-0.5" />
                                                </div>
                                            )}
                                            {isNextDay && (
                                                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/30 to-transparent flex items-center justify-end opacity-90 z-0">
                                                    <ChevronRight className="w-3 h-3 text-white mr-0.5" />
                                                </div>
                                            )}

                                            <div className={`h-full flex items-center gap-2.5 ${width < 80 ? 'px-1.5' : 'px-3'} ${isPreviousDay ? 'pl-5' : ''} ${isNextDay ? 'pr-5' : ''} relative z-10`}>
                                                {/* Airline code badge */}
                                                {width >= 110 && (
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-black/30 text-[9px] font-bold text-white">
                                                        {flight.airlineObj?.code || '—'}
                                                    </span>
                                                )}

                                                <div className="min-w-0 flex flex-col gap-0.5 leading-tight">
                                                    <div className={`text-[12px] font-bold truncate ${cancelled ? 'line-through decoration-2' : ''}`}>
                                                        {title}
                                                    </div>
                                                    <div className="text-[10px] font-medium truncate opacity-90">
                                                        {timeRange}
                                                        {!cancelled && (
                                                            <>
                                                                {' · '}
                                                                {staffNames || 'No staff assigned'}
                                                            </>
                                                        )}
                                                    </div>
                                                    {cancelled && (
                                                        /* Cancelled flights need no staff — show the status instead */
                                                        <span className="mt-0.5 inline-flex w-fit max-w-full items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white truncate">
                                                            <XCircle className="w-3 h-3 shrink-0" />
                                                            Cancelled
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Current time indicator */}
                            {currentTimePos !== null && (
                                <div
                                    className="absolute top-0 z-20 pointer-events-none"
                                    style={{
                                        left: currentTimePos,
                                        height: totalContentHeight,
                                    }}
                                >
                                    <div className="relative w-0 h-full">
                                        {/* Triangle marker at top */}
                                        <div
                                            className="absolute -top-1 -translate-x-1/2"
                                            style={{
                                                width: 0,
                                                height: 0,
                                                borderLeft: '5px solid transparent',
                                                borderRight: '5px solid transparent',
                                                borderTop: '7px solid #ef4444',
                                            }}
                                        />
                                        {/* Line */}
                                        <div className="absolute top-0 left-0 -translate-x-[0.5px] w-[2px] h-full bg-red-500/80" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ───── TOOLTIP ───── */}
                    {tooltipInfo && (() => {
                        // Auto-position: flip left/up when near right/bottom edge
                        const TOOLTIP_W = tooltipRef.current?.offsetWidth  ?? 240;
                        const TOOLTIP_H = tooltipRef.current?.offsetHeight ?? 140;
                        const GAP = 14;
                        const containerW = scrollRef.current?.clientWidth  ?? containerWidth;
                        const containerH = scrollRef.current?.clientHeight ?? 400;
                        const scrollX    = scrollRef.current?.scrollLeft   ?? 0;
                        const visibleX   = tooltipInfo.x - scrollX; // x relative to visible viewport

                        // Flip horizontally if tooltip would overflow right edge
                        const flipX = visibleX + GAP + TOOLTIP_W > containerW;
                        // Flip vertically if tooltip would overflow bottom
                        const flipY = tooltipInfo.y + GAP + TOOLTIP_H > containerH + (scrollRef.current?.scrollTop ?? 0);

                        const styleLeft = flipX
                            ? tooltipInfo.x - TOOLTIP_W - GAP
                            : tooltipInfo.x + GAP;
                        const styleTop  = flipY
                            ? tooltipInfo.y - TOOLTIP_H - GAP
                            : tooltipInfo.y - GAP;

                        return (
                            <div
                                ref={tooltipRef}
                                className="absolute z-50 pointer-events-none"
                                style={{ left: styleLeft, top: styleTop }}
                            >
                            <div className="w-max max-w-[280px] bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-2xl px-3 py-2 text-[11px] border border-slate-600/50">
                                <div className="font-bold mb-1 flex items-center gap-2">
                                    {formatFlightLabel(tooltipInfo.flight, ' / ')}
                                    <span className="rounded bg-white/15 px-1.5 text-[9px] font-semibold uppercase">
                                        {isFlightPlanning(tooltipInfo.flight) ? 'Planning' : 'Current'}
                                    </span>
                                </div>
                                <div className="space-y-0.5 text-slate-300">
                                    <div className="flex flex-col gap-0.5">
                                        <div>STA: {renderTooltipTime(tooltipInfo.flight.arrivalStaDate)}</div>
                                        <div>STD: {renderTooltipTime(tooltipInfo.flight.departureStdDate)}</div>
                                    </div>
                                    {tooltipInfo.flight.airlineObj?.name && (
                                        <div>Airline: {tooltipInfo.flight.airlineObj.name}</div>
                                    )}
                                    {tooltipInfo.flight.acTypeObj?.code && (
                                        <div>Aircraft: {tooltipInfo.flight.acTypeObj.code}</div>
                                    )}
                                    {tooltipInfo.flight.csList &&
                                        tooltipInfo.flight.csList.length > 0 && (
                                            <div>
                                                CS:{' '}
                                                {tooltipInfo.flight.csList
                                                    .map((s) => s.displayName || s.name)
                                                    .join(', ')}
                                            </div>
                                        )}
                                    {tooltipInfo.flight.mechList &&
                                        tooltipInfo.flight.mechList.length > 0 && (
                                            <div>
                                                MECH:{' '}
                                                {tooltipInfo.flight.mechList
                                                    .map((s) => s.displayName || s.name)
                                                    .join(', ')}
                                            </div>
                                        )}
                                    {getMissingStaff(tooltipInfo.flight).length > 0 && (
                                        <div className="font-semibold text-red-400">
                                            Missing staff: {getMissingStaff(tooltipInfo.flight).join(', ')}
                                        </div>
                                    )}
                                    <div>
                                        Status:{' '}
                                        <span className={isFlightCancelled(tooltipInfo.flight) ? 'font-bold text-red-400' : ''}>
                                            {tooltipInfo.flight.statusObj?.code || '-'}
                                        </span>
                                    </div>

                                </div>
                            </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
