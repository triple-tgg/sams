'use client';

import { useTheme } from "next-themes";
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { CustomFlightTimeline } from './CustomFlightTimeline';
import { WeekFlightTimeline } from './WeekFlightTimeline';
import { TimelineLegend } from './TimelineLegend';
import { FlightTable } from './FlightTable';
import { FlightSkeleton } from './FlightSkeleton';
import { formatDateForApi, getWeekStart, isFlightPlanning } from './utils';

import { useFlightListQuery } from '@/lib/api/hooks/useFlightListQuery';
import { GetFlightListParams } from "@/lib/api/flight/getFlightList";
import { FlightItem } from "@/lib/api/flight/filghtlist.interface";
import { AlignStartVertical, CalendarRange, ArrowLeftFromLine, ArrowRightFromLine, Table, Maximize2, Minimize2, X, Plus, AlarmClockOff, AlarmClock, Clock, FileUp, Download, Loader2 } from "lucide-react";
import { useAircraftSchedMappingTemplate } from "@/hooks/use-aircraft-sched-mapping-template";
import dayjs from "dayjs";
import CreateProject from "@/app/[locale]/(protected)/flight/create-project";
import { Button } from "@/components/ui/button";
import { ExcelImportModal } from "./ExcelImportModal";
import { useFlightExcelImport } from "@/hooks/use-flight-excel-import";
import { useStationsOptions } from "@/lib/api/hooks/useStations";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import Tooltip from "../ui/c-tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronDown } from "lucide-react";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";



const CLOCK_PILL_STORAGE_KEY = 'flight-timeline:clock-pill';

interface FlightTimelineWrapperProps {
    initialDate?: Date;
}

