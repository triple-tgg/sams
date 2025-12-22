'use client'

import { useForm } from 'react-hook-form'
import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'

import { useStep } from '../step-context'
import { Separator } from '@/components/ui/separator'
import { FormActions } from '../shared'

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
import { FlightFormData, useLineMaintenancesQueryThfByFlightId } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { Flight } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'

interface FlightStepProps {
  flightInfosId: number | null;
  flightData: Flight | null;
  formData: FlightFormData | null;
  loading: boolean;
  flightError: Error | null;

  customerOptions: Option[]
  stationOptions: Option[]
  aircraftOptions: Option[]
  statusOptions: Option[]

  loadingAirlines: boolean;
  loadingStations: boolean;
  isLoadingAircraft: boolean;
  loadingStatus: boolean;

  airlinesError: Error | null;
  stationsError: Error | null;
  acTypeCodeError: Error | null;
  statusError: Error | null;

  airlinesUsingFallback?: boolean;
  stationsUsingFallback?: boolean;
  acTypeCodeUsingFallback?: boolean;
  statusUsingFallback?: boolean | null;

}

interface Option {
  value: string;
  label: string;
}
const FlightStep = (props: FlightStepProps) => {
  const router = useRouter()
  const { goNext, onSave } = useStep()
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
    defaultValues: props.formData ? sanitizeFormData(props.formData) : getDefaultValues(),
  })

  // Submission handler
  const { onSubmit, isPending } = useFlightSubmission(props.flightData, onSave, goNext);

  return (
    <CardContentStep
      stepNumber={1}
      title={"Parts & Tools Information"}
      description={"Manage parts and tools usage, tracking, and operational details for maintenance activities"}
    >
      <LoadingStates
        flightInfosId={props.flightInfosId}
        loadingFlight={props.loading}
        flightError={props.flightError}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6" >
        {/* Customer / Station Section */}
        <Card className='border border-blue-200'>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Airlines Info</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerStationSection
              control={control}
              errors={errors}
              customerOptions={props.customerOptions || []}
              stationOptions={props.stationOptions || []}
              loadingAirlines={props.loadingAirlines}
              loadingStations={props.loadingStations}
              airlinesError={props.airlinesError}
              stationsError={props.stationsError}
              airlinesUsingFallback={!!props.airlinesUsingFallback}
              stationsUsingFallback={!!props.stationsUsingFallback}
              aircraftOptions={props.aircraftOptions}
              isLoadingAircraft={props.isLoadingAircraft}
              acTypeCodeUsingFallback={!!props.acTypeCodeUsingFallback}
              acTypeCodeError={props.acTypeCodeError}
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
              <FlightSection
                control={control}
                errors={errors}
                stationOptions={props.stationOptions}
                loadingStations={props.loadingStations}
                stationsError={props.stationsError}
                stationsUsingFallback={!!props.stationsUsingFallback}
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
                stationOptions={props.stationOptions}
                loadingStations={props.loadingStations}
                stationsError={props.stationsError}
                stationsUsingFallback={!!props.stationsUsingFallback}
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
                    options={props.statusOptions}
                    isLoading={props.loadingStatus}
                    error={props.statusError?.message}
                    usingFallback={!!props.statusUsingFallback}
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
          onBack={() => { router.back() }} // No back action for first step
          onSubmit={() => handleSubmit(onSubmit)()}
          submitText={isPending ? 'Saving...' : 'Next Step →'}
          backText="Cancel"
          isSubmitting={isPending}
          disableSubmit={isPending}
          showReset={false}
        />
      </form>
    </CardContentStep>
  )
}

export default FlightStep
