'use client';

import { useTheme } from "next-themes";
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useEpg, Epg, Layout } from 'planby';
import { FlightProgram } from './FlightProgram';
import { FlightChannel } from './FlightChannel';
import { FlightTable } from './FlightTable';
import { FlightSkeleton } from './FlightSkeleton';
import { flightTimelineThemeDark, flightTimelineThemeLight } from './types';
import {
    formatDateForApi, transformFlightsToEpg, transformAirlinesToChannels, transformAirlinesToChannelsPlanby, sanitizeFlightsPlanby
} from './utils';

import { useFlightListQuery } from '@/lib/api/hooks/useFlightListQuery';
import { GetFlightListParams } from "@/lib/api/flight/getFlightList";
import { FlightItem } from "@/lib/api/flight/filghtlist.interface";
import { AlignStartVertical, ArrowLeftFromLine, ArrowRightFromLine, ChevronLeft, ChevronRight, Table, Maximize2, Minimize2, X, Plus, AlarmClockOff, AlarmClock, Upload, FileUp, Download } from "lucide-react";
import { FlightTimeline } from "./FlightTimeline";
import { FlightPlanbyItem, useFlightListPlanbyQuery } from "@/lib/api/hooks/useFlightListPlanbyQuery";
import dayjs from "dayjs";
import CreateProject from "@/app/[locale]/(protected)/flight/create-project";
import { Button } from "@/components/ui/button";
import EditFlight from "@/app/[locale]/(protected)/flight/edit-project";
import { mockData } from "./mockData";
import { ExcelImportModal } from "./ExcelImportModal";
import { useFlightExcelImport } from "@/hooks/use-flight-excel-import";



interface FlightTimelineWrapperProps {
    initialDate?: Date;
}

const PLANBY_LICENSE_KEY = process.env.NEXT_PUBLIC_PRODUCTION_API || '8EEEEB33-692F-4F92-8135-0AE2136A70D3';

