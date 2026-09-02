"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Calendar, ChevronDown, Check, Search, X } from "lucide-react";
import { useAirlineOptions } from "@/lib/api/hooks/useAirlines";
import { useStationsOptions } from "@/lib/api/hooks/useStations";
import { useAircraftTypes } from "@/lib/api/hooks/useAircraftTypes";

interface InvoiceFiltersProps {
    selectedAirline: string;
    onAirlineChange: (value: string) => void;
    startDate: string;
    onStartDateChange: (value: string) => void;
    endDate: string;
    onEndDateChange: (value: string) => void;
    selectedLocations: string[];
    onLocationsChange: (value: string[]) => void;
    selectedAircraftTypes: string[];
    onAircraftTypesChange: (value: string[]) => void;
    thfNumber?: string;
    onThfNumberChange?: (value: string) => void;
    showThfNumber?: boolean;
    onSearch: () => void;
    isSearching?: boolean;
}

export const InvoiceFilters = ({
    selectedAirline,
    onAirlineChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    selectedLocations,
    onLocationsChange,
    selectedAircraftTypes,
    onAircraftTypesChange,
    thfNumber = "",
    onThfNumberChange,
    showThfNumber = false,
    onSearch,
    isSearching = false,
}: InvoiceFiltersProps) => {
    const { options: airlineOptions, isLoading: isLoadingAirlines } = useAirlineOptions();
    const { options: stationOptions, isLoading: isLoadingStations } = useStationsOptions();
    const { options: aircraftTypeOptions, isLoading: isLoadingAircraftTypes } = useAircraftTypes();

    const canSearch = startDate !== "" && endDate !== "";

    const handleLocationToggle = (locationCode: string, checked: boolean) => {
        if (locationCode === '__ALL__') {
            // "All Locations" selected → clear individual selections (send [] to API)
            onLocationsChange([]);
            return;
        }
        if (checked) {
            onLocationsChange([...selectedLocations, locationCode]);
        } else {
            onLocationsChange(selectedLocations.filter(l => l !== locationCode));
        }
    };

    const handleAircraftTypeToggle = (aircraftCode: string, checked: boolean) => {
        if (aircraftCode === '__ALL__') {
            // "All Aircraft" selected → clear individual selections (send [] to API)
            onAircraftTypesChange([]);
            return;
        }
        if (checked) {
            onAircraftTypesChange([...selectedAircraftTypes, aircraftCode]);
        } else {
            onAircraftTypesChange(selectedAircraftTypes.filter(t => t !== aircraftCode));
        }
    };

    const handleClearAirline = () => {
        onAirlineChange("");
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-lg bg-slate-100 shadow-sm">
            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Customer Airline — optional */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className="w-40 justify-between h-9 bg-white hover:bg-transparent border-slate-300 hover:text-gray-700 text-left font-normal"
                        >
                            <span className="text-sm truncate">
                                {selectedAirline
                                    ? airlineOptions.find(a => a.value === selectedAirline)?.label || selectedAirline
                                    : (isLoadingAirlines ? "Loading..." : "All Airline")}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-slate-500 ml-1" />
                        </Button>
                    </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search airline..." />
                                <CommandList>
                                    <CommandEmpty>No airline found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="__ALL__"
                                            onSelect={() => onAirlineChange("")}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", !selectedAirline ? "opacity-100" : "opacity-0")} />
                                            All Airline
                                        </CommandItem>
                                        {airlineOptions.map((airline) => (
                                            <CommandItem
                                                key={airline.value}
                                                value={airline.label}
                                                onSelect={() => onAirlineChange(airline.value)}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", selectedAirline === airline.value ? "opacity-100" : "opacity-0")} />
                                                {airline.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                {/* Service Location — optional */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-36 justify-between h-9 bg-white hover:bg-transparent border-slate-300 text-left font-normal"
                            disabled={isLoadingStations}
                        >
                            <span className="flex flex-wrap gap-1 max-w-[110px] overflow-hidden">
                                {selectedLocations.length > 0 ? (
                                    selectedLocations.length <= 2 ? (
                                        selectedLocations.map((loc) => (
                                            <span
                                                key={loc}
                                                className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs"
                                            >
                                                {loc}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm">
                                            {selectedLocations.length} selected
                                        </span>
                                    )
                                ) : (
                                    <span className="text-sm">
                                        {isLoadingStations ? "Loading..." : "All Locations"}
                                    </span>
                                )}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-slate-500 ml-1" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-2" align="start">
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {/* All Locations option */}
                            <div
                                className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer border-b mb-1 pb-2"
                                onClick={() => handleLocationToggle('__ALL__', true)}
                            >
                                <Checkbox
                                    checked={selectedLocations.length === 0}
                                    onCheckedChange={() => handleLocationToggle('__ALL__', true)}
                                />
                                <span className="text-sm flex-1 font-medium">All Locations</span>
                                {selectedLocations.length === 0 && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </div>
                            {stationOptions.map((station) => (
                                <div
                                    key={station.value}
                                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                                    onClick={() => handleLocationToggle(
                                        station.value,
                                        !selectedLocations.includes(station.value)
                                    )}
                                >
                                    <Checkbox
                                        checked={selectedLocations.includes(station.value)}
                                        onCheckedChange={(checked) => handleLocationToggle(
                                            station.value,
                                            checked as boolean
                                        )}
                                    />
                                    <span className="text-sm flex-1">{station.label}</span>
                                    {selectedLocations.includes(station.value) && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Aircraft Types — optional */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-36 justify-between h-9 bg-white hover:bg-transparent border-slate-300 hover:text-gray-700 text-left font-normal"
                            disabled={isLoadingAircraftTypes}
                        >
                            <span className="flex flex-wrap gap-1 max-w-[110px] overflow-hidden">
                                {selectedAircraftTypes.length > 0 ? (
                                    selectedAircraftTypes.length <= 2 ? (
                                        selectedAircraftTypes.map((type) => (
                                            <span
                                                key={type}
                                                className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs"
                                            >
                                                {type}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm">
                                            {selectedAircraftTypes.length} selected
                                        </span>
                                    )
                                ) : (
                                    <span className="text-sm">
                                        {isLoadingAircraftTypes ? "Loading..." : "All Aircraft"}
                                    </span>
                                )}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-slate-500 ml-1" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-2" align="start">
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {/* All Aircraft option */}
                            <div
                                className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer border-b mb-1 pb-2"
                                onClick={() => handleAircraftTypeToggle('__ALL__', true)}
                            >
                                <Checkbox
                                    checked={selectedAircraftTypes.length === 0}
                                    onCheckedChange={() => handleAircraftTypeToggle('__ALL__', true)}
                                />
                                <span className="text-sm flex-1 font-medium">All Aircraft</span>
                                {selectedAircraftTypes.length === 0 && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </div>
                            {aircraftTypeOptions.map((aircraft) => (
                                <div
                                    key={aircraft.value}
                                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                                    onClick={() => handleAircraftTypeToggle(
                                        aircraft.value,
                                        !selectedAircraftTypes.includes(aircraft.value)
                                    )}
                                >
                                    <Checkbox
                                        checked={selectedAircraftTypes.includes(aircraft.value)}
                                        onCheckedChange={(checked) => handleAircraftTypeToggle(
                                            aircraft.value,
                                            checked as boolean
                                        )}
                                    />
                                    <span className="text-sm flex-1">{aircraft.label}</span>
                                    {selectedAircraftTypes.includes(aircraft.value) && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* THF Number (only for THF DOCUMENT tab) */}
                {showThfNumber && (
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="THF Number"
                            value={thfNumber}
                            onChange={(e) => onThfNumberChange?.(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    onSearch();
                                }
                            }}
                            className="w-36 h-9 bg-white border-slate-300 text-sm placeholder:text-muted-foreground/70 pr-7"
                        />
                        {thfNumber && (
                            <button
                                type="button"
                                onClick={() => onThfNumberChange?.("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Date Range + Search Button */}
            <div className="flex flex-wrap items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground shrink-0">From</span>
                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="w-36 h-9 bg-white border-slate-300 text-sm"
                />
                <span className="text-sm text-muted-foreground shrink-0">To</span>
                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="w-36 h-9 bg-white border-slate-300 text-sm"
                />
                <Button
                    onClick={onSearch}
                    disabled={!canSearch || isSearching}
                    className="h-9 gap-2 px-4 ml-1"
                >
                    <Search className="h-4 w-4" />
                    {isSearching ? "Searching..." : "Search"}
                </Button>
            </div>
        </div>
    );
};