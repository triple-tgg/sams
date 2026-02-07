"use client";

import React from "react";
import { Plane, Clock, Calendar } from "lucide-react";

interface FlightTimeCardProps {
  title: string;
  flightNo: string;
  date: string;
  timeLabels: [string, string];
  times: [string, string];
}

export const FlightTimeCard: React.FC<FlightTimeCardProps> = ({
  title,
  flightNo,
  date,
  timeLabels,
  times,
}) => {
  const isArrival = title.toLowerCase().includes("arrival");

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`px-4 py-2.5 flex items-center gap-2 ${isArrival
          ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100'
          : 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100'
        }`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isArrival ? 'bg-blue-500' : 'bg-emerald-500'
          }`}>
          <Plane className={`h-3.5 w-3.5 text-white ${isArrival ? 'rotate-90' : '-rotate-90'}`} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Flight No & Date Row */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">Flight No</span>
            <span className="text-sm font-semibold text-gray-900">{flightNo || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-sm font-medium text-gray-700">{date || '-'}</span>
          </div>
        </div>

        {/* Time Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isArrival ? 'bg-blue-50/70' : 'bg-emerald-50/70'
            }`}>
            <Clock className={`h-3.5 w-3.5 shrink-0 ${isArrival ? 'text-blue-500' : 'text-emerald-500'
              }`} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 leading-none">{timeLabels[0]}</span>
              <span className="text-sm font-bold text-gray-900 mt-0.5">{times[0] || '--:--'}</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isArrival ? 'bg-blue-50/70' : 'bg-emerald-50/70'
            }`}>
            <Clock className={`h-3.5 w-3.5 shrink-0 ${isArrival ? 'text-blue-500' : 'text-emerald-500'
              }`} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 leading-none">{timeLabels[1]}</span>
              <span className="text-sm font-bold text-gray-900 mt-0.5">{times[1] || '--:--'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightTimeCard;