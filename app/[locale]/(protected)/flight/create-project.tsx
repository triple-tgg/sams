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
interface Option {
  value: string;
  label: string;
  image?: string;
}
type Inputs = {
  title: string;
  description: string;
  tags: MultiValue<Option>;
  assignee: MultiValue<Option>;
  startDate: Date;
  endDate: Date;
};

const assigneeOptions: Option[] = [
  { value: "BKK", label: "BKK", image: "/images/avatar/av-1.svg" },
  { value: "DMK", label: "DMK", image: "/images/avatar/av-2.svg" },
  {
    value: "HKT", label: "HKT", image: "/images/avatar/av-3.svg",
  },
  { value: "HDY", label: "HDY", image: "/images/avatar/av-4.svg" },
  { value: "CNX", label: "CNX", image: "/images/avatar/av-4.svg" },
  { value: "CEI", label: "CEI", image: "/images/avatar/av-4.svg" },
  { value: "UTH", label: "UTH", image: "/images/avatar/av-4.svg" },
];
const statusOptions: Option[] = [
  { value: "normal", label: "Normal" },
  { value: "divertReroute", label: "Divert/Reroute" },
  { value: "eob", label: "EOB" },
  { value: "aog", label: "AOG" },
  { value: "cancel", label: "Cancel" },
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
        <form onSubmit={handleSubmit(onSubmit)} >
          <div className="h-full max-h-[500px] overflow-hidden">
            <ScrollArea className="h-full">
              <div >
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-5">
                  <div className="space-y-1">
                    <Label htmlFor="customer">Customer</Label>
                    <Input
                      id="customer"
                      placeholder="Customer"
                      {...register("title", { required: "Title is required." })}
                      color={errors.title ? "destructive" : "default"}
                    />
                    {errors.title && (
                      <p className="text-destructive  text-sm font-medium">
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="assignee">Station</Label>
                    <Controller
                      name="assignee"
                      control={control}
                      defaultValue={[]}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={assigneeOptions}
                          isMulti
                          onChange={(selectedOption) => field.onChange(selectedOption)}
                          getOptionLabel={(option) =>
                            (
                              <div className="flex items-center">
                                <span className="text-sm text-default-600 font-medium">
                                  {option.label}
                                </span>
                              </div>
                            ) as unknown as string
                          }
                          placeholder="Select assignee"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="acReg">A/C Reg</Label>
                    <Input
                      id="acReg"
                      placeholder="A/C Reg"
                      {...register("title", { required: "Title is required." })}
                      color={errors.title ? "destructive" : "default"}
                    />
                    {errors.title && (
                      <p className="text-destructive  text-sm font-medium">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="acType">A/C Type</Label>
                    <Input
                      id="acType"
                      placeholder="A/C Type"
                      {...register("title", { required: "Title is required." })}
                      color={errors.title ? "destructive" : "default"}
                    />
                    {errors.title && (
                      <p className="text-destructive  text-sm font-medium">
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="mb-6 mt-6" />
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-5">
                  <div className="space-y-1">
                    <Label htmlFor="tag">Bay</Label>
                    <Input
                      id="Bay"
                      placeholder="Bay"
                      {...register("title", { required: "Title is required." })}
                      color={errors.title ? "destructive" : "default"}
                    />
                    {errors.title && (
                      <p className="text-destructive  text-sm font-medium">
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="assignee">Status</Label>
                    <Controller
                      name="assignee"
                      control={control}
                      defaultValue={[]}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={statusOptions}
                          isMulti
                          onChange={(selectedOption) => field.onChange(selectedOption)}
                          getOptionLabel={(option) =>
                            (
                              <div className="flex items-center">
                                {/* <Image
                          width={40}
                          height={40}
                          src={option.image as string}
                          alt={option.label}
                          className="w-8 h-8 rounded-full me-2"
                        /> */}
                                <span className="text-sm text-default-600 font-medium">
                                  {option.label}
                                </span>
                              </div>
                            ) as unknown as string
                          }
                          placeholder="Select assignee"
                        />
                      )}
                    />
                  </div>
                </div>

                <Separator className="mb-8 mt-8" />
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-5">
                  <div className="space-y-1">
                    <div className="mb-4">
                      <span>Arrival (UTC Time)</span>
                    </div>
                    <div className="grid lg:grid-cols-2 grid-cols-1 gap-5">
                      <div className="space-y-1 col-span-2">
                        <Label htmlFor="flightNo">Flight No</Label>
                        <Input
                          id="flightNo"
                          placeholder="Flight No"
                          {...register("title", { required: "Title is required." })}
                          color={errors.title ? "destructive" : "default"}
                        />
                        {errors.title && (
                          <p className="text-destructive  text-sm font-medium">
                            {errors.title.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label htmlFor="arrivalDate">Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-start font-normal border border-default-200 text-default-700 md:px-2.5 hover:bg-transparent hover:text-default-700"
                              size="md"
                            >
                              <CalendarIcon className="me-2 h-3.5 w-3.5 text-default-500" />
                              {format(startDate, "PPP")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Controller
                              name="startDate"
                              control={control}
                              render={({ field }) => (
                                <Calendar
                                  mode="single"
                                  selected={startDate}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setStartDate(date as Date);
                                  }}
                                  initialFocus
                                />
                              )}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="sta">STA(UTC)</Label>
                        <Input
                          id="sta"
                          placeholder="STA(UTC)"
                          type="time"
                          {...register("title", { required: "Title is required." })}
                          color={errors.title ? "destructive" : "default"}
                        />
                        {errors.title && (
                          <p className="text-destructive  text-sm font-medium">
                            {errors.title.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="ata">ATA(UTC)</Label>
                        <Input
                          id="ata"
                          placeholder="ATA(UTC)"
                          type="time"
                          {...register("title", { required: "Title is required." })}
                          color={errors.title ? "destructive" : "default"}
                        />
                        {errors.title && (
                          <p className="text-destructive  text-sm font-medium">
                            {errors.title.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="mb-4">
                      <span>Departure (UTC Time)</span>
                    </div>
                    <div className="grid lg:grid-cols-2 grid-cols-1 gap-5">
                      <div className="space-y-1 col-span-2">
                        <Label htmlFor="flightNo">Flight No</Label>
                        <Input
                          id="flightNo"
                          placeholder="Flight No"
                          {...register("title", { required: "Title is required." })}
                          color={errors.title ? "destructive" : "default"}
                        />
                        {errors.title && (
                          <p className="text-destructive  text-sm font-medium">
                            {errors.title.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label htmlFor="departureDate">Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-start font-normal border border-default-200 text-default-700 md:px-2.5 hover:bg-transparent hover:text-default-700"
                              size="md"
                            >
                              <CalendarIcon className="me-2 h-3.5 w-3.5 text-default-500" />
                              {format(startDate, "PPP")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Controller
                              name="startDate"
                              control={control}
                              render={({ field }) => (
                                <Calendar
                                  mode="single"
                                  selected={startDate}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setStartDate(date as Date);
                                  }}
                                  initialFocus
                                />
                              )}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="sta">STA(UTC)</Label>
                        <Input
                          id="sta"
                          placeholder="STA(UTC)"
                          type="time"
                          {...register("title", { required: "Title is required." })}
                          color={errors.title ? "destructive" : "default"}
                        />
                        {errors.title && (
                          <p className="text-destructive  text-sm font-medium">
                            {errors.title.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="ata">ATA(UTC)</Label>
                        <Input
                          id="ata"
                          placeholder="ATA(UTC)"
                          type="time"
                          {...register("title", { required: "Title is required." })}
                          color={errors.title ? "destructive" : "default"}
                        />
                        {errors.title && (
                          <p className="text-destructive  text-sm font-medium">
                            {errors.title.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="mb-8 mt-8" />
                <div className="space-y-1">
                  <Label htmlFor="description">Note.</Label>
                  <Textarea
                    id="description"
                    placeholder="Note."
                    {...register("description")}
                  />
                </div>
              </div>
            </ScrollArea>
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
