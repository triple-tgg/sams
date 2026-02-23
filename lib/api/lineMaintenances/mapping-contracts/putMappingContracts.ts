import axios from '@/lib/axios.config'

export interface MappingContractsRequest {
    userName: string
}

export interface MappingContractsResponse {
    message: string
    responseData: any
    error: string
}

/**
 * Map contracts for a line maintenance record
 * PUT /lineMaintenances/{lineMaintenanceID}/mapping-contracts
 */
export const putMappingContracts = async (
    lineMaintenancesId: number,
    payload: MappingContractsRequest
): Promise<MappingContractsResponse> => {
    try {
        const response = await axios.put<MappingContractsResponse>(
            `/lineMaintenances/${lineMaintenancesId}/mapping-contracts`,
            payload
        )
        // API returns HTTP 200 even on business errors — check the message field
        if (response.data.message === 'error') {
            throw new Error(response.data.error || 'Mapping contracts failed')
        }
        return response.data
    } catch (error) {
        console.error('Error mapping contracts:', error)
        throw error
    }
}
