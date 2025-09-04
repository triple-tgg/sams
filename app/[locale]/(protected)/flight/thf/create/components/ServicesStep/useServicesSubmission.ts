import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { ServicesFormInputs } from './types'
import { transformServicesData } from './utils'
import { usePutServiceFromForm } from '@/lib/api/hooks/usePutService'
import { dateTimeUtils } from '@/lib/dayjs'

interface UseServicesSubmissionProps {
  form: UseFormReturn<ServicesFormInputs>
  onNextStep: () => void
  onBackStep: () => void
  onUpdateData: (data: any) => void
  existingFlightData?: any // Add flight data for line maintenance ID
}

export const useServicesSubmission = ({
  form,
  onNextStep,
  onBackStep,
  onUpdateData,
  existingFlightData,
}: UseServicesSubmissionProps) => {

  // Initialize the PUT service mutation hook
  const putServiceMutation = usePutServiceFromForm()


  const handleSubmit = async (data: ServicesFormInputs) => {
    try {
      // Validate form data
      const isValid = await form.trigger()
      if (!isValid) {
        toast.error("Please fix the validation errors before proceeding")
        return
      }

      // Check if we have line maintenance ID
      if (!existingFlightData?.responseData.lineMaintenance?.id) {
        toast.error("Line maintenance ID not found. Please ensure flight data is loaded properly.")
        console.error("Missing line maintenance ID:", existingFlightData)
        return
      }

      // Transform data for local state
      const transformedData = transformServicesData(data)

      // Update parent component data immediately
      onUpdateData(transformedData)

      // Prepare options based on form data
      const serviceOptions = {
        enablePersonnels: data.addPersonnels || false,
        enableAdditionalDefect: data.additionalDefectRectification || false,
        enableFluidServicing: data.servicingPerformed || false,
        enableFlightdeck: data.flightDeck || false,
        enableAircraftTowing: data.aircraftTowing || false,
      }

      console.log("Submitting services data:", {
        lineMaintenanceId: existingFlightData?.responseData.lineMaintenance?.id,
        formData: data,
        serviceOptions,
        transformedData
      })

      // Call API to save services data
      await putServiceMutation.mutateAsync({
        lineMaintenanceId: existingFlightData?.responseData.lineMaintenance?.id,
        formData: data,
        options: serviceOptions
      })

      // Show success message (additional to hook's toast)
      toast.success("Services data saved and submitted successfully")

      // Proceed to next step
      onNextStep()

    } catch (error) {
      console.error("Error submitting services data:", error)

      // Show error message (additional to hook's toast)
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to save services data. Please try again."

      toast.error(`Submission failed: ${errorMessage}`)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const data = form.getValues()

      // Validate basic required fields only for draft
      const requiredFieldsValid = data.aircraftChecks && data.aircraftChecks.length > 0

      if (!requiredFieldsValid) {
        toast.error("At least one aircraft check is required to save draft")
        return
      }

      // Check if we have line maintenance ID
      if (!existingFlightData?.lineMaintenance?.id) {
        // For draft, we can save locally without API call
        const transformedData = transformServicesData(data)
        onUpdateData(transformedData)
        toast.success("Draft saved locally")
        return
      }

      // Transform data for local state
      const transformedData = transformServicesData(data)
      onUpdateData(transformedData)

      // Prepare options based on current form state (for draft, we can be more lenient)
      const serviceOptions = {
        enablePersonnels: data.addPersonnels || false,
        enableAdditionalDefect: data.additionalDefectRectification || false,
        enableFluidServicing: data.servicingPerformed || false,
        enableFlightdeck: data.flightDeck || false,
        enableAircraftTowing: data.aircraftTowing || false,
      }

      console.log("Saving services draft:", {
        lineMaintenanceId: existingFlightData?.responseData.lineMaintenance?.id,
        formData: data,
        serviceOptions
      })

      // Save draft to API (non-blocking)
      try {
        await putServiceMutation.mutateAsync({
          lineMaintenanceId: existingFlightData?.responseData.lineMaintenance?.id,
          formData: data,
          options: serviceOptions
        })

        toast.success("Draft saved successfully to server")
      } catch (apiError) {
        console.warn("Failed to save draft to server, but saved locally:", apiError)
        toast.success("Draft saved locally (server save failed)")
      }

    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Failed to save draft")
    }
  }

  const handleAddAircraftCheck = () => {
    const currentChecks = form.getValues('aircraftChecks')
    form.setValue('aircraftChecks', [
      ...currentChecks,
      {
        maintenanceTypes: "",
        maintenanceSubTypes: [],
        laeMH: "",
        mechMH: "",
      }
    ])
  }

  const handleRemoveAircraftCheck = (index: number) => {
    const currentChecks = form.getValues('aircraftChecks')
    if (currentChecks.length > 1) {
      form.setValue('aircraftChecks', currentChecks.filter((_, i) => i !== index))
    }
  }

  const handleAddDefect = () => {
    const currentDefects = form.getValues('additionalDefects') || []
    form.setValue('additionalDefects', [
      ...currentDefects,
      {
        defect: "",
        ataChapter: "",
        laeMH: "",
        mechMH: "",
      }
    ])
  }

  const handleRemoveDefect = (index: number) => {
    const currentDefects = form.getValues('additionalDefects') || []
    form.setValue('additionalDefects', currentDefects.filter((_, i) => i !== index))
  }

  const handleAddPersonnel = () => {
    const currentPersonnel = form.getValues('personnel') || []
    form.setValue('personnel', [
      ...currentPersonnel,
      // {
      //   staffId: "",
      //   name: "",
      //   type: "",
      //   from: "",
      //   to: "",
      //   remark: "",
      // }
    ])
  }

  const handleRemovePersonnel = (index: number) => {
    const currentPersonnel = form.getValues('personnel') || []
    form.setValue('personnel', currentPersonnel.filter((_, i) => i !== index))
  }

  const handleAddEngineOilSet = () => {
    const currentSets = form.getValues('fluid.engOilSets')
    if (currentSets.length < 4) {
      form.setValue('fluid.engOilSets', [
        ...currentSets,
        { left: "", right: "" }
      ])
    }
  }

  const handleRemoveEngineOilSet = (index: number) => {
    const currentSets = form.getValues('fluid.engOilSets')
    if (currentSets.length > 1) {
      form.setValue('fluid.engOilSets', currentSets.filter((_, i) => i !== index))
    }
  }

  // const handleAddFlightDeckInfo = () => {
  //   const currentInfo = form.getValues('flightDeckInfo') || []

  //   form.setValue('flightDeckInfo', [
  //     ...currentInfo,
  //     {
  //       date: dateTimeUtils.getCurrentDate(),
  //       timeOn: "",
  //       timeOf: "",
  //     }
  //   ])
  // }

  // const handleRemoveFlightDeckInfo = (index: number) => {
  //   const currentInfo = form.getValues('flightDeckInfo') || []
  //   form.setValue('flightDeckInfo', currentInfo.filter((_, i) => i !== index))
  // }

  const handleAddTowingInfo = () => {
    const currentInfo = form.getValues('aircraftTowingInfo') || []

    form.setValue('aircraftTowingInfo', [
      ...currentInfo,
      {
        date: dateTimeUtils.getCurrentDate(),
        timeOn: "",
        timeOf: "",
        bayFrom: "",
        bayTo: "",
      }
    ])
  }

  const handleRemoveTowingInfo = (index: number) => {
    const currentInfo = form.getValues('aircraftTowingInfo') || []
    form.setValue('aircraftTowingInfo', currentInfo.filter((_, i) => i !== index))
  }

  const handleOnBackStep = () => {
    onBackStep()
  }

  return {
    handleOnBackStep,
    handleSubmit,
    handleSaveDraft,
    handleAddAircraftCheck,
    handleRemoveAircraftCheck,
    handleAddDefect,
    handleRemoveDefect,
    handleAddPersonnel,
    handleRemovePersonnel,
    handleAddEngineOilSet,
    handleRemoveEngineOilSet,
    // handleAddFlightDeckInfo,
    // handleRemoveFlightDeckInfo,
    handleAddTowingInfo,
    handleRemoveTowingInfo,
    // Mutation states
    isSubmitting: putServiceMutation.isPending,
    isSubmitSuccess: putServiceMutation.isSuccess,
    isSubmitError: putServiceMutation.isError,
    submitError: putServiceMutation.error,
    // Reset mutation state
    resetMutation: putServiceMutation.reset,
  }
}
