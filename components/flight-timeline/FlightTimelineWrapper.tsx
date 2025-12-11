'use client';

import { useTheme } from "next-themes";
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useEpg, Epg, Layout } from 'planby';
import { FlightProgram } from './FlightProgram';
import { FlightChannel } from './FlightChannel';
import { FlightTable } from './FlightTable';
import { FlightSkeleton } from './FlightSkeleton';
import { FlightEpgItem, AirlineChannel, flightTimelineThemeDark, flightTimelineThemeLight } from './types';
import {
    transformFlightsToEpg,
    transformAirlinesToChannels,
    formatDateForApi
} from './utils';

import { useFlightListQuery } from '@/lib/api/hooks/useFlightListQuery';
import { GetFlightListParams } from "@/lib/api/flight/getFlightList";
import { FlightItem } from "@/lib/api/flight/filghtlist.interface";
import { AlignStartVertical, ArrowLeftFromLine, ArrowRightFromLine, BetweenVerticalStart, ChevronLeft, ChevronRight, Table, Maximize2, Minimize2, X } from "lucide-react";

interface FlightTimelineWrapperProps {
    initialDate?: Date;
}

const PLANBY_LICENSE_KEY = process.env.NEXT_PUBLIC_PRODUCTION_API || '8EEEEB33-692F-4F92-8135-0AE2136A70D3';

