"use client"

import React, { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "@/components/ui/form"
import { useStep } from "../step-context"
import { FormActions, StatusMessages } from "../shared"

// Import modular components
import { PartsToolsFormInputs } from './types'
import { partsToolsFormSchema } from './schema'
import { getDefaultValues, mapDataThfToPartsToolsStep } from './utils'
import { usePartsToolsSubmission } from './usePartsToolsSubmission'
import { PartsToolsCard } from './PartsToolsCard'
import { LineMaintenanceThfResponse } from "@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId"
import CardContentStep from "../CardContentStep"

/**
 * Props for PartsAndToolsStep component
 */
interface PartsAndToolsStepProps {
  initialData?: LineMaintenanceThfResponse | null;
  flightInfosId?: number | null;
  lineMaintenanceId?: number | null;
  flightError?: Error | null;
  loading?: boolean;
}

const PartsAndToolsStep: React.FC<PartsAndToolsStepProps> = (props) => {

  const { goNext, onSave, goBack } = useStep()

  // Memoize default values to prevent unnecessary re-calculations
  const memoizedDefaultValues = useMemo(() => {
    return props.initialData ? mapDataThfToPartsToolsStep(props.initialData) : getDefaultValues()
  }, [props.initialData])

  // Initialize form with validation
  const form = useForm<PartsToolsFormInputs>({
    resolver: zodResolver(partsToolsFormSchema),
    defaultValues: memoizedDefaultValues,
    mode: "onChange",
  })

  // Console log form errors for debugging
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log('🔴 PartsAndToolsStep Form Errors:', form.formState.errors)
    }
  }, [form.formState.errors])

  // Console log form values for debugging
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        console.log('📝 Form field changed:', { name, value: value[name as keyof PartsToolsFormInputs] })
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Custom submission hook
  const handleOnSave = () => { onSave }
  const {
    handleSubmit,
    handleSaveDraft,
    handleOnBackStep,
    // Mutation states for loading and feedback
    isSubmitting,
    isSubmitSuccess,
    isSubmitError,
    submitError,
    resetMutation,
    hasLineMaintenanceId,
    lineMaintenanceId
  } = usePartsToolsSubmission({
    form,
    onNextStep: goNext,
    onBackStep: goBack,
    onUpdateData: handleOnSave,
    existingFlightData: props.initialData,
    lineMaintenanceId: props.lineMaintenanceId || 0
  })

  return (

    <CardContentStep
      stepNumber={4}
      title={"Parts & Tools Information"}
      description={"Manage parts and tools usage, tracking, and operational details for maintenance activities"}
    >
      {props.loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading parts & tools data...</span>
        </div>
      )}

      {props.flightError && (
        <StatusMessages
          isError={true}
          errorTitle="Error loading data"
          errorMessage={props.flightError.message || 'Failed to load parts & tools information'}
        />
      )}

      {!hasLineMaintenanceId && !props.loading && (
        <StatusMessages
          isWarning={true}
          warningTitle="Line Maintenance ID Missing"
          warningMessage="Line maintenance information is required to save parts & tools data."
        />
      )}

      {!props.loading && !props.flightError && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Form Validation Debug Info */}
            {process.env.NODE_ENV === 'development' && Object.keys(form.formState.errors).length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Form Validation Errors (Debug):</h4>
                <pre className="text-xs text-yellow-700 overflow-auto max-h-32">
                  {JSON.stringify(form.formState.errors, null, 2)}
                </pre>
              </div>
            )}
            {/* Parts & Tools Card */}
            <PartsToolsCard form={form} />

            {/* Form Actions */}
            <FormActions
              onBack={handleOnBackStep}
              onReset={() => {
                form.reset(memoizedDefaultValues)
              }}
              onSubmit={() => form.handleSubmit(handleSubmit)()}
              backText="← Back to Equipment"
              submitText={isSubmitting ? 'Saving...' : 'Next Step →'}
              resetText="Reset"
              isSubmitting={isSubmitting}
              disableBack={isSubmitting}
              disableSubmit={isSubmitting || !hasLineMaintenanceId}
              disableReset={isSubmitting}
              showReset={true}
            />

            {/* Status Messages */}
            {isSubmitError && submitError && (
              <StatusMessages
                isError={true}
                errorTitle="Error Saving Parts & Tools"
                errorMessage={submitError.message || 'Failed to save parts & tools data. Please try again.'}
                onDismissError={resetMutation}
              />
            )}

            {isSubmitSuccess && (
              <StatusMessages
                isSuccess={true}
                successTitle="Parts & Tools Saved Successfully"
                successMessage="Your parts & tools data has been saved and you can proceed to the next step."
              />
            )}
          </form>
        </Form>
      )}
    </CardContentStep>
  )
}

export default PartsAndToolsStep
