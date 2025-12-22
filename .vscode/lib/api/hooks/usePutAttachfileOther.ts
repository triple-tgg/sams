import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'
import { putAttachfileOther, AttachFileOtherData, PutAttachFileOtherResponse } from '../lineMaintenances/attachfile-other/putAttachfileOther'

export interface UsePutAttachFileOtherParams {
  lineMaintenancesId: number
  onSuccess?: (data: PutAttachFileOtherResponse) => void
  onError?: (error: Error) => void
}

/**
 * Hook for updating attach file other data
 * @param params - Configuration object with callbacks
 * @returns Mutation object with loading states and functions
 */
export const usePutAttachFileOther = ({
  lineMaintenancesId,
  onSuccess,
  onError
}: UsePutAttachFileOtherParams) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AttachFileOtherData[]) => 
      putAttachfileOther(lineMaintenancesId, payload),
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: ['lineMaintenances', lineMaintenancesId, 'attachfile-other']
      })
      
      // Show success toast
      toast({
        title: "Files Uploaded Successfully",
        description: "Your attached files have been saved.",
        variant: "default"
      })

      // Call custom success callback
      onSuccess?.(data)
    },
    onError: (error: Error) => {
      // Show error toast
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive"
      })

      // Call custom error callback
      onError?.(error)
    }
  })
}

/**
 * Hook with built-in loading states for easier component usage
 * @param params - Configuration object
 * @returns Extended mutation object with boolean states
 */
export const usePutAttachFileOtherWithLoading = (params: UsePutAttachFileOtherParams) => {
  const mutation = usePutAttachFileOther(params)

  return {
    ...mutation,
    updateAttachFileOther: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset
  }
}
