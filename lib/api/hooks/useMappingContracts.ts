import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    putMappingContracts,
    MappingContractsRequest,
    MappingContractsResponse,
} from '../lineMaintenances/mapping-contracts/putMappingContracts'

export interface UseMappingContractsParams {
    lineMaintenancesId: number
    onSuccess?: (data: MappingContractsResponse) => void
    onError?: (error: Error) => void
}

/**
 * Hook for calling PUT /lineMaintenances/{id}/mapping-contracts
 */
export const useMappingContracts = ({
    lineMaintenancesId,
    onSuccess,
    onError,
}: UseMappingContractsParams) => {
    const mutation = useMutation({
        mutationFn: (payload: MappingContractsRequest) =>
            putMappingContracts(lineMaintenancesId, payload),
        onSuccess: (data) => {
            onSuccess?.(data)
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to map contracts. Please try again.')
            onError?.(error)
        },
    })

    return {
        mappingContracts: mutation.mutateAsync,
        isMappingLoading: mutation.isPending,
        isMappingSuccess: mutation.isSuccess,
        isMappingError: mutation.isError,
        mappingError: mutation.error,
        resetMapping: mutation.reset,
    }
}
