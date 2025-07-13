"use client"

import React, { useEffect } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import Select from "react-select"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Trash } from "lucide-react"
import { useStep } from "./step-context"
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
  // { value: "Full Handling", label: "Full Handling" },
  // { value: "Certification", label: "Certification" },
  // { value: "Marshalling", label: "Marshalling" },
]
type FluidOption = { label: string; value: string }

const fluidOptions: FluidOption[] = [
  { label: 'Hydraulic', value: 'Hydraulic' },
  { label: 'ENG Oil', value: 'ENG Oil' },
  { label: 'APU Oil', value: 'APU Oil' },
]
// const defectSchema = z.object({
//   defect: z.string().min(1, "กรุณากรอกข้อมูล"),
//   ataChapter: z.string().min(1, "กรุณากรอก ATA Chapter"),
//   photo: z.any().optional().refine((val) => !val || val instanceof FileList, {
//     message: "รูปภาพไม่ถูกต้อง",
//   }),
//   laeMH: z.string().optional(),
//   mechMH: z.string().optional(),
// })
// const fluidSchema = z.object({
//   fluidType: z.string(),
//   hydOilBlue: z.string(),
//   hydOilGreen: z.string(),
//   hydOilYellow: z.string(),
//   hydOilA: z.string(),
//   hydOilB: z.string(),
//   hydOilSTBY: z.string(),
//   otherQty: z.string(),
// })

// const formSchema = z
//   .object({
//     aircraftChecks: z
//       .array(
//         z.object({
//           maintenanceTypes: z.string().min(1, "กรุณาเลือกประเภท"),
//           maintenanceSubTypes: z.array(z.string()),
//           laeMH: z.string().optional(),
//           mechMH: z.string().optional(),
//         })
//       )
//       .min(1, "กรุณาเพิ่ม Aircraft Check อย่างน้อย 1 รายการ"),
//     additionalDefectRectification: z.boolean(),
//     additionalDefects: z.array(defectSchema).optional(),
//     servicingPerformed: z.boolean(),
//     fluid: z.array(fluidSchema).optional(),
//   })
//   .superRefine((data, ctx) => {
//     data.aircraftChecks.forEach((check, index) => {
//       if (check.maintenanceTypes === "TR" && check.maintenanceSubTypes.length === 0) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: "กรุณาเลือก Maintenance Sub Types",
//           path: ["aircraftChecks", index, "maintenanceSubTypes"],
//         })
//       }
//     })
//     if (
//       data.additionalDefectRectification &&
//       (!data.additionalDefects || data.additionalDefects.length === 0)
//     ) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: "กรุณาเพิ่มรายการ defect อย่างน้อย 1 รายการ",
//         path: ["additionalDefects"],
//       })
//     }
//   })

