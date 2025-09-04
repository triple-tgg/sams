"use client"

import React, { useEffect } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { CirclePlus, Trash } from "lucide-react"
import { useStep } from "../step-context"
import { Textarea } from "@/components/ui/textarea"

const staffList = [
  { staffId: 'A001', name: 'สมชาย ใจดี', type: 'LAE' },
  { staffId: 'B002', name: 'สมหญิง แสนดี', type: 'MECH' },
  { staffId: 'C003', name: 'สมปอง น่ารัก', type: 'LAE' },
]

const maintenanceOptions = [
  { value: "TR", label: "TR" },
  { value: "Preflight", label: "Preflight" },
  { value: "NS", label: "NS" },
  { value: "Weekly", label: "Weekly" },
  { value: "A-Check", label: "A-Check" },
]

const maintenanceSubTypesOptions = [
  { value: "Assistance", label: "Assistance" },
  { value: "CRS", label: "CRS" },
  { value: "On Call", label: "On Call" },
  { value: "Standby", label: "Standby" },
]
type FluidOption = { label: string; value: string }

const fluidOptions: FluidOption[] = [
  { label: 'Hydraulic', value: 'Hydraulic' },
  { label: 'ENG Oil', value: 'ENG Oil' },
  { label: 'APU Oil', value: 'APU Oil' },
]

type Personnel = {
  staffId: string
  name: string
  type: string
  from: string
  to: string
  remark?: string
}

type ServicesFormInputs = {
  aircraftChecks: {
    maintenanceTypes: string
    maintenanceSubTypes: string[]
    laeMH?: string
    mechMH?: string
  }[]
  additionalDefectRectification: boolean
  additionalDefects?: {
    defect: string
    ataChapter: string
    photo?: FileList
    laeMH?: string
    mechMH?: string
  }[]
  servicingPerformed: boolean
  fluid: {
    fluidType: FluidOption | null
    engOilSets: { left: string; right: string }[]
    hydOilBlue?: string
    hydOilGreen?: string
    hydOilYellow?: string
    hydOilA?: string
    hydOilB?: string
    hydOilSTBY?: string
    otherQty?: string
  }
  addPersonnels: boolean
  personnel?: Personnel[] | null
  flightDeck: boolean
  flightDeckInfo?: {
    date: string;
    timeOn: string;
    timeOf: string;
  }[] | null
  aircraftTowing: boolean
  aircraftTowingInfo?: {
    date: string;
    timeOn: string;
    timeOf: string;
  }[] | null
}

