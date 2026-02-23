'use client'

import { useForm, FieldErrors } from 'react-hook-form'
import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'

import { useStep } from '../step-context'
import { Separator } from '@/components/ui/separator'
import { FormActions } from '../shared'

// Local imports
import type { Step1FormInputs } from './types'
import { flightFormSchema } from './schema'
import { getDefaultValues, sanitizeFormData, sendTime } from './utils'
import { SelectField, InputField, TextareaField, InputFieldDate } from './FormFields'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreatableRouteSelect } from '@/components/ui/creatable-route-select'
import { FlightFormData } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { Flight } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'

// Hooks
import { useAirlineOptions } from '@/lib/api/hooks/useAirlines'
import { useStationsOptions } from '@/lib/api/hooks/useStations'
import { useAircraftTypes } from '@/lib/api/hooks/useAircraftTypes'
import { useStatusOptions } from '@/lib/api/hooks/useStatus'
import { usePushThf } from '@/lib/api/hooks/usePushThf'
import { PushThfRequest } from '@/lib/api/lineMaintenances/flight-thf/pushThf'
import { convertDateToBackend } from '@/lib/utils/formatPicker'

interface FlightStepProps {
  flightInfosId: number | null;
  flightData: Flight | null;
  formData: FlightFormData | null;
  loading: boolean;
  flightError: Error | null;
}

