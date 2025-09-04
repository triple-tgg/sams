'use client'

import { useForm } from 'react-hook-form'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'

import { useStep } from '../step-context'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { FormActions } from '../shared'

// Hooks
import { useAirlineOptions } from '@/lib/api/hooks/useAirlines'
import { useStationsOptions } from '@/lib/api/hooks/useStations'
import { useStatusOptions } from '@/lib/api/hooks/useStatus'
import { useLineMaintenancesQueryThfByFlightId } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { useAircraftTypes } from '@/lib/api/hooks/useAircraftTypes'

// Local imports
import type { Step1FormInputs } from './types'
import { flightFormSchema } from './schema'
import { getDefaultValues, sanitizeFormData } from './utils'
import { useFlightSubmission } from './useFlightSubmission'
import { LoadingStates } from './LoadingStates'
import { CustomerStationSection, FlightSection } from './FormSections'
import { SelectField, InputField, TextareaField } from './FormFields'
import CardContentStep from '../CardContentStep'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FlightStep = () => {
  const { goNext, onSave } = useStep()
  const searchParams = useSearchParams()
  const hasLoadedData = useRef(false)

  // Get flightId from URL parameters
  const flightId = searchParams.get('flightId') ? parseInt(searchParams.get('flightId')!) : null

  // API Hooks
  const {
    isLoading: loadingFlight,
    error: flightError,
    formData: existingFlightData,
    flightData,
  } = useLineMaintenancesQueryThfByFlightId({ flightId });

  const {
    options: customerOptions,
    isLoading: loadingAirlines,
    error: airlinesError,
    usingFallback: airlinesUsingFallback
  } = useAirlineOptions()

  const { options: aircraftOptions, isLoading: isLoadingAircraft, usingFallback: acTypeCodeUsingFallback, error: acTypeCodeError } = useAircraftTypes();

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

  // Form setup
  const {
    handleSubmit,
    register,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Step1FormInputs>({
    resolver: zodResolver(flightFormSchema),
    defaultValues: getDefaultValues(),
  })

  // Submission handler
  const { onSubmit, isPending } = useFlightSubmission(flightData, onSave, goNext);

  // Load existing flight data into form when available (only once)
  useEffect(() => {
    if (existingFlightData && !loadingFlight && !hasLoadedData.current && !loadingAirlines && !loadingStatus && !loadingStations && !isLoadingAircraft) {
      const sanitizedData = sanitizeFormData(existingFlightData);
      reset(sanitizedData)
      hasLoadedData.current = true
    }
  }, [existingFlightData, loadingFlight, loadingStatus, loadingStations, isLoadingAircraft, loadingAirlines, reset])

  return (
    <CardContentStep
      stepNumber={1}
      title={"Parts & Tools Information"}
      description={"Manage parts and tools usage, tracking, and operational details for maintenance activities"}
    >
      <LoadingStates
        flightId={flightId}
        loadingFlight={loadingFlight}
        flightError={flightError}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6" >
        {/* Customer / Station Section */}
        <Card className='border border-blue-200'>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Airlines Info</CardTitle>
          </CardHeader>
          <CardContent>
            < CustomerStationSection
              control={control}
              errors={errors}
              customerOptions={customerOptions}
              stationOptions={stationOptions}
              loadingAirlines={loadingAirlines}
              loadingStations={loadingStations}
              airlinesError={airlinesError}
              stationsError={stationsError}
              airlinesUsingFallback={!!airlinesUsingFallback}
              stationsUsingFallback={!!stationsUsingFallback}
              aircraftOptions={aircraftOptions}
              isLoadingAircraft={isLoadingAircraft}
              acTypeCodeUsingFallback={!!acTypeCodeUsingFallback}
              acTypeCodeError={acTypeCodeError}
            />
          </CardContent>
        </Card>

        <Separator className='mt-6 mb-6' />

        {/* Flight Information Section */}
        < div className="grid lg:grid-cols-2 gap-2" >
          {/* Arrival Section */}
          <Card className='border border-blue-200'>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Arrival (UTC Time)</CardTitle>
            </CardHeader>
            <CardContent>
              < FlightSection
                control={control}
                errors={errors}
                stationOptions={stationOptions}
                loadingStations={loadingStations}
                stationsError={stationsError}
                stationsUsingFallback={!!stationsUsingFallback}
                // title="Arrival (UTC Time)"
                flightField="flightArrival"
                dateField="arrivalDate"
                stdField="sta"
                atdField="ata"
                routeField="routeFrom"
                stdLabel="STA (UTC)"
                atdLabel="ATA (UTC)"
                routeLabel="Route From"
              />
            </CardContent>
          </Card>

          {/* Departure Section */}
          <Card className='border border-blue-200'>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Departure (UTC Time)</CardTitle>
            </CardHeader>
            <CardContent>
              < FlightSection
                control={control}
                errors={errors}
                stationOptions={stationOptions}
                loadingStations={loadingStations}
                stationsError={stationsError}
                stationsUsingFallback={!!stationsUsingFallback}
                // title="Departure (UTC Time)"
                flightField="flightDeparture"
                dateField="departureDate"
                stdField="std"
                atdField="atd"
                routeField="routeTo"
                stdLabel="STD (UTC)"
                atdLabel="ATD (UTC)"
                routeLabel="Route To"
              />
            </CardContent>
          </Card>
        </div>

        <Separator className='mt-6 mb-6' />

        {/* Additional Information Section */}
        <Card className='border border-blue-200'>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>THF Document Info</CardTitle>
          </CardHeader>
          <CardContent>
            < div className="grid lg:grid-cols-2 gap-6" >
              <div className="space-y-4" >
                <InputField
                  name="thfNumber"
                  control={control}
                  label="THF Number"
                  placeholder="รหัสอ้างอิงของฟอร์ม"
                  errorMessage={errors.thfNumber?.message}
                />

                <div className="grid lg:grid-cols-2 gap-6" >
                  <InputField
                    name="bay"
                    control={control}
                    label="Bay"
                    placeholder="Bay"
                    errorMessage={errors.bay?.message}
                  />

                  <SelectField
                    name="status"
                    control={control}
                    label="Status"
                    placeholder="Select status"
                    options={statusOptions}
                    isLoading={loadingStatus}
                    error={statusError?.message}
                    usingFallback={!!statusUsingFallback}
                    errorMessage={errors.status?.message}
                  />
                </div>
              </div>

              < div className="space-y-1" >
                <TextareaField
                  register={register}
                  name="note"
                  label="Note"
                  placeholder="Note..."
                  errorMessage={errors.note?.message}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <FormActions
          onBack={() => { }} // No back action for first step
          onSubmit={() => handleSubmit(onSubmit)()}
          submitText={isPending ? 'Saving...' : 'Next Step →'}
          backText="Cancel"
          isSubmitting={isPending}
          disableBack={true} // First step doesn't go back
          disableSubmit={isPending}
          showReset={false}
        />
      </form>
    </CardContentStep>
  )
}

export default FlightStep
