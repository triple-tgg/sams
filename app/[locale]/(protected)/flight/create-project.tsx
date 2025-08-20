"use client";

import { useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import Select from "react-select";
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
import { addFlight, FlightData } from "@/lib/api/fleght/addFlight";

// หากยังใช้ path เดิม ให้เปลี่ยน import ด้านบนเป็น "@/lib/api/fleght/addFlight"

interface CreateTaskProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

type Option = {
  value: string;
  label: string;
};

type Inputs = {
  customer: Option | null;
  station: Option | null;
  acReg: string;
  acType: string;

  flightArrival: string;
  arrivalDate: string; // yyyy-MM-dd
  sta: string;         // HH:mm
  ata: string;         // HH:mm

  flightDeparture: string;
  departureDate: string; // yyyy-MM-dd
  std: string;           // HH:mm
  atd: string;           // HH:mm

  bay: string;
  thfNumber: string;
  status: Option | null;
  note: string;

  // ถ้าจะใช้ Route ให้เพิ่มชื่อฟิลด์ใหม่ที่ไม่ชน เช่น:
  // arrivalRouteFrom?: string;
  // arrivalRouteTo?: string;
  // departureRouteFrom?: string;
  // departureRouteTo?: string;
};

const stationOptions: Option[] = [
  { value: "BKK", label: "BKK" },
  { value: "DMK", label: "DMK" },
  { value: "HKT", label: "HKT" },
  { value: "HDY", label: "HDY" },
  { value: "CNX", label: "CNX" },
  { value: "CEI", label: "CEI" },
  { value: "UTH", label: "UTH" },
  { value: "KBV", label: "KBV" },
];

const statusOptions: Option[] = [
  { value: "Normal", label: "Normal" },
  { value: "Divert/Reroute", label: "Divert/Reroute" },
  { value: "EOB", label: "EOB" },
  { value: "AOG", label: "AOG" },
  { value: "Cancel", label: "Cancel" },
];

const customerOptions: Option[] = [
  { value: "SEJ", label: "SEJ" },
  { value: "KZR", label: "KZR" },
  { value: "CEB", label: "CEB" },
  { value: "AIX", label: "AIX" },
  { value: "AIC", label: "AIC" },
  { value: "QDA", label: "QDA" },
  { value: "IGO", label: "IGO" },
  { value: "FFM", label: "FFM" },
  { value: "JDL", label: "JDL" },
  { value: "MAS", label: "MAS" },
  { value: "PAL", label: "PAL" },
  { value: "RLH", label: "RLH" },
  { value: "JYH", label: "JYH" },
  { value: "MNA", label: "MNA" },
  { value: "TGW", label: "TGW" },
  { value: "NOK", label: "NOK" },
  { value: "DRK", label: "DRK" },
];

const CreateProject = ({ open, setOpen }: CreateTaskProps) => {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<Inputs>({
    defaultValues: {
      customer: null,
      station: null,
      acReg: "",
      acType: "",
      flightArrival: "",
      arrivalDate: "",
      sta: "",
      ata: "",
      flightDeparture: "",
      departureDate: "",
      std: "",
      atd: "",
      bay: "",
      thfNumber: "",
      status: { value: "Normal", label: "Normal" },
      note: "",
    },
  });

  const onSubmit: SubmitHandler<Inputs> = async (values) => {
    setSubmitting(true);

    const payload: FlightData = {
      id: 0,
      airlinesCode: values.customer?.value?.trim() ?? "",
      stationsCode: values.station?.value?.trim() ?? "",
      acReg: (values.acReg ?? "").trim(),
      acType: (values.acType ?? "").trim(),
      arrivalFlightNo: (values.flightArrival ?? "").trim(),
      arrivalDate: values.arrivalDate,
      arrivalStaTime: values.sta,
      arrivalAtaTime: values.ata,
      departureFlightNo: (values.flightDeparture ?? "").trim(),
      departureDate: values.departureDate,
      departureStdTime: values.std,
      departureAtdTime: values.atd,
      bayNo: (values.bay ?? "").trim(),
      thfNo: (values.thfNumber ?? "").trim(),
      statusCode: values.status?.value ?? "Normal",
      note: (values.note ?? "").trim(),
    };

    try {
      await addFlight(payload);
      // สำเร็จ: reset และปิด dialog
      reset();
      setOpen(false);
    } catch (err) {
      console.error("❌ Error adding flight:", err);
      // TODO: ใส่ toast/error banner ตามระบบแจ้งเตือนของโปรเจกต์
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <DialogDescription className="hidden" />
        <Separator className="mb-4" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer / Station */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label htmlFor="customer">Customer</Label>
              <Controller
                name="customer"
                control={control}
                rules={{ required: "Required" }}
                render={({ field, fieldState }) => (
                  <>
                    <Select<Option>
                      {...field}
                      options={customerOptions}
                      placeholder="Select customer"
                      getOptionLabel={(e) => e.label}
                      getOptionValue={(e) => e.value}
                      isClearable
                      onChange={(val) => field.onChange(val ?? null)}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-500 mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="station">Station</Label>
              <Controller
                name="station"
                control={control}
                rules={{ required: "Required" }}
                render={({ field, fieldState }) => (
                  <>
                    <Select<Option>
                      {...field}
                      options={stationOptions}
                      placeholder="Select station"
                      getOptionLabel={(e) => e.label}
                      getOptionValue={(e) => e.value}
                      isClearable
                      onChange={(val) => field.onChange(val ?? null)}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-500 mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            {/* A/C Reg / A/C Type */}
            <div className="space-y-1">
              <Label htmlFor="acReg">A/C Reg</Label>
              <Input
                {...register("acReg")}
                placeholder="A/C Reg"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="acType">A/C Type</Label>
              <Input
                {...register("acType")}
                placeholder="A/C Type"
                autoComplete="off"
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
                  <Input
                    {...register("flightArrival", { required: "Required" })}
                    placeholder="Flight No"
                    autoComplete="off"
                  />
                  {errors.flightArrival && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.flightArrival.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="arrivalDate">Date</Label>
                  <Input
                    type="date"
                    {...register("arrivalDate", { required: "Required" })}
                  />
                  {errors.arrivalDate && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.arrivalDate.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sta">STA (UTC)</Label>
                  <Input
                    type="time"
                    {...register("sta", { required: "Required" })}
                  />
                  {errors.sta && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.sta.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ata">ATA (UTC)</Label>
                  <Input type="time" {...register("ata")} />
                </div>

                {/* Route (ถ้าต้องใช้ให้เปิดคอมเมนต์และตั้งชื่อใหม่ ไม่ชน atd/std) */}
                {/* <div className="space-y-1 col-span-2">
                  <Label htmlFor="arrivalRoute">Route</Label>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <Input {...register("arrivalRouteFrom")} placeholder="From" />
                  <Input {...register("arrivalRouteTo")} placeholder="To" />
                </div> */}
              </div>
            </div>

            {/* DEPARTURE */}
            <div>
              <h4 className="text-sm font-medium mb-2">Departure (UTC Time)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="flightDeparture">Flight No</Label>
                  <Input
                    {...register("flightDeparture")}
                    placeholder="Flight No"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="departureDate">Date</Label>
                  <Input type="date" {...register("departureDate")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="std">STD (UTC)</Label>
                  <Input type="time" {...register("std")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="atd">ATD (UTC)</Label>
                  <Input type="time" {...register("atd")} />
                </div>

                {/* Route (ถ้าต้องใช้ให้เปิดคอมเมนต์และตั้งชื่อใหม่ ไม่ชน atd/std) */}
                {/* <div className="space-y-1 col-span-2">
                  <Label htmlFor="departureRoute">Route</Label>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <Input
                    {...register("departureRouteFrom")}
                    placeholder="From"
                  />
                  <Input {...register("departureRouteTo")} placeholder="To" />
                </div> */}
              </div>
            </div>
          </div>

          <Separator className="mb-8 mt-10" />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <Label htmlFor="bay">Bay</Label>
              <Input {...register("bay")} placeholder="Bay" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="thfNumber">THF Number</Label>
              <Input
                {...register("thfNumber")}
                placeholder="รหัสอ้างอิงของฟอร์ม"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                rules={{ required: "Required" }}
                render={({ field, fieldState }) => (
                  <>
                    <Select<Option>
                      {...field}
                      options={statusOptions}
                      placeholder="Select status"
                      getOptionLabel={(e) => e.label}
                      getOptionValue={(e) => e.value}
                      isClearable
                      onChange={(val) => field.onChange(val ?? null)}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-500 mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="note">Note</Label>
            <Textarea {...register("note")} placeholder="Note..." />
          </div>

          <Separator className="mb-2 mt-8" />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              // variant="secondary"
              color="secondary"
              // variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProject;
