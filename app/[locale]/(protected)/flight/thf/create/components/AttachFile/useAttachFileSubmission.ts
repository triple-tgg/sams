import { useCallback } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import { AttachFileFormInputs } from './types'
import { prepareAttachFileDataForApi } from './utils'
import { usePutAttachFileOtherWithLoading } from '@/lib/api/hooks/usePutAttachfileOther'
import { useMappingContracts } from '@/lib/api/hooks/useMappingContracts'
import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import useReduxAuth from '@/lib/api/hooks/useReduxAuth'

export interface UseAttachFileSubmissionParams {
  form: UseFormReturn<AttachFileFormInputs>
  onNextStep: () => void
  onBackStep: () => void
  onUpdateData?: () => void
  existingFlightData?: LineMaintenanceThfResponse | null
  lineMaintenanceId: number | null
  closeModal?: () => void
}

export interface UseAttachFileSubmissionReturn {
  handleSubmit: (data: AttachFileFormInputs) => void
  handleDraft: (data: AttachFileFormInputs) => void
  handleOnBackStep: () => void
  isSubmitting: boolean
  isDrafting: boolean
  isSubmitSuccess: boolean
  isSubmitError: boolean
  submitError: Error | null
  resetMutation: () => void
  hasLineMaintenanceId: boolean
}

/**
 * Hook for handling attach file form submission
 * - Draft: calls attachfile-other → close modal
 * - Submit: calls attachfile-other → mapping-contracts → close modal
 */
export const useAttachFileSubmission = ({
  form,
  onNextStep,
  onBackStep,
  onUpdateData,
  lineMaintenanceId,
  closeModal
}: UseAttachFileSubmissionParams): UseAttachFileSubmissionReturn => {
  const { locale } = useParams()
  const hasLineMaintenanceId = lineMaintenanceId !== null
  const queryClient = useQueryClient()
  const router = useRouter()
  const { getUserName } = useReduxAuth()

  // Initialize the PUT mutation for attachfile-other
  const {
    updateAttachFileOther,
    isLoading: isAttachFileLoading,
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
    },
    onError: (error) => {
      console.error('❌ Failed to update attach files:', error)
    }
  })

  // Initialize the mapping-contracts mutation
  const {
    mappingContracts,
    isMappingLoading,
  } = useMappingContracts({
    lineMaintenancesId: lineMaintenanceId || 0,
    onSuccess: async () => {
      console.log('✅ Mapping contracts successful')
    },
    onError: (error) => {
      console.error('❌ Failed to map contracts:', error)
    }
  })

  // Prepare and call the attachfile-other API
  const callAttachFileOther = useCallback(async (data: AttachFileFormInputs) => {
    if (!hasLineMaintenanceId) {
      console.error('❌ No line maintenance ID available')
      throw new Error('No line maintenance ID available')
    }

    const apiData = prepareAttachFileDataForApi(data)
    // Use mutateAsync-style by wrapping in a promise
    return new Promise<void>((resolve, reject) => {
      updateAttachFileOther(apiData, {
        onSuccess: () => resolve(),
        onError: (error: Error) => reject(error),
      })
    })
  }, [hasLineMaintenanceId, updateAttachFileOther])

  // Draft: attachfile-other → close modal
  const handleDraft = useCallback(async (data: AttachFileFormInputs) => {
    try {
      await callAttachFileOther(data)
      toast.success('Draft saved successfully')
      closeModal?.()
    } catch (error) {
      console.error('❌ Draft save failed:', error)
      toast.error(`Draft save failed: ${error}`)
    }
  }, [callAttachFileOther, closeModal])

  // Submit: attachfile-other → mapping-contracts → close modal
  const handleSubmit = useCallback(async (data: AttachFileFormInputs) => {
    try {
      // Step 1: Save attach files
      await callAttachFileOther(data)

      // Step 2: Map contracts
      const userName = getUserName() || 'system'
      await mappingContracts({ userName })

      toast.success('Submit completed successfully')
      closeModal?.()
    } catch (error) {
      console.error('❌ Submit failed:', error)
      toast.error(`Submit failed: ${error instanceof Error ? error.message : error}`)
    }
  }, [callAttachFileOther, mappingContracts, getUserName, closeModal])

  // Handle back navigation
  const handleOnBackStep = useCallback(() => {
    console.log('⬅️ Navigating back from attach file step')
    onBackStep()
  }, [onBackStep])

  return {
    handleSubmit,
    handleDraft,
    handleOnBackStep,
    isSubmitting: isAttachFileLoading || isMappingLoading,
    isDrafting: isAttachFileLoading,
    isSubmitSuccess,
    isSubmitError,
    submitError,
    resetMutation,
    hasLineMaintenanceId
  }
}
