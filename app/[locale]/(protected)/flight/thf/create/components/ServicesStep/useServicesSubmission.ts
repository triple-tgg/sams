import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { ServicesFormInputs } from './types'
import { transformServicesDataToAPI } from './utils'
import { usePutServiceFromForm } from '@/lib/api/hooks/usePutService'
import { dateTimeUtils } from '@/lib/dayjs'
import { formatFromPicker } from '@/lib/utils/formatPicker'
import { FlightFormData } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'

interface UseServicesSubmissionProps {
  form: UseFormReturn<ServicesFormInputs>
  onNextStep: () => void
  onBackStep: () => void
  onUpdateData: (data: any) => void
  existingFlightData?: any // Add flight data for line maintenance ID
  lineMaintenanceId?: number | null
  formData?: FlightFormData | null
}

export const useServicesSubmission = ({
  form,
  onNextStep,
  onBackStep,
  onUpdateData,
  existingFlightData,
  lineMaintenanceId,
  ...props
}: UseServicesSubmissionProps) => {

  // Initialize the PUT service mutation hook
  const putServiceMutation = usePutServiceFromForm()


  const handleSubmit = async (data: ServicesFormInputs) => {
    console.log("data:handleSubmit", data)
    try {
      // Validate form data
      const isValid = await form.trigger()
      if (!isValid) {
        toast.error("Please fix the validation errors before proceeding")
        return
      }

      // Check if we have line maintenance ID
      if (!lineMaintenanceId) {
        toast.error("Line maintenance ID not found. Please ensure flight data is loaded properly.")
        console.error("Missing line maintenance ID:", existingFlightData)
        return
      }
      // Transform data for local state
      // const transformedData = transformServicesDataToAPI(data)

      // Update parent component data immediately
      // onUpdateData(transformedData)

      // Prepare options based on form data
      const serviceOptions = {
        enablePersonnels: data.addPersonnels || false,
        enableAdditionalDefect: data.additionalDefectRectification || false,
        enableFluidServicing: data.servicingPerformed || false,
        enableFlightdeck: data.flightDeck || false,
        enableAircraftTowing: data.aircraftTowing || false,
      }

      // Call API to save services data
      await putServiceMutation.mutateAsync({
        lineMaintenanceId: lineMaintenanceId,
        formData: data,
        options: serviceOptions
      })

      // Show success message (additional to hook's toast)
      // toast.success("Services data saved and submitted successfully")

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
        attachFiles: null
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
        { left: 0, right: 0, selectedEngine: 'left' as const }
      ])
    }
  }

  const handleRemoveEngineOilSet = (index: number) => {
    const currentSets = form.getValues('fluid.engOilSets')
    if (currentSets.length > 1) {
      form.setValue('fluid.engOilSets', currentSets.filter((_, i) => i !== index))
    }
  }

  const handleAddCsdIdgVsfgSet = () => {
    const currentSets = form.getValues('fluid.csdIdgVsfgSets')
    if (currentSets.length < 4) {
      form.setValue('fluid.csdIdgVsfgSets', [
        ...currentSets,
        { quantity: 0 }
      ])
    }
  }

  const handleRemoveCsdIdgVsfgSet = (index: number) => {
    const currentSets = form.getValues('fluid.csdIdgVsfgSets')
    if (currentSets.length > 1) {
      form.setValue('fluid.csdIdgVsfgSets', currentSets.filter((_, i) => i !== index))
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
        // onDate: formatFromPicker(dateTimeUtils.getCurrentDate()),
        // offDate: formatFromPicker(dateTimeUtils.getCurrentDate()),
        onDate: formatFromPicker(props.formData?.arrivalDate || dateTimeUtils.getCurrentDate()),
        offDate: formatFromPicker(props.formData?.arrivalDate || dateTimeUtils.getCurrentDate()),
        onTime: props.formData?.ata || "",
        offTime: props.formData?.atd || "",
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
    handleAddAircraftCheck,
    handleRemoveAircraftCheck,
    handleAddDefect,
    handleRemoveDefect,
    handleAddPersonnel,
    handleRemovePersonnel,
    handleAddEngineOilSet,
    handleRemoveEngineOilSet,
    handleAddCsdIdgVsfgSet,
    handleRemoveCsdIdgVsfgSet,
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
