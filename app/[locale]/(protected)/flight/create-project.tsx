"use client";

import * as React from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
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

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getLangDir } from "rtl-detect";
import { useParams } from "next/navigation";

import { useAddFlight } from "@/lib/api/hooks/useAddFlight";
import type { FlightData } from "@/lib/api/flight/addFlight";
import { useAirlineOptions } from "@/lib/api/hooks/useAirlines";
import { useStationsOptions } from "@/lib/api/hooks/useStations";
import { useStatusOptions } from "@/lib/api/hooks/useStatus";
import { FieldError } from "@/components/ui/field-error";
import { convertDateToBackend } from "@/lib/utils/formatPicker";
import { CustomDateInput } from "@/components/ui/input-date/CustomDateInput";
import { SearchableSelectField } from "@/components/ui/search-select";
import { useAircraftTypes } from "@/lib/api/hooks/useAircraftTypes";
import { toast } from "sonner";



// ------------------------------------------------------
// Types
// ------------------------------------------------------
type Option = { value: string; label: string };

// RHF form values (before transform -> API payload)
const FormSchema = z
  .object({
    customer: z.object({ value: z.string(), label: z.string() }).nullable().refine(Boolean, "Required"),
    station: z.object({ value: z.string(), label: z.string() }).nullable().refine(Boolean, "Required"),

    acReg: z.string().trim().optional().default(""),
    acType: z.object({ value: z.string(), label: z.string() }).nullable().refine(Boolean, "Required"),
    flightArrival: z.string().trim().min(2, "Required"),
    arrivalDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/g, "DD/MMM/YYYY"),
    sta: z.string().regex(/^\d{2}:\d{2}$/g, "HH:mm"),
    ata: z.string().regex(/^\d{2}:\d{2}$/g, "HH:mm").optional().or(z.literal("")),
    // routeFrom: z.object({ value: z.string(), label: z.string() }).nullable().optional(),

    flightDeparture: z.string().trim().optional().default(""),
    departureDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/g, "DD/MMM/YYYY").optional().or(z.literal("")),
    std: z.string().regex(/^\d{2}:\d{2}$/g, "HH:mm").optional().or(z.literal("")),
    atd: z.string().regex(/^\d{2}:\d{2}$/g, "HH:mm").optional().or(z.literal("")),
    // routeTo: z.object({ value: z.string(), label: z.string() }).nullable().optional(),

    bay: z.string().trim().optional().default(""),
    thfNumber: z.string().trim().optional().default(""),
    status: z.object({ value: z.string(), label: z.string() }).nullable().default({ value: "Normal", label: "Normal" }),
    note: z.string().trim().optional().default("")
  })
  // ถ้าใส่ departure อย่างใดอย่างหนึ่ง ต้องใส่ให้ครบ (date + std อย่างน้อย)
  .refine(
    (v) => {
      const anyDep = !!(v.flightDeparture || v.departureDate || v.std || v.atd);
      const depOk = !anyDep || (!!v.departureDate && !!v.std);
      return depOk;
    },
    { path: ["departureDate"], message: "If departure provided, Date & STD are required" }
  );

export type Inputs = z.infer<typeof FormSchema>;

