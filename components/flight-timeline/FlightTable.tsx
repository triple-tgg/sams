'use client';

import { FlightItem } from '@/lib/api/flight/filghtlist.interface';
import { Edit } from 'lucide-react';
import Tooltip from '../ui/c-tooltip';
import dayjs from 'dayjs';
import EditFlight from '@/app/[locale]/(protected)/flight/edit-project';
import { useState, useMemo, useEffect, useCallback } from 'react';

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
                            <th className="px-4 py-3 text-sm font-semibold">Airlines</th>
                            <th className="px-4 py-3 text-sm font-semibold">Flight No</th>
                            <th className="px-4 py-3 text-sm font-semibold">Route</th>
                            <th className="px-4 py-3 text-sm font-semibold ">A/C Type</th>
                            <th className="px-4 py-3 text-sm font-semibold ">A/C REG</th>
                            {/* <th className="px-4 py-3 text-sm font-semibold text-slate-300">REG</th> */}
                            <th className="px-4 py-3 text-sm font-semibold ">STA</th>
                            <th className="px-4 py-3 text-sm font-semibold ">ETA</th>
                            <th className="px-4 py-3 text-sm font-semibold ">STD</th>
                            <th className="px-4 py-3 text-sm font-semibold ">BAY</th>

                            <th className="px-4 py-3 text-sm font-semibold ">CS</th>
                            <th className="px-4 py-3 text-sm font-semibold ">MECH</th>
                            <th className="px-4 py-3 text-sm font-semibold ">Status</th>
                            <th className="px-4 py-3 text-sm font-semibold ">Remarks</th>
                            {!isFullscreen && (
                                <th className="px-4 py-3 text-sm font-semibold  flex items-center justify-center">action</th>
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
                                <td className="overflow-hidden px-4 py-3 text-sm w-[130px] text-ellipsis">
                                    <Tooltip
                                        content={flight.airlineObj?.name || '-'}
                                    >
                                        <span className={`w-full inline-flex items-center rounded
                                         px-1.5 py-2 text-[10px] font-semibold 
                                         ${flight.airlineObj?.colorBackground ? `bg-${flight.airlineObj?.colorBackground} text-${flight.airlineObj?.colorForeground}` : 'bg-slate-900 text-slate-300'}
                                         `}
                                            style={{
                                                backgroundColor: flight.airlineObj?.colorBackground,
                                                color: flight.airlineObj?.colorForeground
                                            }}
                                        >
                                            {flight.airlineObj?.name || "-"}
                                            {/* {flight.airlineObj?.name?.length > 10 ? `${flight.airlineObj?.name?.slice(0, 10)}...` : flight.airlineObj?.name || '-'} */}
                                        </span>
                                    </Tooltip>
                                </td>
                                {/* Flight No - Show both arrival and departure */}
                                <td className="px-4 py-3 text-sm w-[150px]">
                                    <div className="space-y-1">
                                        {flight.arrivalFlightNo && (
                                            <div className="flex items-center gap-2">
                                                {/* <span className="inline-flex items-center rounded bg-sky-900 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
                                                    ARR
                                                </span> */}
                                                <span className="text-sm font-medium">{flight.arrivalFlightNo}</span>
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
                                <td className="px-4 py-3 text-sm w-[100px]">
                                    {`${flight.routeForm || "-"} / ${flight.routeTo || "-"}`}
                                </td>
                                {/* A/C Type */}
                                <td className="px-4 py-3 text-sm w-[80px]">
                                    {flight.acTypeObj?.code || flight.acType || '-'}
                                </td>

                                {/* REG */}
                                <td className="px-4 py-3 text-sm w-[80px]">
                                    {flight.acReg || '-'}
                                </td>

                                {/* STA */}
                                <td className="px-4 py-3 text-sm w-[60px]">
                                    <Tooltip content={dayjs(`${flight.arrivalDate} ${flight.arrivalStatime}`).format('DD-MMM-YYYY, HH:mm') || '-'}>
                                        <div className="">
                                            {dayjs(`${flight.arrivalDate} ${flight.arrivalStatime}`).format('HH:mm') || '-'}
                                        </div>
                                    </Tooltip>
                                </td>
                                {/* ETA */}
                                <td className="px-4 py-3 text-sm w-[60px]">
                                    <Tooltip content={dayjs(`${flight.arrivalDate} ${flight.arrivalAtaTime}`).format('DD-MMM-YYYY, HH:mm') || '-'}>
                                        <div className="">
                                            {dayjs(`${flight.arrivalDate} ${flight.arrivalAtaTime}`).format('HH:mm') || '-'}
                                        </div>
                                    </Tooltip>
                                </td>

                                {/* STD */}
                                <td className="px-4 py-3 text-sm w-[60px]">
                                    <Tooltip content={dayjs(`${flight.departureDate} ${flight.departureStdTime}`).format('DD-MMM-YYYY, HH:mm') || '-'}>
                                        <div className="">
                                            {dayjs(`${flight.departureDate} ${flight.departureStdTime}`).format('HH:mm') || '-'}
                                        </div>
                                    </Tooltip>
                                </td>

                                {/* BAY */}
                                <td className="px-4 py-3 text-sm w-[90px]">
                                    {flight.bayNo || '-'}
                                </td>
                                {/* CS */}
                                <td className="px-4 py-3 text-sm w-[100px]">
                                    <div className="flex flex-wrap gap-1 items-start justify-start h-full flex-1 flex-col">
                                        {flight.csList?.length ? (
                                            flight.csList?.map((cs) => (
                                                <Tooltip key={cs.id} content={cs.name || ''}>
                                                    <span className="bg-cyan-500 text-white dark:text-slate-900 px-2 py-1 rounded">
                                                        {cs.displayName}
                                                    </span>
                                                </Tooltip>
                                            ))
                                        ) : '-'}
                                    </div>
                                </td>
                                {/* MECH */}
                                <td className="px-4 py-3 text-sm w-[100px]">
                                    <div className="flex flex-wrap gap-1 items-start h-full flex-1 grow-0">
                                        {flight.mechList?.length ? (
                                            flight.mechList?.map((mech) => (
                                                <Tooltip key={mech.id} content={mech.name || ''}>
                                                    <span className="bg-amber-600 text-white dark:text-slate-900 px-2 py-1 rounded">
                                                        {mech.displayName}
                                                    </span>
                                                </Tooltip>
                                            ))
                                        ) : '-'}
                                    </div>
                                </td>
                                {/* Status */}
                                <td className="px-4 py-3 text-sm w-[100px]">
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
                                {/* Remarks */}
                                <td className="px-4 py-3 text-sm w-[100px] text-slate-900 dark:text-slate-300">
                                    {flight.note ? <Tooltip content={flight.note || ''}>
                                        <div className="">
                                            {flight.note?.length > 10 ? `${flight.note?.slice(0, 10)}...` : flight.note || '-'}
                                        </div>
                                    </Tooltip> : '-'}
                                </td>
                                {!isFullscreen && (
                                    <td className="px-2 py-2 text-sm w-[50px] text-slate-900 dark:text-slate-300 text-center">
                                        <button
                                            className="bg-slate-300 hover:bg-slate-500 text-slate-700 hover:text-slate-300 dark:text-slate-300 py-2 px-2 rounded-md cursor-pointer hover:scale-110 transition-all "
                                            onClick={() => {
                                                setEditFlightId(flight.flightInfosId);
                                                setOpenEditFlight(true);
                                            }} >
                                            <Edit className='w-4 h-4' />
                                        </button>
                                    </td>
                                )}

                                {/* Status */}
                                {/* <td className="px-4 py-3">
                                    <span className={`
                                        inline-flex items-center rounded px-2 py-1 text-xs font-medium
                                        ${flight.statusObj?.code === 'Normal' ? 'bg-green-900/50 text-green-400' : ''}
                                        ${flight.statusObj?.code === 'DELAYED' ? 'bg-amber-900/50 text-amber-400' : ''}
                                        ${flight.statusObj?.code === 'CANCELLED' ? 'bg-red-900/50 text-red-400' : ''}
                                        ${!['Normal', 'DELAYED', 'CANCELLED'].includes(flight.statusObj?.code || '') ? 'bg-slate-700 text-slate-300' : ''}
                                    `}>
                                        {flight.statusObj?.code || flight.statusObj?.name || '-'}
                                    </span>
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
