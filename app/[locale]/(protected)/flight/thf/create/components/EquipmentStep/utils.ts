import { EquipmentFormData, defaultEquipment } from './types'
import { dateTimeUtils } from '@/lib/dayjs'

/**
 * Get default values for the equipment form
 */
export const getDefaultValues = (): EquipmentFormData => {
  return {
    equipments: [{ ...defaultEquipment }]
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
      svcQty: equipment.svcQty ? parseInt(equipment.svcQty) : null,
      fromDate: equipment.fromDate,
      fromTime: equipment.fromTime,
      toDate: equipment.toDate,
      toTime: equipment.toTime,
      loan: equipment.loan,
      samsTool: equipment.samsTool,
    }))
  }
}

/**
 * Convert API data to equipment form format
 */
export const mapApiDataToEquipmentForm = (apiData: any): EquipmentFormData => {
  if (!apiData?.equipments || !Array.isArray(apiData.equipments)) {
    return getDefaultValues()
  }

  return {
    equipments: apiData.equipments.map((equipment: any) => ({
      equipmentName: equipment.equipmentName || '',
      hrs: equipment.hrs?.toString() || '',
      svcQty: equipment.svcQty?.toString() || '',
      fromDate: equipment.fromDate || '',
      fromTime: equipment.fromTime || '',
      toDate: equipment.toDate || '',
      toTime: equipment.toTime || '',
      loan: equipment.loan ?? false,
      samsTool: equipment.samsTool ?? false,
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
