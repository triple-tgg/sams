'use client'

import React from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useStep } from './step-context'
import { Trash } from 'lucide-react'
import Select from 'react-select'
import { useRouter } from 'next/navigation'
import { CleaveInput } from '@/components/ui/cleave'

type Tool = {
  name: string
  partNo: string
  serialIn: string
  serialOut: string
  qty: number | ''
  equipmentNo: string
  fromStation: string
  toStation: string
  samsTool: boolean
  loan: boolean
}

type FormData = {
  tools: Tool[]
}
type StatusOption = {
  label: string
  value: string
}

const stationOptions: StatusOption[] = [
  { value: "BKK", label: "BKK" },
  { value: "DMK", label: "DMK" },
  { value: "HKT", label: "HKT" },
  { value: "HDY", label: "HDY" },
  { value: "CNX", label: "CNX" },
  { value: "CEI", label: "CEI" },
  { value: "UTH", label: "UTH" }
]
export default function PartsToolsStep() {
  const { goNext, goBack, onSave } = useStep()
  const router = useRouter()
  const { control, register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      tools: [
        {
          name: '',
          partNo: '',
          serialIn: '',
          serialOut: '',
          qty: '',
          equipmentNo: '',
          fromStation: '',
          toStation: '',
          samsTool: false,
          loan: false,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tools',
  })

  const onSubmit = (data: FormData) => {
    console.log('Submit data:', data)
    goNext()
    // router.push('/flight')
    // alert(JSON.stringify(data, null, 2))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-xl font-semibold mb-4">Step 6: Parts / Tools</h2>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid lg:grid-cols-6 gap-4 border border-gray-300 p-4 rounded mb-4"
        >
          <div className="col-span-6">
            <Label htmlFor={`tools.${index}.name`}>name (Parts / Tools)</Label>
            <Input
              id={`tools.${index}.name`}
              type="text"
              {...register(`tools.${index}.name` as const, { required: false })}
              placeholder="name"
            />
          </div>

          <div>
            <Label htmlFor={`tools.${index}.partNo`}>Part No. (P/N)</Label>
            <Input
              id={`tools.${index}.partNo`}
              type="text"
              {...register(`tools.${index}.partNo` as const)}
              placeholder="Part No. "
            />
          </div>

          <div>
            <Label htmlFor={`tools.${index}.serialIn`}>Serial No. (IN)</Label>
            <Input
              id={`tools.${index}.serialIn`}
              type="text"
              {...register(`tools.${index}.serialIn` as const)}
              placeholder="Serial IN"
            />
          </div>

          <div>
            <Label htmlFor={`tools.${index}.serialOut`}>Serial No. (OUT)</Label>
            <Input
              id={`tools.${index}.serialOut`}
              type="text"
              {...register(`tools.${index}.serialOut` as const)}
              placeholder="Serial OUT"
            />
          </div>

          <div>
            <Label htmlFor={`tools.${index}.qty`}>Qty</Label>
            <Input
              id={`tools.${index}.qty`}
              type="number"
              {...register(`tools.${index}.qty` as const, {
                min: 0,
                valueAsNumber: true,
              })}
              placeholder="Qty"
            />
          </div>

          <div>
            <Label htmlFor={`tools.${index}.equipmentNo`}>Equipment No.</Label>
            <Input
              id={`tools.${index}.equipmentNo`}
              type="text"
              {...register(`tools.${index}.equipmentNo` as const)}
              placeholder="Equipment No."
            />
          </div>

          <div className="col-span-2">
            <Label>From (UTC)</Label>
            <div className="grid lg:grid-cols-2 gap-4">
              <CleaveInput
                id="date"
                options={{ date: true, datePattern: ["d", "m", "y"] }}
                placeholder="DD-MM-YYYY"
              />
              <Input
                id={`tools.${index}.fromStation`}
                type="time"
                {...register(`tools.${index}.fromStation` as const)}
                placeholder="00:00"
              />
            </div>
          </div>
          <div className="col-span-2">
            <Label>To (UTC) </Label>
            <div className="grid lg:grid-cols-2 gap-4">
              <CleaveInput
                id="date"
                options={{ date: true, datePattern: ["d", "m", "y"] }}
                placeholder="DD-MM-YYYY"
              />
              <Input
                id={`tools.${index}.toStation`}
                type="time"
                {...register(`tools.${index}.toStation` as const)}
                placeholder="00:00"
              />
            </div>
          </div>


          <div className="flex items-center space-x-8 col-span-2">
            <div className="flex items-center flex-col gap-3">
              <Label htmlFor={`tools.${index}.samsTool`}>SAMS TOOL</Label>
              <Controller
                control={control}
                name={`tools.${index}.samsTool` as const}
                render={({ field }) => (
                  <Switch
                    id={`tools.${index}.samsTool`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center flex-col gap-3">
              <Label htmlFor={`tools.${index}.loan`}>LOAN</Label>
              <Controller
                control={control}
                name={`tools.${index}.loan` as const}
                render={({ field }) => (
                  <Switch
                    id={`tools.${index}.loan`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="col-span-6 text-right">
            <Button type="button" variant="ghost" color="destructive" onClick={() => remove(index)}>
              <Trash className="mr-2 h-4 w-4" /> delete
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            name: '',
            partNo: '',
            serialIn: '',
            serialOut: '',
            qty: '',
            equipmentNo: '',
            fromStation: '',
            toStation: '',
            samsTool: false,
            loan: false,
          })
        }
        className="mb-4"
      >
        + Add Tools
      </Button>

      <br />
      <div className="flex justify-between pt-4">
        <Button onClick={goBack} variant="soft">Back</Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  )
}
