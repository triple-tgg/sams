"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useAirlineOptions } from "@/lib/api/hooks/useAirlines";

interface InvoiceFiltersProps {
    selectedAirline: string;
    onAirlineChange: (value: string) => void;
    startDate: string;
    onStartDateChange: (value: string) => void;
    endDate: string;
    onEndDateChange: (value: string) => void;
}

export const InvoiceFilters = ({
    selectedAirline,
    onAirlineChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
}: InvoiceFiltersProps) => {
    const { options: airlineOptions, isLoading: isLoadingAirlines } = useAirlineOptions();

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 py-6 px-4 rounded-lg bg-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 ">
                    <Select value={selectedAirline} onValueChange={onAirlineChange}>
                        <SelectTrigger className="min-w-52 w-auto  ">
                            <SelectValue placeholder={isLoadingAirlines ? "Loading..." : "Select Customer Airline"} />
                        </SelectTrigger>
                        <SelectContent>
                            {airlineOptions.map((airline) => (
                                <SelectItem key={airline.value} value={airline.value}>
                                    {airline.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    From
                </span>
                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="w-40"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    To
                </span>
                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="w-40"
                />
            </div>
        </div>
    );
};
