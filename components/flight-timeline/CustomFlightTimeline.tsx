'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { FlightPlanbyItem } from '@/lib/api/flight/getFlightListPlanby';
import { FlightItem } from '@/lib/api/flight/filghtlist.interface';
import dayjs from 'dayjs';
import { splitUtcDateTimeToLocal } from '@/lib/utils/flightDatetime';


interface CustomFlightTimelineProps {
    flights: FlightPlanbyItem[];
    flightDetails: FlightItem[];
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
    flightDetails,
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
        flight: FlightPlanbyItem;
        detail?: FlightItem;
        x: number;
        y: number;
    } | null>(null);

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

    // Build lookup map from regular flight data for acType & staff
    const detailMap = useMemo(() => {
        const map = new Map<string, FlightItem>();
        flightDetails.forEach((f) => {
            // key by arrivalFlightNo + arrivalStaDate
            if (f.arrivalFlightNo && f.arrivalStaDate) {
                const dateKey = splitUtcDateTimeToLocal(f.arrivalStaDate).date;
                map.set(`${f.arrivalFlightNo}|${dateKey}`, f);
            }
            if (f.flightInfosId) {
                map.set(`fid|${f.flightInfosId}`, f);
            }
        });
        return map;
    }, [flightDetails]);

    const findDetail = useCallback(
        (f: FlightPlanbyItem): FlightItem | undefined => {
            // Try by ID (strip suffix like "-arrival")
            const numId = f.id?.replace(/-.*$/, '');
            if (numId) {
                const byId = detailMap.get(`fid|${numId}`);
                if (byId) return byId;
            }
            // Try by arrivalFlightNo + arrivalDate
            if (f.arrivalFlightNo && f.arrivalDate) {
                const byKey = detailMap.get(`${f.arrivalFlightNo}|${f.arrivalDate}`);
                if (byKey) return byKey;
            }
            return undefined;
        },
        [detailMap]
    );

    // Group flights by channelUuid (rows)
    const rows = useMemo(() => {
        const grouped = new Map<string, FlightPlanbyItem[]>();
        flights.forEach((f) => {
            const key = f.channelUuid || 'unknown';
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(f);
        });
        return Array.from(grouped.entries()).sort((a, b) =>
            a[0].localeCompare(b[0], undefined, { numeric: true })
        );
    }, [flights]);

    // Calculate pixel position from ISO time string
    const getPos = useCallback(
        (timeStr: string) => {
            const t = dayjs(timeStr);
            const start = dayjs(selectedDate).startOf('day');
            const mins = t.diff(start, 'minute');
            return (mins / 60) * HOUR_WIDTH;
        },
        [selectedDate, HOUR_WIDTH]
    );

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
        flight: FlightPlanbyItem
    ) => {
        const rect = scrollRef.current?.getBoundingClientRect();
        if (!rect) return;
        setHoveredFlight(flight.id);
        setTooltipInfo({
            flight,
            detail: findDetail(flight),
            x: e.clientX - rect.left + scrollRef.current!.scrollLeft,
            y: e.clientY - rect.top + scrollRef.current!.scrollTop,
        });
    };

    const handleBarMouseLeave = () => {
        setHoveredFlight(null);
        setTooltipInfo(null);
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
                            {rows.map(([channelId, channelFlights], rowIdx) =>
                                channelFlights.map((flight) => {
                                    const left = getPos(flight.since);
                                    const right = getPos(flight.till);
                                    const width = Math.max(right - left, 36);
                                    const detail = findDetail(flight);

                                    const acType = detail?.acTypeObj?.code || '';
                                    const airlineName = detail?.airlineObj?.name || flight?.airlineObj?.name || '';
                                    const csNames =
                                        detail?.csList
                                            ?.map((s) => s.displayName || s.name)
                                            .join(', ') || '';
                                    const mechNames =
                                        detail?.mechList
                                            ?.map((s) => s.displayName || s.name)
                                            .join(', ') || '';

                                    const isHovered = hoveredFlight === flight.id;
                                    const barTop = rowIdx * ROW_HEIGHT + 4;
                                    const barHeight = ROW_HEIGHT - 8;

                                    return (
                                        <div
                                            key={flight.id}
                                            className={`absolute rounded-lg overflow-hidden cursor-pointer transition-all duration-150
                                                ${isHovered ? 'shadow-xl scale-[1.02] z-10' : 'shadow-md hover:shadow-lg'}`}
                                            style={{
                                                left,
                                                top: barTop,
                                                width,
                                                height: barHeight,
                                                background: flight.color?.background || '#3b82f6',
                                                color: flight.color?.foreground || '#fff',
                                                border: `1px solid ${isHovered ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
                                            }}
                                            onMouseEnter={(e) => handleBarMouseEnter(e, flight)}
                                            onMouseLeave={handleBarMouseLeave}
                                        >
                                            <div className={`h-full flex flex-col justify-start py-2 gap-0.5 ${width < 80 ? 'px-1.5' : 'px-3'}`}>
                                                {/* Airline name */}
                                                <div className={`${minuteScale === 30 || minuteScale === 60 ? 'text-[10px] sm:text-[12px]' : 'text-[12px] sm:text-[14px]'} font-bold truncate leading-tight tracking-tight`}>
                                                    {airlineName || 'No Airline'}
                                                </div>

                                                {/* Aircraft type & Flight numbers */}
                                                <div className={`flex ${minuteScale === 30 || minuteScale === 60 ? 'flex-col items-start gap-0' : 'items-center gap-3 mt-0.5'} leading-tight`}>
                                                    <div className={`${minuteScale === 30 || minuteScale === 60 ? 'text-[8px]' : 'text-[10px]'} font-bold truncate flex gap-1`}>
                                                        {flight.arrivalFlightNo && <span>{flight.arrivalFlightNo}</span>}
                                                        {flight.arrivalFlightNo && flight.departureFlightNo && <span className="opacity-60">/</span>}
                                                        {flight.departureFlightNo && <span>{flight.departureFlightNo}</span>}
                                                    </div>
                                                    <span className={`text-[8px] font-bold truncate`}>{acType || 'No AC Type'}</span>
                                                </div>

                                                {/* CS staff */}
                                                <div className={`${minuteScale === 30 || minuteScale === 60 ? 'text-[8px]' : 'text-[10px] mt-0.5'} font-medium truncate leading-tight`}>
                                                    {csNames || 'No CS staff'}
                                                </div>

                                                {/* MECH staff */}
                                                <div className={`${minuteScale === 30 || minuteScale === 60 ? 'text-[8px]' : 'text-[10px]'} font-medium truncate leading-tight`}>
                                                    {mechNames || 'No MECH staff'}
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
                    {tooltipInfo && (
                        <div
                            className="absolute z-50 pointer-events-none"
                            style={{
                                left: tooltipInfo.x + 12,
                                top: tooltipInfo.y - 10,
                            }}
                        >
                            <div className="bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-2xl px-3 py-2 text-[11px] max-w-[260px] border border-slate-600/50">
                                <div className="font-bold mb-1">
                                    {tooltipInfo.flight.arrivalFlightNo}
                                    {tooltipInfo.flight.departureFlightNo &&
                                        ` / ${tooltipInfo.flight.departureFlightNo}`}
                                </div>
                                <div className="space-y-0.5 text-slate-300">
                                    <div>
                                        STA: {tooltipInfo.flight.arrivalStatime || '-'} → STD:{' '}
                                        {tooltipInfo.flight.departureStdTime || '-'}
                                    </div>
                                    {(tooltipInfo.detail?.airlineObj?.name || tooltipInfo.flight.airlineObj?.name) && (
                                        <div>Airline: {tooltipInfo.detail?.airlineObj?.name || tooltipInfo.flight.airlineObj?.name}</div>
                                    )}
                                    {tooltipInfo.detail?.acTypeObj?.code && (
                                        <div>Aircraft: {tooltipInfo.detail.acTypeObj.code}</div>
                                    )}
                                    {tooltipInfo.detail?.csList &&
                                        tooltipInfo.detail.csList.length > 0 && (
                                            <div>
                                                CS:{' '}
                                                {tooltipInfo.detail.csList
                                                    .map((s) => s.displayName || s.name)
                                                    .join(', ')}
                                            </div>
                                        )}
                                    {tooltipInfo.detail?.mechList &&
                                        tooltipInfo.detail.mechList.length > 0 && (
                                            <div>
                                                MECH:{' '}
                                                {tooltipInfo.detail.mechList
                                                    .map((s) => s.displayName || s.name)
                                                    .join(', ')}
                                            </div>
                                        )}
                                    <div>Status: {tooltipInfo.flight.status || '-'}</div>

                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
