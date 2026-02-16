"use client";

import { useStaff } from "@/lib/api/hooks/useStaff";
import { X, Search, User, Wrench, ChevronDown, Check } from "lucide-react";
import { Control, useWatch } from "react-hook-form";
import { FormSchema } from "../../../../edit-project";
import z from "zod";
import { Label } from "@/components/ui/label";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export type Inputs = z.infer<typeof FormSchema>;

// ------------------------------------------------------
// Types
// ------------------------------------------------------

export interface SelectedStaff {
    id: number;
    code: string;
    name: string;
}

// ------------------------------------------------------
// Personnel Section Component
// ------------------------------------------------------

interface PersonnelSectionProps {
    control: Control<Inputs>;
    onCsChange: (ids: number[]) => void;
    onMechChange: (ids: number[]) => void;
    initialCsList?: SelectedStaff[];
    initialMechList?: SelectedStaff[];
}

export const PersonnelSection = ({
    control,
    onCsChange,
    onMechChange,
    initialCsList = [],
    initialMechList = [],
}: PersonnelSectionProps) => {
    const csIdList = useWatch({ control, name: "csIdList" }) || [];
    const mechIdList = useWatch({ control, name: "mechIdList" }) || [];

    // Fetch ALL staff once on mount (empty code/name = get all)
    const { data: allStaffData, isLoading: isLoadingAllStaff } = useStaff(
        { code: "", name: "", id: "" },
        true
    );

    // Split staff by position
    const { csStaffList, mechStaffList } = useMemo(() => {
        const all = allStaffData?.responseData || [];
        return {
            csStaffList: all.filter((s: any) => s.position?.code === "CS"),
            mechStaffList: all.filter((s: any) => s.position?.code === "MECH"),
        };
    }, [allStaffData]);

    return (
        <div className="space-y-5">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Personnel Assignment
            </h4>
            <div className="grid lg:grid-cols-2 gap-5">
                {/* CS (Certified Staff) */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-50 dark:bg-cyan-900/30">
                            <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <span>CS (Certified Staff)</span>
                        {csIdList.length > 0 && (
                            <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 text-[10px] px-1.5 py-0 h-4 font-semibold">
                                {csIdList.length}
                            </Badge>
                        )}
                    </Label>
                    <StaffSearchSelect
                        staffList={csStaffList}
                        isLoading={isLoadingAllStaff}
                        selectedIds={csIdList}
                        onChange={onCsChange}
                        placeholder="Search CS staff..."
                        accentColor="cyan"
                        initialStaff={initialCsList}
                    />
                </div>

                {/* MECH (Mechanic) */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-900/30">
                            <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span>MECH (Mechanic)</span>
                        {mechIdList.length > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[10px] px-1.5 py-0 h-4 font-semibold">
                                {mechIdList.length}
                            </Badge>
                        )}
                    </Label>
                    <StaffSearchSelect
                        staffList={mechStaffList}
                        isLoading={isLoadingAllStaff}
                        selectedIds={mechIdList}
                        onChange={onMechChange}
                        placeholder="Search MECH staff..."
                        accentColor="amber"
                        initialStaff={initialMechList}
                    />
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------
// Accent Color Config
// ------------------------------------------------------

const ACCENT_STYLES = {
    cyan: {
        ring: "ring-cyan-400/40",
        listItem: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800/40",
        badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
        initials: "bg-cyan-100 text-cyan-700 dark:bg-cyan-800/50 dark:text-cyan-300",
        hover: "hover:bg-cyan-50 dark:hover:bg-cyan-900/20",
        check: "text-cyan-600 dark:text-cyan-400",
        checkboxActive: "bg-cyan-500 dark:bg-cyan-600",
        remove: "text-cyan-400 hover:text-cyan-600 hover:bg-cyan-100 dark:hover:bg-cyan-800/40",
    },
    amber: {
        ring: "ring-amber-400/40",
        listItem: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        initials: "bg-amber-100 text-amber-700 dark:bg-amber-800/50 dark:text-amber-300",
        hover: "hover:bg-amber-50 dark:hover:bg-amber-900/20",
        check: "text-amber-600 dark:text-amber-400",
        checkboxActive: "bg-amber-500 dark:bg-amber-600",
        remove: "text-amber-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-800/40",
    },
} as const;

// ------------------------------------------------------
// Staff Search Select with List
// ------------------------------------------------------

interface StaffSearchSelectProps {
    staffList: any[];
    isLoading: boolean;
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    placeholder?: string;
    accentColor?: keyof typeof ACCENT_STYLES;
    initialStaff?: SelectedStaff[];
}

export const StaffSearchSelect = ({
    staffList,
    isLoading,
    selectedIds,
    onChange,
    placeholder = "Search staff...",
    accentColor = "cyan",
    initialStaff = [],
}: StaffSearchSelectProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<SelectedStaff[]>(initialStaff);
    const [isInitialized, setIsInitialized] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const styles = ACCENT_STYLES[accentColor];

    // Initialize from prop
    useEffect(() => {
        if (!isInitialized && initialStaff.length > 0) {
            setSelectedStaff(initialStaff);
            setIsInitialized(true);
        }
    }, [initialStaff, isInitialized]);

    // Sync when cleared externally
    useEffect(() => {
        if (selectedIds.length === 0 && selectedStaff.length > 0) {
            setSelectedStaff([]);
        }
    }, [selectedIds]); // eslint-disable-line react-hooks/exhaustive-deps

    // Click-outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Client-side filter: search by code or name (keep selected items visible)
    const filteredOptions = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return staffList
            .filter((staff: any) => {
                if (!term) return true;
                const code = (staff.code || "").toLowerCase();
                const name = (staff.name || "").toLowerCase();
                return code.includes(term) || name.includes(term);
            })
            .slice(0, 50); // Limit to 50 results for performance
    }, [staffList, searchTerm]);

    // Toggle select/deselect (multi-select)
    const handleToggle = useCallback((staff: any) => {
        const isSelected = selectedIds.includes(staff.id);
        if (isSelected) {
            // Deselect
            const newIds = selectedIds.filter((id) => id !== staff.id);
            const newSelected = selectedStaff.filter((s) => s.id !== staff.id);
            setSelectedStaff(newSelected);
            onChange(newIds);
        } else {
            // Select
            const newIds = [...selectedIds, staff.id];
            const newSelected = [...selectedStaff, { id: staff.id, code: staff.code, name: staff.name }];
            setSelectedStaff(newSelected);
            onChange(newIds);
        }
        setSearchTerm("");
        // Keep dropdown open for multi-select
    }, [selectedIds, selectedStaff, onChange]);

    const handleRemove = useCallback((staffId: number) => {
        const newIds = selectedIds.filter((id) => id !== staffId);
        const newSelected = selectedStaff.filter((s) => s.id !== staffId);
        setSelectedStaff(newSelected);
        onChange(newIds);
    }, [selectedIds, selectedStaff, onChange]);

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((w) => w[0])
            .filter(Boolean)
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <div ref={containerRef} className="space-y-2">
            {/* Search Select Trigger */}
            <div className="relative">
                <div
                    className={`
                        flex items-center gap-2
                        h-10 px-3
                        border border-gray-300 dark:border-slate-600 rounded-lg
                        bg-white dark:bg-slate-800
                        cursor-text
                        transition-all duration-150
                        ${isOpen ? `ring-2 ${styles.ring} border-transparent` : "hover:border-gray-400 dark:hover:border-slate-500"}
                    `}
                    onClick={() => {
                        setIsOpen(true);
                        inputRef.current?.focus();
                    }}
                >
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (!isOpen) setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        className="
                            flex-1 bg-transparent border-none outline-none
                            text-sm text-gray-900 dark:text-gray-100
                            placeholder:text-gray-400 dark:placeholder:text-gray-500
                            min-w-0
                        "
                    />
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div className="
                        absolute top-full left-0 right-0 z-50 mt-1
                        bg-white dark:bg-slate-800
                        border border-gray-200 dark:border-slate-700
                        rounded-xl shadow-lg shadow-black/8 dark:shadow-black/30
                        overflow-hidden
                    ">
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-500">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                <span>Loading staff...</span>
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            <ScrollArea className="max-h-52">
                                <div className="py-1">
                                    {filteredOptions.map((staff: any) => {
                                        const isSelected = selectedIds.includes(staff.id);
                                        return (
                                            <button
                                                key={staff.id}
                                                type="button"
                                                className={`
                                                    w-full flex items-center gap-3
                                                    px-3 py-2
                                                    text-left
                                                    transition-colors duration-100
                                                    group
                                                    ${isSelected ? styles.listItem : styles.hover}
                                                `}
                                                onClick={() => handleToggle(staff)}
                                            >
                                                {/* Checkbox */}
                                                <div className={`
                                                    w-5 h-5 rounded-md border-2 shrink-0
                                                    flex items-center justify-center
                                                    transition-all duration-150
                                                    ${isSelected
                                                        ? `${styles.checkboxActive} border-transparent`
                                                        : "border-gray-300 dark:border-slate-500 group-hover:border-gray-400 dark:group-hover:border-slate-400"
                                                    }
                                                `}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>

                                                {/* Initials Avatar */}
                                                <div className={`
                                                    w-7 h-7 rounded-full
                                                    flex items-center justify-center
                                                    text-[10px] font-bold shrink-0
                                                    ${styles.initials}
                                                `}>
                                                    {getInitials(staff.name)}
                                                </div>

                                                {/* Name & Code */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                        {staff.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                        {staff.code}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                {searchTerm ? `No staff found for "${searchTerm}"` : "No staff available"}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Selected Staff List */}
            {selectedStaff.length > 0 && (
                <div className="space-y-1.5">
                    {selectedStaff.map((staff, index) => (
                        <div
                            key={staff.id}
                            className={`
                                flex items-center gap-2.5
                                px-3 py-2 rounded-lg
                                border
                                transition-colors duration-100
                                ${styles.listItem}
                            `}
                        >
                            {/* Number Badge */}
                            <span className={`
                                w-5 h-5 rounded-full
                                flex items-center justify-center
                                text-[10px] font-bold shrink-0
                                ${styles.badge}
                            `}>
                                {index + 1}
                            </span>

                            {/* Staff Info */}
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 shrink-0">
                                    {staff.code}
                                </span>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {staff.name}
                                </span>
                            </div>

                            {/* Remove */}
                            <button
                                type="button"
                                onClick={() => handleRemove(staff.id)}
                                className={`
                                    p-1 rounded-full transition-colors shrink-0
                                    ${styles.remove}
                                `}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};