'use client'

import React from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useStep } from './step-context'
import { Trash } from "lucide-react"
import { Switch } from '@/components/ui/switch'
import { CleaveInput } from '@/components/ui/cleave'

type Equipment = {
  equipmentName: string
  timeOn: string
  timeOff: string
  hrs: string
  svcQty: string
  from: string
  to: string
  samsTool: boolean
  loan: boolean
}

type FormData = {
  equipments: Equipment[]
}

export default function EquipmentStep() {
  const { goNext, goBack } = useStep()

  const { control, register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      equipments: [
        {
          equipmentName: '',
          timeOn: '',
          timeOff: '',
          hrs: '',
          svcQty: '',
          from: '',
          to: '',
          samsTool: true,
          loan: false,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'equipments',
  })

  const onSubmit = (data: FormData) => {
    // console.log('Submit data:', data)
    // alert(JSON.stringify(data, null, 2))
    goNext()
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>Step 5 : Equipment</h2>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid lg:grid-cols-6 gap-4 border border-gray-300 p-4 pt-8 rounded mb-4  relative "
        >
          <div className="col-span-6 text-right absolute top-0 right-0">
            <Button type="button" variant="ghost" color="destructive" onClick={() => remove(index)}>
              <Trash className="mr-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-6 gap-4 col-span-6">
            <div className="flex items-center gap-3 col-span-1">
              <Label htmlFor={`tools.${index}.samsTool`}>SAMS TOOL</Label>
              <Controller
                control={control}
                name={`equipments.${index}.samsTool` as const}
                render={({ field }) => (
                  <Switch
                    id={`tools.${index}.samsTool`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="flex items-center gap-3 col-span-1">
              <Label htmlFor={`equipments.${index}.loan`}>LOAN</Label>
              <Controller
                control={control}
                name={`equipments.${index}.loan` as const}
                render={({ field }) => (
                  <Switch
                    id={`equipments.${index}.loan`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
          <div className="col-span-2">
            <Label htmlFor={`equipments.${index}.equipmentName`}>Equipment Name</Label>
            <Input
              id={`equipments.${index}.equipmentName`}
              type="text"
              {...register(`equipments.${index}.equipmentName` as const, { required: false })}
              placeholder="Equipment name"
            />
          </div>
          <div className="col-span-1">
            <Label htmlFor={`equipments.${index}.hrs`}>HRS</Label>
            <Input
              id={`equipments.${index}.hrs`}
              type="text"
              {...register(`equipments.${index}.hrs` as const, { required: false })}
              placeholder="HRS"
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor={`equipments.${index}.svcQty`}>SVC(Quantity)</Label>
            <Input
              id={`equipments.${index}.svcQty`}
              type="number"
              {...register(`equipments.${index}.svcQty` as const, { required: false, min: 0 })}
              placeholder="SVC"
            />
          </div>
          {/* <div className="col-span-1">
            <Label htmlFor={`equipments.${index}.timeOn`}>Time ON</Label>
            <Input
              id={`equipments.${index}.timeOn`}
              type="time"
              {...register(`equipments.${index}.timeOn` as const, { required: false })}
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor={`equipments.${index}.timeOff`}>Time OFF</Label>
            <Input
              id={`equipments.${index}.timeOff`}
              type="time"
              {...register(`equipments.${index}.timeOff` as const, { required: false })}
            />
          </div> */}
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
                {...register(`equipments.${index}.from` as const)}
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
                {...register(`equipments.${index}.to` as const)}
                placeholder="00:00"
              />
            </div>
          </div>

        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            equipmentName: '',
            timeOn: '',
            timeOff: '',
            hrs: '',
            svcQty: '',
            from: '',
            to: '',
            samsTool: true,
            loan: false,
          })
        }
        className="mb-4"
      >
        Add Equipment
      </Button>

      <br />

      <div className="flex justify-between pt-4">
        <Button onClick={goBack} variant="soft">Back</Button>
        <div className='space-x-2'>
          <Button type="button" variant="soft">Draft</Button>
          <Button type="submit">Next</Button>
        </div>
      </div>
    </form>
  )
}