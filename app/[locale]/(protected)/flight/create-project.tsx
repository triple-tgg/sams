"use client";

import * as React from "react";
import { useForm, SubmitHandler, Controller, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { getLangDir } from "rtl-detect";
import { useParams } from "next/navigation";

import { useAddFlight } from "@/lib/api/hooks/useAddFlight";
import { addFlight, type FlightData } from "@/lib/api/flight/addFlight";
import { useAirlineOptions } from "@/lib/api/hooks/useAirlines";
import { useStationsOptions } from "@/lib/api/hooks/useStations";
import { useStatusOptions } from "@/lib/api/hooks/useStatus";
import { FieldError } from "@/components/ui/field-error";
import { combineFormToUtcDatetime } from "@/lib/utils/flightDatetime";
import { CustomDateInput } from "@/components/ui/input-date/CustomDateInput";
import { CustomTimeInput } from "@/components/ui/input-time/CustomTimeInput";
import { SearchableSelectField } from "@/components/ui/search-select";
import { CreatableRouteSelect } from "@/components/ui/creatable-route-select";
import { useAircraftTypes } from "@/lib/api/hooks/useAircraftTypes";
import { useMaintenanceStatus } from "@/lib/api/hooks/useMaintenanceStatus";
import { useCombinations, useSystemConfigs } from "@/lib/api/master/aircraft-engine/aircraftEngine.hooks";
import type { AircraftEngineCombination } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";
import type { FlightValidateResponse } from "@/components/flight-timeline/types/flight-import.types";
import axios from "@/lib/axios.config";
import { toast } from "sonner";
import { useMemo, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PersonnelSection } from "./thf/create/components/CPresonel";
import { Badge } from "@/components/ui/badge";
import { useStaff } from "@/lib/api/hooks/useStaff";
import {
  PlaneTakeoff,
  Repeat,
  ArrowRight,
  ArrowLeft,
  CalendarRange,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Pencil,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------
// Types & Enums
// ------------------------------------------------------
export type FlightEntryMode = "one-time" | "recurring";

export interface GeneratedRecurringFlight {
  tempId: string;
  arrivalDate: string; // DD/MM/YYYY
  departureDate: string; // DD/MM/YYYY
  dayLabel: string;
  flightArrival: string;
  sta: string;
  ata: string;
  flightDeparture: string;
  std: string;
  atd: string;
  customerValue: string;
  customerLabel: string;
  stationValue: string;
  stationLabel: string;
  acReg: string;
  acTypeValue: string;
  routeFrom: string;
  routeTo: string;
  bay: string;
  statusValue: string;
  note: string;
  thfNumber: string;
  userName: string;
  csIdList: number[] | null;
  csNames: string;
  mechIdList: number[] | null;
  mechNames: string;
  mappedFamilyCode?: string;
  series?: string;
  engineCode?: string;
  airlinesId?: number;
  stationId?: number;
  acTypeId?: number;
  aircraftEngineId?: number;
  maintenanceStatusId?: number;
}

const DAYS_OF_WEEK = [
  { day: 1, label: "Mon", fullLabel: "Monday" },
  { day: 2, label: "Tue", fullLabel: "Tuesday" },
  { day: 3, label: "Wed", fullLabel: "Wednesday" },
  { day: 4, label: "Thu", fullLabel: "Thursday" },
  { day: 5, label: "Fri", fullLabel: "Friday" },
  { day: 6, label: "Sat", fullLabel: "Saturday" },
  { day: 0, label: "Sun", fullLabel: "Sunday" },
];

/**
 * Calculates recurring flight dates based on range and recurrence criteria
 */
export function calculateRecurringDates(
  startDateStr: string,
  endDateStr: string,
  frequency: "daily" | "weekly",
  daysOfWeek: number[],
  isDepartureNextDay: boolean = false
): { arrivalDate: string; departureDate: string; dayLabel: string }[] {
  if (!startDateStr || !endDateStr) return [];
  const startParts = startDateStr.split("/");
  const endParts = endDateStr.split("/");
  if (startParts.length !== 3 || endParts.length !== 3) return [];

  const start = new Date(Number(startParts[2]), Number(startParts[1]) - 1, Number(startParts[0]));
  const end = new Date(Number(endParts[2]), Number(endParts[1]) - 1, Number(endParts[0]));
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const results: { arrivalDate: string; departureDate: string; dayLabel: string }[] = [];
  const curr = new Date(start);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  while (curr <= end) {
    const day = curr.getDay();
    if (frequency === "daily" || daysOfWeek.includes(day)) {
      const dStr = `${String(curr.getDate()).padStart(2, "0")}/${String(curr.getMonth() + 1).padStart(2, "0")}/${curr.getFullYear()}`;
      let depStr = dStr;
      if (isDepartureNextDay) {
        const next = new Date(curr);
        next.setDate(next.getDate() + 1);
        depStr = `${String(next.getDate()).padStart(2, "0")}/${String(next.getMonth() + 1).padStart(2, "0")}/${next.getFullYear()}`;
      }
      results.push({ arrivalDate: dStr, departureDate: depStr, dayLabel: dayNames[day] });
    }
    curr.setDate(curr.getDate() + 1);
    if (results.length > 366) break; // Limit up to 1 year batch
  }
  return results;
}

// RHF form values (before transform -> API payload)
const FormSchema = z.object({
  customer: z.object({ value: z.string(), label: z.string() }).nullable().refine(Boolean, "Customer / Airlines is required"),
  station: z.object({ value: z.string(), label: z.string() }).nullable().refine(Boolean, "Station is required"),

  acReg: z.string().trim().optional().default(""),
  acType: z.object({ value: z.string(), label: z.string() }).nullable().refine(Boolean, "A/C Type is required"),
  series: z.string().optional().default(""),
  engineCode: z.string().optional().default(""),
  flightArrival: z.string().trim().min(1, "Flight number is required").min(2, "Flight number must be at least 2 characters"),
  arrivalDate: z.string().optional().default(""),
  sta: z.string().min(1, "STA is required").regex(/^\d{2}:\d{2}$/, "STA format must be HH:mm"),
  ata: z.string().regex(/^\d{2}:\d{2}$/, "ATA format must be HH:mm").optional().or(z.literal("")),
  routeFrom: z.object({ value: z.string(), label: z.string() }).nullable().optional(),

  flightDeparture: z.string().trim().optional().default(""),
  departureDate: z.string().optional().default(""),
  std: z.string().regex(/^\d{2}:\d{2}$/, "STD format must be HH:mm").optional().or(z.literal("")),
  atd: z.string().regex(/^\d{2}:\d{2}$/, "ATD format must be HH:mm").optional().or(z.literal("")),
  routeTo: z.object({ value: z.string(), label: z.string() }).nullable().optional(),

  bay: z.string().trim().optional().default(""),
  thfNumber: z.string().trim().optional().default(""),
  status: z.object({ value: z.string(), label: z.string() }).nullable().default({ value: "Normal", label: "Normal" }),
  note: z.string().trim().optional().default(""),

  maintenanceStatus: z.object({ value: z.string(), label: z.string(), id: z.number() }).nullable().optional().default(null),
  userName: z.string().trim().optional().default(""),
  csIdList: z.array(z.number()).nullable().default(null),
  mechIdList: z.array(z.number()).nullable().default(null),
});

export type Inputs = z.infer<typeof FormSchema>;

const DEFAULT_FORM_VALUES: Inputs = {
  customer: null,
  station: null,
  acReg: "",
  acType: null,
  series: "",
  engineCode: "",
  flightArrival: "",
  arrivalDate: "",
  sta: "",
  ata: "",
  flightDeparture: "",
  departureDate: "",
  std: "",
  atd: "",
  routeFrom: null,
  routeTo: null,
  bay: "",
  thfNumber: "",
  status: { value: "Normal", label: "Normal" },
  note: "",
  maintenanceStatus: null,
  userName: "",
  csIdList: null,
  mechIdList: null,
};

// ------------------------------------------------------
// Component
// ------------------------------------------------------
interface CreateTaskProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CreateProject({ open, setOpen }: CreateTaskProps) {
  const params = useParams<{ locale: string }>();
  const direction = getLangDir(params?.locale ?? "");
  const queryClient = useQueryClient();

  // Mode & Step state: "select-mode" -> "fill-info" -> "preview-recurring"
  const [step, setStep] = useState<"select-mode" | "fill-info" | "preview-recurring">("select-mode");
  const [flightMode, setFlightMode] = useState<FlightEntryMode>("one-time");

  // Recurring settings state
  const [recurringFrequency, setRecurringFrequency] = useState<"daily" | "weekly">("daily");
  const [recurringDays, setRecurringDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [recurringStartDate, setRecurringStartDate] = useState<string>("");
  const [recurringEndDate, setRecurringEndDate] = useState<string>("");
  const [isDepartureNextDay, setIsDepartureNextDay] = useState<boolean>(false);
  const [isSubmittingRecurring, setIsSubmittingRecurring] = useState<boolean>(false);
  const [recurringProgress, setRecurringProgress] = useState<{ current: number; total: number } | null>(null);
  const [recurrenceErrors, setRecurrenceErrors] = useState<{
    startDate?: string;
    endDate?: string;
    days?: string;
  }>({});

  // Generated flights for preview table
  const [generatedFlights, setGeneratedFlights] = useState<GeneratedRecurringFlight[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowEditData, setRowEditData] = useState<Partial<GeneratedRecurringFlight>>({});
  const [isValidatingRecurring, setIsValidatingRecurring] = useState<boolean>(false);
  const [validationResultMap, setValidationResultMap] = useState<Record<number, { isValid: boolean; statusText?: string }> | null>(null);

  // Fetch staff list to resolve staff display names
  const { data: allStaffData } = useStaff({ code: "", name: "", id: "" }, true);
  const staffList = useMemo(() => allStaffData?.responseData || [], [allStaffData]);

  // Master data hooks
  const { aircraftTypes } = useAircraftTypes();
  const { options: maintenanceStatusOptions } = useMaintenanceStatus();

  // Use airline options hook
  const {
    options: customerOptions,
    isLoading: loadingAirlines,
    error: airlinesError,
    usingFallback,
  } = useAirlineOptions();

  // Use stations options hook
  const {
    options: stationOptions,
    isLoading: loadingStations,
    error: stationsError,
    usingFallback: stationsUsingFallback,
  } = useStationsOptions();

  // Use status options hook
  const {
    options: statusOptions,
    isLoading: loadingStatus,
    error: statusError,
    usingFallback: statusUsingFallback,
  } = useStatusOptions();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
    setError,
  } = useForm<Inputs>({
    resolver: zodResolver(FormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  // Comprehensive reset for all form inputs and modal states
  const resetAllForm = React.useCallback(() => {
    reset(DEFAULT_FORM_VALUES);
    setStep("select-mode");
    setFlightMode("one-time");
    setRecurringFrequency("daily");
    setRecurringDays([1, 2, 3, 4, 5]);
    setRecurringStartDate("");
    setRecurringEndDate("");
    setIsDepartureNextDay(false);
    setIsSubmittingRecurring(false);
    setRecurringProgress(null);
    setRecurrenceErrors({});
    setGeneratedFlights([]);
    setEditingRowId(null);
    setRowEditData({});
    setComboMode("combination");
    setSelectedComboId("");
    setIsValidatingRecurring(false);
    setValidationResultMap(null);
  }, [reset]);

  // Reset all form data and state whenever dialog closes
  useEffect(() => {
    if (!open) {
      resetAllForm();
    }
  }, [open, resetAllForm]);

  const { mutate, isPending } = useAddFlight();

  // Calculate matching recurring dates
  const calculatedDates = useMemo(() => {
    if (flightMode !== "recurring") return [];
    return calculateRecurringDates(
      recurringStartDate,
      recurringEndDate,
      recurringFrequency,
      recurringDays,
      isDepartureNextDay
    );
  }, [flightMode, recurringStartDate, recurringEndDate, recurringFrequency, recurringDays, isDepartureNextDay]);

  // Validate recurrence fields specifically (can be called by onValid or onInvalid)
  const validateRecurrence = (): boolean => {
    if (flightMode !== "recurring") return true;

    const rErrors: { startDate?: string; endDate?: string; days?: string } = {};

    if (!recurringStartDate || !recurringStartDate.trim()) {
      rErrors.startDate = "Start Date is required";
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(recurringStartDate.trim())) {
      rErrors.startDate = "Invalid date format (DD-MMM-YYYY)";
    }

    if (!recurringEndDate || !recurringEndDate.trim()) {
      rErrors.endDate = "End Date is required";
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(recurringEndDate.trim())) {
      rErrors.endDate = "Invalid date format (DD-MMM-YYYY)";
    }

    if (
      recurringStartDate &&
      recurringEndDate &&
      !rErrors.startDate &&
      !rErrors.endDate
    ) {
      const sParts = recurringStartDate.split("/");
      const eParts = recurringEndDate.split("/");
      if (sParts.length === 3 && eParts.length === 3) {
        const sDate = new Date(Number(sParts[2]), Number(sParts[1]) - 1, Number(sParts[0]));
        const eDate = new Date(Number(eParts[2]), Number(eParts[1]) - 1, Number(eParts[0]));
        if (sDate > eDate) {
          rErrors.endDate = "End Date must be on or after Start Date";
        }
      }
    }

    if (recurringFrequency === "weekly" && recurringDays.length === 0) {
      rErrors.days = "Please select at least 1 day of the week";
    }

    setRecurrenceErrors(rErrors);
    return Object.keys(rErrors).length === 0;
  };

  // Runs when form has invalid fields upon submit
  const onInvalid = (_formErrors: FieldErrors<Inputs>) => {
    if (flightMode === "recurring") {
      validateRecurrence();
    } else {
      const arrDate = watch("arrivalDate");
      if (!arrDate || !/^\d{2}\/\d{2}\/\d{4}$/.test(arrDate)) {
        setError("arrivalDate", { message: "Arrival Date is required (DD-MMM-YYYY)" });
      }
    }
    toast.error("Please fill in all required fields marked with *");
  };

  const onSubmit: SubmitHandler<Inputs> = async (values) => {
    if (flightMode === "one-time") {
      // Validate single flight dates
      if (!values.arrivalDate || !/^\d{2}\/\d{2}\/\d{4}$/.test(values.arrivalDate)) {
        setError("arrivalDate", { message: "Arrival Date is required (DD-MMM-YYYY)" });
        return;
      }
      const anyDep = !!(values.flightDeparture || values.departureDate || values.std || values.atd);
      if (anyDep && (!values.departureDate || !values.std)) {
        setError("departureDate", { message: "If departure provided, Date & STD are required" });
        return;
      }

      const payload: FlightData = {
        id: 0,
        airlinesCode: values.customer!.value.trim(),
        stationsCode: values.station!.value.trim(),
        acReg: (values.acReg ?? "").trim(),
        acTypeCode: values.acType!.value.trim(),
        arrivalFlightNo: values.flightArrival.trim(),
        arrivalStaDate: combineFormToUtcDatetime(values.arrivalDate, values.sta),
        arrivalAtaDate: values.ata?.trim() ? combineFormToUtcDatetime(values.arrivalDate, values.ata) : "",
        departureFlightNo: (values.flightDeparture ?? "").trim(),
        departureStdDate: values.departureDate && values.std ? combineFormToUtcDatetime(values.departureDate, values.std) : "",
        departureAtdDate: values.departureDate && values.atd?.trim() ? combineFormToUtcDatetime(values.departureDate, values.atd) : "",
        bayNo: (values.bay ?? "").trim(),
        thfNo: (values.thfNumber ?? "").trim(),
        statusCode: values.status?.value ?? "Normal",
        note: (values.note ?? "").trim(),

        routeForm: values.routeFrom?.value ?? "",
        routeTo: values.routeTo?.value ?? "",

        userName: values.userName.trim() ?? "",
        csIdList: values.csIdList || null,
        mechIdList: values.mechIdList || null,
        aircraftEngineCode: mappedFamilyCode,
        familyCode: mappedFamilyCode,
        series: values.series || "",
        engineCode: values.engineCode || "",
      };

      mutate(
        { payload },
        {
          onSuccess: () => {
            toast.success("Flight was added successfully.");
            resetAllForm();
            setOpen(false);
          },
          onError: (err) => {
            toast.error(err?.message ?? "Submit failed");
          },
        }
      );
    } else {
      // Recurring Mode -> Validate recurrence fields & generate preview
      const isRecurrenceValid = validateRecurrence();
      if (!isRecurrenceValid) {
        if (recurrenceErrors.startDate) toast.error(recurrenceErrors.startDate);
        else if (recurrenceErrors.endDate) toast.error(recurrenceErrors.endDate);
        else if (recurrenceErrors.days) toast.error(recurrenceErrors.days);
        return;
      }

      if (calculatedDates.length === 0) {
        toast.error("No dates match the recurrence criteria. Please verify date range and days of the week");
        return;
      }
      const anyDep = !!(values.flightDeparture || values.std || values.atd);
      if (anyDep && !values.std) {
        setError("std", { message: "STD is required if departure flight is provided" });
        return;
      }

      const csStaffNames = (values.csIdList || [])
        .map((id) => {
          const s = staffList.find((s) => s.id === id);
          return (s as any)?.fullNameEn || (s as any)?.nameEn || (s as any)?.displayName || s?.name || `#${id}`;
        })
        .join(", ");
      const mechStaffNames = (values.mechIdList || [])
        .map((id) => {
          const s = staffList.find((s) => s.id === id);
          return (s as any)?.fullNameEn || (s as any)?.nameEn || (s as any)?.displayName || s?.name || `#${id}`;
        })
        .join(", ");

      const selectedAirline = customerOptions.find((o) => o.value === values.customer?.value);
      const airlinesId = selectedAirline?.id ?? (values.customer as any)?.id ?? 0;

      const selectedStation = stationOptions.find((o) => o.value === values.station?.value);
      const stationId = selectedStation?.id ?? (values.station as any)?.id ?? 0;

      const selectedAcTypeItem = aircraftTypes.find(
        (t) => t.code === (mappedFamilyCode || values.acType?.value)
      );
      const acTypeId = selectedAcTypeItem?.id ?? (values.acType as any)?.id ?? 0;

      const aircraftEngineId =
        Number(selectedComboId) ||
        combinationsData?.find(
          (c) =>
            c.familyCode === mappedFamilyCode &&
            c.series === values.series &&
            c.engineCode === values.engineCode
        )?.id ||
        0;

      const matchedMaintStatus = maintenanceStatusOptions.find(
        (m) => m.value.toLowerCase() === (values.status?.value || "").toLowerCase()
      );
      const maintenanceStatusId =
        (values.maintenanceStatus as any)?.id ?? matchedMaintStatus?.id ?? 2;

      const list: GeneratedRecurringFlight[] = calculatedDates.map((item, idx) => ({
        tempId: `rf-${Date.now()}-${idx}`,
        arrivalDate: item.arrivalDate,
        departureDate: item.departureDate,
        dayLabel: item.dayLabel,
        flightArrival: values.flightArrival.trim(),
        sta: values.sta || "",
        ata: values.ata || "",
        flightDeparture: (values.flightDeparture ?? "").trim(),
        std: values.std || "",
        atd: values.atd || "",
        customerValue: values.customer!.value.trim(),
        customerLabel: values.customer!.label || values.customer!.value.trim(),
        stationValue: values.station!.value.trim(),
        stationLabel: values.station!.label || values.station!.value.trim(),
        acReg: (values.acReg ?? "").trim(),
        acTypeValue: values.acType!.value.trim(),
        routeFrom: values.routeFrom?.value ?? "",
        routeTo: values.routeTo?.value ?? "",
        bay: (values.bay ?? "").trim(),
        statusValue: values.status?.value ?? "Normal",
        note: (values.note ?? "").trim(),
        thfNumber: (values.thfNumber ?? "").trim(),
        userName: values.userName.trim() ?? "",
        csIdList: values.csIdList || null,
        csNames: csStaffNames,
        mechIdList: values.mechIdList || null,
        mechNames: mechStaffNames,
        mappedFamilyCode: mappedFamilyCode,
        series: values.series || "",
        engineCode: values.engineCode || "",
        airlinesId,
        stationId,
        acTypeId,
        aircraftEngineId,
        maintenanceStatusId,
      }));

      setGeneratedFlights(list);
      setEditingRowId(null);
      setRowEditData({});
      setValidationResultMap(null);
      setStep("preview-recurring");
      toast.success(`Generated ${list.length} recurring flights. Review and edit before submitting.`);
    }
  };

  const handleStartEdit = (row: GeneratedRecurringFlight) => {
    setEditingRowId(row.tempId);
    setRowEditData({ ...row });
  };

  const handleSaveEdit = (tempId: string) => {
    setGeneratedFlights((prev) =>
      prev.map((item) => (item.tempId === tempId ? ({ ...item, ...rowEditData } as GeneratedRecurringFlight) : item))
    );
    setEditingRowId(null);
    setRowEditData({});
    setValidationResultMap(null);
    toast.success("Flight record updated");
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setRowEditData({});
  };

  const handleDeleteRow = (tempId: string) => {
    setGeneratedFlights((prev) => prev.filter((item) => item.tempId !== tempId));
    setValidationResultMap(null);
    toast.info("Flight record removed");
  };

  const buildRecurringApiPayload = (flights: GeneratedRecurringFlight[], isImport: boolean = false) => {
    return flights.map((item, idx) => {
      const staUtc = combineFormToUtcDatetime(item.arrivalDate, item.sta);
      const stdUtc = item.departureDate && item.std ? combineFormToUtcDatetime(item.departureDate, item.std) : "";
      const baseItem: Record<string, any> = {
        rowId: idx + 1,
        airlinesId: item.airlinesId ?? 0,
        stationId: item.stationId ?? 0,
        acTypeId: item.acTypeId ?? 0,
        aircraftEngineId: item.aircraftEngineId ?? 0,
        familyCode: item.mappedFamilyCode || item.acTypeValue || "",
        series: item.series || "",
        engineCode: item.engineCode || "",
        acReg: item.acReg || "",
        arrivalFlightNo: item.flightArrival || "",
        departureFlightNo: item.flightDeparture || "",
        routeFrom: item.routeFrom || "",
        routeTo: item.routeTo || "",
        arrivalStaDate: staUtc,
        departureStdDate: stdUtc,
        etaDate: staUtc,
        bayNo: item.bay || "",
        csIdList: item.csIdList || [],
        mechIdList: item.mechIdList || [],
        maintenanceStatusId: item.maintenanceStatusId ?? 2,
        note: item.note || "",
      };

      if (isImport) {
        baseItem.datasource = "recurring";
      }

      return baseItem;
    });
  };

  const handleValidateRecurring = async () => {
    if (generatedFlights.length === 0) {
      toast.error("No flights to validate");
      return;
    }

    setIsValidatingRecurring(true);
    try {
      const payload = buildRecurringApiPayload(generatedFlights, false);
      const response = await axios.post<FlightValidateResponse>(
        "/flight/importlist-filghtinfo-validate",
        payload
      );

      const resData = response.data?.responseData;
      const resultMap: Record<number, { isValid: boolean; statusText?: string }> = {};
      let hasError = false;

      if (resData?.validateFilghtList && Array.isArray(resData.validateFilghtList)) {
        resData.validateFilghtList.forEach((v) => {
          const isRowValid = !v.statusText;
          if (!isRowValid) hasError = true;
          resultMap[v.rowId] = {
            isValid: isRowValid,
            statusText: v.statusText || undefined,
          };
        });
      }

      setValidationResultMap(resultMap);

      if (resData?.flagPass || !hasError) {
        toast.success("Validation passed! All flights are valid.");
      } else {
        toast.error("Validation issues found. Please review the highlighted flights.", {
          duration: Infinity,
          closeButton: true,
        });
      }
    } catch (err: any) {
      console.error("Validate recurring error:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "An error occurred while validating flights";
      toast.error(errorMessage, {
        duration: Infinity,
        closeButton: true,
      });
    } finally {
      setIsValidatingRecurring(false);
    }
  };

  const handleFinalSubmitRecurring = async () => {
    if (generatedFlights.length === 0) {
      toast.error("No flights to submit. Please generate flights first.");
      return;
    }

    setIsSubmittingRecurring(true);

    try {
      const payload = buildRecurringApiPayload(generatedFlights, true);
      await axios.post("/flight/importlist-filghtinfo", payload);

      toast.success(`Successfully created ${generatedFlights.length} recurring flights`);
      queryClient.invalidateQueries({ queryKey: ["flightList"] });
      queryClient.invalidateQueries({ queryKey: ["flightListPlanby"] });
      resetAllForm();
      setOpen(false);
    } catch (err: any) {
      console.error("Submit recurring error:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "An error occurred while creating recurring flights";
      toast.error(errorMessage, {
        duration: Infinity,
        closeButton: true,
      });
    } finally {
      setIsSubmittingRecurring(false);
      setRecurringProgress(null);
    }
  };

  const { data: combinationsData } = useCombinations();
  const { data: systemConfigsData } = useSystemConfigs();

  const familyCodeOptions = useMemo(() => {
    if (!systemConfigsData) return [];
    const seen = new Set<string>();
    return systemConfigsData
      .filter((c) => {
        if (!c.familyCode || seen.has(c.familyCode)) return false;
        seen.add(c.familyCode);
        return true;
      })
      .map((c) => ({ value: c.familyCode, label: c.familyCode }));
  }, [systemConfigsData]);
  const isLoadingFamilyCode = !systemConfigsData;

  const selectedAcType = watch("acType");
  const selectedSeries = watch("series");
  const selectedEngineCode = watch("engineCode");
  const mappedFamilyCode = selectedAcType?.value || "";

  const [comboMode, setComboMode] = useState<"combination" | "manual">("combination");
  const [selectedComboId, setSelectedComboId] = useState<string>("");

  const combinationOptions = useMemo(() => {
    if (!combinationsData || !mappedFamilyCode) return [];
    return combinationsData
      .filter((c: AircraftEngineCombination) => c.familyCode === mappedFamilyCode)
      .map((c: AircraftEngineCombination) => ({
        value: String(c.id),
        label: c.displayLabel,
        combo: c,
      }));
  }, [combinationsData, mappedFamilyCode]);

  const handleComboSelect = (comboId: string) => {
    setSelectedComboId(comboId);
    const found = combinationOptions.find((o) => o.value === comboId);
    if (found) {
      setValue("series", found.combo.series || "");
      setValue("engineCode", found.combo.engineCode || "");
    }
  };

  const prevAcTypeRef = React.useRef(selectedAcType?.value);
  useEffect(() => {
    if (prevAcTypeRef.current !== selectedAcType?.value) {
      setValue("series", "");
      setValue("engineCode", "");
      setSelectedComboId("");
      prevAcTypeRef.current = selectedAcType?.value;
    }
  }, [selectedAcType, setValue]);

  const handleModeChange = (mode: "combination" | "manual") => {
    setComboMode(mode);
    setValue("series", "");
    setValue("engineCode", "");
    setSelectedComboId("");
  };

  const isFormBusy = isPending || isSubmittingRecurring;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isFormBusy) {
          setOpen(o);
          if (!o) {
            resetAllForm();
          }
        }
      }}
    >
      <DialogContent
        size="md"
        className={cn(
          "transition-all duration-200 p-2 sm:p-4",
          step === "select-mode"
            ? "sm:max-w-155 max-h-[90vh]"
            : step === "preview-recurring"
              ? "sm:max-w-[95vw] lg:max-w-7xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden"
              : "h-full max-h-10/12"
        )}
        onInteractOutside={(e) => {
          if (isFormBusy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isFormBusy) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {step === "preview-recurring" ? "Recurring Flights Preview" : "Add Flight Information"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === "select-mode"
              ? "Select how you want to add flight information into the system"
              : step === "preview-recurring"
                ? "Review and edit the generated flights before adding them to the system"
                : flightMode === "one-time"
                  ? "Fill in one-time flight information"
                  : "Fill in recurring flight information based on recurrence pattern"}
          </DialogDescription>
        </DialogHeader>

        <Separator className="mb-3" />

        {/* ══════════════════════════════════════════════════════════
            STEP 1: SELECTION SCREEN
           ══════════════════════════════════════════════════════════ */}
        {step === "select-mode" ? (
          <div className="py-2 space-y-5">
            <div className="text-center space-y-1.5 max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Select Flight Entry Mode
              </div>
              <h3 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Which flight entry mode would you like to use?
              </h3>
              <p className="text-xs text-muted-foreground">
                Choose an entry mode before entering flight details
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-1">
              {/* Card 1: One-time Flight */}
              <div
                onClick={() => {
                  setFlightMode("one-time");
                  setStep("fill-info");
                }}
                className="group relative rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlaneTakeoff className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Single Flight
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                      One-time Flight
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Single Flight Entry
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Record an individual flight for a specific date and time. Ideal for standard operations or ad-hoc flights.
                  </p>
                  <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Specify exact departure and arrival dates/times</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Manage engineers and services per flight</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-5">
                  <Button
                    type="button"
                    color="primary"
                    className="w-full justify-between group-hover:bg-blue-600"
                    onClick={() => {
                      setFlightMode("one-time");
                      setStep("fill-info");
                    }}
                  >
                    <span>Select One-time Flight</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Card 2: Recurring Flight */}
              <div
                onClick={() => {
                  setFlightMode("recurring");
                  setStep("fill-info");
                }}
                className="group relative rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Repeat className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      Batch / Pattern
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 transition-colors">
                      Recurring Flight
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Batch Flight Entry
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Automatically generate recurring flights based on a schedule (e.g., daily or specific days of the week) across a date range.
                  </p>
                  <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Daily or weekly frequency recurrence</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Generate flight schedules in batch at once</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-5">
                  <Button
                    type="button"
                    color="secondary"
                    variant="outline"
                    className="w-full justify-between border-purple-300 text-purple-700 hover:bg-purple-600 hover:text-white"
                    onClick={() => {
                      setFlightMode("recurring");
                      setStep("fill-info");
                    }}
                  >
                    <span>Select Recurring Flight</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetAllForm();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : step === "fill-info" ? (
          /* ══════════════════════════════════════════════════════════
              STEP 2: FILL INFORMATION
             ══════════════════════════════════════════════════════════ */
          <>
            {/* Mode Switcher Banner */}
            <div
              className={cn(
                "flex flex-wrap items-center justify-between p-2.5 rounded-lg mb-3 border text-xs transition-colors",
                flightMode === "one-time"
                  ? "bg-blue-50/80 border-blue-200 text-blue-900"
                  : "bg-purple-50/80 border-purple-200 text-purple-900"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "p-1.5 text-white rounded-md",
                    flightMode === "one-time" ? "bg-blue-600" : "bg-purple-600"
                  )}
                >
                  {flightMode === "one-time" ? <PlaneTakeoff className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                </div>
                <div>
                  <span className="font-bold">
                    {flightMode === "one-time"
                      ? "One-time Flight"
                      : "Recurring Flight"}
                  </span>
                  <span className="text-[11px] opacity-80 block">
                    {flightMode === "one-time"
                      ? "Create an individual flight for a specific date"
                      : "Create a batch of flights based on recurrence pattern"}
                  </span>
                </div>
              </div>

              {/* Segmented toggle to switch mode without losing typed values */}
              <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 p-0.5 rounded-md border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setFlightMode("one-time")}
                  className={cn(
                    "px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1",
                    flightMode === "one-time" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <PlaneTakeoff className="w-3 h-3" />
                  <span>One-time</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlightMode("recurring")}
                  className={cn(
                    "px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1",
                    flightMode === "recurring" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Repeat className="w-3 h-3" />
                  <span>Recurring</span>
                </button>
              </div>
            </div>

            <ScrollArea className="[&>div>div[style]]:block!" dir={direction}>
              <form id="create-flight-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-3.5">
                {/* ── RECURRING SETTINGS CARD (when in Recurring mode) ── */}
                {flightMode === "recurring" && (
                  <div className="rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
                      <div className="flex items-center gap-2 text-purple-900 font-semibold text-sm">
                        <CalendarRange className="w-4 h-4 text-purple-600" />
                        <span>Recurrence Pattern & Date Range</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-purple-200 rounded-lg p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setRecurringFrequency("daily");
                            setRecurrenceErrors((prev) => ({ ...prev, days: undefined }));
                          }}
                          className={cn(
                            "px-3 py-1 rounded-md font-medium transition-colors",
                            recurringFrequency === "daily"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          Daily
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecurringFrequency("weekly")}
                          className={cn(
                            "px-3 py-1 rounded-md font-medium transition-colors",
                            recurringFrequency === "weekly"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          Weekly
                        </button>
                      </div>
                    </div>

                    {/* Weekly days selector */}
                    {recurringFrequency === "weekly" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-slate-700">
                            Select Days of the Week <span className="text-red-500 font-bold">*</span>
                          </Label>
                          <div className="flex items-center gap-1.5 text-[11px] text-purple-600">
                            <button
                              type="button"
                              className="hover:underline"
                              onClick={() => {
                                setRecurringDays([0, 1, 2, 3, 4, 5, 6]);
                                setRecurrenceErrors((prev) => ({ ...prev, days: undefined }));
                              }}
                            >
                              All Days
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              className="hover:underline"
                              onClick={() => {
                                setRecurringDays([1, 2, 3, 4, 5]);
                                setRecurrenceErrors((prev) => ({ ...prev, days: undefined }));
                              }}
                            >
                              Mon - Fri
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              className="hover:underline"
                              onClick={() => {
                                setRecurringDays([0, 6]);
                                setRecurrenceErrors((prev) => ({ ...prev, days: undefined }));
                              }}
                            >
                              Sat - Sun
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS_OF_WEEK.map((d) => {
                            const isSelected = recurringDays.includes(d.day);
                            return (
                              <button
                                key={d.day}
                                type="button"
                                onClick={() => {
                                  setRecurringDays((prev) => {
                                    const next = isSelected ? prev.filter((x) => x !== d.day) : [...prev, d.day];
                                    if (next.length > 0) {
                                      setRecurrenceErrors((p) => ({ ...p, days: undefined }));
                                    }
                                    return next;
                                  });
                                }}
                                className={cn(
                                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1",
                                  isSelected
                                    ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                                  recurrenceErrors.days && !isSelected && "border-red-300"
                                )}
                              >
                                <span>{d.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        {recurrenceErrors.days && (
                          <FieldError msg={recurrenceErrors.days} />
                        )}
                      </div>
                    )}

                    {/* Recurrence Date Range */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">
                          Start Date <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <CustomDateInput
                          value={recurringStartDate}
                          onChange={(val) => {
                            setRecurringStartDate(val);
                            setValue("arrivalDate", val);
                            setRecurrenceErrors((prev) => {
                              const next = { ...prev };
                              if (val) {
                                delete next.startDate;
                                if (recurringEndDate) {
                                  const sParts = val.split("/");
                                  const eParts = recurringEndDate.split("/");
                                  if (sParts.length === 3 && eParts.length === 3) {
                                    const sDate = new Date(Number(sParts[2]), Number(sParts[1]) - 1, Number(sParts[0]));
                                    const eDate = new Date(Number(eParts[2]), Number(eParts[1]) - 1, Number(eParts[0]));
                                    if (sDate > eDate) {
                                      next.endDate = "End Date must be on or after Start Date";
                                    } else if (next.endDate === "End Date must be on or after Start Date") {
                                      delete next.endDate;
                                    }
                                  }
                                }
                              }
                              return next;
                            });
                            if (!recurringEndDate) {
                              setRecurringEndDate(val);
                            }
                          }}
                          className={cn(recurrenceErrors.startDate && "border-red-500 focus-visible:ring-red-500")}
                          placeholder="DD-MMM-YYYY"
                        />
                        {recurrenceErrors.startDate && (
                          <FieldError msg={recurrenceErrors.startDate} />
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">
                          End Date <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <CustomDateInput
                          value={recurringEndDate}
                          onChange={(val) => {
                            setRecurringEndDate(val);
                            setRecurrenceErrors((prev) => {
                              const next = { ...prev };
                              if (val) {
                                delete next.endDate;
                                if (recurringStartDate) {
                                  const sParts = recurringStartDate.split("/");
                                  const eParts = val.split("/");
                                  if (sParts.length === 3 && eParts.length === 3) {
                                    const sDate = new Date(Number(sParts[2]), Number(sParts[1]) - 1, Number(sParts[0]));
                                    const eDate = new Date(Number(eParts[2]), Number(eParts[1]) - 1, Number(eParts[0]));
                                    if (sDate > eDate) {
                                      next.endDate = "End Date must be on or after Start Date";
                                    }
                                  }
                                }
                              }
                              return next;
                            });
                          }}
                          className={cn(recurrenceErrors.endDate && "border-red-500 focus-visible:ring-red-500")}
                          placeholder="DD-MMM-YYYY"
                        />
                        {recurrenceErrors.endDate && (
                          <FieldError msg={recurrenceErrors.endDate} />
                        )}
                      </div>
                    </div>

                    {/* Overnight option */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="isDepartureNextDay"
                        checked={isDepartureNextDay}
                        onChange={(e) => setIsDepartureNextDay(e.target.checked)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                      />
                      <label htmlFor="isDepartureNextDay" className="text-xs text-slate-700 cursor-pointer">
                        Departure arrives next day (+1 Day for Departure — e.g. overnight turnaround)
                      </label>
                    </div>

                    {/* Live Summary */}
                    <div className="p-2.5 rounded-lg bg-white border border-purple-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span>
                          {calculatedDates.length > 0 ? (
                            <>
                              Total flights to create:{" "}
                              <span className="font-bold text-purple-700 text-sm">{calculatedDates.length}</span>{" "}
                              flights
                              {calculatedDates.length > 0 && (
                                <span className="text-slate-500 font-normal ml-1">
                                  (First: {calculatedDates[0].arrivalDate}, Last:{" "}
                                  {calculatedDates[calculatedDates.length - 1].arrivalDate})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              Specify start and end dates to preview total flights to be created
                            </span>
                          )}
                        </span>
                      </div>
                      {calculatedDates.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
                          {recurringFrequency === "daily" ? "Daily" : `${recurringDays.length} days/week`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer / Station */}
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="customer">
                      Customer / Airlines <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Controller
                      name="customer"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.value}
                          onValueChange={(value) => {
                            const option = customerOptions.find((opt) => opt.value === value);
                            field.onChange(option || null);
                          }}
                          disabled={loadingAirlines || customerOptions.length === 0}
                        >
                          <SelectTrigger className={cn(errors.customer && "border-red-500 focus:ring-red-500")}>
                            <SelectValue
                              placeholder={
                                loadingAirlines
                                  ? "Loading airlines..."
                                  : airlinesError
                                    ? "Failed to load airlines"
                                    : customerOptions.length === 0
                                      ? "No airlines found"
                                      : "Select customer"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {customerOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError msg={errors.customer?.message as string | undefined} />
                    {usingFallback && (
                      <p className="text-sm text-amber-600">
                        ⚠ Using offline airline data due to API connection issue
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="station">
                      Station <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Controller
                      name="station"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.value}
                          onValueChange={(value) => {
                            const option = stationOptions.find((opt) => opt.value === value);
                            field.onChange(option || null);
                          }}
                          disabled={loadingStations || stationOptions.length === 0}
                        >
                          <SelectTrigger className={cn(errors.station && "border-red-500 focus:ring-red-500")}>
                            <SelectValue
                              placeholder={
                                loadingStations
                                  ? "Loading stations..."
                                  : stationsError
                                    ? "Failed to load stations"
                                    : stationOptions.length === 0
                                      ? "No stations found"
                                      : "Select station"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {stationOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError msg={errors.station?.message as string | undefined} />
                    {stationsUsingFallback && (
                      <p className="text-sm text-amber-600">
                        ⚠ Using offline station data due to API connection issue
                      </p>
                    )}
                  </div>
                </div>

                {/* Route From / Route To */}
                <div className="grid grid-cols-2 gap-4">
                  <CreatableRouteSelect
                    name="routeFrom"
                    control={control}
                    label="Route From"
                    placeholder="Select Route From"
                    errorMessage={errors.routeFrom?.message as string | undefined}
                  />
                  <CreatableRouteSelect
                    name="routeTo"
                    control={control}
                    label="Route To"
                    placeholder="Select Route To"
                    errorMessage={errors.routeTo?.message as string | undefined}
                  />
                </div>

                {/* A/C Reg / A/C Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="acReg">A/C Reg</Label>
                    <Input {...register("acReg")} placeholder="A/C Reg" autoComplete="off" />
                    <FieldError msg={errors.acReg?.message} />
                  </div>
                  <div className="space-y-1">
                    <SearchableSelectField
                      name="acType"
                      control={control}
                      label="A/C Type *"
                      placeholder="Select A/C Type"
                      options={familyCodeOptions}
                      isLoading={isLoadingFamilyCode}
                      errorMessage={errors.acType?.message}
                    />
                  </div>
                </div>

                {/* Aircraft-Engine Combination */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">Aircraft-Engine :</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={comboMode === "combination"}
                        onCheckedChange={(checked) => handleModeChange(checked ? "combination" : "manual")}
                        color="primary"
                        size="sm"
                      />
                      <span className="text-sm text-slate-600">Select Combination</span>
                    </div>
                  </div>

                  {comboMode === "combination" ? (
                    <div className="grid grid-cols-5 gap-4">
                      <div className="col-span-2 space-y-1">
                        <Label>Combination</Label>
                        <Select
                          value={selectedComboId || undefined}
                          onValueChange={handleComboSelect}
                          disabled={!selectedAcType?.value}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={selectedAcType?.value ? "Select Combination" : "Select A/C Type first"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {combinationOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Family Code</Label>
                        <Input value={mappedFamilyCode || ""} readOnly disabled className="bg-slate-50" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Series</Label>
                        <Input value={selectedSeries || ""} readOnly disabled className="bg-slate-50" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Engine Code</Label>
                        <Input value={selectedEngineCode || ""} readOnly disabled className="bg-slate-50" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label>Family Code</Label>
                        <Input
                          value={mappedFamilyCode || ""}
                          readOnly
                          disabled
                          placeholder="Select A/C Type first"
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Series</Label>
                        <Input {...register("series")} placeholder="e.g. NEO" disabled={!selectedAcType?.value} />
                      </div>
                      <div className="space-y-1">
                        <Label>Engine Code</Label>
                        <Input
                          {...register("engineCode")}
                          placeholder="e.g. LEAP-1A"
                          disabled={!selectedAcType?.value}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-3" />

                {/* ARRIVAL + DEPARTURE */}
                <div className="grid lg:grid-cols-2 gap-4">
                  {/* ARRIVAL */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Arrival (Local Time)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="flightArrival">
                          Flight No <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Input
                          {...register("flightArrival")}
                          placeholder="Flight No"
                          autoComplete="off"
                          className={cn(errors.flightArrival && "border-red-500 focus-visible:ring-red-500")}
                        />
                        <FieldError msg={errors.flightArrival?.message} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="arrivalDate">
                          {flightMode === "recurring" ? (
                            "Date (Schedule Driven)"
                          ) : (
                            <>
                              Date <span className="text-red-500 font-bold">*</span>
                            </>
                          )}
                        </Label>
                        {flightMode === "one-time" ? (
                          <Controller
                            name="arrivalDate"
                            control={control}
                            render={({ field }) => (
                              <CustomDateInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="DD-MMM-YYYY"
                                className={cn(errors.arrivalDate && "border-red-500 focus-visible:ring-red-500")}
                              />
                            )}
                          />
                        ) : (
                          <div className="h-10 px-3 py-2 rounded-md border border-purple-200 bg-purple-50/60 text-xs text-purple-700 flex items-center font-medium">
                            {recurringStartDate ? `${recurringStartDate} (Start)` : "Follows Recurrence"}
                          </div>
                        )}
                        <FieldError msg={errors.arrivalDate?.message} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="sta">
                          STA (Local) <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Controller
                          name="sta"
                          control={control}
                          render={({ field }) => (
                            <CustomTimeInput
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              placeholder="HH:mm"
                              className={cn(errors.sta && "border-red-500 focus-visible:ring-red-500")}
                            />
                          )}
                        />
                        <FieldError msg={errors.sta?.message} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="ata">ATA (Local)</Label>
                        <Controller
                          name="ata"
                          control={control}
                          render={({ field }) => (
                            <CustomTimeInput
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              placeholder="HH:mm"
                              className={cn(errors.ata && "border-red-500 focus-visible:ring-red-500")}
                            />
                          )}
                        />
                        <FieldError msg={errors.ata?.message} />
                      </div>
                    </div>
                  </div>

                  {/* DEPARTURE */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      Departure (Local Time)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="flightDeparture">Flight No</Label>
                        <Input {...register("flightDeparture")} placeholder="Flight No" autoComplete="off" />
                        <FieldError msg={errors.flightDeparture?.message} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="departureDate">
                          {flightMode === "recurring" ? "Date (Schedule Driven)" : "Date"}
                        </Label>
                        {flightMode === "one-time" ? (
                          <Controller
                            name="departureDate"
                            control={control}
                            render={({ field }) => (
                              <CustomDateInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="DD-MMM-YYYY"
                              />
                            )}
                          />
                        ) : (
                          <div className="h-10 px-3 py-2 rounded-md border border-purple-200 bg-purple-50/60 text-xs text-purple-700 flex items-center font-medium">
                            {isDepartureNextDay ? "Next Day (+1 Day)" : "Same Day as Arrival"}
                          </div>
                        )}
                        <FieldError msg={errors.departureDate?.message} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="std">STD (Local)</Label>
                        <Controller
                          name="std"
                          control={control}
                          render={({ field }) => (
                            <CustomTimeInput
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              placeholder="HH:mm"
                              className={cn(errors.std && "border-red-500 focus-visible:ring-red-500")}
                            />
                          )}
                        />
                        <FieldError msg={errors.std?.message} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="atd">ATD (Local)</Label>
                        <Controller
                          name="atd"
                          control={control}
                          render={({ field }) => (
                            <CustomTimeInput
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              placeholder="HH:mm"
                              className={cn(errors.atd && "border-red-500 focus-visible:ring-red-500")}
                            />
                          )}
                        />
                        <FieldError msg={errors.atd?.message} />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="bay">Bay</Label>
                      <Input {...register("bay")} placeholder="Bay" autoComplete="off" />
                      <FieldError msg={errors.bay?.message} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="status">Status</Label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value?.value}
                            onValueChange={(value) => {
                              const option = statusOptions.find((opt) => opt.value === value);
                              field.onChange(option || null);
                            }}
                            disabled={loadingStatus || statusOptions.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingStatus
                                    ? "Loading status..."
                                    : statusError
                                      ? "Failed to load status"
                                      : statusOptions.length === 0
                                        ? "No status found"
                                        : "Select status"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FieldError msg={errors.status?.message as string | undefined} />
                      {statusUsingFallback && (
                        <p className="text-sm text-amber-600">
                          ⚠ Using offline status data due to API connection issue
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="note">Note</Label>
                    <Textarea {...register("note")} placeholder="Note..." className="h-28" />
                    <FieldError msg={errors.note?.message} />
                  </div>
                </div>

                <Separator className="my-3" />
                <PersonnelSection
                  control={control as any}
                  onCsChange={(ids) => setValue("csIdList", ids)}
                  onMechChange={(ids) => setValue("mechIdList", ids)}
                />
              </form>
            </ScrollArea>

            <Separator className="mb-0 mt-0" />
            <div className="flex justify-between items-center py-0 px-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep("select-mode")}
                disabled={isFormBusy}
                className="text-xs text-slate-500"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Change Entry Mode
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  color="primary"
                  onClick={() => {
                    resetAllForm();
                    setOpen(false);
                  }}
                  disabled={isFormBusy}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color={flightMode === "recurring" ? "secondary" : "primary"}
                  form="create-flight-form"
                  disabled={isFormBusy}
                  className={cn(
                    flightMode === "recurring" && "bg-purple-600 hover:bg-purple-700 text-white"
                  )}
                >
                  {flightMode === "recurring" ? (
                    `Generate ${calculatedDates.length > 0 ? `${calculatedDates.length} ` : ""}Recurring Flights`
                  ) : isFormBusy ? (
                    "Adding..."
                  ) : (
                    "Add Flight"
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* ══════════════════════════════════════════════════════════
              STEP 3: PREVIEW & EDIT RECURRING FLIGHTS TABLE
             ══════════════════════════════════════════════════════════ */
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-3">
            {/* Top Summary Bar (Excel Import Style) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-semibold shadow-2xs">
                  <CalendarRange className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>
                    {recurringStartDate} — {recurringEndDate}
                  </span>
                  <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {generatedFlights.length}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">•</span>
                  <span>
                    Frequency:{" "}
                    <strong className="text-slate-800 dark:text-slate-100">
                      {recurringFrequency === "daily"
                        ? "Daily"
                        : `Weekly (${recurringDays
                          .map((d) => DAYS_OF_WEEK.find((w) => w.day === d)?.label)
                          .join(", ")})`}
                    </strong>
                  </span>
                  {isDepartureNextDay && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-purple-700 dark:text-purple-300 font-medium">
                        Dep +1 Day
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <span>
                  Airlines:{" "}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {watch("customer")?.label || watch("customer")?.value || "-"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Station:{" "}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {watch("station")?.label || watch("station")?.value || "-"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Rows:{" "}
                  <strong className="text-purple-700 dark:text-purple-300">
                    {generatedFlights.length}
                  </strong>
                </span>
                {validationResultMap && (
                  <>
                    <span>•</span>
                    {Object.values(validationResultMap).some((v) => !v.isValid) ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        {Object.values(validationResultMap).filter((v) => !v.isValid).length} Error(s) found
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        All Valid
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Preview Table Container */}
            <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg min-h-0 bg-white dark:bg-slate-900 shadow-2xs">
              {generatedFlights.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No Flight Records
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      All generated flights were deleted or none matched criteria.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep("fill-info")}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Back to Edit Settings
                  </Button>
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-semibold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 backdrop-blur-xs">
                    <tr>
                      <th className="py-2 px-2 text-center w-10 font-bold">#</th>
                      <th className="py-2 px-2.5 min-w-[130px]">Arrival Date</th>
                      <th className="py-2 px-2 min-w-[65px]">STA</th>
                      <th className="py-2 px-2 min-w-[65px]">ATA</th>
                      <th className="py-2 px-2 min-w-[90px]">Flight Arr</th>
                      <th className="py-2 px-2.5 min-w-[130px]">Departure Date</th>
                      <th className="py-2 px-2 min-w-[65px]">STD</th>
                      <th className="py-2 px-2 min-w-[65px]">ATD</th>
                      <th className="py-2 px-2 min-w-[90px]">Flight Dep</th>
                      <th className="py-2 px-2 min-w-[85px]">A/C Reg</th>
                      <th className="py-2 px-2 min-w-[75px]">A/C Type</th>
                      <th className="py-2 px-2 min-w-[110px]">Route</th>
                      <th className="py-2 px-2 min-w-[60px]">Bay</th>
                      <th className="py-2 px-2 min-w-[85px]">Status</th>
                      <th className="py-2 px-2 min-w-[120px]">CS</th>
                      <th className="py-2 px-2 min-w-[120px]">MECH</th>
                      <th className="py-2 px-2 text-center min-w-[80px] sticky right-0 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {generatedFlights.map((row, index) => {
                      const isEditing = editingRowId === row.tempId;

                      if (isEditing) {
                        return (
                          <tr
                            key={row.tempId}
                            className="bg-purple-50/60 dark:bg-purple-950/30 border-y border-purple-200 dark:border-purple-800"
                          >
                            <td className="py-2 px-2 text-center font-bold text-purple-700">
                              {index + 1}
                            </td>
                            {/* Arrival Date */}
                            <td className="py-1.5 px-2">
                              <Input
                                value={rowEditData.arrivalDate ?? ""}
                                onChange={(e) =>
                                  setRowEditData((prev) => ({ ...prev, arrivalDate: e.target.value }))
                                }
                                placeholder="DD/MM/YYYY"
                                className="h-7 text-xs px-1.5 bg-white dark:bg-slate-900 min-w-[100px]"
                              />
                            </td>
                            {/* STA */}
                            <td className="py-1.5 px-1.5">
                              <CustomTimeInput
                                value={rowEditData.sta ?? ""}
                                onChange={(val) =>
                                  setRowEditData((prev) => ({ ...prev, sta: val }))
                                }
                                className="h-7 text-xs px-1 bg-white dark:bg-slate-900 w-[78px]"
                              />
                            </td>
                            {/* ATA */}
                            <td className="py-1.5 px-1.5">
                              <CustomTimeInput
                                value={rowEditData.ata ?? ""}
                                onChange={(val) =>
                                  setRowEditData((prev) => ({ ...prev, ata: val }))
                                }
                                className="h-7 text-xs px-1 bg-white dark:bg-slate-900 w-[78px]"
                              />
                            </td>
                            {/* Flight Arr */}
                            <td className="py-1.5 px-1.5">
                              <Input
                                value={rowEditData.flightArrival ?? ""}
                                onChange={(e) =>
                                  setRowEditData((prev) => ({
                                    ...prev,
                                    flightArrival: e.target.value,
                                  }))
                                }
                                placeholder="Arr No"
                                className="h-7 text-xs px-1.5 bg-white dark:bg-slate-900 min-w-[80px]"
                              />
                            </td>
                            {/* Departure Date */}
                            <td className="py-1.5 px-2">
                              <Input
                                value={rowEditData.departureDate ?? ""}
                                onChange={(e) =>
                                  setRowEditData((prev) => ({
                                    ...prev,
                                    departureDate: e.target.value,
                                  }))
                                }
                                placeholder="DD/MM/YYYY"
                                className="h-7 text-xs px-1.5 bg-white dark:bg-slate-900 min-w-[100px]"
                              />
                            </td>
                            {/* STD */}
                            <td className="py-1.5 px-1.5">
                              <CustomTimeInput
                                value={rowEditData.std ?? ""}
                                onChange={(val) =>
                                  setRowEditData((prev) => ({ ...prev, std: val }))
                                }
                                className="h-7 text-xs px-1 bg-white dark:bg-slate-900 w-[78px]"
                              />
                            </td>
                            {/* ATD */}
                            <td className="py-1.5 px-1.5">
                              <CustomTimeInput
                                value={rowEditData.atd ?? ""}
                                onChange={(val) =>
                                  setRowEditData((prev) => ({ ...prev, atd: val }))
                                }
                                className="h-7 text-xs px-1 bg-white dark:bg-slate-900 w-[78px]"
                              />
                            </td>
                            {/* Flight Dep */}
                            <td className="py-1.5 px-1.5">
                              <Input
                                value={rowEditData.flightDeparture ?? ""}
                                onChange={(e) =>
                                  setRowEditData((prev) => ({
                                    ...prev,
                                    flightDeparture: e.target.value,
                                  }))
                                }
                                placeholder="Dep No"
                                className="h-7 text-xs px-1.5 bg-white dark:bg-slate-900 min-w-[80px]"
                              />
                            </td>
                            {/* A/C Reg */}
                            <td className="py-1.5 px-1.5">
                              <Input
                                value={rowEditData.acReg ?? ""}
                                onChange={(e) =>
                                  setRowEditData((prev) => ({ ...prev, acReg: e.target.value }))
                                }
                                placeholder="Reg"
                                className="h-7 text-xs px-1.5 bg-white dark:bg-slate-900 min-w-[75px]"
                              />
                            </td>
                            {/* A/C Type */}
                            <td className="py-1.5 px-2 text-slate-500 font-mono">
                              {row.acTypeValue}
                            </td>
                            {/* Route */}
                            <td className="py-1.5 px-2 text-slate-500 font-mono">
                              {row.routeFrom && row.routeTo
                                ? `${row.routeFrom} → ${row.routeTo}`
                                : "-"}
                            </td>
                            {/* Bay */}
                            <td className="py-1.5 px-1.5">
                              <Input
                                value={rowEditData.bay ?? ""}
                                onChange={(e) =>
                                  setRowEditData((prev) => ({ ...prev, bay: e.target.value }))
                                }
                                placeholder="Bay"
                                className="h-7 text-xs px-1 bg-white dark:bg-slate-900 w-[55px]"
                              />
                            </td>
                            {/* Status */}
                            <td className="py-1.5 px-1.5">
                              <select
                                value={rowEditData.statusValue ?? "Normal"}
                                onChange={(e) =>
                                  setRowEditData((prev) => ({
                                    ...prev,
                                    statusValue: e.target.value,
                                  }))
                                }
                                className="h-7 text-xs px-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                              >
                                {statusOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {/* CS */}
                            <td className="py-1.5 px-2 text-slate-500 text-[11px] truncate max-w-[120px]">
                              {row.csNames || "-"}
                            </td>
                            {/* MECH */}
                            <td className="py-1.5 px-2 text-slate-500 text-[11px] truncate max-w-[120px]">
                              {row.mechNames || "-"}
                            </td>
                            {/* Save / Cancel Actions */}
                            <td className="py-1.5 px-2 text-center sticky right-0 bg-purple-50/90 dark:bg-purple-950/90 border-l border-purple-200 dark:border-purple-800">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(row.tempId)}
                                  className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 transition-colors"
                                  title="Save Changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const rowId = index + 1;
                      const validation = validationResultMap ? validationResultMap[rowId] : null;

                      return (
                        <tr
                          key={row.tempId}
                          className={cn(
                            "transition-colors group",
                            validation && !validation.isValid
                              ? "bg-red-50/60 dark:bg-red-950/30 hover:bg-red-50/80 dark:hover:bg-red-950/40"
                              : "hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                          )}
                        >
                          <td className="py-2.5 px-2 text-center font-semibold text-slate-400">
                            <div className="flex items-center justify-center gap-1">
                              <span>{rowId}</span>
                              {validation && (
                                validation.isValid ? (
                                  <span title="Valid">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  </span>
                                ) : (
                                  <span title={validation.statusText || "Validation issue"}>
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                          {/* Arrival Date */}
                          <td className="py-2.5 px-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                {row.arrivalDate}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                {row.dayLabel}
                              </span>
                            </div>
                          </td>
                          {/* STA */}
                          <td className="py-2.5 px-2 font-mono text-slate-800 dark:text-slate-200">
                            {row.sta || "-"}
                          </td>
                          {/* ATA */}
                          <td className="py-2.5 px-2 font-mono text-slate-500">
                            {row.ata || "-"}
                          </td>
                          {/* Flight Arr */}
                          <td className="py-2.5 px-2 font-semibold text-blue-600 dark:text-blue-400">
                            <div>{row.flightArrival}</div>
                            {validation && !validation.isValid && validation.statusText && (
                              <div
                                className="text-[10px] font-normal text-red-600 dark:text-red-400 truncate max-w-[120px]"
                                title={validation.statusText}
                              >
                                {validation.statusText}
                              </div>
                            )}
                          </td>
                          {/* Departure Date */}
                          <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-300">
                            {row.departureDate || "-"}
                          </td>
                          {/* STD */}
                          <td className="py-2.5 px-2 font-mono text-slate-800 dark:text-slate-200">
                            {row.std || "-"}
                          </td>
                          {/* ATD */}
                          <td className="py-2.5 px-2 font-mono text-slate-500">
                            {row.atd || "-"}
                          </td>
                          {/* Flight Dep */}
                          <td className="py-2.5 px-2 font-semibold text-indigo-600 dark:text-indigo-400">
                            {row.flightDeparture || "-"}
                          </td>
                          {/* A/C Reg */}
                          <td className="py-2.5 px-2 font-mono font-medium text-slate-800 dark:text-slate-200">
                            {row.acReg || "-"}
                          </td>
                          {/* A/C Type */}
                          <td className="py-2.5 px-2 font-mono text-slate-600 dark:text-slate-400">
                            {row.acTypeValue}
                          </td>
                          {/* Route */}
                          <td className="py-2.5 px-2 font-mono text-slate-600 dark:text-slate-400">
                            {row.routeFrom && row.routeTo
                              ? `${row.routeFrom} → ${row.routeTo}`
                              : "-"}
                          </td>
                          {/* Bay */}
                          <td className="py-2.5 px-2 font-mono text-slate-700 dark:text-slate-300">
                            {row.bay || "-"}
                          </td>
                          {/* Status */}
                          <td className="py-2.5 px-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {row.statusValue || "Normal"}
                            </span>
                          </td>
                          {/* CS */}
                          <td
                            className="py-2.5 px-2 text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[120px]"
                            title={row.csNames}
                          >
                            {row.csNames || "-"}
                          </td>
                          {/* MECH */}
                          <td
                            className="py-2.5 px-2 text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[120px]"
                            title={row.mechNames}
                          >
                            {row.mechNames || "-"}
                          </td>
                          {/* Edit / Delete Actions */}
                          <td className="py-2.5 px-2 text-center sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-purple-50/30 dark:group-hover:bg-purple-950/20 border-l border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(row)}
                                className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                                title="Edit Flight Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.tempId)}
                                className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                title="Remove Flight Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Footer Bar */}
            <div className="flex justify-between items-center p-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep("fill-info")}
                disabled={isSubmittingRecurring || isValidatingRecurring}
                className="text-xs text-slate-600"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Edit Settings
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleValidateRecurring}
                  disabled={isValidatingRecurring || isSubmittingRecurring || generatedFlights.length === 0}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950 font-medium"
                >
                  {isValidatingRecurring ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                      Validate
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetAllForm();
                    setOpen(false);
                  }}
                  disabled={isSubmittingRecurring || isValidatingRecurring}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  color="secondary"
                  onClick={handleFinalSubmitRecurring}
                  disabled={isSubmittingRecurring || isValidatingRecurring || generatedFlights.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
                >
                  {isSubmittingRecurring ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Adding Flights...
                    </>
                  ) : (
                    `Add ${generatedFlights.length} Recurring Flights`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
