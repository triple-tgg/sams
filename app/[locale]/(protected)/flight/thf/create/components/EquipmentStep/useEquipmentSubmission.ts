import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { EquipmentFormData, defaultEquipment } from './types'
import { equipmentFormSchema } from './schema'
import { getDefaultValues, mapEquipmentFormToApiData } from './utils'
import { LineMaintenanceThfData } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { FlightFormData } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { formatFromPicker } from '@/lib/utils/formatPicker'
import { dateTimeUtils } from '@/lib/dayjs'
import dayjs from 'dayjs'

interface UseEquipmentSubmissionProps {
  form: UseFormReturn<EquipmentFormData>
  onNextStep: () => void
  onBackStep: () => void
  onUpdateData: (data: any) => void
  reset: () => void
  updateEquipment: (lineMaintenancesId: number, equipmentData: any[]) => void
  lineMaintenanceId?: number | null
  infoData: FlightFormData | null;
}

export const useEquipmentSubmission = ({
  form,
  onNextStep,
  onBackStep,
  onUpdateData,
  updateEquipment,
  reset,
  lineMaintenanceId,
  infoData,
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
    const validation = equipmentFormSchema.safeParse(data)
    if (!validation.success) {
      // console.error('Validation errors:', validation.error)
      // toast({
      //   variant: "destructive",
      //   title: "Validation Error",
      //   description: "Please fix validation errors before submitting"
      // })
      return
    }

    // Save the data
    // saveEquipmentMutation.mutate(data)
    if (lineMaintenanceId === undefined) {
      toast({
        variant: "destructive",
        title: "line Maintenances Id",
        description: "lineMaintenances Id is required"
      })
      return
    }
    try {
      const result = await updateEquipment(lineMaintenanceId || 0, data.equipments)
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
    // Resolve From defaults
    const resolvedFromDate = infoData?.arrivalDate || dateTimeUtils.getCurrentDate()
    const resolvedFromTime = infoData?.ata || dayjs().format('HH:mm')

    // Resolve To defaults — ensure To is not before From
    let resolvedToDate = infoData?.departureDate || resolvedFromDate
    let resolvedToTime = infoData?.atd || resolvedFromTime

    const fromDT = dayjs(`${resolvedFromDate} ${resolvedFromTime}`, 'YYYY-MM-DD HH:mm')
    const toDT = dayjs(`${resolvedToDate} ${resolvedToTime}`, 'YYYY-MM-DD HH:mm')
    if (toDT.isValid() && fromDT.isValid() && toDT.isBefore(fromDT)) {
      resolvedToDate = resolvedFromDate
      resolvedToTime = resolvedFromTime
    }

    form.setValue('equipments', [
      ...currentEquipments,
      {
        ...defaultEquipment,
        fromDate: formatFromPicker(resolvedFromDate),
        fromTime: resolvedFromTime,
        toDate: formatFromPicker(resolvedToDate),
        toTime: resolvedToTime
      }
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
    if (currentEquipments.length <= 0) {
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
