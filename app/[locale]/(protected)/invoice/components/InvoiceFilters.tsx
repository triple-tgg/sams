"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Calendar, ChevronDown, Check } from "lucide-react";
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
}: InvoiceFiltersProps) => {
    const { options: airlineOptions, isLoading: isLoadingAirlines } = useAirlineOptions();
    const { options: stationOptions, isLoading: isLoadingStations } = useStationsOptions();
    const { options: aircraftTypeOptions, isLoading: isLoadingAircraftTypes } = useAircraftTypes();

    const handleLocationToggle = (locationCode: string, checked: boolean) => {
        if (checked) {
            onLocationsChange([...selectedLocations, locationCode]);
        } else {
            onLocationsChange(selectedLocations.filter(l => l !== locationCode));
        }
    };

    const handleAircraftTypeToggle = (aircraftCode: string, checked: boolean) => {
        if (checked) {
            onAircraftTypesChange([...selectedAircraftTypes, aircraftCode]);
        } else {
            onAircraftTypesChange(selectedAircraftTypes.filter(t => t !== aircraftCode));
        }
    };

    return (
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6 py-6 px-4 rounded-lg bg-slate-100 shadow-sm">
            {/* Customer Airline */}
            <div className="flex items-end gap-2">
                <div className="space-y-2">
                    {/* <Label className="text-xs">Customer Airline</Label> */}
                    <Select value={selectedAirline} onValueChange={onAirlineChange}>
                        <SelectTrigger className="min-w-52 w-auto bg-white">
                            <SelectValue placeholder={isLoadingAirlines ? "Loading..." : "Select Airline"} />
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
                {/* Service Location */}
                <div className="space-y-2">
                    {/* <Label className="text-xs">Service Location</Label> */}
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
                                        <span className="text-muted-foreground">
                                            {isLoadingStations ? "Loading..." : "Select Locations"}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-2" align="start">
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
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

                {/* Aircraft Types */}
                <div className="space-y-2">
                    {/* <Label className="text-xs">Aircraft Types</Label> */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="min-w-44 justify-between h-9 bg-white hover:bg-transparent border-slate-300"
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
                                        <span className="text-muted-foreground">
                                            {isLoadingAircraftTypes ? "Loading..." : "Select Aircraft"}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-2" align="start">
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
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


            {/* Date Range */}
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
            </div>
        </div>
    );
};
