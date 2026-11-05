"use client";

import { useState, useMemo } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar, ChevronDown, Check, Search, X, Filter } from "lucide-react";
import { useAirlineOptions } from "@/lib/api/hooks/useAirlines";
import { useStationsOptions } from "@/lib/api/hooks/useStations";
import { useAircraftTypes } from "@/lib/api/hooks/useAircraftTypes";
import { CURRENCY_OPTIONS, CurrencyType } from "@/lib/constants/currency";

interface InvoiceFiltersProps {
    selectedAirline: string;
    onAirlineChange: (value: string) => void;
    allowAllAirline?: boolean;
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
    selectedCurrency?: string;
    onCurrencyChange?: (value: string) => void;
    showCurrencyFilter?: boolean;
    currencyOptions?: string[];
    onSearch: () => void;
    isSearching?: boolean;
}

const DEFAULT_CURRENCY_OPTIONS = CURRENCY_OPTIONS.map((opt) => opt.value);

export const InvoiceFilters = ({
    selectedAirline,
    onAirlineChange,
    allowAllAirline = true,
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
    selectedCurrency = CurrencyType.USD,
    onCurrencyChange,
    showCurrencyFilter = false,
    currencyOptions = DEFAULT_CURRENCY_OPTIONS,
    onSearch,
    isSearching = false,
}: InvoiceFiltersProps) => {
    const { options: airlineOptions, isLoading: isLoadingAirlines } = useAirlineOptions();
    const { options: stationOptions, isLoading: isLoadingStations } = useStationsOptions();
    const { options: aircraftTypeOptions, isLoading: isLoadingAircraftTypes } = useAircraftTypes();

    const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // PRE-INVOICE and DRAFT-INVOICE tabs show currency filter
    const isInvoiceTab = Boolean(showCurrencyFilter);

    // Additional filters count (Locations & Aircraft under the Filter dropdown)
    const activeAdditionalFilterCount =
        (selectedLocations.length > 0 ? 1 : 0) + (selectedAircraftTypes.length > 0 ? 1 : 0);

    const selectedAirlineLabel = useMemo(() => {
        if (!selectedAirline) return "";
        return airlineOptions.find((a) => a.value === selectedAirline)?.label || selectedAirline;
    }, [selectedAirline, airlineOptions]);

    const handleClearAdditionalFilters = () => {
        onLocationsChange([]);
        onAircraftTypesChange([]);
    };

    const canSearch =
        startDate !== "" &&
        endDate !== "" &&
        (allowAllAirline || Boolean(selectedAirline)) &&
        (!showCurrencyFilter || Boolean(selectedCurrency));

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

    const renderAirlineFilter = (widthClass = "w-40") => (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        `${widthClass} justify-between h-9 bg-white hover:bg-transparent border-slate-300 hover:text-gray-700 text-left font-normal`,
                        widthClass.includes("w-full") ? "w-full" : "shrink-0",
                        !allowAllAirline && !selectedAirline && "border-amber-400 text-muted-foreground"
                    )}
                >
                    <span className="text-sm truncate">
                        {selectedAirline
                            ? selectedAirlineLabel
                            : isLoadingAirlines
                                ? "Loading..."
                                : allowAllAirline
                                    ? "All Airline"
                                    : "Select Airline *"}
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
                            {allowAllAirline && (
                                <CommandItem
                                    value="__ALL__"
                                    onSelect={() => onAirlineChange("")}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", !selectedAirline ? "opacity-100" : "opacity-0")} />
                                    All Airline
                                </CommandItem>
                            )}
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
    );

    const renderLocationFilter = (widthClass = "w-36") => (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        `${widthClass} justify-between h-9 bg-white hover:bg-transparent border-slate-300 text-left font-normal`,
                        widthClass.includes("w-full") ? "w-full" : "shrink-0"
                    )}
                    disabled={isLoadingStations}
                >
                    <span className={cn("flex flex-wrap gap-1 overflow-hidden", widthClass.includes("w-full") ? "flex-1 truncate" : "max-w-[110px]")}>
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
                            <span className="text-sm truncate">
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
    );

    const renderAircraftFilter = (widthClass = "w-36") => (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        `${widthClass} justify-between h-9 bg-white hover:bg-transparent border-slate-300 hover:text-gray-700 text-left font-normal`,
                        widthClass.includes("w-full") ? "w-full" : "shrink-0"
                    )}
                    disabled={isLoadingAircraftTypes}
                >
                    <span className={cn("flex flex-wrap gap-1 overflow-hidden", widthClass.includes("w-full") ? "flex-1 truncate" : "max-w-[110px]")}>
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
                            <span className="text-sm truncate">
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
    );

    const renderCurrencyFilter = (widthClass = "w-36") =>
        showCurrencyFilter ? (
            <Select
                value={selectedCurrency || CurrencyType.USD}
                onValueChange={(val) => {
                    if (val) onCurrencyChange?.(val);
                }}
            >
                <SelectTrigger className={cn(`${widthClass} h-9 bg-white border-slate-300 text-sm font-normal`, widthClass.includes("w-full") ? "w-full" : "shrink-0")}>
                    <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                    {currencyOptions.map((curr) => (
                        <SelectItem key={curr} value={curr}>
                            {curr}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        ) : null;

    return (
        <div className="mb-6 p-4 rounded-lg bg-slate-100 shadow-sm transition-all">
            {/* Desktop Layout (lg+): Single horizontal row with Dropdown Filter Popover */}
            <div className="hidden lg:flex flex-wrap items-end justify-between gap-3">
                {/* Left section: THF Number / Airline / Currency */}
                <div className="flex flex-wrap items-end gap-2">
                    {/* THF Number (only for THF DOCUMENT tab) */}
                    {showThfNumber && (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">THF Number</label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="THF Number"
                                    value={thfNumber}
                                    onChange={(e) => onThfNumberChange?.(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && canSearch) {
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
                        </div>
                    )}

                    {/* Airline Filter */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Airline</label>
                        {renderAirlineFilter("w-40")}
                    </div>

                    {/* Currency Filter (only on invoice tabs) */}
                    {isInvoiceTab && (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Currency</label>
                            {renderCurrencyFilter("w-32")}
                        </div>
                    )}
                </div>

                {/* Right section: Date range + Filter Popover Dropdown + Search button */}
                <div className="flex flex-wrap items-end gap-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>From</span>
                        </label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => onStartDateChange(e.target.value)}
                            className="w-36 h-9 bg-white border-slate-300 text-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">To</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => onEndDateChange(e.target.value)}
                            className="w-36 h-9 bg-white border-slate-300 text-sm"
                        />
                    </div>

                    {/* Desktop Dropdown Filter Popover */}
                    <Popover open={isDesktopFilterOpen} onOpenChange={setIsDesktopFilterOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className={cn(
                                    "h-9 w-9 shrink-0 relative bg-white border-slate-300",
                                    isDesktopFilterOpen && "border-primary text-primary bg-primary/5",
                                    activeAdditionalFilterCount > 0 && "border-primary font-medium text-primary bg-primary/10"
                                )}
                                title={
                                    activeAdditionalFilterCount > 0
                                        ? `Additional filters (${activeAdditionalFilterCount} active)`
                                        : "Additional filters"
                                }
                            >
                                <Filter className="h-4 w-4" />
                                {activeAdditionalFilterCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs">
                                        {activeAdditionalFilterCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-72 p-3.5 shadow-lg bg-white border border-slate-200"
                            align="end"
                            onInteractOutside={(e) => {
                                const target = e.target as HTMLElement | null;
                                if (
                                    target?.closest('[data-radix-popper-content-wrapper]') ||
                                    target?.closest('[role="dialog"]') ||
                                    target?.closest('[role="listbox"]')
                                ) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                        <Filter className="h-3.5 w-3.5 text-primary" />
                                        <span>Additional Filters</span>
                                        {activeAdditionalFilterCount > 0 && (
                                            <span className="text-[11px] font-normal text-muted-foreground">
                                                ({activeAdditionalFilterCount})
                                            </span>
                                        )}
                                    </div>
                                    {activeAdditionalFilterCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleClearAdditionalFilters}
                                            className="text-xs text-primary hover:underline font-medium cursor-pointer"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-muted-foreground">Locations</label>
                                        {renderLocationFilter("w-full")}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-muted-foreground">Aircraft</label>
                                        {renderAircraftFilter("w-full")}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex justify-end">
                                    <Button
                                        size="sm"
                                        className="h-7 px-3 text-xs"
                                        onClick={() => setIsDesktopFilterOpen(false)}
                                    >
                                        Done
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button
                        onClick={onSearch}
                        disabled={!canSearch || isSearching}
                        className="h-9 gap-2 px-4"
                    >
                        <Search className="h-4 w-4" />
                        {isSearching ? "Searching..." : "Search"}
                    </Button>
                </div>
            </div>

            {/* Mobile / Tablet (<lg): 2-Column Grid Layout */}
            <div className="lg:hidden grid grid-cols-2 gap-3">
                {/* Row 1: 2 Columns */}
                {showThfNumber ? (
                    <>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">THF Number</label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="THF Number"
                                    value={thfNumber}
                                    onChange={(e) => onThfNumberChange?.(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && canSearch) {
                                            onSearch();
                                        }
                                    }}
                                    className="w-full h-9 bg-white border-slate-300 text-sm placeholder:text-muted-foreground/70 pr-7"
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
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Airline</label>
                            {renderAirlineFilter("w-full")}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Airline</label>
                            {renderAirlineFilter("w-full")}
                        </div>
                        {isInvoiceTab ? (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Currency</label>
                                {renderCurrencyFilter("w-full")}
                            </div>
                        ) : (
                            <div />
                        )}
                    </>
                )}

                {/* Row 2: Date Range (2 Columns) */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>From</span>
                    </label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="w-full h-9 bg-white border-slate-300 text-sm"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">To</label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="w-full h-9 bg-white border-slate-300 text-sm"
                    />
                </div>

                {/* Row 3: Expanded Additional Filters in 2 Columns (when isMobileFilterOpen is true) */}
                {isMobileFilterOpen && (
                    <>
                        <div className="flex flex-col gap-1 animate-in fade-in-50 duration-200">
                            <label className="text-xs font-medium text-muted-foreground">Locations</label>
                            {renderLocationFilter("w-full")}
                        </div>
                        <div className="flex flex-col gap-1 animate-in fade-in-50 duration-200">
                            <label className="text-xs font-medium text-muted-foreground">Aircraft</label>
                            {renderAircraftFilter("w-full")}
                        </div>
                        {activeAdditionalFilterCount > 0 && (
                            <div className="col-span-2 flex justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearAdditionalFilters}
                                    className="h-7 text-xs text-muted-foreground hover:text-slate-900 gap-1"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear filters
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* Bottom Row: Filter & Search buttons (ALWAYS at the bottom!) */}
                <div className="col-span-2 flex items-center justify-end gap-2 pt-1">
                    {/* Filter Icon Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsMobileFilterOpen((prev: boolean) => !prev)}
                        className={cn(
                            "h-9 w-9 shrink-0 relative bg-white border-slate-300",
                            isMobileFilterOpen && "border-primary text-primary bg-primary/5",
                            activeAdditionalFilterCount > 0 && "border-primary font-medium text-primary bg-primary/10"
                        )}
                        title={
                            activeAdditionalFilterCount > 0
                                ? `Additional filters (${activeAdditionalFilterCount} active)`
                                : "Additional filters"
                        }
                    >
                        <Filter className="h-4 w-4" />
                        {activeAdditionalFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs">
                                {activeAdditionalFilterCount}
                            </span>
                        )}
                    </Button>

                    {/* Search Button */}
                    <Button
                        onClick={onSearch}
                        disabled={!canSearch || isSearching}
                        className="h-9 gap-2 px-5"
                    >
                        <Search className="h-4 w-4" />
                        {isSearching ? "Searching..." : "Search"}
                    </Button>
                </div>
            </div>

            {/* Active filter summary chips when drawer/dropdown is closed */}
            {activeAdditionalFilterCount > 0 && (
                <div className="w-full pt-2.5 mt-2.5 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground text-[11px] font-medium mr-1">Applied:</span>
                    {selectedLocations.length > 0 && (
                        <span className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 shadow-xs">
                            <span className="text-muted-foreground font-normal">Locations:</span>
                            <span className="font-medium">{selectedLocations.length <= 2 ? selectedLocations.join(", ") : `${selectedLocations.length} selected`}</span>
                            <button
                                type="button"
                                onClick={() => onLocationsChange([])}
                                className="text-slate-400 hover:text-destructive transition-colors ml-0.5"
                                title="Remove locations filter"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {selectedAircraftTypes.length > 0 && (
                        <span className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 shadow-xs">
                            <span className="text-muted-foreground font-normal">Aircraft:</span>
                            <span className="font-medium">{selectedAircraftTypes.length <= 2 ? selectedAircraftTypes.join(", ") : `${selectedAircraftTypes.length} selected`}</span>
                            <button
                                type="button"
                                onClick={() => onAircraftTypesChange([])}
                                className="text-slate-400 hover:text-destructive transition-colors ml-0.5"
                                title="Remove aircraft filter"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleClearAdditionalFilters}
                        className="text-[11px] text-muted-foreground hover:text-slate-900 underline ml-1 cursor-pointer"
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>
    );
};