export function FlightTimelineWrapper({ initialDate }: FlightTimelineWrapperProps) {
    const { theme } = useTheme();
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
    const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAlarm, setIsAlarm] = useState(false);
    const [containerKey, setContainerKey] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const contentRef = useRef<HTMLDivElement>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const [openAddFlight, setOpenAddFlight] = useState<boolean>(false);

    // Download template handler
    const handleDownloadTemplate = () => {
        const link = document.createElement('a');
        link.href = '/flie/Template Aircraft Sched-Mapping.xlsx';
        link.download = 'Template Aircraft Sched-Mapping.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Excel import hook with preview, validation, and upload
    const excelImport = useFlightExcelImport();

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 600); // Update every minute

        return () => clearInterval(timer);
    }, []);

    // Format current time for display
    const formattedCurrentTime = useMemo(() => {
        return currentTime.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }, [currentTime]);

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
            // Force re-render when fullscreen changes
            setContainerKey(prev => prev + 1);
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
        dateEnd: dateStart,
        page: 1,
        perPage: 1000,
    };
    // Fetch flight data
    const { data, isLoading, error, isFetched } = useFlightListQuery(params);
    const { data: dataPlanby, isLoading: isLoadingPlanby, error: errorPlanby, isFetched: isFetchedPlanby } = useFlightListPlanbyQuery(params);

    const flights: FlightItem[] = data?.responseData || [];
    const flightsPlanbyRaw: FlightPlanbyItem[] = dataPlanby?.responseData || [];

    // Sanitize: fix items where till <= since (invalid time ranges from API)
    const flightsPlanby = useMemo(() => sanitizeFlightsPlanby(flightsPlanbyRaw), [flightsPlanbyRaw]);

    // const flightsPlanby = mockFlights
    // Transform data for Planby
    const epgData = useMemo(() => transformFlightsToEpg(flights), [flights]);
    // const channels = useMemo(() => transformAirlinesToChannels(flights), [flights]);
    const channels = useMemo(() => transformAirlinesToChannelsPlanby(flightsPlanby), [flightsPlanby]);

    // Format start date for Planby (00:00 of selected date)
    const startDateFormatted = useMemo(() => {
        const d = new Date(selectedDate);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    }, [selectedDate]);

    // Format end date for Planby (00:00 of next day for full 24 hours)
    const endDateFormatted = useMemo(() => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1); // Move to next day
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    }, [selectedDate]);

    // Track container dimensions for Planby
    const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({ width: 1200, height: 600 });
    // Initialize Planby with explicit dimensions and full 24-hour view

    // const channels1 = useMemo(() => transformAirlinesToChannels(flights), [flights]);

    const { getEpgProps, getLayoutProps, onScrollToNow, onScrollLeft, onScrollRight } = useEpg({
        epg: flightsPlanby,
        // epg: mockData,
        channels: channels,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        theme: theme === 'dark' ? flightTimelineThemeDark : flightTimelineThemeLight,
        sidebarWidth: 10,
        itemHeight: 60,
        isCurrentTime: true,
        isInitialScrollToNow: true,
        isLine: true,
        licenseKey: PLANBY_LICENSE_KEY,
        width: containerDimensions.width,
        height: containerDimensions.height,
        dayWidth: 1850,
        // hourWidth: 30,
        // dayWidth: 720, // Width for full 24 hours (300px per hour * 24 = 7200px)
        // dayWidth: 7200, // Width for full 24 hours (300px per hour * 24 = 7200px)
    } as any);

    // Force Planby to re-render when container dimensions change
    useEffect(() => {
        if (!isFetched || viewMode !== 'timeline') return;

        const container = timelineContainerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setContainerDimensions({ width, height });
                    setContainerKey(prev => prev + 1);
                }
            }
        });

        resizeObserver.observe(container);

        // Also trigger an initial measurement after a short delay
        const timer = setTimeout(() => {
            if (container.offsetWidth > 0 && container.offsetHeight > 0) {
                setContainerDimensions({
                    width: container.offsetWidth,
                    height: container.offsetHeight
                });
                setContainerKey(prev => prev + 1);
            }
        }, 50);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, [isFetched, viewMode]);

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
            <CreateProject open={openAddFlight} setOpen={setOpenAddFlight} />
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg dark:bg-slate-800/50 bg-slate-100 p-4 shadow">
                {/* Date Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevDay}
                        className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-lg dark:bg-slate-700 dark:text-white bg-slate-200 text-slate-700 hover:bg-slate-600 hover:text-white transition-colors"
                    >
                        <ArrowLeftFromLine className="w-4 h-4" />
                    </button>

                    <input
                        type="date"
                        value={formatDateForApi(selectedDate)}
                        onChange={handleDateChange}
                        className="h-10 rounded-lg dark:bg-slate-700 dark:text-white bg-slate-200 text-slate-700 px-4 border-none focus:ring-2 focus:ring-sky-500"
                    />

                    <button
                        onClick={handleNextDay}
                        className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-lg dark:bg-slate-700 dark:text-white bg-slate-200 text-slate-700 hover:bg-slate-600 hover:text-white transition-colors"
                    >
                        <ArrowRightFromLine className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleToday}
                        className="cursor-pointer h-10 rounded-lg dark:bg-sky-600 bg-sky-400 px-4 dark:text-white text-white font-medium hover:bg-sky-500 hover:text-white transition-colors"
                    >
                        Today
                    </button>
                </div>

                {/* Timeline Navigation */}
                {/* {viewMode === "timeline" ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onScrollLeft(200)}
                            className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-lg dark:bg-slate-700 dark:text-white bg-slate-200 text-slate-700 hover:bg-slate-600 hover:text-white transition-colors"
                        >
                            <span><ChevronLeft className="w-4 h-4" /></span>
                        </button>
                        <button

                            onClick={onScrollToNow}
                            className="cursor-pointer h-10 rounded-lg dark:bg-emerald-600 bg-emerald-400 px-4 text-white font-medium hover:bg-emerald-500 hover:text-white transition-colors"
                        >
                            Now
                        </button>

                        <button
                            onClick={() => onScrollRight(200)}
                            className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-lg dark:bg-slate-700 dark:text-white bg-slate-200 text-slate-700 hover:bg-slate-600 hover:text-white transition-colors"
                        >
                            <span><ChevronRight className="w-4 h-4" /></span>
                        </button>
                    </div>
                ) : null} */}

                <div className="flex items-center gap-6">
                    {/* Legend
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-linear-to-r from-sky-600 to-sky-500" />
                            <span className="text-sm text-slate-700 dark:text-white">Arrival</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-linear-to-r from-emerald-600 to-emerald-500" />
                            <span className="text-sm text-slate-700 dark:text-white">Departure</span>
                        </div>
                    </div> */}

                    <div className="flex items-center gap-2">
                        {viewMode === 'table' && <Button
                            onClick={() => setIsAlarm(!isAlarm)}
                            color={isAlarm ? "warning" : "destructive"}
                            className="flex space-x-2"
                            size="md"
                        >
                            {!isAlarm ? <AlarmClockOff className="w-4 h-4" /> : <AlarmClock className="w-4 h-4 animate-pulse" />}
                            {isAlarm ? <span className="text-sm font-bold">{formattedCurrentTime}</span> : <span className="text-sm font-bold">OFF</span>}
                        </Button>
                        }
                        <Button
                            className="flex-none"
                            color="primary"
                            onClick={() => setOpenAddFlight(true)}
                            size="md"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Flight</span>
                        </Button>

                        {/* Import Button with Excel Preview Modal */}
                        <input
                            type="file"
                            ref={excelImport.fileInputRef}
                            onChange={excelImport.handleFileSelect}
                            accept=".xlsx,.xls"
                            className="hidden"
                        />
                        <Button
                            className="flex-none"
                            color="primary"
                            variant="outline"
                            onClick={excelImport.openFilePicker}
                            disabled={excelImport.isParsing}
                            size="md"
                        >
                            <FileUp className="w-4 h-4 mr-2" />
                            <span>{excelImport.isParsing ? 'Loading...' : 'Import'}</span>
                        </Button>
                        {/* Download Template Button */}
                        <Button
                            className="flex-none"
                            color="secondary"
                            variant="outline"
                            onClick={handleDownloadTemplate}
                            size="md"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            <span>Template</span>
                        </Button>
                    </div>
                    {/* View Toggle */}
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-slate-700 dark:text-white">View : </div>
                        <div className="flex items-center gap-1 rounded-lg dark:bg-slate-700 bg-slate-200 p-1">
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={`cursor-pointer flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'timeline'
                                    ? 'bg-sky-400 text-white'
                                    : 'text-slate-700 dark:text-white hover:text-slate-500'
                                    }`}
                            >
                                <span><AlignStartVertical className="w-4 h-4" /></span>
                                {/* <span><BetweenVerticalStart /></span> */}
                                {/* <span>Timeline</span> */}
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`cursor-pointer flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'table'
                                    ? 'bg-sky-400 text-white'
                                    : 'text-slate-700 dark:text-white hover:text-slate-500'
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

            {/* Loading Skeleton */}
            {!isFetched && <FlightSkeleton viewMode={viewMode} />}

            {/* Timeline or Table View */}
            <div
                ref={contentRef}
                className={isFullscreen
                    ? 'fixed inset-0 z-50 bg-slate-200 dark:bg-slate-900 p-4 overflow-auto'
                    : 'relative w-full'
                }
            >
                {/* Fullscreen Header */}
                {isFullscreen && (
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Flight {viewMode === 'timeline' ? 'Timeline' : 'Table'}</h2>
                        <div className="text-slate-800 dark:text-white"> {dayjs(selectedDate).format('ddd DD MMM YYYY')} </div>
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
                        <div
                            ref={timelineContainerRef}
                            className="relative overflow-hidden rounded-lg border-2 dark:border-2 dark:border-slate-700 dark:bg-slate-900 bg-white shadow-lg"
                            style={{ height: isFullscreen ? 'calc(100vh - 80px)' : '600px' }}
                        >
                            <Epg key={containerKey} {...getEpgProps()} isLoading={isLoading}>
                                <Layout
                                    {...(getLayoutProps() as any)}
                                    // renderGridCell={(props: any) => (
                                    //     <GridCell key={props.item?.position?.top} {...props} />
                                    // )}
                                    renderTimeline={(props: any) => <FlightTimeline {...props} />}
                                    renderProgram={({ program, ...rest }: any) => (
                                        <FlightProgram
                                            key={program.data.id}
                                            program={program as any}
                                            {...rest}
                                        />
                                    )}
                                    renderChannel={({ channel }: any) => (
                                        <FlightChannel
                                            key={channel.uuid}
                                            channel={channel as any}
                                        />
                                    )}
                                />
                            </Epg>
                        </div>
                    )
                ) : (
                    isFetched && <FlightTable flights={flights} isLoading={isLoading} isFullscreen={isFullscreen} isAlarm={isAlarm} />
                )}
            </div>

            {/* No flights message */}
            {!isLoading && flights.length === 0 && (
                <div className="flex h-32 items-center justify-center rounded-lg bg-slate-800/50 text-slate-400">
                    <p>No flights found for {selectedDate.toLocaleDateString()}</p>
                </div>
            )}

            {/* Excel Import Modal with Preview and Validation */}
            <ExcelImportModal
                isOpen={excelImport.isModalOpen}
                onClose={excelImport.closeModal}
                sheets={excelImport.sheets}
                activeSheetIndex={excelImport.activeSheetIndex}
                onSheetChange={excelImport.setActiveSheetIndex}
                validatedRows={excelImport.validatedRows}
                validatedRowsBySheet={excelImport.validatedRowsBySheet}
                hasValidated={excelImport.hasValidated}
                validRows={excelImport.validRows}
                invalidRows={excelImport.invalidRows}
                warningRows={excelImport.warningRows}
                canUpload={excelImport.canUpload}
                isValidating={excelImport.isValidating}
                isUploading={excelImport.isUploading}
                onValidate={excelImport.validateData}
                onUpload={excelImport.uploadData}
                onDeleteRow={excelImport.deleteRow}
                onEditRow={excelImport.editRow}
                onUpdateSheetName={excelImport.updateSheetName}
            />
        </div>
    );
}
