'use client';

import { FlightItem, StaffItem } from '@/lib/api/flight/filghtlist.interface';
import { Edit, FileCheck, MoreHorizontal, SquarePen, Search, X } from 'lucide-react';
import Tooltip from '../ui/c-tooltip';
import dayjs from 'dayjs';
import '@/lib/dayjs'; // ensure UTC + timezone plugins loaded
import { splitUtcDateTimeToLocal, utcToLocalDayjs, combineToUtcDatetime, splitUtcDateTime } from '@/lib/utils/flightDatetime';
import { formatUtcToLocalDisplay } from '@/lib/utils/flightDatetime';
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
import { useStaffListForImport, StaffOption } from '@/lib/api/hooks/useStaffListForImport';
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
        // Check if arrival date (local) is today
        const arrival = splitUtcDateTimeToLocal(flight.arrivalStaDate);
        const isArrivalToday = arrival.date === today;

        // If arrivalDate is NOT today, show the flight normally
        if (!isArrivalToday) return true;

        // If arrivalDate IS today, check departure datetime >= current datetime
        const departureDayjs = utcToLocalDayjs(flight.departureStdDate);

        // If no departure info, show the flight
        if (!departureDayjs) return true;

        // Show flight if departureDatetime >= now
        return departureDayjs.isAfter(now) || departureDayjs.isSame(now);
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

    // Time edit modal state
    const [timeEditModalOpen, setTimeEditModalOpen] = useState(false);
    const [timeEditFlight, setTimeEditFlight] = useState<FlightItem | null>(null);
    const [timeEditField, setTimeEditField] = useState<'sta' | 'std' | 'eta'>('sta');
    const [timeEditDate, setTimeEditDate] = useState('');
    const [timeEditTime, setTimeEditTime] = useState('');
    const [isFetchingTimeEdit, setIsFetchingTimeEdit] = useState(false);

    // Staff edit modal state
    const [staffModalOpen, setStaffModalOpen] = useState(false);
    const [staffModalFlight, setStaffModalFlight] = useState<FlightItem | null>(null);
    const [staffModalType, setStaffModalType] = useState<'cs' | 'mech'>('cs');
    const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
    const [staffSearch, setStaffSearch] = useState('');
    const [isFetchingStaffEdit, setIsFetchingStaffEdit] = useState(false);

    // Remarks edit modal state
    const [remarksModalOpen, setRemarksModalOpen] = useState(false);
    const [remarksModalFlight, setRemarksModalFlight] = useState<FlightItem | null>(null);
    const [remarksText, setRemarksText] = useState('');
    const [isFetchingRemarksEdit, setIsFetchingRemarksEdit] = useState(false);

    // Hooks for maintenance status options, staff list, and flight update
    const { options: maintenanceStatusOptions } = useMaintenanceStatus();
    const { allStaff, csStaffOptions, mechStaffOptions } = useStaffListForImport();
    const queryClient = useQueryClient();
    const { mutate: updateFlightMutation, isPending: isUpdatingStatus } = useMutation({
        mutationFn: (data: Parameters<typeof updateFlight>[0]) => updateFlight(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flightList'] });
            queryClient.invalidateQueries({ queryKey: ['flights'] });
            toast.success('Updated successfully');
            setCheckModalOpen(false);
            setCheckModalFlight(null);
            setStaffModalOpen(false);
            setStaffModalFlight(null);
            setRemarksModalOpen(false);
            setRemarksModalFlight(null);
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
                arrivalStaDate: flightInfo.arrivalStaDate || '',
                arrivalAtaDate: flightInfo.arrivalAtaDate || '',
                departureFlightNo: flightInfo.departureFlightNo || '',
                departureStdDate: flightInfo.departureStdDate || '',
                departureAtdDate: flightInfo.departureAtdDate || '',
                bayNo: flightInfo.bayNo || '',
                statusCode: flightInfo.statusObj?.code || 'Normal',
                note: flightInfo.note || '',
                routeFrom: flightInfo.routeFrom || '',
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

    // Time Edit Modal handlers
    const handleTimeEditCellClick = (flight: FlightItem, field: 'sta' | 'std' | 'eta') => {
        setTimeEditFlight(flight);
        setTimeEditField(field);

        // Parse current UTC value to local date + time for the form
        let utcValue: string | null | undefined = null;
        if (field === 'sta') utcValue = flight.arrivalStaDate;
        else if (field === 'std') utcValue = flight.departureStdDate;
        else if (field === 'eta') {
            // ETA uses separate etaDate/etaTime fields (already local?)
            utcValue = flight.etaDate && flight.etaTime ? `${flight.etaDate} ${flight.etaTime}` : null;
        }

        if (utcValue) {
            const local = utcToLocalDayjs(utcValue);
            if (local) {
                setTimeEditDate(local.format('YYYY-MM-DD'));
                setTimeEditTime(local.format('HH:mm'));
            } else {
                setTimeEditDate('');
                setTimeEditTime('');
            }
        } else {
            setTimeEditDate('');
            setTimeEditTime('');
        }

        setTimeEditModalOpen(true);
    };

    const handleTimeEditModalSave = async () => {
        if (!timeEditFlight || !timeEditFlight.flightInfosId || !timeEditDate || !timeEditTime) return;

        try {
            setIsFetchingTimeEdit(true);
            // Fetch full flight info
            const res = await getlineMaintenancesThfByFlightId({ flightInfosId: timeEditFlight.flightInfosId });
            const flightInfo = res.responseData?.flight;

            if (!flightInfo) {
                toast.error('Failed to fetch flight info');
                return;
            }

            // Convert local input to UTC for API
            const localDayjs = dayjs(`${timeEditDate} ${timeEditTime}`);
            const utcString = localDayjs.utc().format('YYYY-MM-DD HH:mm');

            // Build update body
            const updateBody = {
                id: flightInfo.flightInfosId!,
                airlinesCode: flightInfo.airlineObj?.code || '',
                stationsCode: flightInfo.stationObj?.code || '',
                acReg: flightInfo.acReg || '',
                acTypeCode: flightInfo.acTypeObj?.code || '',
                arrivalFlightNo: flightInfo.arrivalFlightNo || '',
                arrivalStaDate: timeEditField === 'sta' ? utcString : (flightInfo.arrivalStaDate || ''),
                arrivalAtaDate: flightInfo.arrivalAtaDate || '',
                departureFlightNo: flightInfo.departureFlightNo || '',
                departureStdDate: timeEditField === 'std' ? utcString : (flightInfo.departureStdDate || ''),
                departureAtdDate: flightInfo.departureAtdDate || '',
                bayNo: flightInfo.bayNo || '',
                statusCode: flightInfo.statusObj?.code || 'Normal',
                note: flightInfo.note || '',
                routeFrom: flightInfo.routeFrom || '',
                routeTo: flightInfo.routeTo || '',
                userName: flightInfo.createdBy || '',
                csIdList: flightInfo.csList?.map((cs) => cs.id) || [],
                mechIdList: flightInfo.mechList?.map((mech) => mech.id) || [],
                maintenanceStatusId: timeEditFlight.maintenanceStatusObj?.id,
            };

            // If editing ETA, we may need to handle it differently - for now pass as etaDate/etaTime
            // But since updateFlight doesn't have etaDate/etaTime, we use arrivalStaDate pattern
            // TODO: Confirm ETA field mapping with backend

            updateFlightMutation(updateBody, {
                onSuccess: () => {
                    setTimeEditModalOpen(false);
                    setTimeEditFlight(null);
                },
            });
        } catch (error) {
            toast.error('Failed to update time');
            console.error('[FlightTable] handleTimeEditModalSave error:', error);
        } finally {
            setIsFetchingTimeEdit(false);
        }
    };

    const handleTimeEditModalClose = () => {
        setTimeEditModalOpen(false);
        setTimeEditFlight(null);
    };

    const timeEditFieldLabel = timeEditField === 'sta' ? 'STA' : timeEditField === 'std' ? 'STD' : 'ETA';

    // Staff Edit Modal handlers
    const handleStaffCellClick = (flight: FlightItem, type: 'cs' | 'mech') => {
        setStaffModalFlight(flight);
        setStaffModalType(type);
        setStaffSearch('');

        // Pre-select currently assigned staff
        const currentList = type === 'cs' ? flight.csList : flight.mechList;
        const ids = currentList?.map((s) => isStaffItem(s) ? s.id : (s as number)) || [];
        setSelectedStaffIds(ids);

        setStaffModalOpen(true);
    };

    const handleStaffToggle = (staffId: number) => {
        setSelectedStaffIds((prev) =>
            prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
        );
    };

    const handleStaffModalSave = async () => {
        if (!staffModalFlight || !staffModalFlight.flightInfosId) return;

        try {
            setIsFetchingStaffEdit(true);
            const res = await getlineMaintenancesThfByFlightId({ flightInfosId: staffModalFlight.flightInfosId });
            const flightInfo = res.responseData?.flight;

            if (!flightInfo) {
                toast.error('Failed to fetch flight info');
                return;
            }

            const updateBody = {
                id: flightInfo.flightInfosId!,
                airlinesCode: flightInfo.airlineObj?.code || '',
                stationsCode: flightInfo.stationObj?.code || '',
                acReg: flightInfo.acReg || '',
                acTypeCode: flightInfo.acTypeObj?.code || '',
                arrivalFlightNo: flightInfo.arrivalFlightNo || '',
                arrivalStaDate: flightInfo.arrivalStaDate || '',
                arrivalAtaDate: flightInfo.arrivalAtaDate || '',
                departureFlightNo: flightInfo.departureFlightNo || '',
                departureStdDate: flightInfo.departureStdDate || '',
                departureAtdDate: flightInfo.departureAtdDate || '',
                bayNo: flightInfo.bayNo || '',
                statusCode: flightInfo.statusObj?.code || 'Normal',
                note: flightInfo.note || '',
                routeFrom: flightInfo.routeFrom || '',
                routeTo: flightInfo.routeTo || '',
                userName: flightInfo.createdBy || '',
                csIdList: staffModalType === 'cs' ? selectedStaffIds : (flightInfo.csList?.map((cs) => cs.id) || []),
                mechIdList: staffModalType === 'mech' ? selectedStaffIds : (flightInfo.mechList?.map((mech) => mech.id) || []),
                maintenanceStatusId: staffModalFlight!.maintenanceStatusObj?.id,
            };

            updateFlightMutation(updateBody);
        } catch (error) {
            toast.error('Failed to update staff');
            console.error('[FlightTable] handleStaffModalSave error:', error);
        } finally {
            setIsFetchingStaffEdit(false);
        }
    };

    const handleStaffModalClose = () => {
        setStaffModalOpen(false);
        setStaffModalFlight(null);
        setStaffSearch('');
    };

    const staffOptionsForModal = staffModalType === 'cs' ? csStaffOptions : mechStaffOptions;
    const filteredStaffOptions = staffOptionsForModal.filter((staff) =>
        staff.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        staff.code.toLowerCase().includes(staffSearch.toLowerCase())
    );

    // Remarks Edit Modal handlers
    const handleRemarksCellClick = (flight: FlightItem) => {
        setRemarksModalFlight(flight);
        setRemarksText(flight.note || '');
        setRemarksModalOpen(true);
    };

    const handleRemarksModalSave = async () => {
        if (!remarksModalFlight || !remarksModalFlight.flightInfosId) return;

        try {
            setIsFetchingRemarksEdit(true);
            const res = await getlineMaintenancesThfByFlightId({ flightInfosId: remarksModalFlight.flightInfosId });
            const flightInfo = res.responseData?.flight;

            if (!flightInfo) {
                toast.error('Failed to fetch flight info');
                return;
            }

            const updateBody = {
                id: flightInfo.flightInfosId!,
                airlinesCode: flightInfo.airlineObj?.code || '',
                stationsCode: flightInfo.stationObj?.code || '',
                acReg: flightInfo.acReg || '',
                acTypeCode: flightInfo.acTypeObj?.code || '',
                arrivalFlightNo: flightInfo.arrivalFlightNo || '',
                arrivalStaDate: flightInfo.arrivalStaDate || '',
                arrivalAtaDate: flightInfo.arrivalAtaDate || '',
                departureFlightNo: flightInfo.departureFlightNo || '',
                departureStdDate: flightInfo.departureStdDate || '',
                departureAtdDate: flightInfo.departureAtdDate || '',
                bayNo: flightInfo.bayNo || '',
                statusCode: flightInfo.statusObj?.code || 'Normal',
                note: remarksText,
                routeFrom: flightInfo.routeFrom || '',
                routeTo: flightInfo.routeTo || '',
                userName: flightInfo.createdBy || '',
                csIdList: flightInfo.csList?.map((cs) => cs.id) || [],
                mechIdList: flightInfo.mechList?.map((mech) => mech.id) || [],
                maintenanceStatusId: remarksModalFlight.maintenanceStatusObj?.id,
            };

            console.log('[FlightTable] Remarks Save - maintenanceStatusObj (from table):', JSON.stringify(remarksModalFlight.maintenanceStatusObj));
            console.log('[FlightTable] Remarks Save - maintenanceStatusObj (from API - null):', JSON.stringify(flightInfo.maintenanceStatusObj));
            console.log('[FlightTable] Remarks Save - updateBody:', JSON.stringify(updateBody));

            updateFlightMutation(updateBody);
        } catch (error) {
            toast.error('Failed to update remarks');
            console.error('[FlightTable] handleRemarksModalSave error:', error);
        } finally {
            setIsFetchingRemarksEdit(false);
        }
    };

    const handleRemarksModalClose = () => {
        setRemarksModalOpen(false);
        setRemarksModalFlight(null);
        setRemarksText('');
    };

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
                                <td className="p-0 overflow-hidden text-sm w-[150px] text-ellipsis leading-none h-[1px]">
                                    <Tooltip
                                        content={flight.airlineObj?.name || '-'}
                                    >
                                        <div className={`w-full h-full flex items-center 
                                         px-2 py-2 text-xs font-semibold 
                                         ${flight.airlineObj?.colorBackground ? '' : 'bg-slate-900 text-slate-300'}
                                         `}
                                            style={{
                                                backgroundColor: flight.airlineObj?.colorBackground,
                                                color: flight.airlineObj?.colorForeground
                                            }}
                                        >
                                            <span className="truncate">
                                                {flight.airlineObj?.name || "-"}
                                            </span>
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

                                {/* STA (Local) - Editable on hover */}
                                <td
                                    className="p-1 text-sm w-[60px] leading-none cursor-pointer group/sta"
                                    onClick={() => handleTimeEditCellClick(flight, 'sta')}
                                >
                                    {(() => {
                                        const local = utcToLocalDayjs(flight.arrivalStaDate);
                                        return (
                                            <Tooltip content={local ? `${local.format('DD-MMM-YYYY, HH:mm')} — Click to edit` : 'Click to set STA'}>
                                                <div className="flex items-center gap-1">
                                                    <span>{local ? local.format('HH:mm') : '-'}</span>
                                                    <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover/sta:opacity-100 transition-opacity" />
                                                </div>
                                            </Tooltip>
                                        );
                                    })()}
                                </td>
                                {/* ETA - Editable on hover */}
                                <td
                                    className="p-1 text-sm w-[60px] leading-none cursor-pointer group/eta"
                                    onClick={() => handleTimeEditCellClick(flight, 'eta')}
                                >
                                    {(() => {
                                        const hasEta = flight.etaDate && flight.etaTime && dayjs(`${flight.etaDate} ${flight.etaTime}`).isValid();
                                        return (
                                            <Tooltip content={hasEta ? `${dayjs(`${flight.etaDate} ${flight.etaTime}`).format('DD-MMM-YYYY, HH:mm')} — Click to edit` : 'Click to set ETA'}>
                                                <div className="flex items-center gap-1">
                                                    <span>{hasEta ? dayjs(`${flight.etaDate} ${flight.etaTime}`).format('HH:mm') : '-'}</span>
                                                    <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover/eta:opacity-100 transition-opacity" />
                                                </div>
                                            </Tooltip>
                                        );
                                    })()}
                                </td>

                                {/* STD (Local) - Editable on hover */}
                                <td
                                    className="p-1 text-sm w-[60px] leading-none cursor-pointer group/std"
                                    onClick={() => handleTimeEditCellClick(flight, 'std')}
                                >
                                    {(() => {
                                        const local = utcToLocalDayjs(flight.departureStdDate);
                                        return (
                                            <Tooltip content={local ? `${local.format('DD-MMM-YYYY, HH:mm')} — Click to edit` : 'Click to set STD'}>
                                                <div className="flex items-center gap-1">
                                                    <span>{local ? local.format('HH:mm') : '-'}</span>
                                                    <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover/std:opacity-100 transition-opacity" />
                                                </div>
                                            </Tooltip>
                                        );
                                    })()}
                                </td>

                                {/* BAY */}
                                <td className="p-1 text-sm w-[90px]  leading-none">
                                    {flight.bayNo || '-'}
                                </td>
                                {/* CS - Editable on hover */}
                                <td
                                    className="p-1 text-sm w-[100px] leading-none cursor-pointer group/cs"
                                    onClick={() => handleStaffCellClick(flight, 'cs')}
                                >
                                    <Tooltip content="Click to edit CS">
                                        <div className="flex flex-wrap gap-1 items-start">
                                            {flight.csList?.length ? (
                                                <>
                                                    {flight.csList?.map((cs, csIndex) => {
                                                        if (isStaffItem(cs)) {
                                                            return (
                                                                <span key={cs.id} className="bg-cyan-500 text-white dark:text-slate-900 px-2 py-1 rounded text-xs">
                                                                    {cs.displayName}
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <span key={`cs-${csIndex}-${cs}`} className="bg-cyan-500 text-white dark:text-slate-900 px-2 py-1 rounded text-xs">
                                                                ID: {cs}
                                                            </span>
                                                        );
                                                    })}
                                                    <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover/cs:opacity-100 transition-opacity" />
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <span>-</span>
                                                    <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover/cs:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </div>
                                    </Tooltip>
                                </td>
                                {/* MECH - Editable on hover */}
                                <td
                                    className="p-1 text-sm w-[100px] leading-none cursor-pointer group/mech"
                                    onClick={() => handleStaffCellClick(flight, 'mech')}
                                >
                                    <Tooltip content="Click to edit MECH">
                                        <div className="flex flex-wrap gap-1 items-start">
                                            {flight.mechList?.length ? (
                                                <>
                                                    {flight.mechList?.map((mech, mechIndex) => {
                                                        if (isStaffItem(mech)) {
                                                            return (
                                                                <span key={mech.id} className="bg-amber-600 text-white dark:text-slate-900 px-2 py-1 rounded text-xs">
                                                                    {mech.displayName}
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <span key={`mech-${mechIndex}-${mech}`} className="bg-amber-600 text-white dark:text-slate-900 px-2 py-1 rounded text-xs">
                                                                ID: {mech}
                                                            </span>
                                                        );
                                                    })}
                                                    <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover/mech:opacity-100 transition-opacity" />
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <span>-</span>
                                                    <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover/mech:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </div>
                                    </Tooltip>
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
                                {/* Remarks - Editable on hover */}
                                <td
                                    className="p-1 text-sm w-[100px] text-slate-900 dark:text-slate-300 leading-none cursor-pointer group/remarks hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    onClick={() => handleRemarksCellClick(flight)}
                                >
                                    <Tooltip content={flight.note || 'Click to edit remarks'}>
                                        <div className="flex items-center gap-1 w-full h-full min-h-[24px]">
                                            <span className="truncate flex-1">
                                                {flight.note ? (flight.note.length > 10 ? `${flight.note.slice(0, 10)}...` : flight.note) : '-'}
                                            </span>
                                            <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover/remarks:opacity-100 transition-opacity flex-shrink-0" />
                                        </div>
                                    </Tooltip>
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

            {/* Time Edit Modal (STA/STD/ETA) */}
            <Dialog open={timeEditModalOpen} onOpenChange={(open) => { if (!open) handleTimeEditModalClose(); }}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Edit {timeEditFieldLabel} Time</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {timeEditFlight && (
                            <div className="text-sm text-muted-foreground">
                                Flight: <span className="font-medium text-foreground">{timeEditFlight.arrivalFlightNo || '-'} / {timeEditFlight.departureFlightNo || '-'}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date (Local)</label>
                            <input
                                type="date"
                                value={timeEditDate}
                                onChange={(e) => setTimeEditDate(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-background px-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Time (Local)</label>
                            <input
                                type="time"
                                value={timeEditTime}
                                onChange={(e) => setTimeEditTime(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-background px-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            />
                        </div>
                        {timeEditDate && timeEditTime && (
                            <div className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded-md p-2">
                                <div>Local: <span className="font-mono font-medium">{dayjs(`${timeEditDate} ${timeEditTime}`).format('DD-MMM-YYYY HH:mm')}</span></div>
                                <div>UTC: <span className="font-mono font-medium">{dayjs(`${timeEditDate} ${timeEditTime}`).utc().format('DD-MMM-YYYY HH:mm')}</span></div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleTimeEditModalClose}
                            disabled={isUpdatingStatus || isFetchingTimeEdit}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleTimeEditModalSave}
                            disabled={isUpdatingStatus || isFetchingTimeEdit || !timeEditDate || !timeEditTime}
                        >
                            {isFetchingTimeEdit ? 'Loading...' : isUpdatingStatus ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Staff Edit Modal (CS/MECH) */}
            <Dialog open={staffModalOpen} onOpenChange={(open) => { if (!open) handleStaffModalClose(); }}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Edit {staffModalType === 'cs' ? 'CS' : 'MECH'} Staff</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        {staffModalFlight && (
                            <div className="text-sm text-muted-foreground">
                                Flight: <span className="font-medium text-foreground">{staffModalFlight.arrivalFlightNo || '-'} / {staffModalFlight.departureFlightNo || '-'}</span>
                            </div>
                        )}

                        {/* Selected Staff Chips */}
                        {selectedStaffIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedStaffIds.map((id) => {
                                    const staff = staffOptionsForModal.find((s) => s.id === id);
                                    return (
                                        <span
                                            key={id}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${staffModalType === 'cs'
                                                ? 'bg-cyan-500 text-white'
                                                : 'bg-amber-600 text-white'
                                                }`}
                                        >
                                            {staff?.name || `ID: ${id}`}
                                            <button
                                                onClick={() => handleStaffToggle(id)}
                                                className="hover:bg-white/20 rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search staff..."
                                value={staffSearch}
                                onChange={(e) => setStaffSearch(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-background pl-9 pr-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            />
                        </div>

                        {/* Staff List */}
                        <div className="max-h-[300px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStaffOptions.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">No staff found</div>
                            ) : (
                                filteredStaffOptions.map((staff) => {
                                    const isSelected = selectedStaffIds.includes(staff.id);
                                    return (
                                        <label
                                            key={staff.id}
                                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${isSelected ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleStaffToggle(staff.id)}
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{staff.name}</div>
                                                <div className="text-xs text-muted-foreground">{staff.code} · {staff.positionCode}</div>
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                            {selectedStaffIds.length} staff selected
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleStaffModalClose}
                            disabled={isUpdatingStatus || isFetchingStaffEdit}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleStaffModalSave}
                            disabled={isUpdatingStatus || isFetchingStaffEdit}
                        >
                            {isFetchingStaffEdit ? 'Loading...' : isUpdatingStatus ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remarks Edit Modal */}
            <Dialog open={remarksModalOpen} onOpenChange={(open) => { if (!open) handleRemarksModalClose(); }}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Edit Remarks</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {remarksModalFlight && (
                            <div className="text-sm text-muted-foreground">
                                Flight: <span className="font-medium text-foreground">{remarksModalFlight.arrivalFlightNo || '-'} / {remarksModalFlight.departureFlightNo || '-'}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Remarks</label>
                            <textarea
                                value={remarksText}
                                onChange={(e) => setRemarksText(e.target.value)}
                                className="w-full min-h-[100px] rounded-lg border border-slate-300 dark:border-slate-600 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
                                placeholder="Enter remarks..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleRemarksModalClose}
                            disabled={isUpdatingStatus || isFetchingRemarksEdit}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleRemarksModalSave}
                            disabled={isUpdatingStatus || isFetchingRemarksEdit}
                        >
                            {isFetchingRemarksEdit ? 'Loading...' : isUpdatingStatus ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
