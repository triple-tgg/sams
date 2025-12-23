import { useStaff } from "@/lib/api/hooks/useStaff";
import { X, Search, User, Wrench } from "lucide-react";
import { Control, useWatch } from "react-hook-form";
import { FormSchema } from "../../../../edit-project";
import z from "zod";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export type Inputs = z.infer<typeof FormSchema>;

// ------------------------------------------------------
// Personnel Section Component
// ------------------------------------------------------

interface SelectedStaff {
    id: number;
    code: string;
    name: string;
}

interface PersonnelSectionProps {
    control: Control<Inputs>;
    onCsChange: (ids: number[]) => void;
    onMechChange: (ids: number[]) => void;
}

export const PersonnelSection = ({ control, onCsChange, onMechChange }: PersonnelSectionProps) => {
    const csIdList = useWatch({ control, name: "csIdList" }) || [];
    const mechIdList = useWatch({ control, name: "mechIdList" }) || [];

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium">Personnel Assignment</h4>
            <div className="grid lg:grid-cols-2 gap-6">
                {/* CS (Customer Service) Selection */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <User className="w-4 h-4 text-cyan-500" />
                        CS (Customer Service)
                    </Label>
                    <StaffSearchSelect
                        staffType="CS"
                        selectedIds={csIdList}
                        onChange={onCsChange}
                        placeholder="Search CS staff..."
                        badgeColor="bg-cyan-500"
                    />
                </div>

                {/* MECH (Mechanic) Selection */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-500" />
                        MECH (Mechanic)
                    </Label>
                    <StaffSearchSelect
                        staffType="MECH"
                        selectedIds={mechIdList}
                        onChange={onMechChange}
                        placeholder="Search MECH staff..."
                        badgeColor="bg-amber-500"
                    />
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------
// Staff Search Select Component
// ------------------------------------------------------
interface StaffSearchSelectProps {
    staffType: "CS" | "MECH";
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    placeholder?: string;
    badgeColor?: string;
}

export const StaffSearchSelect = ({
    staffType,
    selectedIds,
    onChange,
    placeholder = "Search staff...",
    badgeColor = "bg-blue-500",
}: StaffSearchSelectProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<SelectedStaff[]>([]);
    const [searchBy, setSearchBy] = useState<'code' | 'name'>('code')

    // Fetch staff data based on search
    // const { data: staffData, isLoading } = useStaff(
    //   { code: "", name: searchTerm, id: "" },
    //   searchTerm.length > 1
    // );
    const { data: staffData, isLoading } = useStaff(
        {
            code: searchBy === 'code' ? searchTerm : '',
            name: searchBy === 'name' ? searchTerm : '',
            id: ''
        },
        searchTerm.length > 1 // Only search when there are at least 2 characters
    )

    // Filter staff by type and exclude already selected
    const staffOptions = useMemo(() => {
        if (!staffData?.responseData) return [];

        return staffData.responseData
            .filter((staff: any) => {
                // Filter by staff type
                const staffTypeCode = staff.position?.code?.toUpperCase() || "";
                const matchesType =
                    staffType === "CS"
                        ? staffTypeCode.includes("CS") || staffTypeCode.includes("CUSTOMER")
                        : staffTypeCode.includes("MECH") || staffTypeCode.includes("LAE") || staffTypeCode.includes("TECH");

                // Exclude already selected
                const notSelected = !selectedIds.includes(staff.id);

                return matchesType && notSelected;
            })
            .map((staff: any) => ({
                id: staff.id,
                code: staff.code,
                name: staff.name,
                position: staff.position?.code || "",
            }));
    }, [staffData, selectedIds, staffType]);

    const handleStaffSelect = (staff: any) => {
        const newIds = [...selectedIds, staff.id];
        const newSelected = [...selectedStaff, { id: staff.id, code: staff.code, name: staff.name }];

        setSelectedStaff(newSelected);
        onChange(newIds);
        // setSearchTerm("");
        setShowResults(false);
    };

    const handleRemoveStaff = (staffId: number) => {
        const newIds = selectedIds.filter((id) => id !== staffId);
        const newSelected = selectedStaff.filter((s) => s.id !== staffId);

        setSelectedStaff(newSelected);
        onChange(newIds);
    };

    return (
        <div className="grid grid-cols-12 gap-4">
            {/* Selected Staff Badges */}
            <div className="col-span-12 flex">
                <div className="">
                    <Select
                        value={searchBy}
                        onValueChange={(value: 'code' | 'name') => setSearchBy(value)}
                    >
                        <SelectTrigger className="w-auto">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="code">By Code</SelectItem>
                            <SelectItem value="name">By Name</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 col-span-9 relative -ml-2">
                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <Input
                            placeholder={placeholder}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowResults(e.target.value.length > 1);
                            }}
                            onFocus={() => searchTerm.length > 1 && setShowResults(true)}
                            className="pl-9"
                        />

                        {/* Search Results Dropdown */}
                        {showResults && searchTerm.length > 1 && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                                {isLoading ? (
                                    <div className="p-3 text-sm text-gray-500 text-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white mx-auto mb-2" />
                                        Searching...
                                    </div>
                                ) : staffOptions.length > 0 ? (
                                    <div className="py-1">
                                        {staffOptions.map((staff: any) => (
                                            <div
                                                key={staff.id}
                                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                                                onClick={() => handleStaffSelect(staff)}
                                            >
                                                <div className="font-medium text-gray-900 dark:text-white">{staff.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    Code: <span className="font-mono">{staff.code}</span> |
                                                    Position: <span className="font-semibold">{staff.position}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3 text-sm text-gray-500 text-center">
                                        No {staffType} staff found for &quot;{searchTerm}&quot;
                                    </div>
                                )}

                                {/* Close button */}
                                <div className="border-t border-gray-200 dark:border-slate-700 p-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowResults(false)}
                                        className="w-full text-xs"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="col-span-12 border border-gray-200 dark:border-slate-700 p-2 h-[200px] rounded">
                <ScrollArea className="h-full">
                    {selectedStaff.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedStaff.map((staff) => (
                                <span
                                    key={staff.id}
                                    className={`${badgeColor} text-white px-2 py-1 rounded-md text-sm flex items-center gap-1`}
                                >
                                    {staff.code} - {staff.name}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveStaff(staff.id)}
                                        className="hover:bg-white/20 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
};