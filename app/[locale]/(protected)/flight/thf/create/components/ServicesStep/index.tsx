"use client"

import React, { useMemo } from 'react'
import CardFormServicesStep from './CardFormServicesStep'
import { useStep } from '../step-context'
import { useLineMaintenancesQueryThfByFlightId } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { useAircraftCheckMasterData } from '@/lib/api/hooks/useAircraftCheckMasterData'
import { useStaffsTypesOptions } from '@/lib/api/hooks/useStaffsTypes'
import { useAircraftTypeById } from '@/lib/api/hooks/useAircraftTypeById'
import { mapDataThfToServicesStep } from './utils'
import { ServicesFormInputs } from './types'

interface ServicesStepProps {
  flightInfosId: number | null
  thfNumber: string
  [key: string]: any
}

const ServicesStep = ({ flightInfosId, thfNumber, ...props }: ServicesStepProps) => {


  // 1. Fetch Line Maintenance / Flight Data
  const {
    data: queryData,
    isLoading,
    error,
    formData,
    lineMaintenanceData, // Contains actual lineMaintenanceId if exists
    aircraftData
  } = useLineMaintenancesQueryThfByFlightId({ flightInfosId })

  // 2. Fetch Master Data - Aircraft Check Types
  const {
    checkTypes,
    checkSubTypes,
    isLoading: isLoadingCheckData,
    error: checkDataError,
    isLoadingCheckTypes, // specific loading states if needed
    isLoadingCheckSubTypes,
    checkTypesError,
    checkSubTypesError
  } = useAircraftCheckMasterData()

  // 3. Fetch Master Data - Staff Types
  const {
    options: staffsTypesOptions,
    isLoading: isLoadingStaffsTypes,
    error: staffsTypesError,
    hasOptions: hasOptionsStaffsTypes
  } = useStaffsTypesOptions()

  // 4. Fetch Aircraft Type detail (flags) by ID
  const acTypeId = queryData?.responseData?.flight?.acTypeObj?.id || null
  const {
    flags: aircraftTypeFlags,
    isLoading: isLoadingAircraftTypeFlags,
  } = useAircraftTypeById(acTypeId)

  // 5. Transform API data to Form Initial Data
  const initialData: ServicesFormInputs | null = useMemo(() => {
    if (!queryData) return null
    return mapDataThfToServicesStep(queryData)
  }, [queryData])

  // Prepare props for the card form
  const cardProps = {
    thfNumber: thfNumber || formData?.thfNumber || "",
    initialData,
    flightInfosId: flightInfosId,
    formData: formData,
    loading: isLoading,
    flightError: error,
    acType: formData?.acTypeCode?.value || undefined,
    lineMaintenanceId: lineMaintenanceData?.id || null, // Important: pass lineMaintenanceId
    aircraftTypeFlags: aircraftTypeFlags || null,
    isLoadingAircraftTypeFlags,

    // Master Data Props
    checkTypesValuesOption: {
      checkTypes,
      isLoadingCheckTypes,
      checkTypesError
    },
    checkSubTypesValuesOption: {
      checkSubTypes,
      isLoadingCheckSubTypes,
      checkSubTypesError
    },
    staffsTypesValuesOptions: {
      staffsTypesOptions,
      isLoadingStaffsTypes,
      staffsTypesError,
      hasOptionsStaffsTypes
    }
  }

  return (
    <CardFormServicesStep {...cardProps} />
  )
}

export default ServicesStep

