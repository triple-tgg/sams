"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react';
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

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

const DateRangeFilter = ({
  className,
  value,
  onChange,
  placeholder = "Select date range",
  labels = { from: "From", to: "To" },
  disabled = false,
  required = false,
}: DateRangeFilterProps) => {

  // Handle start date change
  const handleFromDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const fromDate = new Date(dateValue);
      onChange?.({
        from: fromDate,
        to: value?.to
      });
    } else {
      onChange?.({
        from: undefined,
        to: value?.to
      });
    }
  };

  // Handle end date change
  const handleToDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const toDate = new Date(dateValue);
      onChange?.({
        from: value?.from,
        to: toDate
      });
    } else {
      onChange?.({
        from: value?.from,
        to: undefined
      });
    }
  };

  // Format date for input value (YYYY-MM-DD format)
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    try {
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error formatting date:', error);
      return '';
    }
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
        <Input
          id="from-date"
          type="date"
          value={formatDateForInput(value?.from)}
          onChange={handleFromDateChange}
          disabled={disabled}
          required={required}
          max={value?.to ? formatDateForInput(value.to) : undefined}
          className={cn(
            "w-full",
            !isValidRange() && "border-red-500 focus:border-red-500"
          )}
          placeholder={placeholder}
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
        <Input
          id="to-date"
          type="date"
          value={formatDateForInput(value?.to)}
          onChange={handleToDateChange}
          disabled={disabled}
          required={required}
          min={value?.from ? formatDateForInput(value.from) : undefined}
          className={cn(
            "w-full",
            !isValidRange() && "border-red-500 focus:border-red-500"
          )}
          placeholder={placeholder}
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