'use client'

import { useForm, Controller, useFieldArray } from 'react-hook-form'
import Select from 'react-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useStep } from './step-context'
import { Switch } from '@/components/ui/switch'
import { Trash } from 'lucide-react'

type FluidOption = { label: string; value: string }

const fluidOptions: FluidOption[] = [
  { label: 'Hydraulic', value: 'Hydraulic' },
  { label: 'ENG Oil', value: 'ENG Oil' },
  { label: 'APU Oil', value: 'APU Oil' },
]

type FluidFormInputs = {
  servicingPerformed: boolean
  fluidType: FluidOption | null
  engOilSets?: {
    left: string
    right: string
  }[]
  hydOilBlue?: string
  hydOilGreen?: string
  hydOilYellow?: string
  hydOilA?: string
  hydOilB?: string
  hydOilSTBY?: string
  otherQty?: string
}

const FluidStep = ({ flightNumber }: { flightNumber: string }) => {
  const { goNext, onSave, goBack } = useStep()

  const {
    register,
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FluidFormInputs>({
    defaultValues: {
      servicingPerformed: false,
      fluidType: null,
      engOilSets: [{ left: '', right: '' }],
    },
  })

  const servicingPerformed = watch('servicingPerformed')
  const selectedFluidType = watch('fluidType')?.value
  const isAirbus = flightNumber.toLowerCase().includes('a') // สมมุติ logic
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'engOilSets',
  })

  const onSubmit = (data: FluidFormInputs) => {
    onSave(data)
    goNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* STEP 1: YES/NO */}
      <div className="space-y-2">
        <Label>Fluid servicing performed?</Label>
        <div className="flex items-center gap-3">
          <Switch
            id="s1"
            checked={servicingPerformed}
            onCheckedChange={(checked) => setValue('servicingPerformed', checked)}
          />
          <Label htmlFor="s1">Active Switch</Label>
        </div>
      </div>

      {/* STEP 2: ถ้าเลือก YES */}
      {servicingPerformed && (
        <>
          {/* FLUID TYPE */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div>
              <Label>Fluid Type</Label>
              <Controller
                name="fluidType"
                control={control}
                render={({ field }) => (
                  <Select {...field} options={fluidOptions} placeholder="choose..." />
                )}
              />
            </div>
          </div>
          {/* ENG OIL */}
          {selectedFluidType === 'eng_oil' && (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid lg:grid-cols-3 gap-4 items-end">
                  <div className='col-span-1'>
                    <Label>Left (QTS)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...register(`engOilSets.${index}.left`)}
                    />
                  </div>
                  <div className='col-span-1'>
                    <Label>Right (QTS)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...register(`engOilSets.${index}.right`)}
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
          {selectedFluidType === 'hydraulic' && (
            <div className="grid lg:grid-cols-3 gap-4">
              {isAirbus ? (
                <>
                  <div>
                    <Label>Hydraulic - Blue (QTS)</Label>
                    <Input {...register('hydOilBlue')} type="number" step="0.1" min="0" />
                  </div>
                  <div>
                    <Label>Hydraulic - Green (QTS)</Label>
                    <Input {...register('hydOilGreen')} type="number" step="0.1" min="0" />
                  </div>
                  <div>
                    <Label>Hydraulic - Yellow (QTS)</Label>
                    <Input {...register('hydOilYellow')} type="number" step="0.1" min="0" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Hydraulic - A (QTS)</Label>
                    <Input {...register('hydOilA')} type="number" step="0.1" min="0" />
                  </div>
                  <div>
                    <Label>Hydraulic - B (QTS)</Label>
                    <Input {...register('hydOilB')} type="number" step="0.1" min="0" />
                  </div>
                  <div>
                    <Label>Hydraulic - STBY (QTS)</Label>
                    <Input {...register('hydOilSTBY')} type="number" step="0.1" min="0" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* OTHER OIL */}
          <div className="grid lg:grid-cols-3 gap-4">
            {selectedFluidType === 'other' && (
              <div>
                <Label>Other Oil (QTS)</Label>
                <Input {...register('otherQty')} type="number" step="0.1" min="0" />
              </div>
            )}
          </div>
        </>
      )}

      <Separator />

      {/* SUBMIT */}
      <div className="flex justify-between pt-4">
        <Button onClick={goBack} variant="soft">Back</Button>
        <Button type="submit">Next
          {/* {servicingPerformed ? 'Next' : 'Save'} */}
        </Button>
      </div>
    </form>
  )
}

export default FluidStep
