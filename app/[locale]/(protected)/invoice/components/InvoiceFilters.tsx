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
import { Calendar, ChevronDown, Check, Search } from "lucide-react";
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
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6 py-6 px-4 rounded-lg bg-slate-100 shadow-sm">
            {/* Dropdown Filters */}
            <div className="flex items-end gap-2">
                {/* Customer Airline — optional */}
                <div className="space-y-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="min-w-52 justify-between h-9 bg-white hover:bg-transparent border-slate-300 hover:text-gray-700"
                            >
                                <span className="text-sm truncate">
                                    {selectedAirline
                                        ? airlineOptions.find(a => a.value === selectedAirline)?.label || selectedAirline
                                        : (isLoadingAirlines ? "Loading..." : "All Airline")}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-slate-500" />
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
                </div>

                {/* Service Location — optional */}
                <div className="space-y-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="min-w-44 justify-between h-9 bg-white hover:bg-transparent border-slate-300"
                                disabled={isLoadingStations}
                            >
                                <span className="flex flex-wrap gap-1 max-w-[200px] overflow-hidden">
                                    {selectedLocations.length > 0 ? (
                                        selectedLocations.length <= 2 ? (
                                            selectedLocations.map((loc) => (
                                                <span
                                                    key={loc}
                                                    className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs"
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
                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-slate-500" />
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
                </div>

                {/* Aircraft Types — optional */}
                <div className="space-y-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="min-w-44 justify-between h-9 bg-white hover:bg-transparent border-slate-300 hover:text-gray-700"
                                disabled={isLoadingAircraftTypes}
                            >
                                <span className="flex flex-wrap gap-1 max-w-[200px] overflow-hidden">
                                    {selectedAircraftTypes.length > 0 ? (
                                        selectedAircraftTypes.length <= 2 ? (
                                            selectedAircraftTypes.map((type) => (
                                                <span
                                                    key={type}
                                                    className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs"
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
                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-slate-500" />
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
                </div>
            </div>

            {/* Date Range + Search Button */}
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">From</span>
                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="w-40 bg-white"
                />
                <span className="text-sm text-muted-foreground">To</span>
                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="w-40 bg-white"
                />
                <Button
                    onClick={onSearch}
                    disabled={!canSearch || isSearching}
                    className="ml-2 gap-2"
                >
                    <Search className="h-4 w-4" />
                    {isSearching ? "Searching..." : "Search"}
                </Button>
            </div>
        </div>
    );
};