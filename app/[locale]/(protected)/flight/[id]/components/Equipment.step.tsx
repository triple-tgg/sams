'use client'

import React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useStep } from './step-context'

type Equipment = {
  equipmentName: string
  timeOn: string
  timeOff: string
  hrs: string
  svcQty: string
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
          className="grid lg:grid-cols-6 gap-4 border border-gray-300 p-4 rounded mb-4"
        >
          <div className="col-span-2">
            <Label htmlFor={`equipments.${index}.equipmentName`}>Equipment Name</Label>
            <Input
              id={`equipments.${index}.equipmentName`}
              type="text"
              {...register(`equipments.${index}.equipmentName` as const, { required: true })}
              placeholder="ชื่ออุปกรณ์"
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor={`equipments.${index}.timeOn`}>Time ON</Label>
            <Input
              id={`equipments.${index}.timeOn`}
              type="time"
              {...register(`equipments.${index}.timeOn` as const, { required: true })}
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor={`equipments.${index}.timeOff`}>Time OFF</Label>
            <Input
              id={`equipments.${index}.timeOff`}
              type="time"
              {...register(`equipments.${index}.timeOff` as const, { required: true })}
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor={`equipments.${index}.hrs`}>HRS</Label>
            <Input
              id={`equipments.${index}.hrs`}
              type="text"
              {...register(`equipments.${index}.hrs` as const, { required: true })}
              placeholder="HRS"
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor={`equipments.${index}.svcQty`}>SVC</Label>
            <Input
              id={`equipments.${index}.svcQty`}
              type="number"
              {...register(`equipments.${index}.svcQty` as const, { required: true, min: 0 })}
              placeholder="SVC"
            />
          </div>

          <div className="col-span-6 text-right">
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
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
          })
        }
        className="mb-4"
      >
        Add Equipment
      </Button>

      <br />

      <div className="flex justify-between pt-4">
        <Button onClick={goBack} variant="soft">Back</Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  )
}