"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, Check, X, SlidersHorizontal } from "lucide-react";
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
    expiresOnMonth?: 3 | 6;
    onExpiresOnMonthChange: (value: 3 | 6 | undefined) => void;
    onSearch: () => void;
    /** Total rows returned for the current criteria — shown as feedback in the header. */
    resultCount?: number;
    isSearching?: boolean;
}

/** Label + control pair. Declared outside the component so inputs keep focus between renders. */
const Field = ({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: React.ReactNode;
}) => (
    <div className="space-y-1.5">
        <Label
            htmlFor={htmlFor}
            className="text-xs font-medium text-slate-600 dark:text-slate-400"
        >
            {label}
        </Label>
        {children}
    </div>
);

/** Removable summary of one applied filter. */
const FilterChip = ({
    label,
    value,
    onRemove,
}: {
    label: string;
    value: string;
    onRemove: () => void;
}) => (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 py-0.5 pl-2.5 pr-1 text-xs text-primary">
        <span className="text-primary/70">{label}:</span>
        <span className="font-medium">{value}</span>
        <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label} filter`}
            className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
        >
            <X className="h-3 w-3" />
        </button>
    </span>
);

const EXPIRY_LABELS: Record<string, string> = {
    "3": "≤ 3 Months",
    "6": "≤ 6 Months",
};

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
    expiresOnMonth,
    onExpiresOnMonthChange,
    onSearch,
    resultCount,
    isSearching = false,
}: ContractFiltersProps) => {
    const { options: airlineOptions, isLoading: loadingAirlines } = useAirlineOptions();
    const { options: statusOptions, isLoading: loadingStatuses } = useContractStatusOptions();
    const [airlineOpen, setAirlineOpen] = useState(false);

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

    const selectedAirlineLabel = useMemo(() => {
        if (selectedAirline === "all" || !selectedAirline) return "";
        return airlineOptions.find(a => String(a.id) === selectedAirline)?.label || selectedAirline;
    }, [selectedAirline, airlineOptions]);

    const statusLabel = (id: number) => statusOptions.find(s => s.id === id)?.label || String(id);

    const hasDateFilter = Boolean(startDate || endDate);
    const dateChipValue = startDate && endDate
        ? `${startDate} → ${endDate}`
        : startDate
            ? `from ${startDate}`
            : `until ${endDate}`;

    const activeFilterCount =
        (searchContractNo ? 1 : 0) +
        (selectedAirline && selectedAirline !== "all" ? 1 : 0) +
        selectedStatusList.length +
        (expiresOnMonth ? 1 : 0) +
        (hasDateFilter ? 1 : 0);

    const handleClearAll = () => {
        onSearchChange("");
        onAirlineChange("all");
        onStatusListChange([]);
        onExpiresOnMonthChange(undefined);
        onStartDateChange("");
        onEndDateChange("");
    };

    const handleClearDates = () => {
        onStartDateChange("");
        onEndDateChange("");
    };

    return (
        <div className="mb-6 overflow-hidden rounded-lg border bg-slate-50">
            {/* Header: filter count, result feedback, global actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                            {activeFilterCount}
                        </span>
                    )}
                    {resultCount !== undefined && (
                        <span className="text-xs text-slate-500">
                            · {resultCount.toLocaleString()} {resultCount === 1 ? "contract" : "contracts"}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleClearAll}
                        disabled={activeFilterCount === 0}
                        className="h-9 gap-1.5 px-3 text-sm text-slate-600 hover:bg-slate-200 hover:text-slate-900 hover:ring-0 md:px-3"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear all
                    </Button>
                    <Button
                        onClick={onSearch}
                        disabled={isSearching}
                        className="h-9 gap-1.5 px-4 md:px-4"
                    >
                        <Search className="h-4 w-4" />
                        {isSearching ? "Searching..." : "Search"}
                    </Button>
                </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Field label="Contract No." htmlFor="contract-no-filter">
                    <div className="relative">
                        <Input
                            id="contract-no-filter"
                            placeholder="Search contract no."
                            value={searchContractNo}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") onSearch();
                            }}
                            className="h-9 bg-white pr-8 text-sm"
                        />
                        {searchContractNo && (
                            <button
                                type="button"
                                onClick={() => onSearchChange("")}
                                aria-label="Clear contract number"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </Field>

                {/* Customer Airline — searchable, long lists stay usable */}
                <Field label="Customer Airline" htmlFor="contract-airline-filter">
                    <Popover open={airlineOpen} onOpenChange={setAirlineOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                id="contract-airline-filter"
                                variant="outline"
                                role="combobox"
                                aria-expanded={airlineOpen}
                                disabled={loadingAirlines}
                                className="h-9 w-full justify-between bg-white px-3 text-left text-sm font-normal hover:bg-transparent hover:text-gray-700 md:px-3"
                            >
                                <span className={cn("truncate", !selectedAirlineLabel && "text-muted-foreground")}>
                                    {selectedAirlineLabel || (loadingAirlines ? "Loading..." : "All Airlines")}
                                </span>
                                <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[260px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search airline..." />
                                <CommandList>
                                    <CommandEmpty>No airline found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="All Airlines"
                                            onSelect={() => {
                                                onAirlineChange("all");
                                                setAirlineOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedAirline === "all" || !selectedAirline
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            All Airlines
                                        </CommandItem>
                                        {airlineOptions.map((airline) => (
                                            <CommandItem
                                                key={airline.id}
                                                value={airline.label}
                                                onSelect={() => {
                                                    onAirlineChange(String(airline.id));
                                                    setAirlineOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedAirline === String(airline.id)
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                {airline.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </Field>

                {/* Contract Status — multi-select */}
                <Field label="Contract Status" htmlFor="contract-status-filter">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="contract-status-filter"
                                variant="outline"
                                role="combobox"
                                disabled={loadingStatuses}
                                className="h-9 w-full justify-between bg-white px-3 text-left text-sm font-normal hover:bg-transparent hover:text-gray-700 md:px-3"
                            >
                                <span
                                    className={cn(
                                        "truncate",
                                        selectedStatusList.length === 0 && "text-muted-foreground"
                                    )}
                                >
                                    {selectedStatusList.length === 0
                                        ? (loadingStatuses ? "Loading..." : "All Status")
                                        : selectedStatusList.length === 1
                                            ? statusLabel(selectedStatusList[0])
                                            : `${selectedStatusList.length} statuses`}
                                </span>
                                <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-2" align="start">
                            <div className="max-h-[220px] space-y-1 overflow-y-auto">
                                {/* All Status option */}
                                <div
                                    className="mb-1 flex cursor-pointer items-center space-x-2 rounded border-b p-2 pb-2 hover:bg-muted"
                                    onClick={() => handleStatusToggle(-1, true)}
                                >
                                    <Checkbox
                                        checked={selectedStatusList.length === 0}
                                        onCheckedChange={() => handleStatusToggle(-1, true)}
                                    />
                                    <span className="flex-1 text-sm font-medium">All Status</span>
                                    {selectedStatusList.length === 0 && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                                {statusOptions.map((status) => (
                                    <div
                                        key={status.id}
                                        className="flex cursor-pointer items-center space-x-2 rounded p-2 hover:bg-muted"
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
                                        <span className="flex-1 text-sm">{status.label}</span>
                                        {selectedStatusList.includes(status.id) && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {selectedStatusList.length > 0 && (
                                <div className="mt-1 flex items-center justify-between border-t pt-2 text-xs">
                                    <span className="text-muted-foreground">
                                        {selectedStatusList.length} selected
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onStatusListChange([])}
                                        className="font-medium text-primary hover:underline"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </Field>

                <Field label="Expires Within" htmlFor="contract-expiry-filter">
                    <Select
                        value={expiresOnMonth === undefined ? "all" : String(expiresOnMonth)}
                        onValueChange={(value) =>
                            onExpiresOnMonthChange(value === "3" ? 3 : value === "6" ? 6 : undefined)
                        }
                    >
                        <SelectTrigger id="contract-expiry-filter" className="h-9 bg-white text-sm">
                            <SelectValue placeholder="All Expiry" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Expiry</SelectItem>
                            <SelectItem value="3">≤ 3 Months</SelectItem>
                            <SelectItem value="6">≤ 6 Months</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Effective From" htmlFor="contract-effective-from">
                    <Input
                        id="contract-effective-from"
                        type="date"
                        value={startDate}
                        max={endDate || undefined}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="h-9 bg-white text-sm"
                    />
                </Field>

                <Field label="Effective To" htmlFor="contract-effective-to">
                    <Input
                        id="contract-effective-to"
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="h-9 bg-white text-sm"
                    />
                </Field>
            </div>

            {/* Applied filters — one glance at what is narrowing the list */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200 bg-white/60 px-4 py-2">
                    <span className="mr-0.5 text-xs text-slate-500">Applied:</span>
                    {searchContractNo && (
                        <FilterChip
                            label="Contract No."
                            value={searchContractNo}
                            onRemove={() => onSearchChange("")}
                        />
                    )}
                    {selectedAirlineLabel && (
                        <FilterChip
                            label="Airline"
                            value={selectedAirlineLabel}
                            onRemove={() => onAirlineChange("all")}
                        />
                    )}
                    {selectedStatusList.map((id) => (
                        <FilterChip
                            key={id}
                            label="Status"
                            value={statusLabel(id)}
                            onRemove={() => handleStatusToggle(id, false)}
                        />
                    ))}
                    {expiresOnMonth && (
                        <FilterChip
                            label="Expires"
                            value={EXPIRY_LABELS[String(expiresOnMonth)]}
                            onRemove={() => onExpiresOnMonthChange(undefined)}
                        />
                    )}
                    {hasDateFilter && (
                        <FilterChip
                            label="Effective"
                            value={dateChipValue}
                            onRemove={handleClearDates}
                        />
                    )}
                </div>
            )}
        </div>
    );
};
