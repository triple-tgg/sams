import axiosConfig from "@/lib/axios.config"

// Interface สำหรับ Parts/Tools item ที่จะส่งไป API
export interface PutPartsToolsRequestItem {
  isSamsTool: boolean
  isLoan: boolean
  pathToolName: string
  pathToolNo: string
  serialNoIn: string
  serialNoOut: string
  qty: number
  equipmentNo: string
  hrs: number
  formDate: string
  toDate: string
  formTime: string
  toTime: string
  loanRemark: string
}

export interface PutPartsToolsParams {
  lineMaintenancesId: number | string
  partsTools: PutPartsToolsRequestItem[]
}

export interface PutPartsToolsResponse {
  message: string
  responseData: null
  error: string
}

/**
 * PUT API function to update parts/tools for a line maintenance
 * @param params - Parameters containing lineMaintenancesId and partsTools data
 * @returns Promise with the API response
 */
export const putPartsTools = async (params: PutPartsToolsParams): Promise<PutPartsToolsResponse> => {
  try {
    const { lineMaintenancesId, partsTools } = params

    // Validate required parameters
    if (!lineMaintenancesId) {
      throw new Error('Line maintenance ID is required')
    }

    if (!Array.isArray(partsTools)) {
      throw new Error('Parts/tools data must be an array')
    }

    // Make the API call
    const response = await axiosConfig.put(
      `/lineMaintenances/${lineMaintenancesId}/partstools`,
      partsTools
    )

    return response.data

  } catch (error: any) {
    console.error('PUT Parts/Tools API error:', error)

    // Handle different types of errors
    if (error.response) {
      const apiError = error.response.data
      throw new Error(apiError?.message || `API Error: ${error.response.status}`)
    } else if (error.request) {
      throw new Error('Network error: Unable to connect to server')
    } else {
      throw new Error(error.message || 'Unknown error occurred')
    }
  }
}

