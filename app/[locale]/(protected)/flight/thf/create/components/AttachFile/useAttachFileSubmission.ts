import { useCallback, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import { AttachFileFormInputs } from './types'
import { prepareAttachFileDataForApi, getMissingFlightTimeMessage } from './utils'
import { usePutAttachFileOtherWithLoading } from '@/lib/api/hooks/usePutAttachfileOther'
import { useSharePointSend } from '@/lib/api/hooks/useSharePointSend'
import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import useReduxAuth from '@/lib/api/hooks/useReduxAuth'
import { thfRevisionService } from '@/lib/store/useThfRevisionStore'
import { postThfValidateForDone } from '@/lib/api/lineMaintenances/thf-validate/postThfValidateForDone'
import type { SubmitPhase } from '../step-context'

export interface UseAttachFileSubmissionParams {
  form: UseFormReturn<AttachFileFormInputs>
  onNextStep: () => void
  onBackStep: () => void
  onUpdateData?: () => void
  existingFlightData?: LineMaintenanceThfResponse | null
  lineMaintenanceId: number | null
  closeModal?: () => void
  setSubmitPhase?: (phase: SubmitPhase) => void
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
  sharePointError: Error | null
  /** Reasons returned by thf-validate-for-done when Submit is blocked */
  validationErrors: string[]
  resetMutation: () => void
  hasLineMaintenanceId: boolean
}

/**
 * Hook for handling attach file form submission
 * - Draft: calls attachfile-other → close modal
 * - Submit: calls attachfile-other → thf-validate-for-done → SharePoint send → show result (Close button)
 *   If validation fails, Submit stops and the errors are shown so the user can jump to the step to fix.
 *   When validation passes, the API itself changes the THF status (Done → visible to Accounting for mapping).
 *
 * Contract mapping is NOT part of Draft/Submit. It runs only when Accounting creates a
 * Pre-Invoice (PUT /lineMaintenances/mapping-contracts-v2, see useMapContractsV2).
 */
export const useAttachFileSubmission = ({
  form,
  onNextStep,
  onBackStep,
  onUpdateData,
  existingFlightData,
  lineMaintenanceId,
  closeModal,
  setSubmitPhase
}: UseAttachFileSubmissionParams): UseAttachFileSubmissionReturn => {
  const { locale } = useParams()
  const hasLineMaintenanceId = lineMaintenanceId !== null
  const queryClient = useQueryClient()
  const router = useRouter()
  const { getUserName } = useReduxAuth()
  const [validationErrors, setValidationErrors] = useState<string[]>([])

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


  // Initialize the SharePoint send mutation
  const {
    sendToSharePoint,
    isSharePointLoading,
    sharePointError,
    resetSharePoint,
  } = useSharePointSend({
    lineMaintenancesId: lineMaintenanceId || 0,
    onSuccess: async (data) => {
      console.log('✅ SharePoint send successful:', data.responseData?.sharePointUrl)
    },
    onError: (error) => {
      console.error('❌ Failed to send to SharePoint:', error)
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
      toast.error(`Draft save failed: ${error}`, {
        duration: Infinity,
        closeButton: true,
      })
    }
  }, [callAttachFileOther, closeModal])

  // Submit: attachfile-other → sharepoint send
  const handleSubmit = useCallback(async (data: AttachFileFormInputs) => {
    try {
      // Step 1: Save attach files
      setValidationErrors([])
      setSubmitPhase?.('saving_files')
      await callAttachFileOther(data)

      // Step 2: Validate THF. On pass the API moves the THF to Done (ready for Pre-Invoice mapping).
      setSubmitPhase?.('validating')

      // Arrival/Departure (Flight No, Date, STA/ATA, STD/ATD) are not checked by the API,
      // so block here first — before the API call, which would mark the THF as Done.
      const flightTimeError = getMissingFlightTimeMessage(existingFlightData?.responseData?.flight)
      if (flightTimeError) {
        setValidationErrors([flightTimeError])
        setSubmitPhase?.('validation_error')
        toast.error('THF validation failed', {
          description: 'Please fix the listed items and submit again.',
        })
        return
      }

      const validation = await postThfValidateForDone(lineMaintenanceId as number)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        setSubmitPhase?.('validation_error')
        toast.error('THF validation failed', {
          description: 'Please fix the listed items and submit again.',
        })
        return
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['flightList'] }),
        queryClient.invalidateQueries({ queryKey: ['thfDocumentList'] }),
      ])

      // Step 3: Send to SharePoint
      setSubmitPhase?.('sharepoint')
      try {
        await sendToSharePoint()
      } catch (spError) {
        console.warn('⚠️ SharePoint send failed (non-blocking):', spError)
        toast.warning('Submit completed but SharePoint upload failed', {
          description: spError instanceof Error ? spError.message : 'Please try again later',
          duration: Infinity,
          closeButton: true,
        })
        setSubmitPhase?.('sharepoint_error')
        return
      }

      // Check if this was a revision submission
      if (lineMaintenanceId) {
        const rev = thfRevisionService.get(undefined, lineMaintenanceId);
        if (rev && rev.state === 'revision_required') {
          thfRevisionService.submitRevision({
            lineMaintenanceId,
          });
          toast.info('Revision submitted to Accounting. Status updated to REVISED, ready for Pre-Invoice.');
        }
      }

      toast.success('Submit completed successfully')
      setSubmitPhase?.('success')
    } catch (error) {
      console.error('❌ Submit failed:', error)
      toast.error(`Submit failed: ${error instanceof Error ? error.message : error}`, {
        duration: Infinity,
        closeButton: true,
      })
      setSubmitPhase?.('error')
    }
  }, [callAttachFileOther, sendToSharePoint, setSubmitPhase, lineMaintenanceId, queryClient, existingFlightData])

  // Handle back navigation
  const handleOnBackStep = useCallback(() => {
    console.log('⬅️ Navigating back from attach file step')
    onBackStep()
  }, [onBackStep])

  const handleResetAll = useCallback(() => {
    resetMutation()
    resetSharePoint()
    setValidationErrors([])
  }, [resetMutation, resetSharePoint])

  return {
    handleSubmit,
    handleDraft,
    handleOnBackStep,
    isSubmitting: isAttachFileLoading || isSharePointLoading,
    isDrafting: isAttachFileLoading,
    isSubmitSuccess,
    isSubmitError,
    submitError,
    sharePointError: sharePointError ?? null,
    validationErrors,
    resetMutation: handleResetAll,
    hasLineMaintenanceId
  }
}