// ------------------------------------------------------
// Options (static)
// ------------------------------------------------------
// Dynamic stationOptions will be loaded from API
// Dynamic customerOptions will be loaded from API
// Dynamic statusOptions will be loaded from API

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------
// ถ้าหลังบ้านต้องการเวลาเป็น HHmm ให้ตั้งค่านี้เป็น true
const SEND_HHMM = false;
const toHHmm = (t?: string) => (t ? (t.includes(":") ? t.replace(":", "") : t) : "");
const sendTime = (t?: string) => (SEND_HHMM ? toHHmm(t) : (t ?? ""));

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
  // const { toast } = useToast();

  // Use airline options hook
  const {
    options: customerOptions,
    isLoading: loadingAirlines,
    error: airlinesError,
    usingFallback
  } = useAirlineOptions();

  // Use stations options hook
  const {
    options: stationOptions,
    isLoading: loadingStations,
    error: stationsError,
    usingFallback: stationsUsingFallback
  } = useStationsOptions();

  // Use status options hook
  const {
    options: statusOptions,
    isLoading: loadingStatus,
    error: statusError,
    usingFallback: statusUsingFallback
  } = useStatusOptions();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<Inputs>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      customer: null,
      station: null,
      acReg: "",
      acType: null,
      flightArrival: "",
      arrivalDate: "",
      sta: "",
      ata: "",
      // routeFrom: null,
      flightDeparture: "",
      departureDate: "",
      std: "",
      atd: "",
      // routeTo: null,
      bay: "",
      thfNumber: "",
      status: { value: "Normal", label: "Normal" },
      note: "",
    },
  });

  const { mutate, isPending, error: mError } = useAddFlight();

  const onSubmit: SubmitHandler<Inputs> = (values) => {
    const payload: FlightData = {
      id: 0,
      airlinesCode: values.customer!.value.trim(),
      stationsCode: values.station!.value.trim(),
      acReg: (values.acReg ?? "").trim(),
      acTypeCode: values.acType!.value.trim(),
      arrivalFlightNo: values.flightArrival.trim(),
      arrivalDate: convertDateToBackend(values.arrivalDate),
      arrivalStaTime: sendTime(values.sta),
      arrivalAtaTime: sendTime(values.ata),
      departureFlightNo: (values.flightDeparture ?? "").trim(),
      departureDate: convertDateToBackend(values.departureDate ?? ""),
      departureStdTime: sendTime(values.std),
      departureAtdTime: sendTime(values.atd),
      bayNo: (values.bay ?? "").trim(),
      thfNo: (values.thfNumber ?? "").trim(),
      statusCode: values.status?.value ?? "Normal",
      note: (values.note ?? "").trim(),
    };

    mutate(
      { payload },
      {
        onSuccess: () => {
          toast.success("Flight was added successfully.");
          reset();
          setOpen(false);
        },
        onError: (err) => {
          toast.error(err?.message ?? "Submit failed");
          // toast({
          //   variant: "destructive",
          //   title: "Failed",
          //   description: err?.message ?? "Submit failed",
          // });
        },
      }
    );
  };
  const {
    options: aircraftOptions,
    isLoading: isLoadingAircraft,
    usingFallback: acTypeCodeUsingFallback,
    error: acTypeCodeError
  } = useAircraftTypes();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isPending) setOpen(o);
      }}
    >
      <DialogContent
        size="md"
        className="h-full max-h-10/12"
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Flight Information</DialogTitle>
        </DialogHeader>
        <DialogDescription className="hidden" />
        <Separator className="mb-4" />

        <ScrollArea className="[&>div>div[style]]:block!" dir={direction}>
          <form id="create-flight-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer / Station */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label htmlFor="customer">Customer / Airlines</Label>
                <Controller
                  name="customer"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.value}
                      onValueChange={(value) => {
                        const option = customerOptions.find(opt => opt.value === value);
                        field.onChange(option || null);
                      }}
                      disabled={loadingAirlines || customerOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingAirlines ? "Loading airlines..." :
                            airlinesError ? "Failed to load airlines" :
                              customerOptions.length === 0 ? "No airlines found" :
                                "Select customer"
                        } />
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
                    ⚠️ Using offline airline data due to API connection issue
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="station">Station</Label>
                <Controller
                  name="station"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.value}
                      onValueChange={(value) => {
                        const option = stationOptions.find(opt => opt.value === value);
                        field.onChange(option || null);
                      }}
                      disabled={loadingStations || stationOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingStations ? "Loading stations..." :
                            stationsError ? "Failed to load stations" :
                              stationOptions.length === 0 ? "No stations found" :
                                "Select station"
                        } />
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
                    ⚠️ Using offline station data due to API connection issue
                  </p>
                )}
              </div>

              {/* A/C Reg / A/C Type */}
              <div className="space-y-1">
                <Label htmlFor="acReg">A/C Reg</Label>
                <Input {...register("acReg")} placeholder="A/C Reg" autoComplete="off" />
                <FieldError msg={errors.acReg?.message} />
              </div>
              <div className="space-y-1">
                <SearchableSelectField
                  name="acType"
                  control={control}
                  label="A/C Type"
                  placeholder="Select A/C Type"
                  options={aircraftOptions}
                  isLoading={isLoadingAircraft}
                  errorMessage={errors.acType?.message}
                  usingFallback={acTypeCodeUsingFallback}
                />
              </div>
            </div>

            <Separator className="mb-8 mt-10" />

            {/* ARRIVAL + DEPARTURE */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* ARRIVAL */}
              <div>
                <h4 className="text-sm font-medium mb-2">Arrival (UTC Time)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="flightArrival">Flight No</Label>
                    <Input {...register("flightArrival")} placeholder="Flight No" autoComplete="off" />
                    <FieldError msg={errors.flightArrival?.message} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="arrivalDate">Date</Label>
                    <Controller
                      name="arrivalDate"
                      control={control}
                      render={({ field }) => (
                        <CustomDateInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="DD-MMM-YYYY"
                        />
                      )}
                    />
                    <FieldError msg={errors.arrivalDate?.message} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sta">STA (UTC)</Label>
                    <Input type="time" {...register("sta")} />
                    <FieldError msg={errors.sta?.message} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ata">ATA (UTC)</Label>
                    <Input type="time" {...register("ata")} />
                    <FieldError msg={errors.ata?.message} />
                  </div>
                </div>
              </div>

              {/* DEPARTURE */}
              <div>
                <h4 className="text-sm font-medium mb-2">Departure (UTC Time)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="flightDeparture">Flight No</Label>
                    <Input {...register("flightDeparture")} placeholder="Flight No" autoComplete="off" />
                    <FieldError msg={errors.flightDeparture?.message} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="departureDate">Date</Label>
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
                    <FieldError msg={errors.departureDate?.message} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="std">STD (UTC)</Label>
                    <Input type="time" {...register("std")} />
                    <FieldError msg={errors.std?.message} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="atd">ATD (UTC)</Label>
                    <Input type="time" {...register("atd")} />
                    <FieldError msg={errors.atd?.message} />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="mb-8 mt-10" />

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-1 ">
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
                          const option = statusOptions.find(opt => opt.value === value);
                          field.onChange(option || null);
                        }}
                        disabled={loadingStatus || statusOptions.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            loadingStatus ? "Loading status..." :
                              statusError ? "Failed to load status" :
                                statusOptions.length === 0 ? "No status found" :
                                  "Select status"
                          } />
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
                      ⚠️ Using offline status data due to API connection issue
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="space-y-1">
                  <Label htmlFor="note">Note</Label>
                  <Textarea {...register("note")} placeholder="Note..." />
                  <FieldError msg={errors.note?.message} />
                </div>
              </div>
            </div>
            {/* {mError && (
              <p className="text-sm text-red-600">
                {mError.message || "Submit failed"}
              </p>
            )} */}
          </form>
        </ScrollArea>

        <Separator className="mb-2 mt-0" />
        <div className="flex justify-end gap-2 py-2 px-2">
          <Button type="button" variant="outline" color="primary" onClick={() => {
            reset();
            setOpen(false)
          }} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" color="primary" form="create-flight-form" disabled={isPending}>
            {isPending ? "Adding..." : "Add"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
