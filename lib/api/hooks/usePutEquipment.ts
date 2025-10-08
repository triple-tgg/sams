import { useMutation, useQueryClient } from '@tanstack/react-query'
import { putEquipment, transformEquipmentDataForAPI, PutEquipmentRequest, PutEquipmentResponse } from '../lineMaintenances/equipment/putEquipment'
import { toast } from 'sonner'
// import { useToast } from '@/components/ui/use-toast'

// Interface สำหรับ mutation parameters
interface PutEquipmentParams {
  lineMaintenancesId: number
  equipmentData: any[] // Form data from react-hook-form
}

// Interface สำหรับ mutation options
interface UsePutEquipmentOptions {
  onSuccess?: (data: PutEquipmentResponse) => void
  onError?: (error: Error) => void
  onSettled?: () => void
  showToast?: boolean
}

/**
 * Custom hook สำหรับ PUT Equipment data
 * @param options - Configuration options for the mutation
 * @returns React Query mutation object
 */
export const usePutEquipment = (options: UsePutEquipmentOptions = {}) => {
  const queryClient = useQueryClient()
  // const { toast } = useToast()
  const {
    onSuccess,
    onError,
    onSettled,
    showToast = true
  } = options

  return useMutation<PutEquipmentResponse, Error, PutEquipmentParams>({
    mutationFn: async ({ lineMaintenancesId, equipmentData }) => {
      // Transform form data to API format
      const transformedData = transformEquipmentDataForAPI(equipmentData, lineMaintenancesId)
      console.log("transformedData", transformedData)
      // Call API
      return await putEquipment(lineMaintenancesId, transformedData)
    },

    onSuccess: (data, variables) => {
      // Show success toast
      if (showToast) {
        toast.success('Save successfully')
        // toast({
        //   variant: "success",
        //   title: "Success",
        //   description: `${variables.equipmentData.length} equipment(s) have been updated successfully.`
        // })
      }

      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['lineMaintenances', variables.lineMaintenancesId]
      })
      queryClient.invalidateQueries({
        queryKey: ["lineMaintenancesThf"]
      });
      queryClient.invalidateQueries({
        queryKey: ['equipment']
      })

      // Call custom onSuccess callback
      onSuccess?.(data)
    },

    onError: (error, variables) => {
      // Show error toast
      if (showToast) {
        toast.error(error.message || 'An unexpected error occurred')

        // toast({
        //   variant: "destructive",
        //   title: "Failed to update equipment",
        //   description: error.message || 'An unexpected error occurred'
        // })
      }

      // Call custom onError callback
      onError?.(error)
    },

    onSettled: () => {
      // Call custom onSettled callback
      onSettled?.()
    }
  })
}

/**
 * Helper hook สำหรับ PUT Equipment พร้อม loading state management
 * @param options - Configuration options
 * @returns Enhanced mutation with additional utilities
 */
export const usePutEquipmentWithLoading = (options: UsePutEquipmentOptions = {}) => {
  const mutation = usePutEquipment(options)

  return {
    ...mutation,

    // Enhanced methods
    updateEquipment: async (lineMaintenancesId: number, equipmentData: any[]) => {
      try {
        const result = await mutation.mutateAsync({ lineMaintenancesId, equipmentData })
        return result
      } catch (error) {
        throw error
      }
    },

    // Utility methods
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset
  }
}

/**
 * Hook สำหรับ batch update equipment (multiple line maintenances)
 * @param options - Configuration options
 * @returns Mutation for batch operations
 */
export const useBatchPutEquipment = (options: UsePutEquipmentOptions = {}) => {
  const queryClient = useQueryClient()
  // const { toast } = useToast()
  const { onSuccess, onError, onSettled, showToast = true } = options

  return useMutation<PutEquipmentResponse[], Error, PutEquipmentParams[]>({
    mutationFn: async (batchData) => {
      // Process all equipment updates in parallel
      const promises = batchData.map(({ lineMaintenancesId, equipmentData }) => {
        const transformedData = transformEquipmentDataForAPI(equipmentData, lineMaintenancesId)
        return putEquipment(lineMaintenancesId, transformedData)
      })

      return await Promise.all(promises)
    },

    onSuccess: (data, variables) => {
      if (showToast) {
        toast.success('successfully')
        // toast({
        //   variant: "success",
        //   title: "Batch Update Success",
        //   description: `Updated equipment for ${variables.length} line maintenance(s) successfully.`
        // })
      }

      // Invalidate queries for all affected line maintenances
      variables.forEach(({ lineMaintenancesId }) => {
        queryClient.invalidateQueries({
          queryKey: ['lineMaintenances', lineMaintenancesId]
        })
      })
      queryClient.invalidateQueries({
        queryKey: ['equipment']
      })

      onSuccess?.(data[0]) // Pass first result to callback
    },

    onError: (error) => {
      if (showToast) {
        toast.error(error.message || 'Some updates may have failed')
        // toast({
        //   variant: "destructive",
        //   title: "Batch Update Failed",
        //   description: error.message || 'Some updates may have failed'
        // })
      }

      onError?.(error)
    },

    onSettled: () => {
      onSettled?.()
    }
  })
}
