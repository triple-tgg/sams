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

const maintenanceOptions = [
  { value: "TR", label: "TR" },
  { value: "Preflight", label: "Preflight" },
  { value: "NS", label: "NS" },
  { value: "Weekly", label: "Weekly" },
  { value: "A-Check", label: "A-Check" },
]

const maintenanceSubTypesOptions = [
  { value: "Full Handling", label: "Full Handling" },
  { value: "Assistance", label: "Assistance" },
  { value: "Certification", label: "Certification" },
  { value: "On Call", label: "On Call" },
  { value: "Marshalling", label: "Marshalling" },
]

const defectSchema = z.object({
  defect: z.string().min(1, "กรุณากรอกข้อมูล"),
  ataChapter: z.string().min(1, "กรุณากรอก ATA Chapter"),
  photo: z.any().optional().refine((val) => !val || val instanceof FileList, {
    message: "รูปภาพไม่ถูกต้อง",
  }),
  laeMH: z.string().optional(),
  mechMH: z.string().optional(),
})

const formSchema = z
  .object({
    aircraftChecks: z
      .array(
        z.object({
          maintenanceTypes: z.string().min(1, "กรุณาเลือกประเภท"),
          maintenanceSubTypes: z.array(z.string()),
          laeMH: z.string().optional(),
          mechMH: z.string().optional(),
        })
      )
      .min(1, "กรุณาเพิ่ม Aircraft Check อย่างน้อย 1 รายการ"),
    additionalDefectRectification: z.boolean(),
    additionalDefects: z.array(defectSchema).optional(),
  })
  .superRefine((data, ctx) => {
    data.aircraftChecks.forEach((check, index) => {
      if (check.maintenanceTypes === "TR" && check.maintenanceSubTypes.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือก Maintenance Sub Types",
          path: ["aircraftChecks", index, "maintenanceSubTypes"],
        })
      }
    })
    if (
      data.additionalDefectRectification &&
      (!data.additionalDefects || data.additionalDefects.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเพิ่มรายการ defect อย่างน้อย 1 รายการ",
        path: ["additionalDefects"],
      })
    }
  })

type ServicesFormInputs = z.infer<typeof formSchema>

const ServicesStep = () => {
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

  const additionalDefect = watch("additionalDefectRectification")

  const onSubmit = (data: ServicesFormInputs) => {
    onSave(data)
    goNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 space-x-4  p-4 pt-10">
      <Label className="text-lg">Aircraft Check</Label>
      {aircraftFields.map((item, index) => {
        const watchType = watch(`aircraftChecks.${index}.maintenanceTypes`)
        return (
          <Card key={item.id} className="mt-4">
            <CardContent className="p-8 space-y-4">
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

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>LAE (M/H)</Label>
                  <Input type="number" step="0.1" min="0" {...register(`aircraftChecks.${index}.laeMH`)} />
                </div>
                <div>
                  <Label>MECH (M/H)</Label>
                  <Input type="number" step="0.1" min="0" {...register(`aircraftChecks.${index}.mechMH`)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" type="button" color="destructive" onClick={() => removeAircraft(index)}>
                  <Trash className="mr-2 h-4 w-4" />delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
      <Button type="button" variant="outline" onClick={() => appendAircraft({ maintenanceTypes: '', maintenanceSubTypes: [], laeMH: '', mechMH: '' })}>
        + Check
      </Button>

      <div className="space-y-2">
        <Label>Additional Defect Rectification</Label>
        <div className="flex items-center gap-4">
          <Switch
            checked={additionalDefect}
            onCheckedChange={(checked) =>
              setValue("additionalDefectRectification", checked)
            }
          />
          <span>{additionalDefect ? "Yes" : "No"}</span>
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
                  <Trash className="mr-2 h-4 w-4" /> delete
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
            + เพิ่ม Defect
          </Button>
        </div>
      )}

      <Separator />
      <div className="flex justify-between pt-4">
        <Button onClick={goBack} variant="soft">
          Back
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  )
}

export default ServicesStep
