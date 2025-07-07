

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form'
import { useStep } from './step-context'
import { Trash } from 'lucide-react'

type Personnel = {
  staffId: string
  name: string
  type: string
  from: string
  to: string
  remark?: string
}

type FormData = {
  personnels: Personnel[]
}

// ตัวอย่างฐานข้อมูลพนักงาน (จริงๆ ควรดึงจาก API)
const staffList = [
  { staffId: 'A001', name: 'สมชาย ใจดี', type: 'LAE' },
  { staffId: 'B002', name: 'สมหญิง แสนดี', type: 'MECH' },
  { staffId: 'C003', name: 'สมปอง น่ารัก', type: 'LAE' },
]

export default function PersonnelStep() {
  const { goNext, goBack } = useStep()

  const { control, register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      personnels: [{ staffId: '', name: '', type: '', from: '', to: '', remark: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'personnels',
  })

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
      setValue(`personnels.${index}.staffId`, staff.staffId)
      setValue(`personnels.${index}.name`, staff.name)
      setValue(`personnels.${index}.type`, staff.type)
    }
  }


  const onSubmit = (data: FormData) => {
    goNext()
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>Step 4 : Personnel</h2>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid lg:grid-cols-6 gap-6 border border-gray-300 p-4 rounded mb-4"
        >
          <div className="col-span-1">
            <Label htmlFor={`personnels.${index}.staffId`}>Staff ID / Name:</Label>
            <Input
              id={`personnels.${index}.staffId`}
              type="text"
              {...register(`personnels.${index}.staffId` as const)}
              onChange={(e) => onStaffInputChange(index, e.target.value)}
              placeholder="Staff ID"
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor={`personnels.${index}.name`}>name:</Label>
            <Input
              id={`personnels.${index}.name`}
              type="text"
              {...register(`personnels.${index}.name` as const)}
              // readOnly
              placeholder="name"
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor={`personnels.${index}.type`}>Type:</Label>
            <Input
              id={`personnels.${index}.type`}
              type="text"
              {...register(`personnels.${index}.type` as const)}
              readOnly
              placeholder="Type ( LAE, MECH)"
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor={`personnels.${index}.from`}>From:</Label>
            <Input
              id={`personnels.${index}.from`}
              type="time"
              {...register(`personnels.${index}.from` as const, { required: true })}
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor={`personnels.${index}.to`}>To:</Label>
            <Input
              id={`personnels.${index}.to`}
              type="time"
              {...register(`personnels.${index}.to` as const, { required: true })}
            />
          </div>

          <div className="col-span-6">
            <Label htmlFor={`personnels.${index}.remark`}>Note.:</Label>
            <Textarea
              id={`personnels.${index}.remark`}
              {...register(`personnels.${index}.remark` as const)}
              placeholder="Note...."
            />
          </div>

          <div className="col-span-6 text-right">
            <Button type="button" variant="ghost" color="destructive" onClick={() => remove(index)}>
              <Trash className="mr-2 h-4 w-4" /> delete
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={() => append({ staffId: '', name: '', type: '', from: '', to: '', remark: '' })}>
        + Personnel
      </Button>

      <br />
      <div className="flex justify-between pt-4">
        <Button onClick={goBack} variant="soft">Back</Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  )
}
