'use client'

import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, AlertCircle } from 'lucide-react'

import { useStep } from '../step-context'
import { StatusMessages } from '../shared'
import { EquipmentTable } from './EquipmentTable'

// Types and utilities
import { EquipmentFormData, EquipmentStepProps, defaultEquipment } from './types'
import { equipmentFormSchema } from './schema'
import { getDefaultValues, mapApiDataToEquipmentForm } from './utils'
import { useEquipmentSubmission } from './useEquipmentSubmission'
import { usePutEquipmentWithLoading } from '@/lib/api/hooks/usePutEquipment'

/**
 * Equipment Step component for THF form
 * Manages equipment entries with searchable dropdown, toggle switches, and date/time validation
 */
export default function EquipmentStep({
  initialData,
  flightInfosId,
  lineMaintenanceId,
  infoData
}: EquipmentStepProps) {
  const { goNext, goBack, onSave } = useStep()

  // Memoize default values
  const memoizedDefaultValues = useMemo(() => getDefaultValues(), [])

  // Transform existing data for form
  const transformedData = useMemo(() => {
    if (!initialData || initialData.length === 0) return null
    return mapApiDataToEquipmentForm(initialData)
  }, [initialData])

  // Initialize form
  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: transformedData || memoizedDefaultValues,
    mode: 'onChange',
  })

  // Watch equipments array for enable/disable toggle sync
  const equipments = form.watch('equipments')

  // API mutation hook
  const {
    updateEquipment,
    isLoading: isSubmitting,
    isSuccess: isSubmitSuccess,
    isError: isSubmitError,
    error: submitError,
    reset: resetMutation
  } = usePutEquipmentWithLoading({
    showToast: true,
    onSuccess: () => {
      onSave({})
      goNext()
    },
    onError: (error) => {
      console.error('Failed to save equipment:', error)
    }
  })

  // Use equipment submission hook
  const {
    handleSubmit,
    handleOnBackStep,
    handleAddEquipment,
    handleRemoveEquipment,
    resetMutation: resetSubmissionState
  } = useEquipmentSubmission({
    form,
    onNextStep: goNext,
    onBackStep: goBack,
    onUpdateData: onSave,
    updateEquipment,
    reset: () => {
      form.reset(memoizedDefaultValues)
    },
    lineMaintenanceId,
    infoData
  })


  // Load initial data when available
  useEffect(() => {
    if (transformedData && transformedData.equipments.length > 0) {
      form.reset(transformedData)
    } else {
      form.reset(memoizedDefaultValues)
    }
  }, [transformedData, form, memoizedDefaultValues])

  // Computed states
  const hasLineMaintenanceId = !!lineMaintenanceId
  const hasEquipments = equipments && equipments.length > 0
  const canAddMore = equipments.length < 20
  const canSubmit = hasLineMaintenanceId && form.formState.isValid && !isSubmitting

  // Get form errors for display
  const formErrors = form.formState.errors

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Equipment Table */}
        {hasEquipments && (
          <EquipmentTable
            control={form.control}
            watch={form.watch}
            setValue={form.setValue}
            onAddEquipment={handleAddEquipment}
            onRemoveEquipment={handleRemoveEquipment}
            canAddMore={canAddMore}
          />
        )}

        {/* No Equipment - Empty State */}
        {!hasEquipments && (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-12">
            <div className="flex flex-col items-center justify-center text-center">
              {/* Plus Icon in Circle */}
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-blue-500" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Equipment
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-6 max-w-md">
                Add equipment used during this maintenance activity
              </p>

              {/* Add Button */}
              <Button
                type="button"
                onClick={handleAddEquipment}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            </div>
          </div>
        )}

        {/* Validation Errors Summary */}
        {Object.keys(formErrors).length > 0 && formErrors.equipments && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Please fix the following errors:
                  </p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {typeof formErrors.equipments?.message === 'string' && (
                      <li>{formErrors.equipments.message}</li>
                    )}
                    {formErrors.equipments?.root?.message && (
                      <li>{formErrors.equipments.root.message}</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Status Messages */}
        {isSubmitError && submitError && (
          <StatusMessages
            isError={true}
            errorTitle="Error Saving Equipment"
            errorMessage={submitError.message || 'Failed to save equipment data. Please try again.'}
            onDismissError={resetMutation}
          />
        )}

        {isSubmitSuccess && (
          <StatusMessages
            isSuccess={true}
            successTitle="Equipment Saved Successfully"
            successMessage="Your equipment data has been saved."
          />
        )}
      </form>
    </Form>
  )
}