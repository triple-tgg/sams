"use client"

import React, { useMemo } from "react"
import { StatusMessages } from "../shared"

import { getDefaultValues, mapDataThfToServicesStep } from './utils'

import { LineMaintenanceThfResponse } from "@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId"
import { FlightFormData } from "@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId"
import { useAircraftCheckMasterData } from '@/lib/api/hooks/useAircraftCheckMasterData'
import CardContentStep from "../CardContentStep"
import CardFormServicesStep from "./CardFormServicesStep"

/**
 * Props for ServicesStep component
 */
interface ServicesStepProps {
  initialData?: LineMaintenanceThfResponse | null
  flightInfosId: number | null
  formData: FlightFormData | null;
  loading: boolean;
  flightError: Error | null;
  lineMaintenanceId: number | null;

  acType?: string;
}

const ServicesStep = (props: ServicesStepProps) => {

  // Get aircraft check master data
  const { checkTypes, checkSubTypes, isLoadingCheckTypes, checkSubTypesError, checkTypesError, isLoadingCheckSubTypes } = useAircraftCheckMasterData()

  const checkTypesValuesOption = useMemo(() => { return { checkTypes, isLoadingCheckTypes, checkTypesError } }, [checkTypes, checkTypesError, isLoadingCheckTypes])
  const checkSubTypesValuesOption = useMemo(() => { return { checkSubTypes, isLoadingCheckSubTypes, checkSubTypesError } }, [checkSubTypes, checkSubTypesError, isLoadingCheckSubTypes])


  const memoizedDefaultValues = useMemo(() => {
    return getDefaultValues(checkTypes)
  }, [checkTypes])
  console.log("getDefaultValues(checkTypes)", memoizedDefaultValues)

  // Don't render form until we have aircraft check types data
  const isDataReady = !isLoadingCheckTypes && !checkTypesError

  const transformedData = useMemo(() => {
    if (props.initialData) {
      return mapDataThfToServicesStep(props.initialData)
    }
    return null
  }, [props.initialData])

  return (
    <CardContentStep
      stepNumber={2}
      title={"Services Information"}
      description={"Manage aircraft checks, defect rectification, fluid servicing, personnel assignments, and operational activities for maintenance procedures"}
    >
      {(props.loading) && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">
            {props.loading ? 'Loading services data...' : 'Loading aircraft check types...'}
          </span>
        </div>
      )}

      {(props.flightError) && (
        <StatusMessages
          isError={true}
          errorTitle="Error loading data"
          errorMessage={props.flightError?.message || 'Failed to load required information'}
        />
      )}
      <CardFormServicesStep
        flightInfosId={props.flightInfosId}
        flightError={props.flightError}
        loading={props.loading}
        formData={props.formData}
        initialData={transformedData}
        acType={props.acType}
        lineMaintenanceId={props.lineMaintenanceId}
        checkTypesValuesOption={checkTypesValuesOption}
        checkSubTypesValuesOption={checkSubTypesValuesOption}
      />
    </CardContentStep>
  )
}

export default ServicesStep
