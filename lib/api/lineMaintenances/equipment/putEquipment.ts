import apiClient from '../../../axios.config'

// Interface สำหรับ Equipment data ที่จะส่งไป
export interface PutEquipmentRequest {
  lineMaintenancesId?: number
  isSamsTool: boolean
  isLoan: boolean
  equipmentName: string
  svc: number
  formDate: string // YYYY-MM-DD format
  toDate: string | null
  formTime: string // HH:mm format
  toTime: string | null
  hrs: number
}

// Interface สำหรับ Response
export interface PutEquipmentResponse {
  message: string
  responseData: any | null
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
 * @param lineMaintenancesId - Line Maintenance ID
 * @returns Transformed data for API
 */
export const transformEquipmentDataForAPI = (
  formData: any[],
  lineMaintenancesId: number
): PutEquipmentRequest[] => {
  return formData.map((equipment, index) => ({
    ...(index > 0 && { lineMaintenancesId }), // Add lineMaintenancesId for items after first
    isSamsTool: equipment.isSamsTool || false,
    isLoan: equipment.isLoan || false,
    equipmentName: equipment.equipmentName || '',
    svc: equipment.svc || 0,
    formDate: equipment.fromDate || '',
    toDate: equipment.toDate || null,
    formTime: equipment.fromTime || '',
    toTime: equipment.toTime || null,
    hrs: equipment.hrs || 0
  }))
}
