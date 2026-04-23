import { convertDateToBackend } from '@/lib/utils/formatPicker'
import { combineFormToUtcDatetime } from '@/lib/utils/flightDatetime'
import apiClient from '../../../axios.config'

// Interface สำหรับ Equipment data ที่จะส่งไป
export interface PutEquipmentRequest {
  isSamsTool: boolean
  isLoan: boolean
  equipmentName: string
  svc: number
  formDate: string // YYYY-MM-DD HH:mm format
  toDate: string
  hrs: number
  loanRemark: string
}

// Interface สำหรับ Response
export interface PutEquipmentResponse {
  message: string
  responseData: null
  error: string
}

/**
 * PUT Equipment data to Line Maintenance
 * @param lineMaintenancesId - Line Maintenance ID
 * @param equipmentData - Array of equipment data
 * @returns Promise<PutEquipmentResponse>
 */
export const putEquipment = async (
  lineMaintenancesId: number,
  equipmentData: PutEquipmentRequest[]
): Promise<PutEquipmentResponse> => {
  try {
    const response = await apiClient.put<PutEquipmentResponse>(
      `/lineMaintenances/${lineMaintenancesId}/equipment`,
      equipmentData
    )

    return response.data
  } catch (error: any) {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || error.response.data?.message || 'Equipment update failed'
      throw new Error(errorMessage)
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response received from server. Please check your connection.')
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred while updating equipment')
    }
  }
}

/**
 * Transform form data to API format
 * @param formData - Equipment form data
 * @returns Transformed data for API
 */
export const transformEquipmentDataForAPI = (
  formData: any[]
): PutEquipmentRequest[] => {
  return formData.map((equipment) => ({
    isSamsTool: equipment.isSamsTool || false,
    isLoan: equipment.isLoan || false,
    equipmentName: equipment.equipmentName || '',
    svc: Number(equipment.svc) || 0,
    formDate: equipment.fromDate ? combineFormToUtcDatetime(equipment.fromDate, equipment.fromTime) : '',
    toDate: equipment.toDate ? combineFormToUtcDatetime(equipment.toDate, equipment.toTime) : '',
    hrs: Number(equipment.hrs) || 0,
    loanRemark: equipment.loanRemark || '',
  }))
}

