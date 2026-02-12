"use client";

import { Label } from '@/components/ui/label';
import React from 'react';
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { CustomDateInput } from '@/components/ui/input-date/CustomDateInput';
import dayjs from 'dayjs';

interface DateRangeFilterProps {
  className?: string;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  labels?: {
    from?: string;
    to?: string;
  };
  disabled?: boolean;
  required?: boolean;
}

// Convert Date to DD/MM/YYYY string (CustomDateInput internal format)
const dateToString = (date: Date | undefined): string => {
  if (!date) return '';
  return dayjs(date).format('DD/MM/YYYY');
};

// Convert DD/MM/YYYY string to Date
const stringToDate = (str: string): Date | undefined => {
  if (!str) return undefined;
  const parsed = dayjs(str, 'DD/MM/YYYY');
  return parsed.isValid() ? parsed.toDate() : undefined;
};

const DateRangeFilter = ({
  className,
  value,
  onChange,
  placeholder = "DD-MMM-YYYY",
  labels = { from: "From", to: "To" },
  disabled = false,
  required = false,
}: DateRangeFilterProps) => {

  // Handle start date change (receives DD/MM/YYYY from CustomDateInput)
  const handleFromDateChange = (dateStr: string) => {
    const fromDate = stringToDate(dateStr);
    onChange?.({
      from: fromDate,
      to: value?.to
    });
  };

  // Handle end date change (receives DD/MM/YYYY from CustomDateInput)
  const handleToDateChange = (dateStr: string) => {
    const toDate = stringToDate(dateStr);
    onChange?.({
      from: value?.from,
      to: toDate
    });
  };

  // Validate date range (from date should not be after to date)
  const isValidRange = () => {
    if (!value?.from || !value?.to) return true;
    return value.from <= value.to;
  };

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {/* From Date Input */}
      <div className="space-y-2 flex items-center justify-center space-x-2">
        {labels.from && (
          <Label htmlFor="from-date" className="text-sm font-medium mb-0">
            {labels.from}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <CustomDateInput
          value={dateToString(value?.from)}
          onChange={handleFromDateChange}
          placeholder={placeholder}
          className={cn(
            "w-full",
            !isValidRange() && "border-red-500 focus:border-red-500"
          )}
        />
      </div>

      {/* To Date Input */}
      <div className="space-y-2 flex items-center space-x-2">
        {labels.to && (
          <Label htmlFor="to-date" className="text-sm font-medium mb-0">
            {labels.to}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <CustomDateInput
          value={dateToString(value?.to)}
          onChange={handleToDateChange}
          placeholder={placeholder}
          className={cn(
            "w-full",
            !isValidRange() && "border-red-500 focus:border-red-500"
          )}
        />
      </div>

      {/* Error message for invalid range */}
      {!isValidRange() && (
        <div className="col-span-full">
          <p className="text-sm text-red-500 mt-1">
            From date cannot be after to date
          </p>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