export function FlightTimelineWrapper({ initialDate }: FlightTimelineWrapperProps) {
    const { theme } = useTheme();
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
    const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Toggle fullscreen using Browser Fullscreen API
    const toggleFullscreen = useCallback(async () => {
        if (!contentRef.current) return;

        try {
            if (!isFullscreen) {
                // Enter fullscreen
                if (contentRef.current.requestFullscreen) {
                    await contentRef.current.requestFullscreen();
                } else if ((contentRef.current as any).webkitRequestFullscreen) {
                    await (contentRef.current as any).webkitRequestFullscreen();
                }
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                }
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    }, [isFullscreen]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Format dates for API
    const dateStart = formatDateForApi(selectedDate);
    const dateEnd = formatDateForApi(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
    const params: GetFlightListParams = {
        // flightNo: filters.flightNo,
        // stationCodeList: filters.stationCode ? [filters.stationCode] : [],

        // airlineId: filters.airlineId ? Number(filters.airlineId) : undefined,
        // stationCode: filters.stationCode || undefined,
        dateStart: dateStart,
        dateEnd: dateEnd,
        page: 1,
        perPage: 1000,
    };
    // Fetch flight data
    const { data, isLoading, error, isFetched } = useFlightListQuery(params);

    const flights: FlightItem[] = data?.responseData || [];

    // Transform data for Planby
    const epgData = useMemo(() => transformFlightsToEpg(flights), [flights]);
    const channels = useMemo(() => transformAirlinesToChannels(flights), [flights]);

    // Debug: Check EPG data and channels matching
    console.log("=== PLANBY DEBUG ===");
    console.log("EPG Items:", epgData.length, epgData);
    console.log("Channels:", channels.length, channels);
    console.log("Channel UUIDs:", channels.map(c => c.uuid));
    console.log("EPG channelUuids:", Array.from(new Set(epgData.map(e => e.channelUuid))));

    // Format start date for Planby
    const startDateFormatted = useMemo(() => {
        const d = new Date(selectedDate);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    }, [selectedDate]);

    const endDateFormatted = useMemo(() => {
        const d = new Date(selectedDate);
        d.setHours(23, 59, 59, 999);
        return d.toISOString();
    }, [selectedDate]);

    // Debug date range
    console.log("Timeline Date Range:", startDateFormatted, "to", endDateFormatted);
    if (epgData.length > 0) {
        console.log("First EPG item since/till:", epgData[0].since, epgData[0].till);
    }

    // Initialize Planby
    const { getEpgProps, getLayoutProps, onScrollToNow, onScrollLeft, onScrollRight } = useEpg({
        epg: epgData,
        channels: channels,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        theme: theme === 'dark' ? flightTimelineThemeDark : flightTimelineThemeLight,
        sidebarWidth: 150,
        itemHeight: 80,
        isCurrentTime: true,
        isInitialScrollToNow: true,
        isLine: true,
        licenseKey: PLANBY_LICENSE_KEY,
    } as any);

    // Handle date change
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(new Date(e.target.value));
    };

    const handlePrevDay = () => {
        setSelectedDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
    };

    const handleNextDay = () => {
        setSelectedDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    if (error) {
        return (
            <div className="flex h-96 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <div className="text-center">
                    <p className="text-lg font-semibold">Failed to load flight data</p>
                    <p className="text-sm opacity-70">{(error as Error).message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-800/50 p-4">
                {/* Date Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevDay}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                    >
                        <ArrowLeftFromLine className="w-4 h-4" />
                    </button>

                    <input
                        type="date"
                        value={formatDateForApi(selectedDate)}
                        onChange={handleDateChange}
                        className="h-10 rounded-lg bg-slate-700 px-4 text-white border-none focus:ring-2 focus:ring-sky-500"
                    />

                    <button
                        onClick={handleNextDay}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                    >
                        <ArrowRightFromLine className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleToday}
                        className="h-10 rounded-lg bg-sky-600 px-4 text-white font-medium hover:bg-sky-500 transition-colors"
                    >
                        Today
                    </button>
                </div>

                {/* Timeline Navigation */}
                {viewMode === "timeline" ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onScrollLeft(200)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                        >
                            <span><ChevronLeft className="w-4 h-4" /></span>
                        </button>
                        <button

                            onClick={onScrollToNow}
                            className="h-10 rounded-lg bg-emerald-600 px-4 text-white font-medium hover:bg-emerald-500 transition-colors"
                        >
                            Now
                        </button>

                        <button
                            onClick={() => onScrollRight(200)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                        >
                            <span><ChevronRight className="w-4 h-4" /></span>
                        </button>
                    </div>
                ) : null}

                <div className="flex items-center gap-6">
                    {/* Legend */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-linear-to-r from-sky-600 to-sky-500" />
                            <span className="text-sm text-slate-300">Arrival</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-linear-to-r from-emerald-600 to-emerald-500" />
                            <span className="text-sm text-slate-300">Departure</span>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-slate-300">View : </div>
                        <div className="flex items-center gap-1 rounded-lg bg-slate-700 p-1">
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={`cursor-pointer flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'timeline'
                                    ? 'bg-sky-600 text-white'
                                    : 'text-slate-300 hover:text-white'
                                    }`}
                            >
                                <span><AlignStartVertical className="w-4 h-4" /></span>
                                {/* <span><BetweenVerticalStart /></span> */}
                                {/* <span>Timeline</span> */}
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`cursor-pointer flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'table'
                                    ? 'bg-sky-600 text-white'
                                    : 'text-slate-300 hover:text-white'
                                    }`}
                            >
                                <span><Table className="w-4 h-4" /></span>
                                {/* <span>Table</span> */}
                            </button>
                        </div>
                        {/* Fullscreen Toggle Button */}
                        <div className="flex justify-end items-center gap-1 rounded-lg bg-slate-700 p-1">
                            <button
                                onClick={toggleFullscreen}
                                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-white hover:bg-slate-600 cursor-pointer"
                            >
                                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Flight Stats */}
            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-slate-800/50 p-4">
                    <p className="text-2xl font-bold text-white">{flights.length}</p>
                    <p className="text-sm text-slate-400">Total Flights</p>
                </div>
                <div className="rounded-lg bg-sky-900/50 p-4">
                    <p className="text-2xl font-bold text-sky-400">
                        {epgData.filter(f => f.flightType === 'arrival').length}
                    </p>
                    <p className="text-sm text-slate-400">Arrivals</p>
                </div>
                <div className="rounded-lg bg-emerald-900/50 p-4">
                    <p className="text-2xl font-bold text-emerald-400">
                        {epgData.filter(f => f.flightType === 'departure').length}
                    </p>
                    <p className="text-sm text-slate-400">Departures</p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-4">
                    <p className="text-2xl font-bold text-white">{channels.length}</p>
                    <p className="text-sm text-slate-400">Airlines</p>
                </div>
            </div> */}

            {/* Loading Skeleton */}
            {!isFetched && <FlightSkeleton viewMode={viewMode} />}

            {/* Timeline or Table View */}
            <div
                ref={contentRef}
                className={isFullscreen ? 'bg-slate-900 p-4 overflow-auto h-screen w-screen' : ''}
            >
                {/* Fullscreen Header */}
                {isFullscreen && (
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Flight {viewMode === 'timeline' ? 'Timeline' : 'Table'}</h2>
                        <button
                            onClick={toggleFullscreen}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors cursor-pointer"
                        >
                            <Minimize2 className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {viewMode === 'timeline' ? (
                    isFetched && (
                        <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                            <div style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '600px', width: '100%' }}>
                                <Epg {...getEpgProps()} isLoading={isLoading}>
                                    <Layout
                                        {...getLayoutProps()}
                                        renderProgram={({ program, ...rest }) => (
                                            <FlightProgram
                                                key={program.data.id}
                                                program={program as any}
                                                {...rest}
                                            />
                                        )}
                                        renderChannel={({ channel }) => (
                                            <FlightChannel
                                                key={channel.uuid}
                                                channel={channel as any}
                                            />
                                        )}
                                    />
                                </Epg>
                            </div>
                        </div>
                    )
                ) : (
                    isFetched && <FlightTable flights={flights} isLoading={isLoading} />
                )}
            </div>

            {/* No flights message */}
            {!isLoading && flights.length === 0 && (
                <div className="flex h-32 items-center justify-center rounded-lg bg-slate-800/50 text-slate-400">
                    <p>No flights found for {selectedDate.toLocaleDateString()}</p>
                </div>
            )}
        </div>
    );
}
