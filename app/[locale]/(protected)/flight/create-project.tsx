"use client";
import BasicCombobox from "@/components/basic-combobox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import Select, { MultiValue } from "react-select";
import { customerOption } from "./data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams } from "next/navigation";
import { getLangDir } from "rtl-detect";
interface CreateTaskProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
type StatusOption = {
  label: string
  value: string
}
interface Option {
  value: string;
  label: string;
  image?: string;
}
type Inputs = {
  customer: StatusOption | null
  station: StatusOption | null
  acReg: string
  acType: string
  flightArrival: string
  arrivalDate: string
  sta: string
  ata: string
  flightDeparture: string
  departureDate: string
  std: string
  atd: string
  bay: string
  status: StatusOption | null
  note: string
  thfNumber: string
  delayCode: string
};

const stationOptions: Option[] = [
  { value: "BKK", label: "BKK" },
  { value: "DMK", label: "DMK" },
  { value: "HKT", label: "HKT" },
  { value: "HDY", label: "HDY" },
  { value: "CNX", label: "CNX" },
  { value: "CEI", label: "CEI" },
  { value: "UTH", label: "UTH" },
  { value: "KBV", label: "KBV" }
];
const statusOptions: Option[] = [
  { value: "normal", label: "Normal" },
  { value: "divertReroute", label: "Divert/Reroute" },
  { value: "eob", label: "EOB" },
  { value: "aog", label: "AOG" },
  { value: "cancel", label: "Cancel" },
];
const customerOptions: Option[] = [
  { value: "SEJ ", label: "SEJ " },
  { value: "KZR ", label: "KZR " },
  { value: "CEB ", label: "CEB " },
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
  const params = useParams<{ locale: string; }>();
  const direction = getLangDir(params?.locale ?? '');

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndtDate] = useState<Date>(new Date());
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    console.log(data);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}  >
      <DialogContent size="md"  >
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <DialogDescription className="hidden"></DialogDescription>
        <Separator className="mb-4" />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* กลุ่ม Customer / Station */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label htmlFor="customer">Customer</Label>
              <Controller
                name="customer"
                control={control}
                render={({ field }) => (
                  <Select<StatusOption>
                    {...field}
                    options={customerOptions}
                    placeholder="Select station"
                    getOptionLabel={(e) => e.label}
                    getOptionValue={(e) => e.value}
                    isClearable
                  />
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="station">Station</Label>
              <Controller
                name="station"
                control={control}
                render={({ field }) => (
                  <Select<StatusOption>
                    {...field}
                    options={stationOptions}
                    placeholder="Select station"
                    getOptionLabel={(e) => e.label}
                    getOptionValue={(e) => e.value}
                    isClearable
                  />
                )}
              />
            </div>

            {/* A/C Reg / A/C Type */}
            <div className="space-y-1">
              <Label htmlFor="acReg">A/C Reg</Label>
              <Input {...register('acReg')} placeholder="A/C Reg" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="acType">A/C Type</Label>
              <Input {...register('acType')} placeholder="A/C Type" />
            </div>
          </div>
          <Separator className='mb-8 mt-10' />

          {/* ARRIVAL + DEPARTURE */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* ARRIVAL */}
            <div>
              <h4 className="text-sm font-medium mb-2">Arrival (UTC Time)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="flightArrival">Flight No</Label>
                  <Input {...register('flightArrival')} placeholder="Flight No" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="arrivalDate">Date</Label>
                  <Input type="date" {...register('arrivalDate')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sta">STA (UTC)</Label>
                  <Input {...register('sta')} type="time" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ata">ATA (UTC)</Label>
                  <Input {...register('ata')} type="time" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="arrivalRoute">Route </Label>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <Input {...register('atd')} />
                  <Input {...register('atd')} />
                </div>
              </div>
            </div>

            {/* DEPARTURE */}
            <div>
              <h4 className="text-sm font-medium mb-2">Departure (UTC Time)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="flightDeparture">Flight No</Label>
                  <Input {...register('flightDeparture')} placeholder="Flight No" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="departureDate">Date</Label>
                  <Input type="date" {...register('departureDate')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="std">STD (UTC)</Label>
                  <Input {...register('std')} type="time" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="atd">ATD (UTC)</Label>
                  <Input {...register('atd')} type="time" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="departureRoute">Route </Label>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <Input {...register('atd')} />
                  <Input {...register('atd')} />
                </div>
              </div>
            </div>
          </div>

          <Separator className='mb-8 mt-10' />

          <div className="grid lg:grid-cols-3 gap-6">
            {/* BAY */}
            <div className="space-y-1">
              <Label htmlFor="bay">Bay</Label>
              <Input {...register('bay')} placeholder="Bay" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="thfNumber">THF Number</Label>
              <Input {...register('thfNumber')} placeholder="รหัสอ้างอิงของฟอร์ม" />
            </div>
            {/* STATUS */}
            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select<StatusOption>
                    {...field}
                    options={statusOptions}
                    placeholder="Select status"
                    getOptionLabel={(e) => e.label}
                    getOptionValue={(e) => e.value}
                    isClearable
                  />
                )}
              />
            </div>
            {/* <div className="space-y-1">
          <Label htmlFor="delayCode">Delay Code</Label>
          <Input {...register('delayCode')} placeholder="รหัสการล่าช้า" />
        </div> */}
          </div>

          {/* NOTE */}
          <div className="space-y-1">
            <Label htmlFor="note">Note</Label>
            <Textarea {...register('note')} placeholder="Note..." />
          </div>
          <Separator className="mb-2 mt-8" />
          <div className="flex justify-end">
            <Button type="submit" >Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog >
  );
};

export default CreateProject;
