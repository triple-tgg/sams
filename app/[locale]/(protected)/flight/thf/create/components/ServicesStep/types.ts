// Types and constants for Services Step form

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
  staffId: string
  name: string
  type: string
  from: string
  to: string
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
    laeMH?: string
    mechMH?: string
  }[]
  servicingPerformed: boolean
  fluid: {
    fluidName: FluidOption | null
    engOilSets: { left: string; right: string }[]
    hydOilBlue?: string
    hydOilGreen?: string
    hydOilYellow?: string
    hydOilA?: string
    hydOilB?: string
    hydOilSTBY?: string
    otherQty?: string
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
    date: string;
    timeOn: string;
    timeOf: string;
    bayFrom: string;
    bayTo: string;
  }[] | null
}

// Mock data - should be moved to API calls in the future
export const staffList = [
  { staffId: 'A001', name: 'สมชาย ใจดี', type: 'LAE' },
  { staffId: 'B002', name: 'สมหญิง แสนดี', type: 'MECH' },
  { staffId: 'C003', name: 'สมปอง น่ารัก', type: 'LAE' },
]

// export const maintenanceOptions = [
//   { value: "TR", label: "TR" },
//   { value: "Preflight", label: "Preflight" },
//   { value: "NS", label: "NS" },
//   { value: "Weekly", label: "Weekly" },
//   { value: "A-Check", label: "A-Check" },
// ]

// export const maintenanceSubTypesOptions = [
//   { value: "Assistance", label: "Assistance" },
//   { value: "CRS", label: "CRS" },
//   { value: "On Call", label: "On Call" },
//   { value: "Standby", label: "Standby" },
// ]

export const fluidOptions: FluidOption[] = [
  { label: 'Hydraulic', value: 'Hydraulic' },
  { label: 'ENG Oil', value: 'ENG Oil' },
  { label: 'APU Oil', value: 'APU Oil' },
]

// Master Data Transformation Functions

/**
 * Transform Aircraft Check Types from API to dropdown options
 */
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