// type ServicesFormInputs = z.infer<typeof formSchema>
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
    // resolver: zodResolver(formSchema),
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
        engOilSets: [],
        hydOilBlue: "",
        hydOilGreen: "",
        hydOilYellow: "",
        hydOilA: "",
        hydOilB: "",
        hydOilSTBY: "",
        otherQty: "",
      },
      addPersonnels: false,
      personnel: null,
      flightDeck: false,
      flightDeckInfo: null,
      aircraftTowing: false,
      aircraftTowingInfo: null
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
  const selectedFluidType = watch('fluid.fluidType')?.value
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 space-x-4  p-4 pt-10">
      <Label className="text-lg">Aircraft Check</Label>
      {aircraftFields.map((item, index) => {
        const watchType = watch(`aircraftChecks.${index}.maintenanceTypes`)
        return (
          <Card key={item.id} className="mt-4">
            <CardContent className="p-8 space-y-4 relative">
              <div className="flex justify-end absolute top-0 right-0">
                <Button variant="ghost" type="button" color="destructive" onClick={() => removeAircraft(index)}>
                  <Trash className="mr-2 h-4 w-4" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Check Type</Label>
                  <Controller
                    control={control}
                    name={`aircraftChecks.${index}.maintenanceTypes`}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={maintenanceOptions}
                        onChange={(selected) => field.onChange(selected?.value || '')}
                        value={maintenanceOptions.find((opt) => opt.value === field.value) || null}
                      />
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
                        <Select
                          {...field}
                          isMulti
                          options={maintenanceSubTypesOptions}
                          onChange={(selected) =>
                            field.onChange(selected.map((s) => s.value))
                          }
                          value={maintenanceSubTypesOptions.filter((opt) =>
                            field.value.includes(opt.value)
                          )}
                        />
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

              {/* <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>LAE (M/H)</Label>
                  <Input type="number" step="0.1" min="0" {...register(`aircraftChecks.${index}.laeMH`)} />
                </div>
                <div>
                  <Label>MECH (M/H)</Label>
                  <Input type="number" step="0.1" min="0" {...register(`aircraftChecks.${index}.mechMH`)} />
                </div>
              </div> */}

            </CardContent>
          </Card>
        )
      })}
      <Button type="button" variant="outline" onClick={() => appendAircraft({ maintenanceTypes: '', maintenanceSubTypes: [], laeMH: '', mechMH: '' })}>
        + Check
      </Button>
      {/* Personnels */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Personnels?</Label>
          <Switch
            checked={addPersonnels}
            onCheckedChange={(checked) =>
              setValue("addPersonnels", checked)
            }
          />
        </div>
        {addPersonnels && (
          <>
            {personnelsFields.map((field, index) => (
              <div
                key={field.id}
                className="grid lg:grid-cols-6 gap-6 border border-gray-300 p-6  rounded mb-4 relative"
              >
                <div className="col-span-6 text-right absolute top-0 right-0">
                  <Button type="button" variant="ghost" color="destructive" onClick={() => removePersonnels(index)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                <div className="col-span-1">
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

                <div className="col-span-6">
                  <Label htmlFor={`personnel.${index}.remark`}>Note.:</Label>
                  <Textarea
                    id={`personnel.${index}.remark`}
                    {...register(`personnel.${index}.remark` as const)}
                    placeholder="Note...."
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendPersonnels({ staffId: '', name: '', type: '', from: '', to: '', remark: '' })}>
              + Personnel
            </Button>
            <Separator className="mt-2" />
          </>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Additional Defect Rectification?</Label>
          <Switch
            checked={additionalDefect}
            onCheckedChange={(checked) =>
              setValue("additionalDefectRectification", checked)
            }
          />
        </div>
      </div>

      {additionalDefect && (
        <div className="space-y-4 space-x-4">
          <Label>Additional Defect</Label>
          {defectFields.map((field, index) => (
            <div key={field.id} className="grid md:grid-cols-3 gap-4 border p-4 rounded-md">
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
              <div className="md:col-span-3 flex justify-end">
                <Button type="button" variant="ghost" color="destructive" onClick={() => removeDefect(index)}>
                  <Trash className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              appendDefect({ defect: "", ataChapter: "", laeMH: "", mechMH: "", photo: undefined })
            }
          >
            + Defect
          </Button>
          <Separator />
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Fluid servicing performed?</Label>
          <Switch
            checked={servicingPerformed}
            onCheckedChange={(checked) => setValue('servicingPerformed', checked)}
          />
        </div>
        {/* STEP 2: ถ้าเลือก YES */}
        {servicingPerformed && (
          <>
            {/* FLUID TYPE */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div>
                <Label>Fluid Type</Label>
                <Controller
                  name="fluid.fluidType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} options={fluidOptions} placeholder="choose..." />
                  )}
                />
              </div>
            </div>
            {/* ENG OIL */}
            {selectedFluidType === 'ENG Oil' && (
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
                    <div className='col-span-1'>
                      <Button
                        type="button"
                        variant="soft"
                        color="destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ left: '', right: '' })}
                >
                  + Add ENG
                </Button>
              </div>
            )}

            {/* HYDRAULIC */}
            {selectedFluidType === 'Hydraulic' && (
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
              {selectedFluidType === 'APU Oil' && (
                <div>
                  <Label>Other Oil (QTS)</Label>
                  <Input {...register('fluid.otherQty')} type="number" step="0.1" min="0" />
                </div>
              )}
            </div>
            <Separator />
          </>
        )}
      </div>

      {/* Flight Deck */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Flight Deck?</Label>
          <Switch
            checked={flightDeck}
            onCheckedChange={(checked) => setValue('flightDeck', checked)}
          />
        </div>
        {flightDeck && (
          <>
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
                <div className="flex items-end">
                  <Button type="button" variant="ghost" color="destructive" onClick={() => removeFlightDeckInfo(index)}>
                    <Trash className="mr-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendFlightDeckInfo({ date: '', timeOn: '', timeOf: '' })
              }
            >
              + add
            </Button>
            <Separator />
          </>
        )}
      </div>
      {/* aircraft Towing */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Aircraft Towing?</Label>
          <Switch
            checked={aircraftTowing}
            onCheckedChange={(checked) => setValue('aircraftTowing', checked)}
          />
        </div>
        {aircraftTowing && (
          <>
            {aircraftTowingInfoFields.map((field, index) => (
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
                <div className="flex items-end">
                  <Button type="button" variant="ghost" color="destructive" onClick={() => removeAircraftTowingInfo(index)}>
                    <Trash className="mr-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendAircraftTowingInfo({ date: '', timeOn: '', timeOf: '' })
              }
            >
              + add
            </Button>
          </>
        )}
      </div>
      <Separator />
      <div className="flex justify-between pt-4">
        <Button onClick={goBack} variant="soft">
          Back
        </Button>
        <div className='space-x-2'>
          <Button type="button" variant="soft">Draft</Button>
          <Button type="submit">Next</Button>
        </div>
      </div>
    </form>
  )
}

export default ServicesStep
