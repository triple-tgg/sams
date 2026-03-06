import axios from '@/lib/axios.config'

export interface SharePointSendResponse {
    message: string
    responseData: {
        isSuccess: boolean
        fileName: string | null
        sharePointUrl: string | null
        errorMessage: string | null
    }
    error: string
}

/**
 * Send THF file to SharePoint
 * POST /sharepoint/send/{lineMaintenanceId}
 */
export const postSharePointSend = async (
    lineMaintenanceId: number
): Promise<SharePointSendResponse> => {
    try {
        const response = await axios.post<SharePointSendResponse>(
            `/sharepoint/send/${lineMaintenanceId}`
        )
        // API returns HTTP 200 even on business errors — check the message field
        if (response.data.message === 'error') {
            throw new Error(response.data.error || response.data.responseData?.errorMessage || 'SharePoint send failed')
        }
        return response.data
    } catch (error) {
        console.error('Error sending to SharePoint:', error)
        throw error
    }
}
