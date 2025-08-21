'use client'

import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import Select from 'react-select'
import { useStep } from './step-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

// 🧠 เพิ่ม generic ให้ Select เพื่อไม่ให้ TS error
type StatusOption = {
  label: string
  value: string
}

type Step1FormInputs = {
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
}

const statusOptions: StatusOption[] = [
  { value: "normal", label: "Normal" },
  { value: "divertReroute", label: "Divert/Reroute" },
  { value: "eob", label: "EOB" },
  { value: "aog", label: "AOG" },
  { value: "cancel", label: "Cancel" },
]

const stationOptions: StatusOption[] = [
  { value: "BKK", label: "BKK" },
  { value: "DMK", label: "DMK" },
  { value: "HKT", label: "HKT" },
  { value: "HDY", label: "HDY" },
  { value: "CNX", label: "CNX" },
  { value: "CEI", label: "CEI" },
  { value: "UTH", label: "UTH" },
  { value: "KBV", label: "KBV" }
];
const customerOptions: StatusOption[] = [
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
const FlightStep = () => {
  const { goNext, onSave } = useStep()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<Step1FormInputs>({
    defaultValues: {
      customer: null,
      station: null,
      acReg: '',
      acType: '',
      flightArrival: '',
      arrivalDate: '',
      sta: '',
      ata: '',
      flightDeparture: '',
      departureDate: '',
      std: '',
      atd: '',
      bay: '',
      status: null,
      note: '',
      thfNumber: '',
      delayCode: '',
    },
  })

  const currentStatus = watch('status')?.value

  const onSubmit: SubmitHandler<Step1FormInputs> = (data) => {
    if (currentStatus !== 'cancel') {
      onSave(data)
      goNext()
    } else {
      onSave(data)
    }
  }

  return (
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
      <div className="flex justify-end pt-4 space-x-2">
        <Button type="button" variant="soft">Cancel</Button>
        {currentStatus !== 'cancel' ? (
          <Button type="submit">Next</Button>
        ) : (
          <Button type="submit" variant="outline">
            Save
          </Button>
        )}
      </div>
    </form>
  )
}

export default FlightStep