export function FlightTimelineWrapper({ initialDate }: FlightTimelineWrapperProps) {
    const { theme } = useTheme();
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
    const [viewMode, setViewMode] = useState<'timeline' | 'week' | 'table'>('week');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAlarm, setIsAlarm] = useState(false);
    const [showClockPill, setShowClockPill] = useState(true);

    // Remember whether the Local/UTC clock pill was closed (per browser; storage may be unavailable)
    useEffect(() => {
        try {
            if (localStorage.getItem(CLOCK_PILL_STORAGE_KEY) === 'hidden') setShowClockPill(false);
        } catch { /* ignore */ }
    }, []);

    const updateClockPill = (show: boolean) => {
        setShowClockPill(show);
        try {
            if (show) localStorage.removeItem(CLOCK_PILL_STORAGE_KEY);
            else localStorage.setItem(CLOCK_PILL_STORAGE_KEY, 'hidden');
        } catch { /* ignore */ }
    };
    const [currentTime, setCurrentTime] = useState(new Date());
    const contentRef = useRef<HTMLDivElement>(null);
    const [openAddFlight, setOpenAddFlight] = useState<boolean>(false);
    const [selectedStations, setSelectedStations] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'planning' | 'current'>('all');
    const [minuteScale, setMinuteScale] = useState<number>(60);

    // Station options from API
    const { options: stationOptions, isLoading: loadingStations } = useStationsOptions();

    // Station toggle handler
    const handleStationToggle = (stationCode: string, checked: boolean) => {
        if (stationCode === '__ALL__') {
            setSelectedStations([]);
            return;
        }
        if (checked) {
            setSelectedStations(prev => [...prev, stationCode]);
        } else {
            setSelectedStations(prev => prev.filter(s => s !== stationCode));
        }
    };

    // Template comes from the API so its reference sheets stay current
    const { downloadTemplate, isDownloading: isDownloadingTemplate } = useAircraftSchedMappingTemplate();

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

    const formattedLocalTime = useMemo(() => {
        return dayjs(currentTime).format('DD MMM YYYY HH:mm:ss');
    }, [currentTime]);

    const formattedUtcTime = useMemo(() => {
        // Fallback using native Date to avoid dayjs.utc plugin issues if not registered
        const pad = (n: number) => n.toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${pad(currentTime.getUTCDate())} ${months[currentTime.getUTCMonth()]} ${currentTime.getUTCFullYear()} ${pad(currentTime.getUTCHours())}:${pad(currentTime.getUTCMinutes())}:${pad(currentTime.getUTCSeconds())}`;
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
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Format dates for API — week view fetches Mon–Sun of the selected date's week
    const isWeekView = viewMode === 'week';
    const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
    const dateStart = formatDateForApi(isWeekView ? weekStart : selectedDate);
    const dateEnd = isWeekView ? formatDateForApi(dayjs(weekStart).add(6, 'day').toDate()) : dateStart;
    const weekRangeLabel = `${dayjs(weekStart).format('DD MMM')} – ${dayjs(weekStart).add(6, 'day').format('DD MMM YYYY')}`;
    const params: GetFlightListParams = {
        stationCodeList: selectedStations.length > 0 ? selectedStations : [],
        dateStart: dateStart,
        dateEnd: dateEnd,
        page: 1,
        perPage: 1000,
    };
    // Fetch flight data
    // All views use /flight/listdata (one item per flight). /flight/listdata-planby splits flights into
    // inconsistent per-day chunks — see documents/api-spec/flight-timeline-week.md
    const { data, isLoading, error, isFetched } = useFlightListQuery(params);

    const allFlights: FlightItem[] = data?.responseData || [];

    // Status filter: Planning = statusObj.code "Planning", Current = any other status
    const flights = useMemo(() => {
        if (statusFilter === 'all') return allFlights;
        const wantPlanning = statusFilter === 'planning';
        return allFlights.filter((f) => isFlightPlanning(f) === wantPlanning);
    }, [allFlights, statusFilter]);
    const planningCount = useMemo(() => allFlights.filter(isFlightPlanning).length, [allFlights]);

    // Handle date change
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(new Date(e.target.value));
    };

    const handlePrevDay = () => {
        setSelectedDate(prev => dayjs(prev).subtract(isWeekView ? 7 : 1, 'day').toDate());
    };

    const handleNextDay = () => {
        setSelectedDate(prev => dayjs(prev).add(isWeekView ? 7 : 1, 'day').toDate());
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

    const stationFilterNode = (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className="flex items-center justify-between gap-2 w-52 h-10 rounded-lg dark:bg-slate-700 dark:text-white bg-slate-200 text-slate-700 px-3 text-sm cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                    disabled={loadingStations}
                >
                    <span className="flex flex-wrap gap-1 max-w-[160px] overflow-hidden">
                        {selectedStations.length > 0 ? (
                            selectedStations.length <= 2 ? (
                                selectedStations.map((s) => (
                                    <span key={s} className="bg-sky-500/20 text-sky-800 px-2 py-0.5 rounded text-xs font-medium">{s}</span>
                                ))
                            ) : (
                                <span>{selectedStations.length} stations</span>
                            )
                        ) : (
                            <span>{loadingStations ? "Loading..." : "All Stations"}</span>
                        )}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
                <div className="space-y-1 max-h-[240px] overflow-y-auto">
                    {/* All Stations option */}
                    <div
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer border-b mb-1 pb-2"
                        onClick={() => handleStationToggle('__ALL__', true)}
                    >
                        <Checkbox
                            checked={selectedStations.length === 0}
                            onCheckedChange={() => handleStationToggle('__ALL__', true)}
                        />
                        <span className="text-sm flex-1 font-medium">All Stations</span>
                        {selectedStations.length === 0 && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </div>
                    {stationOptions.map((station: { value: string; label: string }) => (
                        <div
                            key={station.value}
                            className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                            onClick={() => handleStationToggle(
                                station.value,
                                !selectedStations.includes(station.value)
                            )}
                        >
                            <Checkbox
                                checked={selectedStations.includes(station.value)}
                                onCheckedChange={(checked) => handleStationToggle(
                                    station.value,
                                    checked as boolean
                                )}
                            />
                            <span className="text-sm flex-1">{station.label}</span>
                            {selectedStations.includes(station.value) && (
                                <Check className="h-4 w-4 text-primary" />
                            )}
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );

    const statusFilterOptions = [
        { value: 'all', label: 'All', count: allFlights.length },
        { value: 'planning', label: 'Planning', count: planningCount },
        { value: 'current', label: 'Current', count: allFlights.length - planningCount },
    ] as const;

    const statusFilterNode = (
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-700 dark:text-white">Status :</span>
            <div className="flex items-center gap-1 rounded-lg dark:bg-slate-700 bg-slate-200 p-1">
                {statusFilterOptions.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
                        title={opt.value === 'current' ? 'Every status except Planning' : undefined}
                        className={`cursor-pointer flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${statusFilter === opt.value
                            ? 'bg-sky-400 text-white'
                            : 'text-slate-700 dark:text-white hover:text-slate-500'
                            }`}
                    >
                        {opt.label}
                        <span className={`rounded px-1 text-[10px] font-semibold ${statusFilter === opt.value ? 'bg-white/25' : 'bg-slate-300/70 dark:bg-slate-600'}`}>
                            {opt.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="relative space-y-4">


            <CreateProject open={openAddFlight} setOpen={setOpenAddFlight} />

            {/* Page Header with Action Buttons */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Flight Timeline</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        View incoming and outgoing flights on an interactive timeline
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">

                    <div className="flex items-center gap-2">
                        <PermissionActionGuard menuCode="FLIGHT_TIMELINE" action="canCreate">
                        <Button
                            className="flex-none"
                            color="primary"
                            onClick={() => setOpenAddFlight(true)}
                            size="md"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            <span>Add Flight</span>
                        </Button>

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
                        </PermissionActionGuard>

                        <PermissionActionGuard menuCode="FLIGHT_TIMELINE" action="canExport">
                        <Button
                            className="flex-none"
                            color="secondary"
                            variant="outline"
                            onClick={downloadTemplate}
                            disabled={isDownloadingTemplate}
                            size="md"
                        >
                            {isDownloadingTemplate
                                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                : <Download className="w-4 h-4 mr-2" />}
                            <span>Template</span>
                        </Button>
                        </PermissionActionGuard>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg dark:bg-slate-800/50 bg-slate-100 p-4 shadow">

                {/* Station Filter (Multi-Select) */}
                <div className="flex items-center gap-4">
                    {stationFilterNode}
                    {statusFilterNode}
                </div>
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

                    {isWeekView && (
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{weekRangeLabel}</span>
                    )}

                    <button
                        onClick={handleToday}
                        className="cursor-pointer h-10 rounded-lg dark:bg-sky-600 bg-sky-400 px-4 dark:text-white text-white font-medium hover:bg-sky-500 hover:text-white transition-colors"
                    >
                        Today
                    </button>

                    {viewMode === 'timeline' && (
                        <div className="flex items-center gap-2 ml-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Scale:</span>
                            <select
                                value={minuteScale}
                                onChange={(e) => setMinuteScale(Number(e.target.value))}
                                className="h-10 rounded-lg dark:bg-slate-700 dark:text-white bg-slate-200 text-slate-700 px-3 border-none focus:ring-2 focus:ring-sky-500 text-sm cursor-pointer"
                            >
                                <option value={240}>4 hr</option>
                                <option value={120}>2 hr</option>
                                <option value={60}>1 hr</option>
                                <option value={30}>30 mins</option>
                                <option value={15}>15 mins</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    {/* View Toggle */}
                    <div className="flex items-center gap-2">
                        {viewMode === 'table' && (
                            <Tooltip content="Filter: Hide today's departed flights">
                                <Button
                                    onClick={() => setIsAlarm(!isAlarm)}
                                    color={isAlarm ? "warning" : "destructive"}
                                    className="flex space-x-2"
                                    size="md"
                                >
                                    {!isAlarm ? <AlarmClockOff className="w-4 h-4" /> : <AlarmClock className="w-4 h-4 animate-pulse" />}
                                    {isAlarm ? <span className="text-sm font-bold">{formattedCurrentTime}</span> : <span className="text-sm font-bold">OFF</span>}
                                </Button>
                            </Tooltip>
                        )}
                        <div className="text-sm text-slate-700 dark:text-white">View : </div>
                        <div className="flex items-center gap-1 rounded-lg dark:bg-slate-700 bg-slate-200 p-1">
                            <button
                                onClick={() => setViewMode('week')}
                                title="Week timeline"
                                className={`cursor-pointer flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'week'
                                    ? 'bg-sky-400 text-white'
                                    : 'text-slate-700 dark:text-white hover:text-slate-500'
                                    }`}
                            >
                                <span><CalendarRange className="w-4 h-4" /></span>
                            </button>
                            <button
                                onClick={() => setViewMode('timeline')}
                                title="Day timeline"
                                className={`cursor-pointer flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'timeline'
                                    ? 'bg-sky-400 text-white'
                                    : 'text-slate-700 dark:text-white hover:text-slate-500'
                                    }`}
                            >
                                <span><AlignStartVertical className="w-4 h-4" /></span>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                title="Table"
                                className={`cursor-pointer flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'table'
                                    ? 'bg-sky-400 text-white'
                                    : 'text-slate-700 dark:text-white hover:text-slate-500'
                                    }`}
                            >
                                <span><Table className="w-4 h-4" /></span>
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
                {/* Sticky Timezone Pill - Centered at the top. Needs to be inside contentRef to be visible in fullscreen mode. */}
                <div className={`fixed left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 pointer-events-none ${isFullscreen ? 'top-2' : 'top-4'}`}>
                    {showClockPill ? (
                        <div className="flex items-center gap-3 pl-6 pr-2 py-2 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg pointer-events-auto">
                            <div className="flex items-center gap-2 ">
                                <span className="text-slate-500 font-bold tracking-wider text-[11px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">LOCAL (BANGKOK)</span>
                                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-mono font-medium tracking-tight">{formattedLocalTime}</span>
                            </div>
                            <div className="h-5 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-sky-600 dark:text-sky-400 font-bold tracking-wider text-[11px] bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-md">UTC</span>
                                <span className="text-slate-800 dark:text-slate-200 text-[11px] font-mono font-medium tracking-tight">{formattedUtcTime}</span>
                            </div>
                            <button
                                onClick={() => updateClockPill(false)}
                                title="Hide clock"
                                aria-label="Hide clock"
                                className="cursor-pointer ml-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => updateClockPill(true)}
                            title="Show local / UTC clock"
                            aria-label="Show local / UTC clock"
                            className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg pointer-events-auto text-slate-500 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400 transition-colors"
                        >
                            <Clock className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Fullscreen Header */}
                {isFullscreen && (
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Flight {viewMode === 'timeline' ? 'Timeline' : viewMode === 'week' ? 'Week' : 'Table'}</h2>
                            {stationFilterNode}
                            {statusFilterNode}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-slate-800 dark:text-white"> {isWeekView ? weekRangeLabel : dayjs(selectedDate).format('ddd DD MMM YYYY')} </div>

                            {viewMode === 'timeline' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Scale:</span>
                                    <select
                                        value={minuteScale}
                                        onChange={(e) => setMinuteScale(Number(e.target.value))}
                                        className="h-10 rounded-lg dark:bg-slate-700 dark:text-white bg-white border border-slate-300 dark:border-slate-600 text-slate-700 px-3 focus:ring-2 focus:ring-sky-500 text-sm cursor-pointer shadow-sm"
                                    >
                                        <option value={240}>4 hr</option>
                                        <option value={120}>2 hr</option>
                                        <option value={60}>1 hr</option>
                                        <option value={30}>30 mins</option>
                                        <option value={15}>15 mins</option>
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={toggleFullscreen}
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors cursor-pointer shadow-sm"
                            >
                                <Minimize2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {viewMode === 'timeline' ? (
                    isFetched && (
                        <CustomFlightTimeline
                            flights={flights}
                            selectedDate={selectedDate}
                            isFullscreen={isFullscreen}
                            minuteScale={minuteScale}
                        />
                    )
                ) : viewMode === 'week' ? (
                    isFetched && (
                        <WeekFlightTimeline
                            flights={flights}
                            weekStart={weekStart}
                            isFullscreen={isFullscreen}
                        />
                    )
                ) : (
                    isFetched && <FlightTable flights={flights} isLoading={isLoading} isFullscreen={isFullscreen} isAlarm={isAlarm} />
                )}
                {viewMode !== 'table' && isFetched && <TimelineLegend />}
            </div>


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