const formSchema = z.object({
  aircraftChecks: z.array(z.object({
    maintenanceTypes: z.string().min(1, "Check type is required"),
    maintenanceSubTypes: z.array(z.string()),
    laeMH: z.string().optional(),
    mechMH: z.string().optional(),
  })).min(1, "At least one aircraft check is required"),
  additionalDefectRectification: z.boolean(),
  additionalDefects: z.array(z.object({
    defect: z.string().min(1, "Defect details are required"),
    ataChapter: z.string().min(1, "ATA Chapter is required"),
    photo: z.any().optional(),
    laeMH: z.string().optional(),
    mechMH: z.string().optional(),
  })).optional(),
  servicingPerformed: z.boolean(),
  fluid: z.object({
    fluidType: z.object({
      label: z.string(),
      value: z.string(),
    }).nullable(),
    engOilSets: z.array(z.object({
      left: z.string(),
      right: z.string(),
    })),
    hydOilBlue: z.string().optional(),
    hydOilGreen: z.string().optional(),
    hydOilYellow: z.string().optional(),
    hydOilA: z.string().optional(),
    hydOilB: z.string().optional(),
    hydOilSTBY: z.string().optional(),
    otherQty: z.string().optional(),
  }),
  addPersonnels: z.boolean(),
  personnel: z.array(z.object({
    staffId: z.string().min(1, "Staff ID is required"),
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    from: z.string().min(1, "From time is required"),
    to: z.string().min(1, "To time is required"),
    remark: z.string().optional(),
  })).nullable().optional(),
  flightDeck: z.boolean(),
  flightDeckInfo: z.array(z.object({
    date: z.string().min(1, "Date is required"),
    timeOn: z.string().min(1, "Time on is required"),
    timeOf: z.string().min(1, "Time of is required"),
  })).nullable().optional(),
  aircraftTowing: z.boolean(),
  aircraftTowingInfo: z.array(z.object({
    date: z.string().min(1, "Date is required"),
    timeOn: z.string().min(1, "Time on is required"),
    timeOf: z.string().min(1, "Time of is required"),
  })).nullable().optional(),
}).refine((data) => {
  // Additional validation: if additionalDefectRectification is true, additionalDefects should not be empty
  if (data.additionalDefectRectification && (!data.additionalDefects || data.additionalDefects.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Additional defects are required when defect rectification is enabled",
  path: ["additionalDefects"],
}).refine((data) => {
  // Additional validation: if addPersonnels is true, personnel should not be empty
  if (data.addPersonnels && (!data.personnel || data.personnel.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Personnel are required when personnel option is enabled",
  path: ["personnel"],
}).refine((data) => {
  // Additional validation: if flightDeck is true, flightDeckInfo should not be empty
  if (data.flightDeck && (!data.flightDeckInfo || data.flightDeckInfo.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Flight deck information is required when flight deck option is enabled",
  path: ["flightDeckInfo"],
}).refine((data) => {
  // Additional validation: if aircraftTowing is true, aircraftTowingInfo should not be empty
  if (data.aircraftTowing && (!data.aircraftTowingInfo || data.aircraftTowingInfo.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Aircraft towing information is required when towing option is enabled",
  path: ["aircraftTowingInfo"],
});

const ServicesStep = ({ flightNumber }: { flightNumber: string }) => {
  const { goNext, onSave, goBack } = useStep()
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServicesFormInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aircraftChecks: [
        {
          maintenanceTypes: "",
          maintenanceSubTypes: [],
          laeMH: "",
          mechMH: "",
        },
      ],
      additionalDefectRectification: false,
      additionalDefects: [],
      servicingPerformed: false,
      fluid: {
        fluidType: null,
        engOilSets: [{ left: "", right: "" }],
        hydOilBlue: "",
        hydOilGreen: "",
        hydOilYellow: "",
        hydOilA: "",
        hydOilB: "",
        hydOilSTBY: "",
        otherQty: "",
      },
      addPersonnels: false,
      personnel: [
        {
          staffId: '',
          name: '',
          type: '',
          from: '',
          to: '',
          remark: '',
        }
      ],
      flightDeck: false,
      flightDeckInfo: [
        {
          date: '',
          timeOn: '',
          timeOf: '',
        }
      ],
      aircraftTowing: false,
      aircraftTowingInfo: [
        {
          date: '',
          timeOn: '',
          timeOf: '',
        }
      ]
    },
  })

  const {
    fields: aircraftFields,
    append: appendAircraft,
    remove: removeAircraft,
  } = useFieldArray({
    control,
    name: "aircraftChecks",
  })

  const {
    fields: defectFields,
    append: appendDefect,
    remove: removeDefect,
  } = useFieldArray({
    control,
    name: "additionalDefects",
  })
  const {
    fields: personnelsFields,
    append: appendPersonnels,
    remove: removePersonnels,
  } = useFieldArray({
    control,
    name: "personnel",
  })
  const {
    fields: flightDeckInfoFields,
    append: appendFlightDeckInfo,
    remove: removeFlightDeckInfo,
  } = useFieldArray({
    control,
    name: "flightDeckInfo",
  })
  const {
    fields: aircraftTowingInfoFields,
    append: appendAircraftTowingInfo,
    remove: removeAircraftTowingInfo,
  } = useFieldArray({
    control,
    name: "aircraftTowingInfo",
  })

  const additionalDefect = watch("additionalDefectRectification")
  const servicingPerformed = watch('servicingPerformed')
  const selectedFluidType = watch('fluid.fluidType')
  const addPersonnels = watch('addPersonnels')
  const flightDeck = watch('flightDeck')
  const aircraftTowing = watch('aircraftTowing')
  const isAirbus = flightNumber.toLowerCase().includes('a') // สมมุติ logic

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fluid.engOilSets', // Ensure this matches your form schema
  });
  const onSubmit = (data: ServicesFormInputs) => {
    onSave(data)
    goNext()
  }

  // ฟังก์ชันค้นหาข้อมูลพนักงานจาก staffList
  const findStaffByIdOrName = (input: string) => {
    return staffList.find(
      (staff) =>
        staff.staffId.toLowerCase() === input.toLowerCase() ||
        staff.name.includes(input)
    )
  }
  const onStaffInputChange = (index: number, value: string) => {
    const staff = findStaffByIdOrName(value)
    if (staff) {
      setValue(`personnel.${index}.staffId`, staff.staffId)
      setValue(`personnel.${index}.name`, staff.name)
      setValue(`personnel.${index}.type`, staff.type)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 ">

      <div className="bg-blue-50/60 border border-primary-100 p-4 mb-0 rounded-md ">
        <Label>Aircraft Check</Label>
      </div>
      <div className="bg-gray-50 border border-t-0 border-primary-100 p-4 rounded-b-md ">
        {aircraftFields.map((item, index) => {
          const watchType = watch(`aircraftChecks.${index}.maintenanceTypes`)
          return (
            <Card key={item.id} className="mb-2">
              <CardContent className="p-4 space-y-4 relative">
                {index ? (
                  <div className="col-span-2 text-right absolute -top-2 -right-2">
                    <Button
                      type="button"
                      variant="soft"
                      color="destructive"
                      rounded="full"
                      size="icon"
                      className="!p-0"
                      onClick={() => removeAircraft(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ) : ""}
                <div className="grid md:grid-cols-1 gap-4">
                  <div>
                    <Label>Check Type</Label>
                    <Controller
                      control={control}
                      name={`aircraftChecks.${index}.maintenanceTypes`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select check type" />
                          </SelectTrigger>
                          <SelectContent>
                            {maintenanceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.aircraftChecks?.[index]?.maintenanceTypes && (
                      <p className="text-sm text-red-500">
                        {errors.aircraftChecks[index]?.maintenanceTypes?.message}
                      </p>
                    )}
                  </div>

                  {watchType === "TR" && (
                    <div>
                      <Label>Sub Types</Label>
                      <Controller
                        control={control}
                        name={`aircraftChecks.${index}.maintenanceSubTypes`}
                        render={({ field }) => (
                          <div className="space-y-2">
                            {maintenanceSubTypesOptions.map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${index}-${option.value}`}
                                  checked={field.value.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, option.value])
                                    } else {
                                      field.onChange(field.value.filter((val: string) => val !== option.value))
                                    }
                                  }}
                                />
                                <Label htmlFor={`${index}-${option.value}`} className="text-sm">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      />
                      {errors.aircraftChecks?.[index]?.maintenanceSubTypes && (
                        <p className="text-sm text-red-500">
                          {errors.aircraftChecks[index]?.maintenanceSubTypes?.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        <Button
          type="button"
          variant="outline"
          color="primary"
          className="w-full mt-2"
          onClick={() => appendAircraft({ maintenanceTypes: '', maintenanceSubTypes: [], laeMH: '', mechMH: '' })}>
          + Check
        </Button>
      </div>
      {/* Personnels */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-0 ">
          <div className="bg-blue-50/60 p-4 rounded-md w-full justify-between flex border border-primary-100">
            <Label>Personnels?</Label>
            <Switch
              color="primary"
              checked={addPersonnels}
              onCheckedChange={(checked) =>
                setValue("addPersonnels", checked)
              }
            />
          </div>
        </div>
        {addPersonnels && (
          <div className="bg-gray-50 border border-t-0 border-primary-100 p-4 rounded-b-md ">
            {personnelsFields.map((field, index) => (
              <Card key={field.id} className="mb-2">
                <CardContent className="p-4 space-y-4 relative grid lg:grid-cols-2 gap-4 gap-b-2">
                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="col-span-2 text-right absolute -top-2 -right-2">
                      <Button
                        type="button"
                        variant="soft"
                        color="destructive"
                        rounded="full"
                        size="icon"
                        className="!p-0"
                        onClick={() => removePersonnels(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor={`personnel.${index}.staffId`}>Staff ID / Name:</Label>
                      <Input
                        id={`personnel.${index}.staffId`}
                        type="text"
                        {...register(`personnel.${index}.staffId` as const)}
                        onChange={(e) => onStaffInputChange(index, e.target.value)}
                        placeholder="Staff ID"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor={`personnel.${index}.name`}>name:</Label>
                      <Input
                        id={`personnel.${index}.name`}
                        type="text"
                        {...register(`personnel.${index}.name` as const)}
                        // readOnly
                        placeholder="name"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor={`personnel.${index}.type`}>Type:</Label>
                      <Input
                        id={`personnel.${index}.type`}
                        type="text"
                        {...register(`personnel.${index}.type` as const)}
                        readOnly
                        placeholder="Type ( LAE, MECH)"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor={`personnel.${index}.from`}>From:</Label>
                      <Input
                        id={`personnel.${index}.from`}
                        type="time"
                        {...register(`personnel.${index}.from` as const, { required: true })}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor={`personnel.${index}.to`}>To:</Label>
                      <Input
                        id={`personnel.${index}.to`}
                        type="time"
                        {...register(`personnel.${index}.to` as const, { required: true })}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="col-span-6">
                      <Label htmlFor={`personnel.${index}.remark`}>Note.:</Label>
                      <Textarea
                        id={`personnel.${index}.remark`}
                        {...register(`personnel.${index}.remark` as const)}
                        placeholder="Note...."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              color="primary"
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => appendPersonnels({ staffId: '', name: '', type: '', from: '', to: '', remark: '' })}
            >
              + Personnel
            </Button>
            <Separator className="mt-2" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-0">
          <div className="bg-blue-50/60 p-4 rounded-md w-full justify-between flex border border-primary-100">
            <Label>Additional Defect Rectification?</Label>
            <Switch
              color="primary"
              checked={additionalDefect}
              onCheckedChange={(checked) =>
                setValue("additionalDefectRectification", checked)
              }
            />
          </div>
        </div>
        {additionalDefect && (
          <div className="bg-gray-50 border border-t-0 border-primary-100 p-4 rounded-b-md ">
            {defectFields.map((field, index) => (
              <Card key={field.id} className="mb-2">
                <CardContent className="p-4 space-y-4 relative grid md:grid-cols-3 gap-4">
                  <div className="col-span-2 text-right absolute -top-2 -right-2">
                    <Button
                      type="button"
                      variant="soft"
                      color="destructive"
                      rounded="full"
                      size="icon"
                      className="!p-0"
                      onClick={() => removeDefect(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label>Defect Details</Label>
                    <Input {...register(`additionalDefects.${index}.defect`)} />
                  </div>
                  <div>
                    <Label>ATA Chapter</Label>
                    <Input {...register(`additionalDefects.${index}.ataChapter`)} />
                  </div>
                  <div>
                    <Label>Photo</Label>
                    <Input type="file" accept="image/*" {...register(`additionalDefects.${index}.photo`)} />
                  </div>
                  <div>
                    <Label>LAE (M/H)</Label>
                    <Input type="number" step="0.1" min="0" {...register(`additionalDefects.${index}.laeMH`)} />
                  </div>
                  <div>
                    <Label>MECH (M/H)</Label>
                    <Input type="number" step="0.1" min="0" {...register(`additionalDefects.${index}.mechMH`)} />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              color="primary"
              fullWidth
              onClick={() =>
                appendDefect({ defect: "", ataChapter: "", laeMH: "", mechMH: "", photo: undefined })
              }
            >
              + Defect
            </Button>
            <Separator className="mt-2" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-0">
          <div className="bg-blue-50/60 p-4 rounded-md w-full justify-between flex border border-primary-100">
            <Label>Fluid servicing performed?</Label>
            <Switch
              color="primary"
              checked={servicingPerformed}
              onCheckedChange={(checked) => setValue('servicingPerformed', checked)}
            />
          </div>
        </div>
        {/* STEP 2: ถ้าเลือก YES */}
        {servicingPerformed && (
          <div className="bg-gray-50 border border-t-0 border-primary-100 p-4 rounded-b-md ">
            {/* FLUID TYPE */}
            <div className="grid lg:grid-cols-3 gap-4 mb-0">
              <div>
                <Label>Fluid Type</Label>
                <Controller
                  name="fluid.fluidType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.value || ""}
                      onValueChange={(value) => {
                        const selectedOption = fluidOptions.find(opt => opt.value === value)
                        field.onChange(selectedOption || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="choose..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fluidOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <Separator className="mt-4 mb-4" />
            {/* ENG OIL */}
            {selectedFluidType?.value === 'ENG Oil' && (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid lg:grid-cols-3 gap-4 items-end">
                    <div className='col-span-1'>
                      <Label>Left (QTS)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        {...register(`fluid.engOilSets.${index}.left`)}
                      />
                    </div>
                    <div className='col-span-1'>
                      <Label>Right (QTS)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        {...register(`fluid.engOilSets.${index}.right`)}
                      />
                    </div>
                    <div className='col-span-1 flex space-x-2'>
                      {index ? <Button
                        type="button"
                        variant="soft"
                        color="destructive"
                        rounded="full"
                        size="icon"
                        className="!p-0"
                        onClick={() => remove(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button> : ""
                      }
                      <Button
                        type="button"
                        variant="soft"
                        color="primary"
                        rounded="full"
                        size="icon"
                        className="!p-0"
                        onClick={() => append({ left: '', right: '' })}
                      >
                        <CirclePlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HYDRAULIC */}
            {selectedFluidType?.value === 'Hydraulic' && (
              <div className="grid lg:grid-cols-3 gap-4">
                {isAirbus ? (
                  <>
                    <div>
                      <Label>Hydraulic - Blue (QTS)</Label>
                      <Input {...register('fluid.fluidType')} type="number" step="0.1" min="0" />
                    </div>
                    <div>
                      <Label>Hydraulic - Green (QTS)</Label>
                      <Input {...register('fluid.fluidType')} type="number" step="0.1" min="0" />
                    </div>
                    <div>
                      <Label>Hydraulic - Yellow (QTS)</Label>
                      <Input {...register('fluid.hydOilYellow')} type="number" step="0.1" min="0" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Hydraulic - A (QTS)</Label>
                      <Input {...register('fluid.hydOilA')} type="number" step="0.1" min="0" />
                    </div>
                    <div>
                      <Label>Hydraulic - B (QTS)</Label>
                      <Input {...register('fluid.hydOilB')} type="number" step="0.1" min="0" />
                    </div>
                    <div>
                      <Label>Hydraulic - STBY (QTS)</Label>
                      <Input {...register('fluid.hydOilSTBY')} type="number" step="0.1" min="0" />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* OTHER OIL */}
            <div className="grid lg:grid-cols-3 gap-4">
              {selectedFluidType?.value === 'APU Oil' && (
                <div>
                  <Label>Other Oil (QTS)</Label>
                  <Input {...register('fluid.otherQty')} type="number" step="0.1" min="0" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Flight Deck */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-0">
          <div className="bg-blue-50/60 p-4 rounded-md w-full justify-between flex border border-primary-100">
            <Label>Flight Deck?</Label>
            <Switch
              color="primary"
              checked={flightDeck}
              onCheckedChange={(checked) => setValue('flightDeck', checked)}
            />
          </div>
        </div>
        {flightDeck && (
          <div className="bg-gray-50 border border-t-0 border-primary-100 p-4 rounded-b-md ">
            {flightDeckInfoFields.map((field, index) => (
              <div key={field.id} className="grid md:grid-cols-4 gap-4 p-4 rounded-md">
                <div className="flex-1">
                  <Label>Date</Label>
                  <Input {...register(`flightDeckInfo.${index}.date`)} type="date" />
                </div>
                <div>
                  <Label>Time on</Label>
                  <Input {...register(`flightDeckInfo.${index}.timeOn`)} />
                </div>
                <div>
                  <Label>Time of</Label>
                  <Input {...register(`flightDeckInfo.${index}.timeOf`)} />
                </div>
                <div className="flex items-end space-x-2">
                  {index ? (
                    <Button
                      type="button"
                      variant="soft"
                      color="destructive"
                      rounded="full"
                      size="icon"
                      className="!p-0" onClick={() => removeFlightDeckInfo(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  ) : ""
                  }
                  <Button
                    type="button"
                    variant="soft"
                    color="primary"
                    rounded="full"
                    size="icon"
                    className="!p-0"
                    onClick={() =>
                      appendFlightDeckInfo({ date: '', timeOn: '', timeOf: '' })
                    }
                  >
                    <CirclePlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Separator />
          </div>
        )}
      </div>
      {/* aircraft Towing */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-0">
          <div className="bg-blue-50/60 p-4 rounded-md w-full justify-between flex border border-primary-100">
            <Label>Aircraft Towing?</Label>
            <Switch
              color="primary"
              checked={aircraftTowing}
              onCheckedChange={(checked) => setValue('aircraftTowing', checked)}
            />
          </div>
        </div>
        {aircraftTowing && (
          <div className="bg-gray-50 border border-t-0 border-primary-100 p-4 rounded-b-md ">
            {aircraftTowingInfoFields.map((field, index) => (
              <div key={field.id}>
                {index ? <Separator /> : null}
                <div className="grid md:grid-cols-4 gap-4 p-4 rounded-md">
                  <div className="flex-1">
                    <Label>Date</Label>
                    <Input {...register(`flightDeckInfo.${index}.date`)} type="date" />
                  </div>
                  <div>
                    <Label>Time on</Label>
                    <Input {...register(`flightDeckInfo.${index}.timeOn`)} />
                  </div>
                  <div>
                    <Label>Time of</Label>
                    <Input {...register(`flightDeckInfo.${index}.timeOf`)} />
                  </div>
                  <div className="flex items-end space-x-2">
                    {index ? (<Button
                      type="button"
                      variant="soft"
                      color="destructive"
                      rounded="full"
                      size="icon"
                      className="!p-0"
                      onClick={() => removeAircraftTowingInfo(index)}
                    >
                      <Trash className=" h-4 w-4" />
                    </Button>
                    ) : ""}
                    <Button
                      type="button"
                      variant="soft"
                      color="primary"
                      rounded="full"
                      size="icon"
                      className="!p-0"
                      onClick={() =>
                        appendAircraftTowingInfo({ date: '', timeOn: '', timeOf: '' })
                      }
                    >
                      <CirclePlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Separator />
      <div className="flex justify-between pt-4">
        <Button onClick={goBack} variant="soft" color="primary">
          Back
        </Button>
        <div className='space-x-2'>
          <Button type="submit" color="primary">Next</Button>
        </div>
      </div>
    </form>
  )
}

export default ServicesStep
