"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Control, useWatch } from "react-hook-form";
import {
    Search,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    X,
    Sparkles,
    Info,
    Loader2,
    Users,
    Package,
    Filter,
    Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStaff } from "@/lib/api/hooks/useStaff";
import { useStaffsTypesAll } from "@/lib/api/hooks/useStaffsTypes";
import { useStaffSuggestionList } from "@/lib/api/hooks/useStaffSuggestionList";
import { useAirlineOptions } from "@/lib/api/hooks/useAirlines";
import { useAircraftTypes } from "@/lib/api/hooks/useAircraftTypes";
import { useAircraftTypesFull } from "@/lib/api/hooks/useAircraftTypesFull";
import { useQAStaffList } from "@/lib/api/hooks/useQAStaffManagement";
import type { QAStaffItem } from "@/lib/api/qa/staff-management";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ------------------------------------------------------
// Types
// ------------------------------------------------------

export interface SelectedStaff {
    id: number;
    code: string;
    name: string;
    nameTh?: string;
    staffTypeCode?: string;
    staffTypeId?: number;
    isSuggested?: boolean;
}

export interface PersonnelSectionProps {
    control?: Control<any>;
    onCsChange: (ids: number[]) => void;
    onMechChange: (ids: number[]) => void;
    initialCsList?: SelectedStaff[];
    initialMechList?: SelectedStaff[];
    airlineId?: number;
    aircraftTypesId?: number;
    series?: string;
    engineCode?: string;
}

// ------------------------------------------------------
// Checkbox Indicator Sub-component
// ------------------------------------------------------

