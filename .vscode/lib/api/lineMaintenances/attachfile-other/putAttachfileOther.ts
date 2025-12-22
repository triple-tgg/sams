import axios from '@/lib/axios.config'

export interface AttachFileOtherData {
  id: string | null
  storagePath: string
  realName: string
  fileType: string
  isDelete: boolean
}

export interface PutAttachFileOtherPayload {
  files: AttachFileOtherData[]
}

export interface PutAttachFileOtherResponse {
  message: string
  responseData: null
  error: string
}

/**
 * Update attach file other data for a line maintenance record
 * @param lineMaintenancesId - The line maintenance ID
 * @param payload - Array of attach file data
 * @returns Promise with the API response
 */
export const putAttachfileOther = async (
  lineMaintenancesId: number,
  payload: AttachFileOtherData[]
): Promise<PutAttachFileOtherResponse> => {
  try {
    const response = await axios.put<PutAttachFileOtherResponse>(
      `/lineMaintenances/${lineMaintenancesId}/attachfile-other`,
      payload
    )

    return response.data
  } catch (error) {
    console.error('Error updating attach file other:', error)
    throw error
  }
}
