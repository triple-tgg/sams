// Types and constants for Services Step form

import { AdditionalDefectAttachFile } from "@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId";
import { AircraftCheckSubType, AircraftCheckType } from "@/lib/api/master/aircraft-check-types/airlines.interface";


export type FluidOption = {
  label: string;
  value: string
}

export type DropdownOption = {
  value: string;
  label: string;
}

export type Personnel = {
  staffId: number
  staffCode: string
  name: string
  type: string
  formDate: string
  formTime: string
  toDate: string
  toTime: string
  remark?: string
}

export type ServicesFormInputs = {
  aircraftChecks: {
    maintenanceTypes: string
    maintenanceSubTypes: string[]
    laeMH?: string
    mechMH?: string
  }[]
  additionalDefectRectification: boolean
  additionalDefects?: {
    defect: string
    ataChapter: string
    photo?: FileList
    attachFiles: AdditionalDefectAttachFile[] | null
    laeMH?: string
    mechMH?: string
    acDefect?: string
    action?: string
    technicalDelay?: string
  }[]
  servicingPerformed: boolean
  fluid: {
    fluidName: FluidOption | null
    engOilSets: { left: number; right: number }[]
    hydOilBlue?: number
    hydOilGreen?: number
    hydOilYellow?: number
    hydOilA?: number
    hydOilB?: number
    hydOilSTBY?: number
    otherOil?: number
    rampFuelKgs?: number
    actualUpliftLts?: number
  }
  addPersonnels: boolean
  personnel?: Personnel[] | null
  flightDeck: boolean
  flightDeckInfo?: {
    date: string;
    timeOn: string;
    timeOf: string;
  }[] | null
  aircraftTowing: boolean
  aircraftTowingInfo?: {
    onDate: string;
    offDate: string;
    onTime: string;
    offTime: string;
    bayFrom: string;
    bayTo: string;
  }[] | null
  marshallingServicePerFlight?: number
}

// Mock data - should be moved to API calls in the future
export const staffList = [
  { staffId: 'A001', name: 'สมชาย ใจดี', type: 'LAE' },
  { staffId: 'B002', name: 'สมหญิง แสนดี', type: 'MECH' },
  { staffId: 'C003', name: 'สมปอง น่ารัก', type: 'LAE' },
]

export const fluidOptions: FluidOption[] = [
  { label: 'Hydraulic', value: 'Hydraulic' },
  { label: 'ENG Oil', value: 'ENG Oil' },
  { label: 'APU Oil', value: 'APU Oil' },
]

export const transformAircraftCheckTypesToOptions = (checkTypes: AircraftCheckType[]): DropdownOption[] => {
  return checkTypes
    .filter(type => !type.isdelete) // Filter out deleted items
    .map(type => ({
      value: type.code,
      label: type.name || type.code // Use name if available, fallback to code
    }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
}

/**
 * Transform Aircraft Check Sub Types from API to dropdown options
 */
export const transformAircraftCheckSubTypesToOptions = (subTypes: AircraftCheckSubType[]): DropdownOption[] => {
  return subTypes
    .filter(subType => !subType.isdelete) // Filter out deleted items
    .map(subType => ({
      value: subType.code,
      label: subType.name || subType.code // Use name if available, fallback to code
    }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
}

/**
 * Get master data functions for Services Step
 */
export const getMasterDataFunctions = () => {
  return {
    transformAircraftCheckTypesToOptions,
    transformAircraftCheckSubTypesToOptions
  }
}
