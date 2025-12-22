import { FlightFormData } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { Equipment as EquipmentAPI } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'

import dayjs from 'dayjs'

// Equipment Step Types
export interface Equipment {
  equipmentName: string // Required
  hrs: string // Optional
  svc: string // Optional
  loanRemark: string // Optional
  fromDate: string // Required
  fromTime: string // Required
  toDate: string // Required
  toTime: string // Required
  isLoan: boolean // Optional
  isSamsTool: boolean // Optional

}

export interface EquipmentFormData {
  equipments: Equipment[]
}

export interface EquipmentStepProps {
  initialData?: EquipmentAPI[]
  flightInfosId: number | null
  lineMaintenanceId: number | null
  infoData: FlightFormData | null;
}

// Default equipment values with current date/time
export const defaultEquipment: Equipment = {
  equipmentName: '',
  hrs: '',
  svc: '',
  loanRemark: '',
  fromDate: dayjs().format('YYYY-MM-DD'),
  fromTime: dayjs().format('HH:mm'),
  toDate: dayjs().format('YYYY-MM-DD'),
  toTime: dayjs().format('HH:mm'),
  isLoan: false,
  isSamsTool: false,
}
