import { PartsToolsFormInputs, PartToolItem, defaultPartToolItem } from './types'
import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'

/**
 * Get default values for the parts/tools form
 */
export const getDefaultValues = (): PartsToolsFormInputs => {
  return {
    partsTools: [defaultPartToolItem]
  }
}

/**
 * Transform API data to form data
 */
export const mapDataThfToPartsToolsStep = (data: LineMaintenanceThfResponse): PartsToolsFormInputs => {
  // Extract parts/tools data from API response
  const apiPartsTools = data?.responseData?.partsTool || []

  if (apiPartsTools.length === 0) {
    return getDefaultValues()
  }

  const transformedPartsTools: PartToolItem[] = apiPartsTools.map((item: any) => ({
    isSamsTool: item.isSamsTool || true,
    isLoan: item.isLoan || false,
    pathToolName: item.pathToolName || '',
    pathToolNo: item.pathToolNo || '',
    serialNoIn: item.serialNoIn || '',
    serialNoOut: item.serialNoOut || '',
    qty: item.qty || 0,
    equipmentNo: item.equipmentNo || '',
    hrs: item.hrs || 0,
    formDate: item.formDate || null,
    toDate: item.toDate || null,
    formTime: item.formTime || null,
    toTime: item.toTime || null,
  }))

  return {
    partsTools: transformedPartsTools
  }
}

/**
 * Transform form data to API format
 */
export const transformPartsToolsForApi = (formData: PartsToolsFormInputs): PartToolItem[] => {
  return formData.partsTools.map(item => ({
    isSamsTool: item.isSamsTool,
    isLoan: item.isLoan,
    pathToolName: item.pathToolName.trim(),
    pathToolNo: item.pathToolNo.trim(),
    serialNoIn: item.serialNoIn.trim(),
    serialNoOut: item.serialNoOut.trim(),
    qty: item.qty,
    equipmentNo: item.equipmentNo.trim(),
    hrs: item.hrs,
    formDate: item.formDate,
    toDate: item.toDate,
    formTime: item.formTime,
    toTime: item.toTime,
  }))
}
