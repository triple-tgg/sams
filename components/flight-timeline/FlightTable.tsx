'use client';

import { FlightItem, StaffItem } from '@/lib/api/flight/filghtlist.interface';
import { Edit, FileCheck, MoreHorizontal, SquarePen } from 'lucide-react';
import Tooltip from '../ui/c-tooltip';
import dayjs from 'dayjs';
import EditFlight from '@/app/[locale]/(protected)/flight/edit-project';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { useMaintenanceStatus } from '@/lib/api/hooks/useMaintenanceStatus';
import { getlineMaintenancesThfByFlightId } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId';
import { updateFlight } from '@/lib/api/flight/updateFlight';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Type guard to check if item is a StaffItem object (not just a number ID)
const isStaffItem = (item: number | StaffItem): item is StaffItem => {
    return typeof item === 'object' && item !== null && 'id' in item && 'displayName' in item;
};

// Filter function: extracted for reusability
const filterFlightsByAlarm = (flights: FlightItem[], currentTime: Date): FlightItem[] => {
    const now = dayjs(currentTime);
    const today = now.format('YYYY-MM-DD');

    return flights.filter((flight) => {
        // Check if arrivalDate is today
        const arrivalDate = flight.arrivalDate || '';
        const arrivalDateFormatted = dayjs(arrivalDate).format('YYYY-MM-DD');
        const isArrivalToday = arrivalDate === today || arrivalDateFormatted === today;

        // If arrivalDate is NOT today, show the flight normally
        if (!isArrivalToday) return true;

        // If arrivalDate IS today, check departureDate + departureStdTime >= current datetime
        const departureDate = flight.departureDate || '';
        const departureStdTime = flight.departureStdTime || '';

        // If no departure info, show the flight
        if (!departureDate || !departureStdTime) return true;

        // Combine departureDate + departureStdTime and compare with current datetime
        const departureDatetime = dayjs(`${departureDate} ${departureStdTime}`);

        // Show flight if departureDatetime >= now
        return departureDatetime.isAfter(now) || departureDatetime.isSame(now);
    });
};

interface FlightTableProps {
    flights: FlightItem[];
    isLoading?: boolean;
    isFullscreen?: boolean;
    isAlarm?: boolean;
}

