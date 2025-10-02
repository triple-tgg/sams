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
      console.log('Parts/Tools saved successfully:', data)
      // onUpdateData()
      onNextStep()
    },
    onError: (error, variables) => {
      console.error('Failed to save parts/tools:', error)
      // Error handling is done in the hook
    },
  })

  const handleSubmit = (data: PartsToolsFormInputs) => {
    console.log('Submitting parts/tools data:', data)

    // Validate that we have a line maintenance ID
    if (!lineMaintenanceId) {
      console.error('No line maintenance ID available')
      form.setError('root', {
        type: 'manual',
        message: 'Line maintenance information not found. Please try again.'
      })
      return
    }

    // Transform form data to API format
    const apiData = transformPartsToolsForApi(data)

    // Validate that we have at least one part/tool with required data
    const hasValidItems = apiData.some(item => item.pathToolName.trim() !== '')
    if (!hasValidItems) {
      form.setError('partsTools.0.pathToolName', {
        type: 'manual',
        message: 'At least one part/tool name is required'
      })
      return
    }

    // Submit to API
    putPartsToolsMutation.mutate({
      lineMaintenancesId: lineMaintenanceId,
      partsTools: apiData
    })
  }

  const handleSaveDraft = (data: PartsToolsFormInputs) => {
    console.log('Saving parts/tools draft:', data)

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
    // Optional: Save as draft before going back
    // const currentData = form.getValues()
    // if (lineMaintenanceId && currentData.partsTools.some(item => item.pathToolName.trim() !== '')) {
    //   // handleSaveDraft(currentData)
    //   console.log("handleOnBackStep:PartsAndToolsStepProps")
    // }
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
