"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

interface FlightTimeCardProps {
  title: string; // เช่น "Arrival (UTC Time)"
  flightNo: string;
  date: string;
  timeLabels: [string, string]; // เช่น ["STA (UTC)", "ATA (UTC)"]
  times: [string, string]; // เช่น ["12:05", "02:29"]
}

export const FlightTimeCard: React.FC<FlightTimeCardProps> = ({
  title,
  flightNo,
  date,
  timeLabels,
  times,
}) => {
  return (
    <div className="w-full rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>

      {/* Flight Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Flight No</label>
          <Input
            value={flightNo}
            readOnly
            className="mt-1 bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Date</label>
          <Input
            value={date}
            readOnly
            className="mt-1 bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      {/* Time Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">{timeLabels[0]}</label>
          <div className="relative mt-1">
            <Input
              value={times[0]}
              readOnly
              className="pr-8 bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Clock className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">{timeLabels[1]}</label>
          <div className="relative mt-1">
            <Input
              value={times[1]}
              readOnly
              className="pr-8 bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Clock className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
export default FlightTimeCard;