export function FlightTable({ flights, isLoading, isFullscreen, isAlarm }: FlightTableProps) {
    const [openEditFlight, setOpenEditFlight] = useState<boolean>(false);
    const [editFlightId, setEditFlightId] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    // Check (Maintenance Status) modal state
    const [checkModalOpen, setCheckModalOpen] = useState(false);
    const [checkModalFlight, setCheckModalFlight] = useState<FlightItem | null>(null);
    const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
    const [isFetchingFlightInfo, setIsFetchingFlightInfo] = useState(false);

    // Hooks for maintenance status options and flight update
    const { options: maintenanceStatusOptions } = useMaintenanceStatus();
    const queryClient = useQueryClient();
    const { mutate: updateFlightMutation, isPending: isUpdatingStatus } = useMutation({
        mutationFn: (data: Parameters<typeof updateFlight>[0]) => updateFlight(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flightList'] });
            queryClient.invalidateQueries({ queryKey: ['flights'] });
            toast.success('Maintenance Status updated successfully');
            setCheckModalOpen(false);
            setCheckModalFlight(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update');
        },
    });

    const handleCheckCellClick = (flight: FlightItem) => {
        setCheckModalFlight(flight);
        setSelectedStatusId(flight.maintenanceStatusObj?.id ?? null);
        setCheckModalOpen(true);
    };

    const handleCheckModalSave = async () => {
        if (!checkModalFlight || !checkModalFlight.flightInfosId || !selectedStatusId) return;

        try {
            setIsFetchingFlightInfo(true);
            // 1. Fetch full flight info from API
            const res = await getlineMaintenancesThfByFlightId({ flightInfosId: checkModalFlight.flightInfosId });
            const flightInfo = res.responseData?.flight;

            if (!flightInfo) {
                toast.error('Failed to fetch flight info');
                return;
            }

            // 2. Build update body from fetched flight info, only changing maintenanceStatusId
            const updateBody = {
                id: flightInfo.flightInfosId!,
                airlinesCode: flightInfo.airlineObj?.code || '',
                stationsCode: flightInfo.stationObj?.code || '',
                acReg: flightInfo.acReg || '',
                acTypeCode: flightInfo.acTypeObj?.code || '',
                arrivalFlightNo: flightInfo.arrivalFlightNo || '',
                arrivalDate: flightInfo.arrivalDate || '',
                arrivalStaTime: flightInfo.arrivalStatime || '',
                arrivalAtaTime: flightInfo.arrivalAtaTime || '00:00',
                departureFlightNo: flightInfo.departureFlightNo || '',
                departureDate: flightInfo.departureDate || '',
                departureStdTime: flightInfo.departureStdTime || '00:00',
                departureAtdTime: flightInfo.departureAtdtime || '00:00',
                bayNo: flightInfo.bayNo || '',
                thfNo: flightInfo.thfNumber || '',
                statusCode: flightInfo.statusObj?.code || 'Normal',
                note: flightInfo.note || '',
                routeFrom: flightInfo.routeForm || '',
                routeTo: flightInfo.routeTo || '',
                userName: flightInfo.createdBy || '',
                csIdList: flightInfo.csList?.map((cs) => cs.id) || [],
                mechIdList: flightInfo.mechList?.map((mech) => mech.id) || [],
                maintenanceStatusId: selectedStatusId,
            };

            // 3. Call update API
            updateFlightMutation(updateBody);
        } catch (error) {
            toast.error('Failed to fetch flight info');
            console.error('[FlightTable] handleCheckModalSave error:', error);
        } finally {
            setIsFetchingFlightInfo(false);
        }
    };

    const handleCheckModalClose = () => {
        setCheckModalOpen(false);
        setSelectedStatusId(null);
    };

    const onEditFlightClose = () => {
        setOpenEditFlight(false);
        setEditFlightId(null);
    }

    // Update current time every 5 minutes (300000ms) for alarm filtering
    useEffect(() => {
        if (!isAlarm) return;

        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
            console.log('[FlightTable] Alarm filter refreshed at:', new Date().toLocaleTimeString());
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(intervalId);
    }, [isAlarm]);

    // Filter flights when isAlarm is true
    // If arrivalDate is NOT today → show flight normally
    // If arrivalDate IS today → check if departureDate + departureStdTime >= current datetime
    const filteredFlights = useMemo(() => {
        if (!isAlarm) return flights;
        return filterFlightsByAlarm(flights, currentTime);
    }, [flights, isAlarm, currentTime]);

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-3 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                    <span>Loading flights...</span>
                </div>
            </div>
        );
    }

    if (filteredFlights.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center rounded-lg bg-slate-500/50 text-slate-100">
                <p>{isAlarm ? 'No upcoming flights for today' : 'No flights found'}</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-slate-300 dark:border-slate-800 dark:bg-slate-800 shadow-lg ">
            <EditFlight open={openEditFlight} setOpen={setOpenEditFlight} flightInfosId={editFlightId} onClose={onEditFlightClose} />
            <div className="overflow-x-auto">
                <table className="w-full bg-slate-50 dark:bg-slate-800">
                    <thead>
                        <tr className="bg-slate-300 text-left dark:bg-slate-700 dark:text-slate-300  text-slate-500 ">
                            <th className="p-2 text-sm font-semibold w-[150px]">Airlines</th>
                            <th className="p-2 text-sm font-semibold w-[150px]">Flight No</th>
                            <th className="p-2 text-sm font-semibold w-[100px]">Route</th>
                            <th className="p-2 text-sm font-semibold w-[80px]">A/C Type</th>
                            <th className="p-2 text-sm font-semibold w-[80px]">A/C REG</th>
                            {/* <th className="p-2 text-sm font-semibold text-slate-300">REG</th> */}
                            <th className="p-2 text-sm font-semibold w-[60px]">STA</th>
                            <th className="p-2 text-sm font-semibold w-[60px]">ETA</th>
                            <th className="p-2 text-sm font-semibold w-[60px]">STD</th>
                            <th className="p-2 text-sm font-semibold w-[90px]">BAY</th>

                            <th className="p-2 text-sm font-semibold w-[100px]">CS</th>
                            <th className="p-2 text-sm font-semibold w-[100px]">MECH</th>
                            <th className="p-2 text-sm font-semibold w-[100px]">Status</th>
                            <th className="p-2 text-sm font-semibold w-[100px]">Check</th>
                            <th className="p-2 text-sm font-semibold w-[100px]">Remarks</th>
                            {!isFullscreen && (
                                <th className="p-2 text-sm text-right font-semibold w-[50px]">action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 dark:divide-slate-900">
                        {filteredFlights.map((flight, index) => (
                            <tr
                                key={flight.flightInfosId ?? index}
                                className="transition-colors hover:bg-slate-600/50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-300"
                            >
                                {/* Airlines */}
                                <td className="p-1 overflow-hidden text-sm w-[150px] text-ellipsis leading-none">
                                    <Tooltip
                                        content={flight.airlineObj?.name || '-'}
                                    >
                                        <div className={`w-full min-h-full  inline-flex items-center rounded 
                                         px-1.5 py-2 text-xs font-semibold 
                                         ${flight.airlineObj?.colorBackground ? `bg-${flight.airlineObj?.colorBackground} text-${flight.airlineObj?.colorForeground}` : 'bg-slate-900 text-slate-300'}
                                         `}
                                            style={{
                                                backgroundColor: flight.airlineObj?.colorBackground,
                                                color: flight.airlineObj?.colorForeground
                                            }}
                                        >
                                            {flight.airlineObj?.name || "-"}
                                            {/* {flight.airlineObj?.name?.length > 10 ? `${flight.airlineObj?.name?.slice(0, 10)}...` : flight.airlineObj?.name || '-'} */}
                                        </div>
                                    </Tooltip>
                                </td>
                                {/* Flight No - Show both arrival and departure */}
                                <td className="p-1 text-sm w-[150px]  leading-none">
                                    <div className="space-y-1">
                                        {flight.arrivalFlightNo && (
                                            <div className="flex items-center gap-2">
                                                {/* <span className="inline-flex items-center rounded bg-sky-900 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
                                                    ARR
                                                </span> */}
                                                <span className="text-sm font-medium">{flight.arrivalFlightNo || "N/A"}</span>
                                            </div>
                                        )}
                                        {/* {flight.departureFlightNo && (
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center rounded bg-emerald-900 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                                                    DEP
                                                </span>
                                                <span className="text-sm font-medium">{flight.departureFlightNo}</span>
                                            </div>
                                        )} */}
                                    </div>
                                </td>

                                {/* Root */}
                                <td className="p-1 text-sm w-[100px]  leading-none">
                                    {`${flight.routeForm || "-"} / ${flight.routeTo || "-"}`}
                                </td>
                                {/* A/C Type */}
                                <td className="p-1 text-sm w-[80px]  leading-none">
                                    {flight.acTypeObj?.code || flight.acType || '-'}
                                </td>

                                {/* REG */}
                                <td className="p-1 text-sm w-[80px]  leading-none">
                                    {flight.acReg || '-'}
                                </td>

                                {/* STA */}
                                <td className="p-1 text-sm w-[60px]  leading-none">
                                    {flight.arrivalDate && flight.arrivalStatime && dayjs(`${flight.arrivalDate} ${flight.arrivalStatime}`).isValid() ? (
                                        <Tooltip content={dayjs(`${flight.arrivalDate} ${flight.arrivalStatime}`).format('DD-MMM-YYYY, HH:mm')}>
                                            <div>{dayjs(`${flight.arrivalDate} ${flight.arrivalStatime}`).format('HH:mm')}</div>
                                        </Tooltip>
                                    ) : '-'}
                                </td>
                                {/* ETA */}
                                <td className="p-1 text-sm w-[60px]  leading-none">
                                    {flight.etaDate && flight.etaTime && dayjs(`${flight.etaDate} ${flight.etaTime}`).isValid() ? (
                                        <Tooltip content={dayjs(`${flight.etaDate} ${flight.etaTime}`).format('DD-MMM-YYYY, HH:mm')}>
                                            <div>{dayjs(`${flight.etaDate} ${flight.etaTime}`).format('HH:mm')}</div>
                                        </Tooltip>
                                    ) : '-'}
                                </td>

                                {/* STD */}
                                <td className="p-1 text-sm w-[60px]  leading-none">
                                    {flight.departureDate && flight.departureStdTime && dayjs(`${flight.departureDate} ${flight.departureStdTime}`).isValid() ? (
                                        <Tooltip content={dayjs(`${flight.departureDate} ${flight.departureStdTime}`).format('DD-MMM-YYYY, HH:mm')}>
                                            <div>{dayjs(`${flight.departureDate} ${flight.departureStdTime}`).format('HH:mm')}</div>
                                        </Tooltip>
                                    ) : '-'}
                                </td>

                                {/* BAY */}
                                <td className="p-1 text-sm w-[90px]  leading-none">
                                    {flight.bayNo || '-'}
                                </td>
                                {/* CS */}
                                <td className="p-1 text-sm w-[100px]  leading-none">
                                    <div className="flex flex-wrap gap-1 items-start justify-start h-full flex-1 flex-col">
                                        {flight.csList?.length ? (
                                            flight.csList?.map((cs, csIndex) => {
                                                // Handle case where cs is StaffItem object
                                                if (isStaffItem(cs)) {
                                                    return (
                                                        <Tooltip key={cs.id} content={cs.name || ''}>
                                                            <span className="bg-cyan-500 text-white dark:text-slate-900 px-2 py-1 rounded">
                                                                {cs.displayName}
                                                            </span>
                                                        </Tooltip>
                                                    );
                                                }
                                                // Handle case where cs is just a number (ID)
                                                return (
                                                    <span key={`cs-${csIndex}-${cs}`} className="bg-cyan-500 text-white dark:text-slate-900 px-2 py-1 rounded">
                                                        ID: {cs}
                                                    </span>
                                                );
                                            })
                                        ) : '-'}
                                    </div>
                                </td>
                                {/* MECH */}
                                <td className="p-1 text-sm w-[100px]  leading-none">
                                    <div className="flex flex-wrap gap-1 items-start h-full flex-1 grow-0">
                                        {flight.mechList?.length ? (
                                            flight.mechList?.map((mech, mechIndex) => {
                                                // Handle case where mech is StaffItem object
                                                if (isStaffItem(mech)) {
                                                    return (
                                                        <Tooltip key={mech.id} content={mech.name || ''}>
                                                            <span className="bg-amber-600 text-white dark:text-slate-900 px-2 py-1 rounded">
                                                                {mech.displayName}
                                                            </span>
                                                        </Tooltip>
                                                    );
                                                }
                                                // Handle case where mech is just a number (ID)
                                                return (
                                                    <span key={`mech-${mechIndex}-${mech}`} className="bg-amber-600 text-white dark:text-slate-900 px-2 py-1 rounded">
                                                        ID: {mech}
                                                    </span>
                                                );
                                            })
                                        ) : '-'}
                                    </div>
                                </td>
                                {/* Status */}
                                <td className="p-1 text-sm w-[100px]  leading-none">
                                    <span className={`
                                        inline-flex items-center rounded px-2 py-1 text-xs font-medium
                                        ${flight.statusObj?.code === 'Normal' ? 'dark:bg-green-900/50 bg-green-700 dark:text-green-400 text-green-100' : ''}
                                        ${flight.statusObj?.code === 'DELAYED' ? 'dark:bg-amber-900/50 bg-amber-700 dark:text-amber-400 text-amber-100' : ''}
                                        ${flight.statusObj?.code === 'CANCELLED' ? 'dark:bg-red-900/50 bg-red-700 dark:text-red-400 text-red-100' : ''}
                                        ${!['Normal', 'DELAYED', 'CANCELLED'].includes(flight.statusObj?.code || '') ? 'dark:bg-slate-700/50 bg-slate-700 dark:text-slate-300 text-slate-100' : ''}
                                    `}>
                                        {flight.statusObj?.code || flight.statusObj?.name || '-'}
                                    </span>
                                </td>
                                {/* Check (Maintenance Status) - Clickable to open edit modal */}
                                <td className="p-1 text-sm w-[100px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors  leading-none"
                                    onClick={() => handleCheckCellClick(flight)}
                                    title="Click to edit Maintenance Status"
                                >
                                    <span className={`
                                        inline-flex items-center rounded px-2 py-1 text-xs font-medium
                                        ${flight.maintenanceStatusObj?.code === 'Scheduled' ? 'dark:bg-blue-900/50 bg-blue-700 dark:text-blue-400 text-blue-100' : ''}
                                        ${flight.maintenanceStatusObj?.code === 'In-Proress' ? 'dark:bg-amber-900/50 bg-amber-700 dark:text-amber-400 text-amber-100' : ''}
                                        ${flight.maintenanceStatusObj?.code === 'Cancelled' ? 'dark:bg-red-900/50 bg-red-700 dark:text-red-400 text-red-100' : ''}
                                        ${flight.maintenanceStatusObj?.code === 'Completed' ? 'dark:bg-green-900/50 bg-green-700 dark:text-green-400 text-green-100' : ''}
                                        ${flight.maintenanceStatusObj?.code === 'Delayed' ? 'dark:bg-orange-900/50 bg-orange-700 dark:text-orange-400 text-orange-100' : ''}
                                        ${!flight.maintenanceStatusObj || !['Scheduled', 'In-Proress', 'Cancelled', 'Completed', 'Delayed'].includes(flight.maintenanceStatusObj?.code || '') ? 'dark:bg-slate-700/50 bg-slate-700 dark:text-slate-300 text-slate-100' : ''}
                                    `}>
                                        {flight.maintenanceStatusObj?.code || flight.maintenanceStatusObj?.name || '-'}
                                    </span>
                                </td>
                                {/* Remarks */}
                                <td className="p-1 text-sm w-[100px] text-slate-900 dark:text-slate-300  leading-none">
                                    {flight.note ? <Tooltip content={flight.note || ''}>
                                        <div className="">
                                            {flight.note?.length > 10 ? `${flight.note?.slice(0, 10)}...` : flight.note || '-'}
                                        </div>
                                    </Tooltip> : '-'}
                                </td>
                                {!isFullscreen && (
                                    <td className="p-1 text-sm w-[50px] text-slate-900 dark:text-slate-300  leading-none">
                                        <div className="flex items-center justify-end gap-2 w-full"    >
                                            {flight.state !== "plan" && (
                                                <Tooltip content={flight.state === "save" ? `Done (THF:${flight.thfNumber})` : `Draft (THF:${flight.thfNumber})` || ''}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        color={flight.state === "save" ? "success" : "secondary"}
                                                        className="p-2 hover:scale-110 transition-all bg-none hover:bg-transparent border-none  cursor-default">
                                                        <FileCheck className="h-6 w-6" />
                                                    </Button>
                                                </Tooltip>
                                            )}
                                            <div className="flex items-center justify-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            disabled={flight.statusObj?.code === "Cancel"}
                                                            onClick={() => {
                                                                setEditFlightId(flight.flightInfosId);
                                                                setOpenEditFlight(true);
                                                            }}
                                                        >
                                                            <SquarePen className="h-4 w-4 mr-2" />
                                                            Edit Flight
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        {/* <Tooltip content={"Edit Flight"}>
                                            <button
                                                className="bg-slate-300 hover:bg-slate-500 text-slate-700 hover:text-slate-300 dark:text-slate-300 py-2 px-2 rounded-md cursor-pointer hover:scale-110 transition-all "
                                                onClick={() => {
                                                    setEditFlightId(flight.flightInfosId);
                                                    setOpenEditFlight(true);
                                                }} >
                                                <Edit className='w-4 h-4' />
                                            </button>
                                        </Tooltip> */}

                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Maintenance Status Edit Modal */}
            <Dialog open={checkModalOpen} onOpenChange={(open) => { if (!open) handleCheckModalClose(); }}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Edit Maintenance Status</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        {checkModalFlight && (
                            <div className="text-sm text-muted-foreground">
                                Flight: <span className="font-medium text-foreground">{checkModalFlight.arrivalFlightNo || '-'}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Maintenance Status</label>
                            <Select
                                value={selectedStatusId != null ? String(selectedStatusId) : ''}
                                onValueChange={(val) => setSelectedStatusId(Number(val))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {maintenanceStatusOptions.map((option) => (
                                        <SelectItem key={option.id} value={String(option.id)}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCheckModalClose}
                            disabled={isUpdatingStatus || isFetchingFlightInfo}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleCheckModalSave}
                            disabled={isUpdatingStatus || isFetchingFlightInfo || !selectedStatusId}
                        >
                            {isFetchingFlightInfo ? 'Loading...' : isUpdatingStatus ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
