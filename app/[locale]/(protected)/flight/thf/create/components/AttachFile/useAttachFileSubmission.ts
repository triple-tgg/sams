import { useCallback } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { AttachFileFormInputs } from './types'
import { prepareAttachFileDataForApi } from './utils'
import { usePutAttachFileOtherWithLoading } from '@/lib/api/hooks/usePutAttachfileOther'
import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { useQueryClient } from '@tanstack/react-query'

export interface UseAttachFileSubmissionParams {
  form: UseFormReturn<AttachFileFormInputs>
  onNextStep: () => void
  onBackStep: () => void
  onUpdateData?: () => void
  existingFlightData?: LineMaintenanceThfResponse | null
}

export interface UseAttachFileSubmissionReturn {
  handleSubmit: (data: AttachFileFormInputs) => void
  handleOnBackStep: () => void
  isSubmitting: boolean
  isSubmitSuccess: boolean
  isSubmitError: boolean
  submitError: Error | null
  resetMutation: () => void
  hasLineMaintenanceId: boolean
  lineMaintenanceId: number | null
}

/**
 * Hook for handling attach file form submission
 * @param params - Configuration parameters
 * @returns Submission handlers and state
 */
export const useAttachFileSubmission = ({
  form,
  onNextStep,
  onBackStep,
  onUpdateData,
  existingFlightData
}: UseAttachFileSubmissionParams): UseAttachFileSubmissionReturn => {

  // Get line maintenance ID from existing data
  const lineMaintenanceId = existingFlightData?.responseData?.lineMaintenance?.id || null
  const hasLineMaintenanceId = lineMaintenanceId !== null
  const queryClient = useQueryClient()
  const router = useRouter()

  // Initialize the PUT mutation
  const {
    updateAttachFileOther,
    isLoading: isSubmitting,
    isSuccess: isSubmitSuccess,
    isError: isSubmitError,
    error: submitError,
    reset: resetMutation
  } = usePutAttachFileOtherWithLoading({
    lineMaintenancesId: lineMaintenanceId || 0,
    onSuccess: async () => {
      console.log('✅ Attach files updated successfully')
      await queryClient.invalidateQueries({ queryKey: ['flightList'] })
      onUpdateData?.()

      // Navigate to flight list page
      router.push('/flight/list')
    },
    onError: (error) => {
      console.error('❌ Failed to update attach files:', error)
    }
  })

  // Handle form submission
  const handleSubmit = useCallback((data: AttachFileFormInputs) => {
    console.log('📤 Submitting attach file data:', data)

    if (!hasLineMaintenanceId) {
      console.error('❌ No line maintenance ID available')
      return
    }

    try {
      // Prepare data for API
      const apiData = prepareAttachFileDataForApi(data)

      if (apiData.length === 0) {
        console.warn('⚠️ No completed files to submit')
        // Still proceed to next step if no files are required
        onNextStep()
        return
      }

      console.log('📦 Prepared API data:', apiData)

      // Submit to API
      updateAttachFileOther(apiData)
    } catch (error) {
      console.error('❌ Error preparing attach file data:', error)
    }
  }, [hasLineMaintenanceId, updateAttachFileOther, onNextStep])

  // Handle back navigation
  const handleOnBackStep = useCallback(() => {
    console.log('⬅️ Navigating back from attach file step')
    onBackStep()
  }, [onBackStep])

  return {
    handleSubmit,
    handleOnBackStep,
    isSubmitting,
    isSubmitSuccess,
    isSubmitError,
    submitError,
    resetMutation,
    hasLineMaintenanceId,
    lineMaintenanceId
  }
}
