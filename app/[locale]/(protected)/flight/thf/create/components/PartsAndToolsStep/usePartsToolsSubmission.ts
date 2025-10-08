import { UseFormReturn } from 'react-hook-form'
import { PartsToolsFormInputs } from './types'
import { transformPartsToolsForApi } from './utils'
import { usePutPartsToolsWithCallbacks } from '@/lib/api/hooks/usePutPartsTools'
import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'

interface UsePartsToolsSubmissionProps {
  form: UseFormReturn<PartsToolsFormInputs>
  onNextStep: () => void
  onBackStep: () => void
  onUpdateData: () => void
  existingFlightData?: LineMaintenanceThfResponse | null
  lineMaintenanceId: number
}

export const usePartsToolsSubmission = ({
  form,
  onNextStep,
  onBackStep,
  onUpdateData,
  existingFlightData,
  lineMaintenanceId
}: UsePartsToolsSubmissionProps) => {

  const putPartsToolsMutation = usePutPartsToolsWithCallbacks({
    onSuccess: (data, variables) => {
      onNextStep()
    },
    onError: (error, variables) => {
      console.error('Failed to save parts/tools:', error)
      // Error handling is done in the hook
    },
  })

  const handleSubmit = (data: PartsToolsFormInputs) => {
    // Validate that we have a line maintenance ID
    if (!lineMaintenanceId) {
      form.setError('root', {
        type: 'manual',
        message: 'Line maintenance information not found. Please try again.'
      })
      return
    }

    // Transform form data to API format
    const apiData = transformPartsToolsForApi(data)

    // Submit to API
    putPartsToolsMutation.mutate({
      lineMaintenancesId: lineMaintenanceId,
      partsTools: apiData
    })
  }

  const handleSaveDraft = (data: PartsToolsFormInputs) => {
    if (!lineMaintenanceId) {
      console.error('No line maintenance ID available for draft save')
      return
    }

    // Transform and save even if validation fails (draft mode)
    const apiData = transformPartsToolsForApi(data)

    putPartsToolsMutation.mutate({
      lineMaintenancesId: lineMaintenanceId,
      partsTools: apiData
    })
  }

  const handleOnBackStep = () => {
    onBackStep()
  }

  return {
    // Form handlers
    handleSubmit,
    handleSaveDraft,
    handleOnBackStep,

    // Mutation states
    isSubmitting: putPartsToolsMutation.isPending,
    isSubmitSuccess: putPartsToolsMutation.isSuccess,
    isSubmitError: putPartsToolsMutation.isError,
    submitError: putPartsToolsMutation.error,
    resetMutation: putPartsToolsMutation.reset,

    // Computed states
    hasLineMaintenanceId: !!lineMaintenanceId,
    lineMaintenanceId,
  }
}