const FlightStep = (props: FlightStepProps) => {
  const router = useRouter()
  const { goNext, onSave, isModal, closeModal, setSubmitHandler, setIsSubmitting } = useStep()

  // Data Hooks
  const { options: customerOptions, isLoading: loadingAirlines, error: airlinesError, usingFallback: airlinesUsingFallback } = useAirlineOptions()
  const { options: stationOptions, isLoading: loadingStations, error: stationsError, usingFallback: stationsUsingFallback } = useStationsOptions()
  const { options: aircraftOptions, isLoading: isLoadingAircraft, error: acTypeCodeError, usingFallback: acTypeCodeUsingFallback } = useAircraftTypes()
  const { options: statusOptions, isLoading: loadingStatus, error: statusError, usingFallback: statusUsingFallback } = useStatusOptions()

  // Mutation Hook
  const pushThfMutation = usePushThf()

  // Form setup — use existing data for defaults so remount on back-navigation is pre-populated
  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors },
  } = useForm<Step1FormInputs>({
    resolver: zodResolver(flightFormSchema),
    defaultValues: props.formData ? sanitizeFormData(props.formData) : getDefaultValues(),
  })

  // Focus the first error field: scroll into view and focus the input/button/textarea
  const focusFirstError = useCallback((fieldErrors: FieldErrors<Step1FormInputs>) => {
    const errorKeys = Object.keys(fieldErrors)
    if (errorKeys.length === 0) return

    // Use a small delay to ensure the DOM has updated with error styles
    setTimeout(() => {
      for (const key of errorKeys) {
        const fieldEl = document.querySelector(`[data-field-name="${key}"]`)
        if (fieldEl) {
          // Scroll the field into view
          fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' })

          // Focus the first focusable element inside the field wrapper
          const focusable = fieldEl.querySelector<HTMLElement>(
            'input, textarea, button[role="combobox"], select'
          )
          if (focusable) {
            // Delay focus slightly so scroll finishes
            setTimeout(() => focusable.focus(), 300)
          }
          break // Only focus the first error field
        }
      }
    }, 50)
  }, [])

  // Reset form when formData is loaded from API
  useEffect(() => {
    if (props.formData) {
      console.log('Resetting form with data:', props.formData)
      reset(sanitizeFormData(props.formData))
    }
  }, [props.formData, reset])

  // Submit handler
  const onSubmit = async (data: Step1FormInputs) => {
    try {
      // Map form data to API payload
      const payload: PushThfRequest = {
        flightsId: props.flightData?.flightsId || 0,
        flightInfosId: props.flightInfosId || 0,
        airlinesCode: data.customer?.value || '',
        stationsCode: data.station?.value || '',
        acReg: data.acReg || '',
        acTypeCode: data.acTypeCode?.value || '',
        arrivalFlightNo: data.flightArrival,
        arrivalDate: data.arrivalDate ? convertDateToBackend(data.arrivalDate) : "",
        arrivalStaTime: sendTime(data.sta),
        arrivalAtaTime: sendTime(data.ata),
        departureFlightNo: data.flightDeparture,
        departureDate: data.departureDate ? convertDateToBackend(data.departureDate) : "",
        departureStdTime: sendTime(data.std),
        departureAtdTime: sendTime(data.atd),
        bayNo: data.bay || '',
        statusCode: data.status?.value || "Normal",
        note: data.note || '',
        thfNo: data.thfNumber,
      }

      await pushThfMutation.mutateAsync(payload)

      // Save data to step context
      onSave(data)

      // Go to next step
      goNext()
    } catch (error) {
      console.error('Failed to submit flight step:', error)
    }
  }

  const isPending = pushThfMutation.isPending

  // Sync submission state with step context
  useEffect(() => {
    if (setIsSubmitting) {
      setIsSubmitting(isPending)
    }
  }, [isPending, setIsSubmitting])

  // Register submit handler for Modal Footer
  const onSubmitRef = useRef(onSubmit)
  onSubmitRef.current = onSubmit

  useEffect(() => {
    if (isModal && setSubmitHandler) {
      // Pass a function that will be called when "Next Step" is clicked
      setSubmitHandler(() => {
        handleSubmit(
          (data) => onSubmitRef.current(data),
          (errors) => {
            console.log("Form Validation Errors:", errors)
            focusFirstError(errors)
          }
        )()
      })
    }
  }, [isModal, setSubmitHandler, handleSubmit, focusFirstError])

  return (
    <>
      {/* Loading State */}
      {props.loading && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading flight data...</span>
        </div>
      )}

      {/* Error State */}
      {props.flightError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error loading flight data</p>
          <p className="text-sm">{props.flightError.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, focusFirstError)} className="space-y-6 mt-6">
        {/* Airlines Info Section */}
        <Card className='border border-blue-200'>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Airlines Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Row 1: Customer/Airlines & Station */}
              <div className="grid lg:grid-cols-2 gap-6">
                <SelectField
                  name="customer"
                  control={control}
                  label="Customer / Airlines *"
                  placeholder="Select Customer/Airlines"
                  options={customerOptions}
                  isLoading={loadingAirlines}
                  error={airlinesError?.message}
                  usingFallback={!!airlinesUsingFallback}
                  errorMessage={errors.customer?.message}
                />
                <SelectField
                  name="station"
                  control={control}
                  label="Station *"
                  placeholder="Select Station"
                  options={stationOptions}
                  isLoading={loadingStations}
                  error={stationsError?.message}
                  usingFallback={!!stationsUsingFallback}
                  errorMessage={errors.station?.message}
                />
              </div>

              {/* Row 2: A/C Reg & A/C Type */}
              <div className="grid lg:grid-cols-2 gap-6">
                <InputField
                  name="acReg"
                  control={control}
                  label="A/C Reg"
                  placeholder="Enter A/C Registration"
                  errorMessage={errors.acReg?.message}
                />
                <SelectField
                  name="acTypeCode"
                  control={control}
                  label="A/C Type *"
                  placeholder="Select A/C Type"
                  options={aircraftOptions}
                  isLoading={isLoadingAircraft}
                  error={acTypeCodeError?.message}
                  usingFallback={!!acTypeCodeUsingFallback}
                  errorMessage={errors.acTypeCode?.message}
                />
              </div>

              {/* Row 3: Route From & Route To */}
              <div className="grid lg:grid-cols-2 gap-6">
                <CreatableRouteSelect
                  name="routeFrom"
                  control={control}
                  label="Route From"
                  placeholder="Select Route From"
                  errorMessage={errors.routeFrom?.message}
                />
                <CreatableRouteSelect
                  name="routeTo"
                  control={control}
                  label="Route To"
                  placeholder="Select Route To"
                  errorMessage={errors.routeTo?.message}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className='mt-6 mb-6' />

        {/* Arrival & Departure Section */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Arrival Section */}
          <Card className='border border-blue-200'>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Arrival (UTC Time)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <InputField
                  name="flightArrival"
                  control={control}
                  label="Flight No *"
                  placeholder="Enter Flight No"
                  errorMessage={errors.flightArrival?.message}
                />
                <InputFieldDate
                  name="arrivalDate"
                  control={control}
                  label="Date *"
                  placeholder="Select Date"
                  errorMessage={errors.arrivalDate?.message}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    name="sta"
                    control={control}
                    label="STA (UTC) *"
                    placeholder="HH:MM"
                    errorMessage={errors.sta?.message}
                  />
                  <InputField
                    name="ata"
                    control={control}
                    label="ATA (UTC)"
                    placeholder="HH:MM"
                    errorMessage={errors.ata?.message}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departure Section */}
          <Card className='border border-blue-200'>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Departure (UTC Time)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <InputField
                  name="flightDeparture"
                  control={control}
                  label="Flight No *"
                  placeholder="Enter Flight No"
                  errorMessage={errors.flightDeparture?.message}
                />
                <InputFieldDate
                  name="departureDate"
                  control={control}
                  label="Date *"
                  placeholder="Select Date"
                  errorMessage={errors.departureDate?.message}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    name="std"
                    control={control}
                    label="STD (UTC) *"
                    placeholder="HH:MM"
                    errorMessage={errors.std?.message}
                  />
                  <InputField
                    name="atd"
                    control={control}
                    label="ATD (UTC)"
                    placeholder="HH:MM"
                    errorMessage={errors.atd?.message}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className='mt-6 mb-6' />

        {/* THF Document Info Section */}
        <Card className='border border-blue-200'>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>THF Document Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <InputField
                  name="thfNumber"
                  control={control}
                  label="THF Number *"
                  placeholder="Enter THF Number"
                  errorMessage={errors.thfNumber?.message}
                />
                <div className="grid lg:grid-cols-2 gap-6">
                  <InputField
                    name="bay"
                    control={control}
                    label="Bay"
                    placeholder="Enter Bay"
                    errorMessage={errors.bay?.message}
                  />
                  <SelectField
                    name="status"
                    control={control}
                    label="Status"
                    placeholder="Select Status"
                    options={statusOptions}
                    isLoading={loadingStatus}
                    error={statusError?.message}
                    usingFallback={!!statusUsingFallback}
                    errorMessage={errors.status?.message}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <TextareaField
                  register={register}
                  name="note"
                  label="Note"
                  placeholder="Enter notes..."
                  errorMessage={errors.note?.message}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions - Hidden in Modal */}
        {!isModal && (
          <FormActions
            onBack={() => {
              if (isModal && closeModal) {
                closeModal()
              } else {
                router.back()
              }
            }}
            onSubmit={() => handleSubmit(onSubmit, focusFirstError)()}
            submitText={isPending ? 'Saving...' : 'Next Step →'}
            backText="Cancel"
            isSubmitting={isPending}
            disableSubmit={isPending}
            showReset={false}
          />
        )}
      </form>
    </>
  )
}

export default FlightStep
