"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";

interface DateRangePickerProps {
    className?: string;
    value?: DateRange;
    onChange?: (range: DateRange | undefined) => void;
    placeholder?: string;
}

export default function DateRangePicker({
    className,
    value,
    onChange,
    placeholder = "Pick a date"
}: DateRangePickerProps) {
    const { theme: mode } = useTheme();

    const handleDateChange = (range: DateRange | undefined) => {
        onChange?.(range);
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button

                        className={cn(" font-normal", {
                            "  bg-background hover:bg-background hover:ring-background text-default-600 cursor-pointer": mode !== "dark",
                        })}
                    >
                        <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                        {value?.from ? (
                            value.to ? (
                                <>
                                    {format(value.from, "LLL dd, y")} -{" "}
                                    {format(value.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(value.from, "LLL dd, y")
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={value?.from}
                        selected={value}
                        onSelect={handleDateChange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
