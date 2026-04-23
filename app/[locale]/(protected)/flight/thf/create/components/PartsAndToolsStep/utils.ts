import { convertDateToBackend, formatFromPicker } from '@/lib/utils/formatPicker'
import { utcDatetimeToFormDate, utcDatetimeToFormTime, combineFormToUtcDatetime } from '@/lib/utils/flightDatetime'
import { PartsToolsFormInputs, PartToolItem, defaultPartToolItem } from './types'
import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { PutPartsToolsRequestItem } from '@/lib/api/lineMaintenances/parts-tools/putPartsTools'

/**
 * Get default values for the parts/tools form
 */
export const getDefaultValues = (): PartsToolsFormInputs => {
  return {
    partsTools: []
    // partsTools: [defaultPartToolItem]
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
    loanRemark: item.loanRemark || '',
    pathToolName: item.pathToolName || '',
    pathToolNo: item.pathToolNo || '',
    serialNoIn: item.serialNoIn || '',
    serialNoOut: item.serialNoOut || '',
    qty: item.qty || 0,
    equipmentNo: item.equipmentNo || '',
    hrs: item.hrs || 0,
    formDate: item.formDate ? utcDatetimeToFormDate(item.formDate.replace(' ', 'T')) : null,
    toDate: item.toDate ? utcDatetimeToFormDate(item.toDate.replace(' ', 'T')) : null,
    formTime: item.formDate ? utcDatetimeToFormTime(item.formDate.replace(' ', 'T')) : "",
    toTime: item.toDate ? utcDatetimeToFormTime(item.toDate.replace(' ', 'T')) : "",
  }))

  return {
    partsTools: transformedPartsTools
  }
}

/**
 * Transform form data to API format
 */
export const transformPartsToolsForApi = (formData: PartsToolsFormInputs): PutPartsToolsRequestItem[] => {
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
    formDate: item.formDate ? combineFormToUtcDatetime(item.formDate, item.formTime || undefined) : '',
    toDate: item.toDate ? combineFormToUtcDatetime(item.toDate, item.toTime || undefined) : '',
    loanRemark: item.loanRemark.trim(),
  }))
}

