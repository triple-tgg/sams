'use client';

import { FlightItem } from '@/lib/api/flight/filghtlist.interface';
import { Edit } from 'lucide-react';

interface FlightTableProps {
    flights: FlightItem[];
    isLoading?: boolean;
}

export function FlightTable({ flights, isLoading }: FlightTableProps) {
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

    if (flights.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center rounded-lg bg-slate-800/50 text-slate-400">
                <p>No flights found</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-slate-300 dark:border-slate-800 dark:bg-slate-800 shadow-lg ">
            <div className="overflow-x-auto">
                <table className="w-full bg-slate-50 dark:bg-slate-800">
                    <thead>
                        <tr className="bg-slate-300 text-left dark:bg-slate-700 dark:text-slate-300  text-slate-500 ">
                            <th className="px-4 py-3 text-sm font-semibold">Airlines</th>
                            <th className="px-4 py-3 text-sm font-semibold">Flight No</th>
                            <th className="px-4 py-3 text-sm font-semibold">Root</th>
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
                            <th className="px-4 py-3 text-sm font-semibold  flex items-center justify-center">action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 dark:divide-slate-900">
                        {flights.map((flight, index) => (
                            <tr
                                key={flight.flightInfosId ?? index}
                                className="transition-colors hover:bg-slate-600/50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-300"
                            >
                                {/* Airlines */}
                                <td className="px-4 py-3 text-sm">
                                    <span className={`w-full inline-flex items-center rounded
                                         px-1.5 py-2 text-[10px] font-semibold 
                                         ${flight.airlineObj?.colorBackground ? `bg-${flight.airlineObj?.colorBackground} text-${flight.airlineObj?.colorForeground}` : 'bg-slate-900 text-slate-300'}
                                         `}
                                        style={{
                                            backgroundColor: flight.airlineObj?.colorBackground,
                                            color: flight.airlineObj?.colorForeground
                                        }}
                                    >
                                        {flight.airlineObj?.name || '-'}
                                    </span>
                                </td>
                                {/* Flight No - Show both arrival and departure */}
                                <td className="px-4 py-3 text-sm">
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
                                <td className="px-4 py-3 text-sm">
                                    {`${flight.routeForm || "-"} / ${flight.routeTo || "-"}`}
                                </td>
                                {/* A/C Type */}
                                <td className="px-4 py-3 text-sm">
                                    {flight.acTypeObj?.code || flight.acType || '-'}
                                </td>

                                {/* REG */}
                                <td className="px-4 py-3 text-sm">
                                    {flight.acReg || '-'}
                                </td>

                                {/* STA */}
                                <td className="px-4 py-3 text-sm">
                                    <div className="">
                                        {flight.arrivalStatime || '-'}
                                    </div>
                                    {/* {flight.arrivalAtaTime && flight.arrivalAtaTime !== '00:00' && (
                                        <div className="text-xs text-sky-400">
                                            ATA: {flight.arrivalAtaTime}
                                        </div>
                                    )} */}
                                </td>
                                {/* ETA */}
                                <td className="px-4 py-3 text-sm">
                                    <div className="">
                                        {flight.arrivalAtaTime || '-'}
                                    </div>
                                    {/* {flight.arrivalAtaTime && flight.arrivalAtaTime !== '00:00' && (
                                        <div className="text-xs text-sky-400">
                                            ATA: {flight.arrivalAtaTime}
                                        </div>
                                    )} */}
                                </td>

                                {/* STD */}
                                <td className="px-4 py-3 text-sm">
                                    <div className="">
                                        {flight.departureStdTime || '-'}
                                    </div>
                                    {/* {flight.departureAtdtime && flight.departureAtdtime !== '00:00' && (
                                        <div className="text-xs text-emerald-400">
                                            ATD: {flight.departureAtdtime}
                                        </div>
                                    )} */}
                                </td>

                                {/* BAY */}
                                <td className="px-4 py-3 text-sm">
                                    {flight.bayNo || '-'}
                                </td>
                                {/* CS */}
                                <td className="px-4 py-3 text-sm ">
                                    {flight.csList?.length ? (<span className="bg-yellow-300 text-black dark:text-slate-900 px-2 py-1 rounded">
                                        {flight.csList?.map((cs) => cs.displayName).join(', ') || '-'}
                                    </span>) : '-'}
                                </td>
                                {/* MECH */}
                                <td className="px-4 py-3 text-sm">
                                    {flight.mechList?.length ? (<span className="bg-blue-300 text-black dark:text-slate-900 px-2 py-1 rounded">
                                        {flight.mechList?.map((mech) => mech.displayName).join(', ') || '-'}
                                    </span>) : '-'}
                                </td>
                                {/* Status */}
                                <td className="px-4 py-3 text-sm">
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
                                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-300">
                                    {flight.note || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-300">
                                    <button className="bg-slate-600 text-white py-2 px-2 rounded-md cursor-pointer w-full flex items-center justify-center"><Edit className='w-5 h-5' /></button>
                                </td>

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
