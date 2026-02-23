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
        return response.data
    } catch (error) {
        console.error('Error mapping contracts:', error)
        throw error
    }
}
