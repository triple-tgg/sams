import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { EquipmentFormData, defaultEquipment } from './types'
import { equipmentFormSchema } from './schema'
import { getDefaultValues, mapEquipmentFormToApiData } from './utils'
import { LineMaintenanceThfData } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'

interface UseEquipmentSubmissionProps {
  form: UseFormReturn<EquipmentFormData>
  onNextStep: () => void
  onBackStep: () => void
  onUpdateData: (data: any) => void
  reset: () => void
  updateEquipment: (lineMaintenancesId: number, equipmentData: any[]) => void
  existingData?: LineMaintenanceThfData
}

export const useEquipmentSubmission = ({
  form,
  onNextStep,
  onBackStep,
  onUpdateData,
  updateEquipment,
  reset,
  existingData
}: UseEquipmentSubmissionProps) => {
  const { toast } = useToast()

  // // Mutation for saving equipment data
  // const saveEquipmentMutation = useMutation({
  //   mutationFn: async (data: EquipmentFormData) => {
  //     // Transform data for API
  //     const apiData = mapEquipmentFormToApiData(data)

  //     // TODO: Replace with actual API call
  //     console.log('Saving equipment data:', apiData)
  //     await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
  //     return apiData
  //   },
  //   onSuccess: (data) => {
  //     toast.success('Equipment data saved successfully')
  //     onUpdateData(data)
  //     onNextStep()
  //   },
  //   onError: (error: any) => {
  //     console.error('Equipment save error:', error)
  //     toast.error('Failed to save equipment data. Please try again.')
  //   }
  // })

  // Form submission handler
  const handleSubmit = async (data: EquipmentFormData) => {
    console.log('Equipment form submitted:', data)

    // Validate the data
    const validation = equipmentFormSchema.safeParse(data)
    if (!validation.success) {
      console.error('Validation errors:', validation.error)
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix validation errors before submitting"
      })
      return
    }

    // Save the data
    // saveEquipmentMutation.mutate(data)
    const lineMaintenancesId = existingData?.lineMaintenance.id
    if (lineMaintenancesId === undefined) {
      toast({
        variant: "destructive",
        title: "line Maintenances Id",
        description: "lineMaintenances Id is required"
      })
      return
    }
    try {
      const result = await updateEquipment(lineMaintenancesId, data.equipments)
      console.log('Update result:', result)
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  // Handle back step
  const handleOnBackStep = () => {
    onBackStep()
  }

  // Add new equipment
  const handleAddEquipment = () => {
    const currentEquipments = form.getValues('equipments')
    if (currentEquipments.length >= 20) {
      toast({
        variant: "destructive",
        title: "Maximum Limit Reached",
        description: "Maximum 20 equipment entries allowed"
      })
      return
    }

    form.setValue('equipments', [
      ...currentEquipments,
      { ...defaultEquipment }
    ])

    toast({
      variant: "success",
      title: "Equipment Added",
      description: "New equipment entry has been added"
    })
  }

  // Remove equipment
  const handleRemoveEquipment = (index: number) => {
    const currentEquipments = form.getValues('equipments')
    if (currentEquipments.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least one equipment entry is required"
      })
      return
    }

    const updatedEquipments = currentEquipments.filter((_, i) => i !== index)
    form.setValue('equipments', updatedEquipments)

    toast({
      variant: "success",
      title: "Equipment Removed",
      description: "Equipment entry has been removed successfully"
    })
  }

  // Save as draft
  // const handleSaveDraft = () => {
  //   const data = form.getValues()
  //   onUpdateData(mapEquipmentFormToApiData(data))
  //   toast.success('Draft saved')
  // }

  // Reset form
  const resetMutation = () => {
    reset()
  }

  return {
    // Form handlers
    handleSubmit,
    handleOnBackStep,
    handleAddEquipment,
    handleRemoveEquipment,
    // handleSaveDraft,

    // Mutation states
    // isSubmitting: saveEquipmentMutation.isPending,
    // isSubmitSuccess: saveEquipmentMutation.isSuccess,
    // isSubmitError: saveEquipmentMutation.isError,
    // submitError: saveEquipmentMutation.error,
    resetMutation
  }
}

export default useEquipmentSubmission