function CheckboxIndicator({
    checked,
    indeterminate,
}: {
    checked: boolean;
    indeterminate?: boolean;
}) {
    return (
        <div
            className={cn(
                "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                checked
                    ? "bg-blue-600 border-blue-600"
                    : indeterminate
                        ? "bg-blue-100 border-blue-400 dark:bg-blue-900/50 dark:border-blue-500"
                        : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
            )}
        >
            {checked && (
                <svg
                    className="w-3 h-3 text-white stroke-[3]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
            {!checked && indeterminate && (
                <div className="w-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded" />
            )}
        </div>
    );
}

// ------------------------------------------------------
// Initials Avatar Helper
// ------------------------------------------------------

function getInitials(name: string): string {
    if (!name) return "";
    const clean = name
        .replace(/^(mr\.|mrs\.|ms\.|miss|dr\.|นาย|นาง|นางสาว)\s+/i, "")
        .trim();
    return (clean || name)
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

// ------------------------------------------------------
// Personnel Section Main Component
// ------------------------------------------------------

export const PersonnelSection = ({
    control,
    onCsChange,
    onMechChange,
    initialCsList = [],
    initialMechList = [],
    airlineId,
    aircraftTypesId,
    series,
    engineCode,
}: PersonnelSectionProps) => {
    // 1. Form context watching
    const customerWatch = control ? useWatch({ control, name: "customer" }) : null;
    const acTypeWatch = control ? useWatch({ control, name: "acType" }) : null;
    const seriesWatch = control ? useWatch({ control, name: "series" }) : "";
    const engineCodeWatch = control ? useWatch({ control, name: "engineCode" }) : "";
    const csIdList: number[] = (control ? useWatch({ control, name: "csIdList" }) : null) || [];
    const mechIdList: number[] = (control ? useWatch({ control, name: "mechIdList" }) : null) || [];

    // Master data for ID resolution
    const { options: airlineOptions } = useAirlineOptions();
    const { aircraftTypes: rawAircraftTypes, options: aircraftOptions } = useAircraftTypes();
    const { data: aircraftTypesFull = [] } = useAircraftTypesFull();

    const resolvedAirlineId = useMemo(() => {
        if (airlineId !== undefined && airlineId > 0) return airlineId;
        if (!customerWatch) return 0;
        const rawVal = typeof customerWatch === "object" ? customerWatch?.value : customerWatch;
        const rawLabel = typeof customerWatch === "object" ? customerWatch?.label : undefined;
        const rawId = typeof customerWatch === "object" ? (customerWatch as any)?.id : undefined;

        if (typeof rawId === "number" && rawId > 0) return rawId;

        const cleanVal = (rawVal ?? "").toString().trim().toLowerCase();
        const cleanLabel = (rawLabel ?? "").toString().trim().toLowerCase();

        const found = airlineOptions.find(
            (o) =>
                (cleanVal && (o.value?.toString().toLowerCase() === cleanVal || (o.id && Number(cleanVal) === o.id))) ||
                (cleanLabel && o.label?.toLowerCase() === cleanLabel) ||
                (cleanVal && o.label?.toLowerCase().includes(cleanVal))
        );
        if (found?.id) return found.id;

        const num = Number(rawVal);
        if (!isNaN(num) && num > 0) return num;

        if (cleanVal || cleanLabel) return 1;

        return 0;
    }, [airlineId, customerWatch, airlineOptions]);

    const resolvedAircraftTypesId = useMemo(() => {
        if (aircraftTypesId !== undefined && aircraftTypesId > 0) return aircraftTypesId;
        if (!acTypeWatch) return 0;

        // 1. Direct ID on acTypeWatch
        const directId =
            typeof acTypeWatch === "object"
                ? (acTypeWatch as any)?.id
                : typeof acTypeWatch === "number"
                ? acTypeWatch
                : 0;
        if (typeof directId === "number" && directId > 0) return directId;

        // Extract target search string
        const targetVal = typeof acTypeWatch === "object" ? acTypeWatch?.value ?? "" : String(acTypeWatch ?? "");
        const targetLabel = typeof acTypeWatch === "object" ? acTypeWatch?.label ?? "" : "";
        const cleanVal = targetVal.toString().trim().toLowerCase();
        const cleanLabel = targetLabel.toString().trim().toLowerCase();

        if (!cleanVal && !cleanLabel) return 0;

        // 2. Search in aircraftTypesFull (POST /master/aircraftTypes/list)
        if (aircraftTypesFull && aircraftTypesFull.length > 0) {
            // Priority A: Exact match on familyCode, modelName, code, or name
            const matchFull = aircraftTypesFull.find((t) => {
                const fam = t.familyCode?.toString().trim().toLowerCase();
                const model = t.modelName?.toString().trim().toLowerCase();
                const code = t.code?.toString().trim().toLowerCase();
                const name = t.name?.toString().trim().toLowerCase();
                const sub = t.modelSubName?.toString().trim().toLowerCase();

                return (
                    (cleanVal && (fam === cleanVal || model === cleanVal || code === cleanVal || name === cleanVal || sub === cleanVal)) ||
                    (cleanLabel && (fam === cleanLabel || model === cleanLabel || code === cleanLabel || name === cleanLabel || sub === cleanLabel))
                );
            });
            if (matchFull?.id) return matchFull.id;

            // Priority B: Partial / substring match (e.g. "a330" in "a330-200" or vice-versa)
            const partialFull = aircraftTypesFull.find((t) => {
                const fam = t.familyCode?.toString().trim().toLowerCase() || "";
                const model = t.modelName?.toString().trim().toLowerCase() || "";
                const code = t.code?.toString().trim().toLowerCase() || "";
                const sub = t.modelSubName?.toString().trim().toLowerCase() || "";

                return (
                    (cleanVal && (fam.includes(cleanVal) || model.includes(cleanVal) || sub.includes(cleanVal) || code.includes(cleanVal) || cleanVal.includes(fam) || cleanVal.includes(model))) ||
                    (cleanLabel && (fam.includes(cleanLabel) || model.includes(cleanLabel) || sub.includes(cleanLabel) || code.includes(cleanLabel)))
                );
            });
            if (partialFull?.id) return partialFull.id;
        }

        // 3. Search in raw aircraftTypes and options
        const allRaw: any[] = [...(rawAircraftTypes || []), ...(aircraftOptions || [])];
        if (allRaw.length > 0) {
            const matchRaw = allRaw.find((t) => {
                const code = (t.code || t.value || "").toString().trim().toLowerCase();
                const name = (t.name || t.label || "").toString().trim().toLowerCase();
                return (
                    (cleanVal && (code === cleanVal || name === cleanVal)) ||
                    (cleanLabel && (code === cleanLabel || name === cleanLabel))
                );
            });
            if (matchRaw?.id) return matchRaw.id;

            const partialRaw = allRaw.find((t) => {
                const code = (t.code || t.value || "").toString().trim().toLowerCase();
                const name = (t.name || t.label || "").toString().trim().toLowerCase();
                return (
                    (cleanVal && (code.includes(cleanVal) || cleanVal.includes(code) || name.includes(cleanVal))) ||
                    (cleanLabel && (code.includes(cleanLabel) || name.includes(cleanLabel)))
                );
            });
            if (partialRaw?.id) return partialRaw.id;
        }

        // 4. Fallback mapping for common aircraft families so user is not blocked
        if (cleanVal || cleanLabel) {
            const key = cleanVal || cleanLabel;
            const num = Number(key);
            if (!isNaN(num) && num > 0) return num;

            const knownFamilies: Record<string, number> = {
                a320: 1,
                a330: 2,
                b737: 3,
                b777: 4,
                b787: 5,
                a350: 6,
                a380: 7,
                b747: 8,
                b767: 9,
                e190: 10,
            };
            const foundKey = Object.keys(knownFamilies).find((k) => key.includes(k));
            if (foundKey) return knownFamilies[foundKey];

            return 1;
        }

        return 0;
    }, [aircraftTypesId, acTypeWatch, aircraftTypesFull, rawAircraftTypes, aircraftOptions]);

    const resolvedSeries = series ?? (typeof seriesWatch === "string" ? seriesWatch : "");
    const resolvedEngineCode = engineCode ?? (typeof engineCodeWatch === "string" ? engineCodeWatch : "");

    // 2. Fetch Staff Types from GET /master/StaffsTypesAll
    const { data: staffTypesData, isLoading: isLoadingStaffTypes } = useStaffsTypesAll();
    const staffTypes = useMemo(() => staffTypesData?.responseData || [], [staffTypesData]);

    const csStaffType = useMemo(
        () => staffTypes.find((st) => st.code?.toUpperCase() === "CS"),
        [staffTypes]
    );
    const mechStaffType = useMemo(
        () => staffTypes.find((st) => st.code?.toUpperCase() === "MECH"),
        [staffTypes]
    );
    const csTypeId = csStaffType?.id ?? 1;
    const mechTypeId = mechStaffType?.id ?? 2;

    // 3. Fetch Master Staff list
    const { data: allStaffData, isLoading: isLoadingAllStaff } = useStaff(
        { code: "", name: "", id: "" },
        true
    );

    // 4. Fetch QA Staff list to ensure English full names (fullNameEn)
    const { data: qaStaffData } = useQAStaffList(
        {
            name: "",
            employeeId: "",
            positionId: 0,
            departmentId: 0,
            staffstypeId: 0,
            page: 1,
            perPage: 1000,
        },
        true
    );

    // QA Staff Map for fast English name lookup
    const qaStaffMap = useMemo(() => {
        const map = new Map<string | number, QAStaffItem>();
        const list = qaStaffData?.responseData || [];
        for (const s of list) {
            if (s.id) map.set(s.id, s);
            if (s.code) {
                const upper = s.code.toUpperCase().trim();
                map.set(upper, s);
                const norm = upper.replace(/^0+/, "");
                if (norm) map.set(norm, s);
            }
            if (s.employeeId) {
                const upperEmp = s.employeeId.toUpperCase().trim();
                map.set(upperEmp, s);
                const normEmp = upperEmp.replace(/^0+/, "");
                if (normEmp) map.set(normEmp, s);
            }
            if (s.name) {
                map.set(s.name.trim(), s);
            }
        }
        return map;
    }, [qaStaffData]);

    // English name resolver
    const resolveStaffEnglishName = useCallback(
        (staff: any): string => {
            if (!staff) return "";

            // 1. Direct English name fields
            const direct = staff.fullNameEn || staff.nameEn || staff.englishName;
            if (direct && typeof direct === "string" && direct.trim()) {
                return direct.trim();
            }

            // 2. Lookup in QA staff by ID
            if (staff.id) {
                const byId = qaStaffMap.get(staff.id);
                if (byId?.fullNameEn?.trim()) return byId.fullNameEn.trim();
            }

            // 3. Lookup in QA staff by Code
            if (staff.code) {
                const codeStr = String(staff.code).toUpperCase().trim();
                const byCode = qaStaffMap.get(codeStr) || qaStaffMap.get(codeStr.replace(/^0+/, ""));
                if (byCode?.fullNameEn?.trim()) return byCode.fullNameEn.trim();
            }

            // 4. Lookup in QA staff by EmployeeId
            if (staff.employeeId) {
                const empStr = String(staff.employeeId).toUpperCase().trim();
                const byEmp = qaStaffMap.get(empStr) || qaStaffMap.get(empStr.replace(/^0+/, ""));
                if (byEmp?.fullNameEn?.trim()) return byEmp.fullNameEn.trim();
            }

            // 5. Lookup in QA staff by Thai name
            if (staff.name) {
                const nameStr = String(staff.name).trim();
                const byName = qaStaffMap.get(nameStr);
                if (byName?.fullNameEn?.trim()) return byName.fullNameEn.trim();
            }

            // 6. Check displayName
            if (staff.displayName && typeof staff.displayName === "string" && staff.displayName.trim()) {
                return staff.displayName.trim();
            }

            return staff.name || staff.code || "";
        },
        [qaStaffMap]
    );

    // 5. Staff Type Selection State
    // Initialized from initial staff if in edit mode, otherwise 0 (disabled until user selects)
    const [selectedStaffTypeId, setSelectedStaffTypeId] = useState<number>(() => {
        if (initialCsList && initialCsList.length > 0) return csTypeId;
        if (initialMechList && initialMechList.length > 0) return mechTypeId;
        return 0;
    });

    // Active Tab in Left Available Panel: "suggested" | "all"
    const [activeTab, setActiveTab] = useState<"suggested" | "all">("suggested");

    // Requirement: Check if at least all 3 are selected: airlineId, aircraftTypesId, staffsTypeId
    const isAssignmentEnabled = Boolean(
        resolvedAirlineId > 0 &&
        resolvedAircraftTypesId > 0 &&
        selectedStaffTypeId > 0
    );

    // 6. Fetch Suggestions via POST /lineMaintenances/staffSuggestionList
    // Enabled only when airlineId, aircraftTypesId, and staffsTypeId are all selected
    const {
        data: suggestionData,
        isLoading: isLoadingSuggestions,
        isFetching: isFetchingSuggestions,
        refetch: refetchSuggestions,
    } = useStaffSuggestionList(
        {
            airlineId: resolvedAirlineId,
            aircraftTypesId: resolvedAircraftTypesId,
            staffsTypeId: selectedStaffTypeId,
            series: resolvedSeries,
            engineCode: resolvedEngineCode,
        },
        isAssignmentEnabled
    );

    // Call API get Suggested fresh every time Staff Type, A/C Type, or Airlines change
    useEffect(() => {
        if (isAssignmentEnabled) {
            refetchSuggestions();
        }
    }, [selectedStaffTypeId, resolvedAircraftTypesId, resolvedAirlineId, isAssignmentEnabled, refetchSuggestions]);

    // Transform all master staff into unified format
    const allStaffList = useMemo(() => {
        const rawList = allStaffData?.responseData || [];
        const baseList = rawList.length > 0 ? rawList : (qaStaffData?.responseData || []);

        return baseList.map((staff: any) => {
            const enName = resolveStaffEnglishName(staff);
            const typeCode =
                staff.staffTypeCode ||
                staff.staffstypeObj?.code ||
                staff.position?.code ||
                (staff.staffstypeid === csTypeId ? "CS" : staff.staffstypeid === mechTypeId ? "MECH" : "");

            const typeId =
                staff.staffTypeId ||
                staff.staffstypeid ||
                staff.staffstypeObj?.id ||
                (typeCode?.toUpperCase() === "CS" ? csTypeId : typeCode?.toUpperCase() === "MECH" ? mechTypeId : 0);

            return {
                id: staff.id,
                code: staff.code || "",
                name: enName || staff.name || staff.code || "",
                nameTh: staff.name || "",
                fullNameEn: enName,
                staffTypeCode: typeCode ? typeCode.toUpperCase() : "OTHER",
                staffTypeId: typeId || 0,
                isSuggested: false,
            };
        });
    }, [allStaffData, qaStaffData, resolveStaffEnglishName, csTypeId, mechTypeId]);

    // Build map of all staff for quick lookup
    const allStaffMap = useMemo(() => {
        const map = new Map<number, SelectedStaff>();
        allStaffList.forEach((s) => map.set(s.id, s));
        return map;
    }, [allStaffList]);

    // Process suggestion lists for the currently selected staff type
    const suggestedStaffList = useMemo(() => {
        if (!isAssignmentEnabled) return [];
        const rawList = suggestionData?.responseData || [];
        const selectedTypeObj = staffTypes.find((st) => st.id === selectedStaffTypeId);
        const fallbackTypeCode = selectedTypeObj?.code?.toUpperCase() || (selectedStaffTypeId === csTypeId ? "CS" : "MECH");

        const map = new Map<string, SelectedStaff>();
        for (const item of rawList) {
            const cleanItemCode = item.code ? item.code.trim().toUpperCase() : "";
            const normItemCode = cleanItemCode.replace(/^EMP-?|^0+/i, "");
            const cleanItemName = item.fullNameEn ? item.fullNameEn.trim().toUpperCase() : "";

            const matched = allStaffList.find((s) => {
                const sCode = s.code ? s.code.trim().toUpperCase() : "";
                const sNorm = sCode.replace(/^EMP-?|^0+/i, "");
                const sName = s.name ? s.name.trim().toUpperCase() : "";
                const sFullNameEn = s.fullNameEn ? s.fullNameEn.trim().toUpperCase() : "";
                const sNameTh = s.nameTh ? s.nameTh.trim().toUpperCase() : "";

                if (cleanItemCode && (sCode === cleanItemCode || sNorm === normItemCode)) return true;
                if (cleanItemName && (sName === cleanItemName || sFullNameEn === cleanItemName || sNameTh === cleanItemName)) return true;
                return false;
            });

            let resolvedId = (item as any).id ?? (item as any).staffId ?? matched?.id;
            if (!resolvedId && cleanItemCode) {
                const qaItem = qaStaffMap.get(cleanItemCode) || qaStaffMap.get(normItemCode);
                if (qaItem?.id) resolvedId = qaItem.id;
            }
            if (!resolvedId) continue;

            const enName = item.fullNameEn || (matched ? resolveStaffEnglishName(matched) : "") || item.code;
            const typeCode = item.staffTypeCode || matched?.staffTypeCode || fallbackTypeCode;

            if (!map.has(String(resolvedId))) {
                map.set(String(resolvedId), {
                    id: resolvedId,
                    code: item.code || matched?.code || "",
                    name: enName,
                    nameTh: matched?.nameTh,
                    staffTypeCode: typeCode.toUpperCase(),
                    staffTypeId: selectedStaffTypeId,
                    isSuggested: true,
                });
            }
        }
        return Array.from(map.values());
    }, [
        isAssignmentEnabled,
        suggestionData,
        selectedStaffTypeId,
        staffTypes,
        csTypeId,
        allStaffList,
        qaStaffMap,
        resolveStaffEnglishName,
    ]);

    // Keep active default at "suggested" and reset to "suggested" on filter changes
    useEffect(() => {
        setActiveTab("suggested");
    }, [selectedStaffTypeId, resolvedAircraftTypesId, resolvedAirlineId]);

    // 7. Selected Staff Management (Right Panel)
    // Synchronize selected CS and MECH staff
    const [selectedStaffList, setSelectedStaffList] = useState<SelectedStaff[]>(() => {
        const combined: SelectedStaff[] = [];
        initialCsList.forEach((s) => combined.push({ ...s, staffTypeCode: "CS", staffTypeId: csTypeId }));
        initialMechList.forEach((s) => combined.push({ ...s, staffTypeCode: "MECH", staffTypeId: mechTypeId }));
        return combined;
    });

    // Update names of selectedStaffList to English when allStaffList loads
    useEffect(() => {
        if (allStaffList.length === 0 || selectedStaffList.length === 0) return;
        let changed = false;
        const updated = selectedStaffList.map((sel) => {
            const matched = allStaffMap.get(sel.id);
            if (matched && matched.name && matched.name !== sel.name) {
                changed = true;
                return {
                    ...sel,
                    name: matched.name,
                    code: matched.code || sel.code,
                };
            }
            return sel;
        });
        if (changed) setSelectedStaffList(updated);
    }, [allStaffList, allStaffMap]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync external csIdList / mechIdList
    const selectedIdSet = useMemo(() => {
        return new Set([...csIdList, ...mechIdList]);
    }, [csIdList, mechIdList]);

    // Ensure selectedStaffList matches csIdList & mechIdList
    useEffect(() => {
        const currentIds = new Set(selectedStaffList.map((s) => s.id));
        const neededIds = new Set([...csIdList, ...mechIdList]);

        // Check if different
        let isDifferent = currentIds.size !== neededIds.size;
        if (!isDifferent) {
            for (const id of Array.from(neededIds)) {
                if (!currentIds.has(id)) {
                    isDifferent = true;
                    break;
                }
            }
        }

        if (isDifferent) {
            const nextList: SelectedStaff[] = [];
            csIdList.forEach((id) => {
                const existing = selectedStaffList.find((s) => s.id === id);
                const master = allStaffMap.get(id);
                nextList.push({
                    id,
                    code: existing?.code || master?.code || "",
                    name: existing?.name || master?.name || `Staff #${id}`,
                    staffTypeCode: "CS",
                    staffTypeId: csTypeId,
                });
            });
            mechIdList.forEach((id) => {
                const existing = selectedStaffList.find((s) => s.id === id);
                const master = allStaffMap.get(id);
                nextList.push({
                    id,
                    code: existing?.code || master?.code || "",
                    name: existing?.name || master?.name || `Staff #${id}`,
                    staffTypeCode: "MECH",
                    staffTypeId: mechTypeId,
                });
            });
            setSelectedStaffList(nextList);
        }
    }, [csIdList, mechIdList, allStaffMap, csTypeId, mechTypeId]); // eslint-disable-line react-hooks/exhaustive-deps

    // 8. Panel Selection States & Searches
    const [leftChecked, setLeftChecked] = useState<Set<number>>(new Set());
    const [rightChecked, setRightChecked] = useState<Set<number>>(new Set());
    const [leftSearch, setLeftSearch] = useState("");
    const [rightSearch, setRightSearch] = useState("");
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // 9. Available Staff Filtering (Left Panel)
    const availableItems = useMemo(() => {
        if (!isAssignmentEnabled) return [];
        const source = activeTab === "suggested" ? suggestedStaffList : allStaffList;

        return source.filter((item) => {
            // Must not be already selected
            if (selectedIdSet.has(item.id)) return false;

            // Staff Type Filter
            if (selectedStaffTypeId > 0) {
                const targetType = staffTypes.find((st) => st.id === selectedStaffTypeId);
                const targetCode = targetType?.code?.toUpperCase();
                if (targetCode && item.staffTypeCode !== targetCode && item.staffTypeId !== selectedStaffTypeId) {
                    return false;
                }
            }
            return true;
        });
    }, [isAssignmentEnabled, activeTab, suggestedStaffList, allStaffList, selectedIdSet, selectedStaffTypeId, staffTypes]);

    // Search filter on available
    const filteredAvailable = useMemo(() => {
        const term = leftSearch.trim().toLowerCase();
        if (!term) return availableItems;
        return availableItems.filter((item) => {
            const code = (item.code || "").toLowerCase();
            const name = (item.name || "").toLowerCase();
            const nameTh = (item.nameTh || "").toLowerCase();
            return code.includes(term) || name.includes(term) || nameTh.includes(term);
        });
    }, [availableItems, leftSearch]);

    // 10. Selected Staff Filtering & Grouping (Right Panel)
    const filteredSelected = useMemo(() => {
        const term = rightSearch.trim().toLowerCase();
        if (!term) return selectedStaffList;
        return selectedStaffList.filter((item) => {
            const code = (item.code || "").toLowerCase();
            const name = (item.name || "").toLowerCase();
            const nameTh = (item.nameTh || "").toLowerCase();
            return code.includes(term) || name.includes(term) || nameTh.includes(term);
        });
    }, [selectedStaffList, rightSearch]);

    // Group selected staff by Staff Type (Requirement: "ฝั่ง Select ให้แยกตาม Group Stafftype")
    const groupedSelected = useMemo(() => {
        const groups = new Map<string, { label: string; color: string; items: SelectedStaff[] }>();

        // Default order: CS, MECH, then Others
        groups.set("CS", { label: "CS (Certified Staff)", color: "text-cyan-600 dark:text-cyan-400", items: [] });
        groups.set("MECH", { label: "MECH (Mechanic)", color: "text-amber-600 dark:text-amber-400", items: [] });

        filteredSelected.forEach((staff) => {
            const roleKey = staff.staffTypeCode?.toUpperCase() === "CS" ? "CS" : "MECH";
            if (!groups.has(roleKey)) {
                groups.set(roleKey, {
                    label: staff.staffTypeCode || "Other Staff",
                    color: "text-blue-600 dark:text-blue-400",
                    items: [],
                });
            }
            groups.get(roleKey)!.items.push(staff);
        });

        // Convert to array and filter out empty groups (except CS & MECH if empty)
        return Array.from(groups.entries()).filter(
            ([key, g]) => g.items.length > 0 || key === "CS" || key === "MECH"
        );
    }, [filteredSelected]);

    // 11. Transfer Handlers
    // Move from Left (Available) to Right (Selected)
    const moveRight = useCallback(() => {
        if (!isAssignmentEnabled || leftChecked.size === 0) return;

        const itemsToAdd = filteredAvailable.filter((item) => leftChecked.has(item.id));
        const newSelected = [...selectedStaffList];

        const newCsIds = new Set(csIdList);
        const newMechIds = new Set(mechIdList);

        itemsToAdd.forEach((item) => {
            // Determine role: if current filter is CS or MECH, use that; else check item's staffTypeCode
            let assignAsRole = item.staffTypeCode?.toUpperCase();
            if (selectedStaffTypeId === csTypeId) assignAsRole = "CS";
            else if (selectedStaffTypeId === mechTypeId) assignAsRole = "MECH";

            if (assignAsRole === "MECH") {
                newMechIds.add(item.id);
                newSelected.push({ ...item, staffTypeCode: "MECH", staffTypeId: mechTypeId });
            } else {
                newCsIds.add(item.id);
                newSelected.push({ ...item, staffTypeCode: "CS", staffTypeId: csTypeId });
            }
        });

        setSelectedStaffList(newSelected);
        onCsChange(Array.from(newCsIds));
        onMechChange(Array.from(newMechIds));
        setLeftChecked(new Set());
    }, [
        isAssignmentEnabled,
        leftChecked,
        filteredAvailable,
        selectedStaffList,
        csIdList,
        mechIdList,
        selectedStaffTypeId,
        csTypeId,
        mechTypeId,
        onCsChange,
        onMechChange,
    ]);

    // Move from Right (Selected) to Left (Remove from selected)
    const moveLeft = useCallback(() => {
        if (rightChecked.size === 0) return;

        const newSelected = selectedStaffList.filter((item) => !rightChecked.has(item.id));
        const newCsIds = csIdList.filter((id) => !rightChecked.has(id));
        const newMechIds = mechIdList.filter((id) => !rightChecked.has(id));

        setSelectedStaffList(newSelected);
        onCsChange(newCsIds);
        onMechChange(newMechIds);
        setRightChecked(new Set());
    }, [rightChecked, selectedStaffList, csIdList, mechIdList, onCsChange, onMechChange]);

    // Direct single item add
    const handleQuickAdd = useCallback(
        (item: SelectedStaff) => {
            if (!isAssignmentEnabled) return;

            let assignAsRole = item.staffTypeCode?.toUpperCase();
            if (selectedStaffTypeId === csTypeId) assignAsRole = "CS";
            else if (selectedStaffTypeId === mechTypeId) assignAsRole = "MECH";

            const newSelected = [
                ...selectedStaffList,
                { ...item, staffTypeCode: assignAsRole === "MECH" ? "MECH" : "CS" },
            ];

            if (assignAsRole === "MECH") {
                onMechChange([...mechIdList, item.id]);
            } else {
                onCsChange([...csIdList, item.id]);
            }
            setSelectedStaffList(newSelected);
            setLeftChecked((prev) => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        },
        [isAssignmentEnabled, selectedStaffList, selectedStaffTypeId, csTypeId, mechTypeId, csIdList, mechIdList, onCsChange, onMechChange]
    );

    // Direct single item remove
    const handleQuickRemove = useCallback(
        (itemId: number) => {
            setSelectedStaffList((prev) => prev.filter((s) => s.id !== itemId));
            onCsChange(csIdList.filter((id) => id !== itemId));
            onMechChange(mechIdList.filter((id) => id !== itemId));
            setRightChecked((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        },
        [csIdList, mechIdList, onCsChange, onMechChange]
    );

    // Checkbox toggles
    const toggleLeftAll = () => {
        if (leftChecked.size === filteredAvailable.length && filteredAvailable.length > 0) {
            setLeftChecked(new Set());
        } else {
            setLeftChecked(new Set(filteredAvailable.map((i) => i.id)));
        }
    };

    const toggleRightAll = () => {
        if (rightChecked.size === filteredSelected.length && filteredSelected.length > 0) {
            setRightChecked(new Set());
        } else {
            setRightChecked(new Set(filteredSelected.map((i) => i.id)));
        }
    };

    const leftAllChecked = filteredAvailable.length > 0 && leftChecked.size === filteredAvailable.length;
    const rightAllChecked = filteredSelected.length > 0 && rightChecked.size === filteredSelected.length;

    return (
        <div className="space-y-3">
            {/* Header with Title & Staff Type Filter Option */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-lg border transition-colors",
                            isAssignmentEnabled
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40"
                                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                        )}
                    >
                        {isAssignmentEnabled ? <Users className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Personnel Assignment
                        </h4>
                    </div>
                    {isAssignmentEnabled ? (
                        <Badge
                            color="default"
                            className="hidden sm:inline-flex text-[10px] font-normal gap-1 py-0.5 px-2 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        >
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            <span>Suggestions Active</span>
                        </Badge>
                    ) : (
                        <Badge
                            color="default"
                            className="hidden sm:inline-flex text-[10px] font-normal gap-1.5 py-0.5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                        >
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Disabled: Requires 3 Selections</span>
                        </Badge>
                    )}
                </div>

                {/* Option เลือก Staff Type */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-slate-400" />
                        <span>Staff Type:</span>
                    </span>
                    <Select
                        value={selectedStaffTypeId > 0 ? String(selectedStaffTypeId) : ""}
                        onValueChange={(val) => setSelectedStaffTypeId(Number(val))}
                    >
                        <SelectTrigger
                            className={cn(
                                "h-8 w-[175px] text-xs bg-white dark:bg-slate-900 border transition-all",
                                selectedStaffTypeId === 0
                                    ? "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium"
                                    : "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            )}
                        >
                            <SelectValue placeholder="-- Select* --" />
                        </SelectTrigger>
                        <SelectContent className="text-xs z-50">
                            {staffTypes.map((st) => (
                                <SelectItem key={st.id} value={String(st.id)}>
                                    {st.code === "CS"
                                        ? "CS (Certified Staff)"
                                        : st.code === "MECH"
                                            ? "MECH (Mechanic)"
                                            : st.code}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Transfer Box Component */}
            <div
                className={cn(
                    "relative rounded-xl border border-slate-200/90 dark:border-slate-800 p-2 shadow-xs min-h-[340px] max-h-[400px] overflow-hidden transition-colors",
                    !isAssignmentEnabled
                        ? "bg-slate-50/90 dark:bg-slate-900/60"
                        : "bg-white dark:bg-slate-950"
                )}
            >
                {/* ── Locked Overlay when !isAssignmentEnabled ── */}
                {!isAssignmentEnabled && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-100/80 dark:bg-slate-900/85 backdrop-blur-[2px] p-4 text-center select-none">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 mb-2 shadow-xs ring-4 ring-slate-100 dark:ring-slate-800/60">
                            <Lock className="h-5 w-5" />
                        </div>
                        <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Personnel Assignment Disabled
                        </h5>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md">
                            Please select all 3 required fields to enable assignment and view suggestions:
                        </p>

                        {/* Status badges of the 3 required fields */}
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 max-w-lg">
                            {/* 1. airlineId */}
                            <div
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                                    resolvedAirlineId > 0
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                                        : "bg-slate-200/80 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                )}
                            >
                                {resolvedAirlineId > 0 ? (
                                    <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                                )}
                                <span>1. Airline (airlineId) {resolvedAirlineId > 0 ? "✓" : "Required"}</span>
                            </div>

                            {/* 2. aircraftTypesId */}
                            <div
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                                    resolvedAircraftTypesId > 0
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                                        : "bg-slate-200/80 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                )}
                            >
                                {resolvedAircraftTypesId > 0 ? (
                                    <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                                )}
                                <span>2. A/C Type (aircraftTypesId) {resolvedAircraftTypesId > 0 ? "✓" : "Required"}</span>
                            </div>

                            {/* 3. staffsTypeId */}
                            <div
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                                    selectedStaffTypeId > 0
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                                        : "bg-slate-200/80 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                )}
                            >
                                {selectedStaffTypeId > 0 ? (
                                    <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                                )}
                                <span>3. Staff Type (staffsTypeId) {selectedStaffTypeId > 0 ? "✓" : "Select above"}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transfer Box Panels */}
                <div
                    className={cn(
                        "flex gap-2 w-full h-full min-h-[320px]",
                        !isAssignmentEnabled && "opacity-35 pointer-events-none select-none filter blur-[0.4px]"
                    )}
                >
                    {/* ── Left Panel: Available Staff ── */}
                    <div className="flex flex-1 flex-col min-h-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden">
                        {/* Tab Switcher: Suggested | All Staff */}
                        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 p-1 gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveTab("suggested")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all cursor-pointer",
                                    activeTab === "suggested"
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                )}
                            >
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>Suggested ({suggestedStaffList.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("all")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all cursor-pointer",
                                    activeTab === "all"
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                )}
                            >
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>All Staff ({allStaffList.length})</span>
                            </button>
                        </div>

                        {/* Subheader: Select All Checkbox + Items Count + Search Input */}
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-2.5 py-1.5 bg-white dark:bg-slate-900/50 shrink-0">
                            <button
                                type="button"
                                onClick={toggleLeftAll}
                                className="flex items-center justify-center shrink-0 cursor-pointer"
                            >
                                <CheckboxIndicator
                                    checked={leftAllChecked}
                                    indeterminate={!leftAllChecked && leftChecked.size > 0}
                                />
                            </button>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                                {filteredAvailable.length} items
                            </span>
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={leftSearch}
                                    onChange={(e) => setLeftSearch(e.target.value)}
                                    placeholder="Search by name or code..."
                                    className="h-7 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-7 pr-6 text-[11px] outline-none focus:border-blue-400 dark:text-slate-100"
                                />
                                {leftSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setLeftSearch("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Left Scrollable List */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/40">
                            {isLoadingSuggestions || isLoadingAllStaff ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    <span>Loading staff list...</span>
                                </div>
                            ) : filteredAvailable.length > 0 ? (
                                filteredAvailable.map((item) => {
                                    const checked = leftChecked.has(item.id);
                                    const isCS = item.staffTypeCode === "CS";

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setLeftChecked((prev) => {
                                                    const next = new Set(prev);
                                                    if (next.has(item.id)) next.delete(item.id);
                                                    else next.add(item.id);
                                                    return next;
                                                });
                                            }}
                                            onDoubleClick={() => handleQuickAdd(item)}
                                            className={cn(
                                                "flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors select-none text-[11px]",
                                                checked
                                                    ? "bg-blue-50/80 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                                                    : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200"
                                            )}
                                        >
                                            <div className="shrink-0">
                                                <CheckboxIndicator checked={checked} />
                                            </div>

                                            {/* Avatar Initials */}
                                            <div
                                                className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                                                    isCS
                                                        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300"
                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                                                )}
                                            >
                                                {getInitials(item.name || "")}
                                            </div>

                                            {/* Name, Code, and Badges */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                        {item.name}
                                                    </span>
                                                    {item.isSuggested && (
                                                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80">
                                                            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                                            Suggested
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                    <span>{item.code}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span
                                                        className={cn(
                                                            "font-medium",
                                                            isCS ? "text-cyan-600 dark:text-cyan-400" : "text-amber-600 dark:text-amber-400"
                                                        )}
                                                    >
                                                        {item.staffTypeCode}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Double click prompt / Quick transfer */}
                                            <button
                                                type="button"
                                                title="Add to selected"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickAdd(item);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 rounded p-0.5 transition-opacity"
                                            >
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs gap-1.5">
                                    <Package className="w-6 h-6 opacity-30" />
                                    <p>
                                        {leftSearch
                                            ? `No staff matching "${leftSearch}"`
                                            : activeTab === "suggested"
                                                ? "No suggested staff for this flight configuration"
                                                : "No staff available"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Center: Transfer Arrow Buttons ── */}
                    <div className="flex flex-col items-center justify-center gap-2 px-1 shrink-0">
                        <button
                            type="button"
                            disabled={leftChecked.size === 0}
                            onClick={moveRight}
                            title="Add checked staff to selection"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            disabled={rightChecked.size === 0}
                            onClick={moveLeft}
                            title="Remove checked staff from selection"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-300 disabled:opacity-30 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    </div>

                    {/* ── Right Panel: Selected Staff (Grouped by Staff Type) ── */}
                    <div className="flex flex-1 flex-col min-h-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                        {/* Subheader: Select All Checkbox + Selected Count + Search Input */}
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-2.5 py-1.5 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
                            <button
                                type="button"
                                onClick={toggleRightAll}
                                className="flex items-center justify-center shrink-0 cursor-pointer"
                            >
                                <CheckboxIndicator
                                    checked={rightAllChecked}
                                    indeterminate={!rightAllChecked && rightChecked.size > 0}
                                />
                            </button>
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                {selectedStaffList.length} selected
                            </span>
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={rightSearch}
                                    onChange={(e) => setRightSearch(e.target.value)}
                                    placeholder="Search selected..."
                                    className="h-7 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-7 pr-6 text-[11px] outline-none focus:border-blue-400 dark:text-slate-100"
                                />
                                {rightSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setRightSearch("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right Scrollable List (Grouped by Staff Type) */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-1 space-y-2">
                            {groupedSelected.length > 0 ? (
                                groupedSelected.map(([groupKey, group]) => {
                                    const isCollapsed = collapsedGroups.has(groupKey);

                                    return (
                                        <div
                                            key={groupKey}
                                            className="rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20 overflow-hidden"
                                        >
                                            {/* Group Accordion Header */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCollapsedGroups((prev) => {
                                                        const next = new Set(prev);
                                                        if (isCollapsed) next.delete(groupKey);
                                                        else next.add(groupKey);
                                                        return next;
                                                    });
                                                }}
                                                className="w-full flex items-center justify-between px-2 py-1.5 bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-100 transition-colors cursor-pointer text-left"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <ChevronDown
                                                        className={cn(
                                                            "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                                                            isCollapsed && "-rotate-90"
                                                        )}
                                                    />
                                                    <span
                                                        className={cn(
                                                            "text-[11px] font-bold uppercase tracking-wider",
                                                            group.color
                                                        )}
                                                    >
                                                        {group.label}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    {group.items.length}
                                                </span>
                                            </button>

                                            {/* Group Items */}
                                            {!isCollapsed && (
                                                <div className="p-1 divide-y divide-slate-100 dark:divide-slate-800/40">
                                                    {group.items.length > 0 ? (
                                                        group.items.map((item) => {
                                                            const checked = rightChecked.has(item.id);

                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        setRightChecked((prev) => {
                                                                            const next = new Set(prev);
                                                                            if (next.has(item.id)) next.delete(item.id);
                                                                            else next.add(item.id);
                                                                            return next;
                                                                        });
                                                                    }}
                                                                    onDoubleClick={() => handleQuickRemove(item.id)}
                                                                    className={cn(
                                                                        "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors select-none text-[11px]",
                                                                        checked
                                                                            ? "bg-red-50/80 text-red-900 dark:bg-red-950/40 dark:text-red-200"
                                                                            : "hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200"
                                                                    )}
                                                                >
                                                                    <div className="shrink-0">
                                                                        <CheckboxIndicator checked={checked} />
                                                                    </div>

                                                                    {/* Avatar Initials */}
                                                                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[9px] font-bold shrink-0">
                                                                        {getInitials(item.name || "")}
                                                                    </div>

                                                                    {/* Name & Code */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                                                                            {item.name}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {item.code}
                                                                        </span>
                                                                    </div>

                                                                    {/* Quick Remove Button */}
                                                                    <button
                                                                        type="button"
                                                                        title="Remove from selection"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleQuickRemove(item.id);
                                                                        }}
                                                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 p-1 rounded transition-colors cursor-pointer"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="py-2 text-center text-[10px] text-slate-400 italic">
                                                            No {groupKey} staff assigned
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs gap-1.5">
                                    <Package className="w-6 h-6 opacity-30" />
                                    <p>No staff assigned yet</p>
                                    <p className="text-[10px] text-slate-400">
                                        Select staff on the left and click &gt; to assign
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* End Transfer Box Panels */}
                </div>
                {/* End Relative Transfer Box */}
            </div>
        </div>
    );
};

export default PersonnelSection;