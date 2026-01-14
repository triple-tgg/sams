"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Download, Plus, Calendar } from "lucide-react";
import { airlines } from "./data";

interface ContractFiltersProps {
    searchContractNo: string;
    onSearchChange: (value: string) => void;
    selectedAirline: string;
    onAirlineChange: (value: string) => void;
    startDate: string;
    onStartDateChange: (value: string) => void;
    endDate: string;
    onEndDateChange: (value: string) => void;
    onSearch: () => void;
}

export const ContractFilters = ({
    searchContractNo,
    onSearchChange,
    selectedAirline,
    onAirlineChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    onSearch
}: ContractFiltersProps) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 py-6 px-4 rounded-lg bg-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                    {/* <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Contract No.
                </span> */}
                    <Input
                        placeholder="Contract No."
                        value={searchContractNo}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-48"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {/* <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Customer Airline
                </span> */}
                    <Select value={selectedAirline} onValueChange={onAirlineChange}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Customer Airline" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Airlines</SelectItem>
                            {airlines.map((airline) => (
                                <SelectItem key={airline} value={airline}>
                                    {airline}
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
            {/* <Button variant="outline" onClick={onSearch} size="md">
                <Search className="h-4 w-4 mr-2" />
                Search
            </Button> */}
        </div>
    );
};
