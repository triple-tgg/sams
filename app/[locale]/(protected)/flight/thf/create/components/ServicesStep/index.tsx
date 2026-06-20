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
import { usePersonnelsByFlightInfoId } from '@/lib/api/hooks/usePersonnelsByFlightInfoId'
import { FlightInfoPersonnelData } from '@/lib/api/lineMaintenances/flight/getPersonnelsByFlightInfoId'
import { utcDatetimeToFormDate, utcDatetimeToFormTime } from '@/lib/utils/flightDatetime'

interface ServicesStepProps {
  flightInfosId: number | null
  thfNumber: string
  isInitialCreationMode?: boolean
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

  // 5. Fetch default Personnels for New THF
  // Use the passed isInitialCreationMode if available, fallback to checking lineMaintenanceData
  const isNewThf = props.isInitialCreationMode !== undefined ? props.isInitialCreationMode : !lineMaintenanceData?.id
  const { data: defaultPersonnelsData, isLoading: isLoadingDefaultPersonnels } = usePersonnelsByFlightInfoId(isNewThf ? flightInfosId : null)

  // 6. Transform API data to Form Initial Data
  const initialData: ServicesFormInputs | null = useMemo(() => {
    if (!queryData) return null
    const mappedData = mapDataThfToServicesStep(queryData)

    // Override personnels if this is a New THF and we have fetched default personnels
    if (isNewThf && defaultPersonnelsData?.responseData && mappedData) {
      mappedData.addPersonnels = defaultPersonnelsData.responseData.length > 0;
      mappedData.personnel = defaultPersonnelsData.responseData.map((person: FlightInfoPersonnelData) => ({
        staffId: person.staff?.id || 0,
        staffCode: person.staff?.code || "",
        name: person.staff?.name || "",
        type: person.staff?.staffTypeId ? person.staff.staffTypeId.toString() : "",
        formDate: person.formDate ? utcDatetimeToFormDate(person.formDate) : "",
        toDate: person.toDate ? utcDatetimeToFormDate(person.toDate) : "",
        formTime: person.formDate ? utcDatetimeToFormTime(person.formDate) : "",
        toTime: person.toDate ? utcDatetimeToFormTime(person.toDate) : "",
        remark: person.note || "",
      }));
    }

    return mappedData
  }, [queryData, isNewThf, defaultPersonnelsData])

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

