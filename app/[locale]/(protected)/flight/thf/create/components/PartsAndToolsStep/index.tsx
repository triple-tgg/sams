'use client'

import React, { useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Plus } from 'lucide-react'

import { useStep } from '../step-context'
import { StatusMessages } from '../shared'
import { PartsToolsTable } from './PartsToolsTable'

// Types and utilities
import { PartsToolsFormInputs, defaultPartToolItem } from './types'
import { partsToolsFormSchema } from './schema'
import { getDefaultValues, mapDataThfToPartsToolsStep } from './utils'
import { usePartsToolsSubmission } from './usePartsToolsSubmission'

import { FlightFormData } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { formatFromPicker } from '@/lib/utils/formatPicker'
import { dateTimeUtils } from '@/lib/dayjs'
import dayjs from 'dayjs'

interface PartsAndToolsStepProps {
  infoData: FlightFormData | null
  initialData?: LineMaintenanceThfResponse | null
  flightInfosId?: number | null
  lineMaintenanceId?: number | null
  flightError?: Error | null
  loading?: boolean
}

/**
 * Parts & Tools Step component for THF modal
 * Matches Equipment step layout: table-based inline editing with toggle, empty state, add/remove
 */
const PartsAndToolsStep: React.FC<PartsAndToolsStepProps> = ({
  infoData,
  initialData,
  flightInfosId,
  lineMaintenanceId,
  flightError,
  loading
}) => {
  const { goNext, goBack, onSave, setSubmitHandler, setIsSubmitting } = useStep()

  // Memoize default values
  const memoizedDefaultValues = useMemo(() => getDefaultValues(), [])

  // Transform existing API data for form
  const transformedData = useMemo(() => {
    if (!initialData) return null
    return mapDataThfToPartsToolsStep(initialData)
  }, [initialData])

  // Initialize form
  const form = useForm<PartsToolsFormInputs>({
    resolver: zodResolver(partsToolsFormSchema),
    defaultValues: transformedData || memoizedDefaultValues,
    mode: 'onChange',
  })

  // Field array for add/remove
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'partsTools',
  })

  // Watch partsTools for state checks
  const partsTools = form.watch('partsTools')

  // Add new item with flight info defaults
  const handleAddItem = () => {
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

    append({
      ...defaultPartToolItem,
      formDate: formatFromPicker(resolvedFromDate),
      formTime: resolvedFromTime,
      toDate: formatFromPicker(resolvedToDate),
      toTime: resolvedToTime
    })
  }

  // Remove item
  const handleRemoveItem = (index: number) => {
    remove(index)
  }

  // Use parts/tools submission hook
  const {
    handleSubmit,
    handleSaveDraft,
    handleOnBackStep,
    isSubmitting: isSubmittingMutation,
    isSubmitSuccess,
    isSubmitError,
    submitError,
    resetMutation,
    hasLineMaintenanceId,
  } = usePartsToolsSubmission({
    form,
    onNextStep: goNext,
    onBackStep: goBack,
    onUpdateData: () => onSave({}),
    existingFlightData: initialData,
    lineMaintenanceId: lineMaintenanceId || 0,
  })

  // Load initial data when available
  useEffect(() => {
    if (transformedData && transformedData.partsTools.length > 0) {
      form.reset(transformedData)
    } else {
      form.reset(memoizedDefaultValues)
    }
  }, [transformedData, form, memoizedDefaultValues])

  // Register submit handler for modal wrapper's "Next Step" button
  useEffect(() => {
    if (setSubmitHandler) {
      setSubmitHandler(() => {
        form.handleSubmit(
          (data) => {
            handleSubmit(data)
          },
          (errors) => {
            console.log('Parts/Tools validation errors:', errors)
          }
        )()
      })
    }
  }, [setSubmitHandler, form, handleSubmit])

  // Sync submitting state with modal wrapper
  useEffect(() => {
    if (setIsSubmitting) {
      setIsSubmitting(isSubmittingMutation)
    }
  }, [isSubmittingMutation, setIsSubmitting])

  // Computed states
  const hasPartsTools = partsTools && partsTools.length > 0
  const canAddMore = (partsTools?.length || 0) < 20

  // Get form errors for display
  const formErrors = form.formState.errors

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Parts/Tools Table (when items exist) */}
        {hasPartsTools && (
          <PartsToolsTable
            control={form.control}
            watch={form.watch}
            setValue={form.setValue}
            register={form.register}
            errors={form.formState.errors}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            canAddMore={canAddMore}
          />
        )}

        {/* No Parts/Tools - Empty State (matches Equipment empty state) */}
        {!hasPartsTools && (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Parts & Tools
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md">
                Add parts and tools used during this maintenance activity
              </p>
              <Button
                type="button"
                onClick={handleAddItem}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Parts/Tools
              </Button>
            </div>
          </div>
        )}

        {/* Validation Errors Summary */}
        {Object.keys(formErrors).length > 0 && formErrors.partsTools && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Please fix the following errors:
                  </p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {typeof formErrors.partsTools?.message === 'string' && (
                      <li>{formErrors.partsTools.message}</li>
                    )}
                    {formErrors.partsTools?.root?.message && (
                      <li>{formErrors.partsTools.root.message}</li>
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
            errorTitle="Error Saving Parts/Tools"
            errorMessage={submitError.message || 'Failed to save parts/tools data. Please try again.'}
            onDismissError={resetMutation}
          />
        )}

        {isSubmitSuccess && (
          <StatusMessages
            isSuccess={true}
            successTitle="Parts/Tools Saved Successfully"
            successMessage="Your parts/tools data has been saved."
          />
        )}
      </form>
    </Form>
  )
}

export default PartsAndToolsStep
