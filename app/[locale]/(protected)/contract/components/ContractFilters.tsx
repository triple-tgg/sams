"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Calendar, ChevronDown, Check } from "lucide-react";
import { useAirlineOptions } from "@/lib/api/hooks/useAirlines";
import { useContractStatusOptions } from "@/lib/api/hooks/useContractStatus";

interface ContractFiltersProps {
    searchContractNo: string;
    onSearchChange: (value: string) => void;
    selectedAirline: string;
    onAirlineChange: (value: string) => void;
    startDate: string;
    onStartDateChange: (value: string) => void;
    endDate: string;
    onEndDateChange: (value: string) => void;
    selectedStatusList: number[];
    onStatusListChange: (value: number[]) => void;
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
    selectedStatusList,
    onStatusListChange,
    onSearch
}: ContractFiltersProps) => {
    const { options: airlineOptions, isLoading: loadingAirlines } = useAirlineOptions();
    const { options: statusOptions, isLoading: loadingStatuses } = useContractStatusOptions();

    const handleStatusToggle = (statusId: number, checked: boolean) => {
        if (statusId === -1) {
            // "All Status" selected → clear selections (send [] to API)
            onStatusListChange([]);
            return;
        }
        if (checked) {
            onStatusListChange([...selectedStatusList, statusId]);
        } else {
            onStatusListChange(selectedStatusList.filter(id => id !== statusId));
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 py-6 px-4 rounded-lg bg-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Contract No."
                        value={searchContractNo}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-48"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedAirline} onValueChange={onAirlineChange}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder={loadingAirlines ? "Loading airlines..." : "Customer Airline"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Airlines</SelectItem>
                            {airlineOptions.map((airline) => (
                                <SelectItem key={airline.id} value={String(airline.id)}>
                                    {airline.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Contract Status — multi-select */}
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="min-w-44 justify-between h-9 bg-white hover:bg-transparent border-slate-300"
                                disabled={loadingStatuses}
                            >
                                <span className="flex flex-wrap gap-1 max-w-[200px] overflow-hidden">
                                    {selectedStatusList.length > 0 ? (
                                        selectedStatusList.length <= 2 ? (
                                            selectedStatusList.map((id) => {
                                                const opt = statusOptions.find(s => s.id === id);
                                                return (
                                                    <span
                                                        key={id}
                                                        className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs"
                                                    >
                                                        {opt?.label || id}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span className="text-sm">
                                                {selectedStatusList.length} selected
                                            </span>
                                        )
                                    ) : (
                                        <span className="text-sm">
                                            {loadingStatuses ? "Loading..." : "All Status"}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-2" align="start">
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                {/* All Status option */}
                                <div
                                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer border-b mb-1 pb-2"
                                    onClick={() => handleStatusToggle(-1, true)}
                                >
                                    <Checkbox
                                        checked={selectedStatusList.length === 0}
                                        onCheckedChange={() => handleStatusToggle(-1, true)}
                                    />
                                    <span className="text-sm flex-1 font-medium">All Status</span>
                                    {selectedStatusList.length === 0 && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                                {statusOptions.map((status) => (
                                    <div
                                        key={status.id}
                                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                                        onClick={() => handleStatusToggle(
                                            status.id,
                                            !selectedStatusList.includes(status.id)
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedStatusList.includes(status.id)}
                                            onCheckedChange={(checked) => handleStatusToggle(
                                                status.id,
                                                checked as boolean
                                            )}
                                        />
                                        <span className="text-sm flex-1">{status.label}</span>
                                        {selectedStatusList.includes(status.id) && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
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
                <Button
                    onClick={onSearch}
                    className="ml-2 gap-2"
                >
                    <Search className="h-4 w-4" />
                    Search
                </Button>
            </div>
        </div>
    );
};
