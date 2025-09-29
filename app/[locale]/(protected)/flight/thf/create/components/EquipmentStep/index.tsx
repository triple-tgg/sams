'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Plus } from 'lucide-react'
import { useStep } from '../step-context'
import { FormActions, StatusMessages } from '../shared'

// Import modular components and utilities
import { EquipmentFormData, EquipmentStepProps } from './types'
import { equipmentFormSchema } from './schema'
import { getDefaultValues, mapApiDataToEquipmentForm } from './utils'
import { EquipmentCard } from './EquipmentCard'
import { useEquipmentSubmission } from './useEquipmentSubmission'
import { usePutEquipmentWithLoading } from '@/lib/api/hooks/usePutEquipment'
import { toast } from '@/components/ui/use-toast'
import CardContentStep from '../CardContentStep'

export default function EquipmentStep(props: EquipmentStepProps) {
  const { goNext, goBack, onSave } = useStep()

  // Initialize form with validation
  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: props.initialData ? mapApiDataToEquipmentForm(props.initialData) : getDefaultValues(),
    mode: "onChange",
  })
  const {
    updateEquipment,
    isLoading,
    isSuccess,
    isError,
    error,
    reset
  } = usePutEquipmentWithLoading({
    showToast: true, // แสดง toast notifications
    onSuccess: () => {
      // Custom success handling
      goNext()
      toast({
        variant: "success",
        title: "Equipment Saved",
        description: "Equipment saved successfully!",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to save Equipment",
        description: error?.message || "An error occurred while saving Equipment data.",
      });
    }
  })
  // Custom submission hook
  const {
    handleSubmit,
    handleOnBackStep,
    handleAddEquipment,
    handleRemoveEquipment,
    resetMutation
  } = useEquipmentSubmission({
    form,
    onNextStep: goNext,
    onBackStep: goBack,
    onUpdateData: onSave,
    updateEquipment: updateEquipment,
    reset: reset,
    lineMaintenanceId: props.lineMaintenanceId
  })

  // Load initial data if provided
  // useEffect(() => {
  //   if (props.initialData) {
  //     console.log('EquipmentStep: Loading initial data', mapApiDataToEquipmentForm(props.initialData))
  //     form.reset(mapApiDataToEquipmentForm(props.initialData))
  //   }
  // }, [props.initialData, form])

  // Console log form errors for debugging
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log('🔴 EquipmentStep Form Errors:', form.formState.errors)
    }
  }, [form.formState.errors])

  const equipments = form.watch('equipments')

  return (
    <CardContentStep
      stepNumber={3}
      title={"Equipment Information"}
      description={"  Manage equipment usage, tracking, and operational details for maintenance activities"}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Equipment Summary */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Equipment Entries</h3>
                  <p className="text-sm text-gray-600">
                    {equipments?.length || 0} of 20 maximum entries
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {equipments?.length || 0}/20
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Cards */}
          <div className="space-y-6">
            {equipments?.map((_, index) => {
              const hasEquipmentErrors = form.formState.errors.equipments?.[index]
              return (
                <div key={index} className="relative">
                  <div className={`absolute left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shadow-lg z-10 text-white ${hasEquipmentErrors ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                    {hasEquipmentErrors ? '!' : index + 1}
                  </div>
                  <EquipmentCard
                    index={index}
                    control={form.control}
                    register={form.register}
                    watch={form.watch}
                    setValue={form.setValue}
                    onRemove={handleRemoveEquipment}
                    canRemove={equipments.length > 1}
                    errors={form.formState.errors}
                  />
                </div>
              )
            })}
          </div>

          {/* Add Equipment Button */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddEquipment}
              disabled={isLoading || equipments?.length >= 20}
              className="px-8 py-3 h-auto border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New Equipment
              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                {equipments?.length || 0}/20
              </span>
            </Button>
            {equipments?.length >= 20 && (
              <p className="text-sm text-gray-500 mt-2">Maximum equipment entries reached</p>
            )}
          </div>

          {/* Form Actions */}
          <FormActions
            onBack={handleOnBackStep}
            onReset={() => {
              console.log('Reset to default values')
              form.reset(getDefaultValues())
            }}
            onSubmit={() => form.handleSubmit(handleSubmit)()}
            backText="← Back to Services"
            submitText="Next Step →"
            resetText="Reset"
            isSubmitting={isLoading}
            disableBack={isLoading}
            disableSubmit={isLoading}
            disableReset={isLoading}
            showReset={true}
          />

          {/* Submission Status Messages */}
          {isError && error && (
            <StatusMessages
              isError={true}
              errorTitle="Unable to Save Equipment Data"
              errorMessage={error.message || 'An error occurred while saving your equipment information. Please check your entries and try again.'}
              onDismissError={reset}
            />
          )}

          {isSuccess && (
            <StatusMessages
              isSuccess={true}
              successTitle="Equipment Data Saved Successfully"
              successMessage="Your equipment information has been securely saved. You can now proceed to the next step of the maintenance process."
            />
          )}
        </form>
      </Form>
    </CardContentStep >
  )
}