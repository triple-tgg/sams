'use client'
import React from 'react'
import StepWrapper from './step-wrapper'
import FlightStep from './FlightStep'
import ServicesStep from './ServicesStep'
import PartsAndToolsStep from './PartsAndToolsStep'

import AttachFileStep from './AttachFile'
import { useSearchParams } from 'next/navigation'
import { useLineMaintenancesQueryThfByFlightId } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { LoadingStates } from './FlightStep/LoadingStates'
import { useAirlineOptions } from '@/lib/api/hooks/useAirlines'
import { useStationsOptions } from '@/lib/api/hooks/useStations'
import { useStatusOptions } from '@/lib/api/hooks/useStatus'
import { useAircraftTypes } from '@/lib/api/hooks/useAircraftTypes'
import EquipmentStep from './EquipmentStep'


const steps = [
  { label: 'Flight', step: 1 },
  { label: 'Services', step: 2 },
  { label: 'Equipment', step: 3 },
  { label: 'Parts & Tools', step: 4 },
  { label: 'Attach file', step: 5 },
]

const StepForm = () => {
  const searchParams = useSearchParams()

  const flightInfosId = searchParams.get('flightInfosId') ? parseInt(searchParams.get('flightInfosId')!) : null;
  // API Hooks
  const {
    isLoading: loadingFlight,
    error: flightError,
    formData: existingFlightData,
    flightData,
    aircraftData,
    lineMaintenanceData,
    equipmentData,
    data
  } = useLineMaintenancesQueryThfByFlightId({ flightInfosId });

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
    options: aircraftOptions,
    isLoading: isLoadingAircraft,
    usingFallback: acTypeCodeUsingFallback,
    error: acTypeCodeError
  } = useAircraftTypes();

  const {
    options: statusOptions,
    isLoading: loadingStatus,
    error: statusError,
    usingFallback: statusUsingFallback
  } = useStatusOptions()

  if (loadingFlight || loadingStatus || isLoadingAircraft || loadingStations || loadingAirlines) {
    return (
      <LoadingStates
        flightInfosId={flightInfosId}
        loadingFlight={loadingFlight}
        flightError={flightError}
      />)
  }

  return (
    <div className="p-4">
      <StepWrapper steps={steps}>
        <FlightStep
          flightData={flightData}
          formData={existingFlightData}
          loading={loadingFlight}
          flightError={flightError}
          flightInfosId={flightInfosId}
          customerOptions={customerOptions || []}
          stationOptions={stationOptions || []}
          loadingAirlines={loadingAirlines}
          loadingStations={loadingStations}
          airlinesError={airlinesError}
          stationsError={stationsError}
          airlinesUsingFallback={!!airlinesUsingFallback}
          stationsUsingFallback={!!stationsUsingFallback}
          aircraftOptions={aircraftOptions || []}
          isLoadingAircraft={isLoadingAircraft}
          acTypeCodeUsingFallback={!!acTypeCodeUsingFallback}
          acTypeCodeError={acTypeCodeError}
          statusOptions={statusOptions || []}
          loadingStatus={loadingStatus}
          statusError={statusError}
          statusUsingFallback={statusUsingFallback}
        />
        <ServicesStep
          flightInfosId={flightInfosId}
          flightError={flightError}
          loading={loadingFlight}
          formData={existingFlightData}
          initialData={data}
          lineMaintenanceId={lineMaintenanceData?.id || null}

        />
        <EquipmentStep
          flightInfosId={flightInfosId}
          lineMaintenanceId={lineMaintenanceData?.id || null}
          initialData={equipmentData}
          infoData={existingFlightData}
        />
        <PartsAndToolsStep
          flightError={flightError}
          loading={loadingFlight}
          flightInfosId={flightInfosId}
          lineMaintenanceId={lineMaintenanceData?.id || null}
          initialData={data}
          infoData={existingFlightData}
        />
        <AttachFileStep
          lineMaintenanceId={lineMaintenanceData?.id || null}
          flightInfosId={flightInfosId}
          flightError={flightError}
          loading={loadingFlight}
          initialData={data}
        />
      </StepWrapper>
    </div>
  )
}

export default StepForm
