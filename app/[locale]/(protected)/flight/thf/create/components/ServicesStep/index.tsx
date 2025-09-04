"use client"

import React, { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useStep } from "../step-context"
import { FormActions, StatusMessages } from "../shared"

// Import modular components
import { ServicesFormInputs } from './types'
import { servicesFormSchema } from './schema'
import { getDefaultValues, mapDataThfToServicesStep } from './utils'
import { useServicesSubmission } from './useServicesSubmission'
import {
  AircraftChecksSection,
  AdditionalDefectsSection,
  PersonnelSection
} from './FormSections'
import { FluidSection, OperationalSections } from './FluidSection'
import { LineMaintenanceThfResponse } from "@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId"
import { useLineMaintenancesQueryThfByFlightId } from "@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId"
import { useSearchParams } from "next/navigation"
import { useAircraftCheckMasterData } from '@/lib/api/hooks/useAircraftCheckMasterData'
import CardContentStep from "../CardContentStep"

/**
 * Props for ServicesStep component
 */
interface ServicesStepProps {
  initialData?: LineMaintenanceThfResponse | null
}

/**
 * Services Step component for THF form
 * Handles aircraft checks, defects, fluid servicing, personnel, and operational data
 */

const ServicesStep: React.FC<ServicesStepProps> = ({
  initialData
}) => {
  const searchParams = useSearchParams()

  const flightId = searchParams.get('flightId') ? parseInt(searchParams.get('flightId')!) : null

  const { goNext, onSave, goBack } = useStep()

  // Get aircraft check master data
  const { checkTypes, isLoadingCheckTypes, checkTypesError } = useAircraftCheckMasterData()

  const {
    isLoading: loadingFlight,
    error: flightError,
    formData: existingFlightData,
    aircraftData,
    data
  } = useLineMaintenancesQueryThfByFlightId({ flightId });

  // Memoize default values to prevent unnecessary re-calculations
  const memoizedDefaultValues = useMemo(() => {
    return getDefaultValues(checkTypes)
  }, [checkTypes])

  // Don't render form until we have aircraft check types data
  const isDataReady = !isLoadingCheckTypes && !checkTypesError

  // Memoize transformed data to prevent unnecessary re-calculations
  const transformedData = useMemo(() => {
    console.log('ServicesStep: Calculating transformed data')

    if (data) {
      return mapDataThfToServicesStep(data)
    } else if (initialData) {
      return mapDataThfToServicesStep(initialData)
    }
    return null
  }, [data, initialData])

  // Initialize form with validation
  const form = useForm<ServicesFormInputs>({
    resolver: zodResolver(servicesFormSchema),
    defaultValues: memoizedDefaultValues,
    mode: "onChange",
  })

  // Console log form errors for debugging
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log('🔴 ServicesStep Form Errors:', form.formState.errors)
    }
  }, [form.formState.errors])

  // Console log form values for debugging
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        console.log('📝 Form field changed:', { name, value: value[name as keyof ServicesFormInputs] })
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Custom submission hook
  const handleOnSave = () => { onSave }
  const {
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
    handleOnBackStep,
    // Mutation states for loading and feedback
    isSubmitting,
    isSubmitSuccess,
    isSubmitError,
    submitError,
    resetMutation
  } = useServicesSubmission({
    form,
    onNextStep: goNext,
    onBackStep: goBack,
    onUpdateData: handleOnSave,
    existingFlightData: data
  })

  // Load initial data if provided
  useEffect(() => {
    if (transformedData) {
      // console.log('ServicesStep: Using transformed data', transformedData)
      form.reset(transformedData)
      console.log('ServicesStep: Form reset completed')

      // // Log form state after reset
      // setTimeout(() => {
      //   console.log('📊 Form state after reset:', {
      //     values: form.getValues(),
      //     errors: form.formState.errors,
      //     isValid: form.formState.isValid,
      //     isDirty: form.formState.isDirty
      //   })
      // }, 100)
    } else if (!loadingFlight && !flightError) {
      console.log('ServicesStep: No data available, using default values')
      form.reset(memoizedDefaultValues)

      // // Log form state after default reset
      // setTimeout(() => {
      //   console.log('📊 Form state after default reset:', {
      //     values: form.getValues(),
      //     errors: form.formState.errors,
      //     isValid: form.formState.isValid,
      //     isDirty: form.formState.isDirty
      //   })
      // }, 100)
    }
  }, [transformedData, loadingFlight, flightError, form, memoizedDefaultValues])

  return (

    <CardContentStep
      stepNumber={2}
      title={"Services Information"}
      description={"Manage aircraft checks, defect rectification, fluid servicing, personnel assignments, and operational activities for maintenance procedures"}
    >
      {(loadingFlight || isLoadingCheckTypes) && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">
            {loadingFlight ? 'Loading services data...' : 'Loading aircraft check types...'}
          </span>
        </div>
      )}

      {(flightError || checkTypesError) && (
        <StatusMessages
          isError={true}
          errorTitle="Error loading data"
          errorMessage={flightError?.message || checkTypesError?.message || 'Failed to load required information'}
        />
      )}

      {isDataReady && !loadingFlight && !flightError && (
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

            {/* Data Source Information */}
            {data && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <div className="text-xs text-blue-600">
                  Data source: Flight ID {flightId}
                  {data.responseData?.lineMaintenance?.thfNumber &&
                    ` | THF: ${data.responseData.lineMaintenance.thfNumber}`
                  }
                </div>
              </div>
            )}

            {/* Aircraft Checks Section */}
            <AircraftChecksSection
              form={form}
              onAdd={handleAddAircraftCheck}
              onRemove={handleRemoveAircraftCheck}
            />

            <Separator />

            {/* Additional Defects Section */}
            <AdditionalDefectsSection
              form={form}
              onAdd={handleAddDefect}
              onRemove={handleRemoveDefect}
            />

            <Separator />

            {/* Fluid Section */}
            <FluidSection
              form={form}
              onAddEngineOilSet={handleAddEngineOilSet}
              onRemoveEngineOilSet={handleRemoveEngineOilSet}
              acType={data?.responseData?.flight?.acTypeObj?.code || existingFlightData?.acTypeCode?.value}
            />

            <Separator />

            {/* Personnel Section */}
            <PersonnelSection
              form={form}
              onAdd={handleAddPersonnel}
              onRemove={handleRemovePersonnel}
            />

            <Separator />

            {/* Operational Sections */}
            <OperationalSections
              form={form}
              // onAddFlightDeckInfo={handleAddFlightDeckInfo}
              // onRemoveFlightDeckInfo={handleRemoveFlightDeckInfo}
              onAddTowingInfo={handleAddTowingInfo}
              onRemoveTowingInfo={handleRemoveTowingInfo}
            />

            {/* Form Actions */}
            <FormActions
              onBack={handleOnBackStep}
              onReset={() => {
                // Reset to original transformed data if available, otherwise use defaults
                if (transformedData) {
                  console.log('Reset to original transformed data')
                  form.reset(transformedData)
                } else {
                  console.log('Reset to default values')
                  form.reset(memoizedDefaultValues)
                }
              }}
              onSubmit={() => form.handleSubmit(handleSubmit)()}
              backText="← Back to flight"
              submitText="Next Step →"
              resetText="Reset"
              isSubmitting={isSubmitting}
              disableBack={isSubmitting}
              disableSubmit={isSubmitting || loadingFlight}
              disableReset={isSubmitting}
              showReset={true}
            />

            {/* Submission Status Messages */}
            {isSubmitError && submitError && (
              <StatusMessages
                isError={true}
                errorTitle="Submission Error"
                errorMessage={submitError.message || 'Failed to save services data. Please try again.'}
                onDismissError={resetMutation}
              />
            )}

            {isSubmitSuccess && (
              <StatusMessages
                isSuccess={true}
                successTitle="Services Saved Successfully"
                successMessage="Your services data has been saved and you can proceed to the next step."
              />
            )}
          </form>
        </Form>
      )}
    </CardContentStep>

  )
}

export default ServicesStep
