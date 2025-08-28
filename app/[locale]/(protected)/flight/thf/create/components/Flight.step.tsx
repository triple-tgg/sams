'use client'

import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Select from 'react-select'
import { useStep } from './step-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useAirlineOptions } from '@/lib/api/hooks/useAirlines'
import { useStationsOptions } from '@/lib/api/hooks/useStations'
import { useStatusOptions } from '@/lib/api/hooks/useStatus'
import { useFlightFormData } from '@/lib/api/hooks/useFlightQueryById'

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

// Dynamic options will be loaded from API hooks
// - customerOptions from useAirlineOptions
// - stationOptions from useStationsOptions  
// - statusOptions from useStatusOptions
const FlightStep = () => {
  const { goNext, onSave } = useStep()
  const searchParams = useSearchParams()

  // Track if we've already loaded the data to prevent re-renders
  const hasLoadedData = useRef(false)

  // Get flightId from URL parameters
  const flightId = searchParams.get('flightId') ? parseInt(searchParams.get('flightId')!) : null

  // Load existing flight data if flightId exists
  const {
    formData: existingFlightData,
    isLoading: loadingFlight,
    error: flightError,
    isFound: flightFound
  } = useFlightFormData(flightId)

  // Use dynamic options hooks
  const {
    options: customerOptions,
    isLoading: loadingAirlines,
    error: airlinesError,
    usingFallback: airlinesUsingFallback
  } = useAirlineOptions()

  const {
    options: stationOptions,
    isLoading: loadingStations,
    error: stationsError,
    usingFallback: stationsUsingFallback
  } = useStationsOptions()

  const {
    options: statusOptions,
    isLoading: loadingStatus,
    error: statusError,
    usingFallback: statusUsingFallback
  } = useStatusOptions()

  const {
    handleSubmit,
    control,
    watch,
    reset,
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

  // Load existing flight data into form when available (only once)
  useEffect(() => {
    console.log(existingFlightData)
    if (existingFlightData && !loadingFlight && !hasLoadedData.current) {
      // Sanitize data to ensure all fields have proper default values
      const sanitizedData: Step1FormInputs = {
        customer: existingFlightData.customer || null,
        station: existingFlightData.station || null,
        acReg: existingFlightData.acReg || '',
        acType: existingFlightData.acType || '',
        flightArrival: existingFlightData.flightArrival || '',
        arrivalDate: existingFlightData.arrivalDate || '',
        sta: existingFlightData.sta || '',
        ata: existingFlightData.ata || '',
        flightDeparture: existingFlightData.flightDeparture || '',
        departureDate: existingFlightData.departureDate || '',
        std: existingFlightData.std || '',
        atd: existingFlightData.atd || '',
        bay: existingFlightData.bay || '',
        status: existingFlightData.status || null,
        note: existingFlightData.note || '',
        thfNumber: existingFlightData.thfNumber || '',
        delayCode: existingFlightData.delayCode || '',
      }

      reset(sanitizedData)
      hasLoadedData.current = true
    }
  }, [existingFlightData, loadingFlight, reset])

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
    <>
      {/* Flight Loading/Error States */}
      {flightId && loadingFlight && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            🔄 Loading flight data (ID: {flightId})...
          </p>
        </div>
      )}

      {flightId && flightError && (
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">
            ❌ Failed to load flight data: {flightError.message}
          </p>
        </div>
      )}

      {flightId && !loadingFlight && !flightError && !flightFound && (
        <div className="p-4 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-700">
            ⚠️ Flight with ID {flightId} not found
          </p>
        </div>
      )}

      {flightId && flightFound && !loadingFlight && (
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Flight data loaded successfully (ID: {flightId})
          </p>
        </div>
      )}

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
                  placeholder={loadingAirlines ? "Loading airlines..." : "Select customer"}
                  getOptionLabel={(e) => e.label}
                  getOptionValue={(e) => e.value}
                  isLoading={loadingAirlines}
                  isClearable
                  noOptionsMessage={() =>
                    airlinesError ? "Failed to load airlines" : "No airlines found"
                  }
                />
              )}
            />
            {airlinesUsingFallback && (
              <p className="text-sm text-amber-600">
                ⚠️ Using offline airline data due to API connection issue
              </p>
            )}
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
                  placeholder={loadingStations ? "Loading stations..." : "Select station"}
                  getOptionLabel={(e) => e.label}
                  getOptionValue={(e) => e.value}
                  isLoading={loadingStations}
                  isClearable
                  noOptionsMessage={() =>
                    stationsError ? "Failed to load stations" : "No stations found"
                  }
                />
              )}
            />
            {stationsUsingFallback && (
              <p className="text-sm text-amber-600">
                ⚠️ Using offline station data due to API connection issue
              </p>
            )}
          </div>

          {/* A/C Reg / A/C Type */}
          <div className="space-y-1">
            <Label htmlFor="acReg">A/C Reg</Label>
            <Controller
              name="acReg"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="A/C Reg"
                />
              )}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="acType">A/C Type</Label>
            <Controller
              name="acType"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="A/C Type"
                />
              )}
            />
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
                <Controller
                  name="flightArrival"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Flight No"
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="arrivalDate">Date</Label>
                <Controller
                  name="arrivalDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      type="date"
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sta">STA (UTC)</Label>
                <Controller
                  name="sta"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      type="time"
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ata">ATA (UTC)</Label>
                <Controller
                  name="ata"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      type="time"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* DEPARTURE */}
          <div>
            <h4 className="text-sm font-medium mb-2">Departure (UTC Time)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="flightDeparture">Flight No</Label>
                <Controller
                  name="flightDeparture"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Flight No"
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="departureDate">Date</Label>
                <Controller
                  name="departureDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      type="date"
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="std">STD (UTC)</Label>
                <Controller
                  name="std"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      type="time"
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="atd">ATD (UTC)</Label>
                <Controller
                  name="atd"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      type="time"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator className='mb-8 mt-10' />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* BAY */}
          <div className="space-y-1">
            <Label htmlFor="bay">Bay</Label>
            <Controller
              name="bay"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Bay"
                />
              )}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="thfNumber">THF Number</Label>
            <Controller
              name="thfNumber"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="รหัสอ้างอิงของฟอร์ม"
                />
              )}
            />
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
                  placeholder={loadingStatus ? "Loading status..." : "Select status"}
                  getOptionLabel={(e) => e.label}
                  getOptionValue={(e) => e.value}
                  isLoading={loadingStatus}
                  isClearable
                  noOptionsMessage={() =>
                    statusError ? "Failed to load status" : "No status found"
                  }
                />
              )}
            />
            {statusUsingFallback && (
              <p className="text-sm text-amber-600">
                ⚠️ Using offline status data due to API connection issue
              </p>
            )}
          </div>
          {/* <div className="space-y-1">
          <Label htmlFor="delayCode">Delay Code</Label>
          <Input {...register('delayCode')} placeholder="รหัสการล่าช้า" />
        </div> */}
        </div>

        {/* NOTE */}
        <div className="space-y-1">
          <Label htmlFor="note">Note</Label>
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                value={field.value || ''}
                placeholder="Note..."
              />
            )}
          />
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
    </>
  )
}

export default FlightStep
