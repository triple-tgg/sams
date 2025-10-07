import dayjs from 'dayjs'
import { EquipmentFormData, defaultEquipment } from './types'
import { dateTimeUtils } from '@/lib/dayjs'
import { Equipment } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { formatFromPicker } from '@/lib/utils/formatPicker'

/**
 * Get default values for the equipment form with current date/time
 */
export const getDefaultValues = (): EquipmentFormData => {
  const currentDate = dayjs().format('YYYY-MM-DD')
  const currentTime = dayjs().format('HH:mm')

  return {
    equipments: [
      //   {
      //   equipmentName: '',
      //   hrs: '',
      //   svc: '',
      //   fromDate: currentDate,
      //   fromTime: currentTime,
      //   toDate: currentDate,
      //   toTime: currentTime,
      //   isLoan: false,
      //   isSamsTool: false,

    ]
  }
}

/**
 * Convert equipment form data to API format
 */
export const mapEquipmentFormToApiData = (formData: EquipmentFormData) => {
  return {
    equipments: formData.equipments.map(equipment => ({
      equipmentName: equipment.equipmentName,
      hrs: equipment.hrs ? parseFloat(equipment.hrs) : null,
      svcQty: equipment.svc ? parseInt(equipment.svc) : null,
      fromDate: equipment.fromDate,
      fromTime: equipment.fromTime,
      toDate: equipment.toDate,
      toTime: equipment.toTime,
      isLoan: equipment.isLoan,
      isSamsTool: equipment.isSamsTool,
    }))
  }
}

/**
 * Convert API data to equipment form format
 */
export const mapApiDataToEquipmentForm = (equipments: Equipment[]): EquipmentFormData => {
  if (!equipments || !Array.isArray(equipments)) {
    return getDefaultValues()
  }

  const currentDate = dayjs().format('YYYY-MM-DD')
  const currentTime = dayjs().format('HH:mm')

  return {
    equipments: equipments.map((equipment: any) => ({
      equipmentName: equipment.equipmentName || '',
      hrs: equipment.hrs?.toString() || '',
      svc: equipment.svc?.toString() || '',
      fromDate: equipment.fromDate ? formatFromPicker(equipment.fromDate) : formatFromPicker(currentDate),
      fromTime: equipment.fromTime || currentTime,
      toDate: equipment.toDate ? formatFromPicker(equipment.toDate) : formatFromPicker(currentDate),
      toTime: equipment.toTime || currentTime,
      isLoan: equipment.isLoan ?? false,
      loanRemark: equipment.loanRemark || '',
      isSamsTool: equipment.isSamsTool ?? true,
    }))
  }
}

/**
 * Validate equipment time ranges
 */
export const validateEquipmentTimes = (equipment: any): string[] => {
  const errors: string[] = []

  // Validate from vs to date/time
  if (equipment.fromDate && equipment.fromTime && equipment.toDate && equipment.toTime) {
    const convertDate = (ddmmyyyy: string) => {
      const [day, month, year] = ddmmyyyy.split('-')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    const fromDateTime = `${convertDate(equipment.fromDate)} ${equipment.fromTime}`
    const toDateTime = `${convertDate(equipment.toDate)} ${equipment.toTime}`

    if (!dateTimeUtils.isAfter(toDateTime, fromDateTime)) {
      errors.push('End date/time must be after start date/time')
    }
  }

  return errors
}
