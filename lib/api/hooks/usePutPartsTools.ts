import { useMutation, useQueryClient } from '@tanstack/react-query'
import { putPartsTools, PutPartsToolsParams, PutPartsToolsResponse } from '@/lib/api/lineMaintenances/parts-tools/putPartsTools'
import { useToast } from '@/components/ui/use-toast'
import { PartToolItem } from '@/app/[locale]/(protected)/flight/thf/create/components/PartsAndToolsStep/types'

/**
 * Hook for updating parts/tools data
 */
export const usePutPartsTools = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<PutPartsToolsResponse, Error, PutPartsToolsParams>({
    mutationFn: putPartsTools,
    onSuccess: (data, variables) => {
      // Show success toast
      toast({
        title: "Parts/Tools Updated",
        description: "Parts and tools information has been saved successfully.",
        variant: "default",
      })

      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['lineMaintenances', 'flight', variables.lineMaintenancesId]
      })
      queryClient.invalidateQueries({
        queryKey: ['lineMaintenances', variables.lineMaintenancesId]
      })

      console.log('Parts/Tools update successful:', data)
    },
    onError: (error, variables) => {
      // Show error toast
      toast({
        title: "Error Updating Parts/Tools",
        description: error.message || "Failed to save parts and tools information. Please try again.",
        variant: "destructive",
      })

      console.error('Parts/Tools update failed:', error)
    },
  })
}

/**
 * Hook for updating parts/tools with custom callbacks
 */
export const usePutPartsToolsWithCallbacks = (
  options: {
    onSuccess?: (data: PutPartsToolsResponse, variables: PutPartsToolsParams) => void
    onError?: (error: Error, variables: PutPartsToolsParams) => void
    onSettled?: (data: PutPartsToolsResponse | undefined, error: Error | null, variables: PutPartsToolsParams) => void
  } = {}
) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<PutPartsToolsResponse, Error, PutPartsToolsParams>({
    mutationFn: putPartsTools,
    onSuccess: (data, variables) => {
      // Default success behavior
      toast({
        title: "Parts/Tools Updated",
        description: "Parts and tools information has been saved successfully.",
        variant: "default",
      })

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['lineMaintenances', 'flight', variables.lineMaintenancesId]
      })
      queryClient.invalidateQueries({
        queryKey: ['lineMaintenances', variables.lineMaintenancesId]
      })

      // Custom success callback
      options.onSuccess?.(data, variables)
    },
    onError: (error, variables) => {
      // Default error behavior
      toast({
        title: "Error Updating Parts/Tools",
        description: error.message || "Failed to save parts and tools information. Please try again.",
        variant: "destructive",
      })

      // Custom error callback
      options.onError?.(error, variables)
    },
    onSettled: (data, error, variables) => {
      // Custom settled callback
      options.onSettled?.(data, error, variables)
    },
  })
}

/**
 * Helper hook to get mutation state
 */
export const usePutPartsToolsState = () => {
  const mutation = usePutPartsTools()
  
  return {
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
  }
}
