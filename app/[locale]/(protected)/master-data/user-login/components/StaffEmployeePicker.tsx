"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useQAStaffList } from "@/lib/api/hooks/useQAStaffManagement";
import type { QAStaffItem } from "@/lib/api/qa/staff-management";

type Props = {
    /** Selected staff employee ID ("" = none). */
    value: string;
    onChange: (employeeId: string, staff: QAStaffItem | null) => void;
    disabled?: boolean;
    invalid?: boolean;
};

const staffLabel = (s: QAStaffItem) => [s.title, s.name].filter(Boolean).join(" ") || s.fullNameEn || "-";

/** Searchable staff picker that links a user account to a staff member by employee ID. */
const StaffEmployeePicker = ({ value, onChange, disabled, invalid }: Props) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);

    // Server-side search over active staff (name or employee ID)
    const { data, isFetching } = useQAStaffList(
        {
            keyword: debouncedSearch.trim(),
            name: "",
            employeeId: "",
            departmentId: 0,
            staffstypeId: [],
            isActive: true,
            sortBy: "employeeId",
            sortDirection: "asc",
            page: 1,
            perPage: 20,
        },
        open
    );

    // Resolve the label of the currently linked staff (edit / view mode)
    const { data: selectedData } = useQAStaffList(
        {
            keyword: "",
            name: "",
            employeeId: value,
            departmentId: 0,
            staffstypeId: [],
            isActive: true,
            sortBy: "",
            sortDirection: "",
            page: 1,
            perPage: 1,
        },
        !!value
    );
    const selectedStaff = selectedData?.responseData?.find((s) => s.employeeId === value) ?? null;

    const options = data?.responseData ?? [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                        invalid && "border-destructive"
                    )}
                >
                    {value ? (
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-primary">{value}</span>
                            <span className="truncate text-foreground">
                                {selectedStaff ? staffLabel(selectedStaff) : ""}
                            </span>
                        </span>
                    ) : (
                        <span className="text-muted-foreground">Search staff by name or employee ID</span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="z-[1000] w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Type name or employee ID..." value={search} onValueChange={setSearch} />
                    <CommandList>
                        {isFetching ? (
                            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>No staff found.</CommandEmpty>
                                <CommandGroup>
                                    {options.map((s) => (
                                        <CommandItem
                                            key={s.id}
                                            value={String(s.id)}
                                            onSelect={() => {
                                                onChange(s.employeeId || "", s);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value && value === s.employeeId ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span className="w-16 shrink-0 font-mono text-xs font-semibold text-primary">
                                                {s.employeeId || "-"}
                                            </span>
                                            <span className="truncate">{staffLabel(s)}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default StaffEmployeePicker;
