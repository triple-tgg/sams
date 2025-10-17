"use client"

import React, { useEffect, useMemo } from "react"
import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { FormActions, StatusMessages } from "../shared"
import {
  AircraftChecksSection,
  AdditionalDefectsSection,
  PersonnelSection
} from './FormSections'
import { FluidSection, OperationalSections } from './FluidSection'
import CardContentStep from "../CardContentStep"
import { LineMaintenanceThfResponse } from "@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId"
import { FlightFormData } from "@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ServicesFormInputs } from "./types"
import { useServicesSubmission } from './useServicesSubmission'
import { servicesFormSchema } from "./schema"
import { useStep } from "../step-context"
import { useAircraftCheckMasterData } from '@/lib/api/hooks/useAircraftCheckMasterData'
import { useSearchParams } from "next/navigation"
import { getDefaultValues } from "./utils"
import { AircraftCheckSubType, AircraftCheckType } from "@/lib/api/master/aircraft-check-types/airlines.interface"
import { StaffTypeOption } from "@/lib/api/hooks/useStaffsTypes"

// Determine if all required data is loaded
const isDataReady = (loading: boolean, error: Error | null, checkTypesLoading: boolean, checkTypesError: Error | null) => {
  return !loading && !error && !checkTypesLoading && !checkTypesError
}

/**
 * Props for CardForm component
 */

interface Props {
  initialData?: ServicesFormInputs | null
  flightInfosId: number | null
  formData: FlightFormData | null;
  loading: boolean;
  flightError: Error | null;
  acType?: string;
  lineMaintenanceId: number | null;
  checkSubTypesValuesOption: {
    checkSubTypes: AircraftCheckSubType[];
    isLoadingCheckSubTypes: boolean;
    checkSubTypesError: Error | null;
  };
  checkTypesValuesOption: {
    checkTypes: AircraftCheckType[];
    isLoadingCheckTypes: boolean;
    checkTypesError: Error | null;
  };
  staffsTypesValuesOptions: {
    staffsTypesOptions: StaffTypeOption[];
    isLoadingStaffsTypes: boolean;
    staffsTypesError: Error | null;
    hasOptionsStaffsTypes: boolean;
  };
}

const CardFormServicesStep = (props: Props) => {
  // Initialize form with validation
  const { goNext, onSave, goBack } = useStep()

  // const isDataReady = !isLoadingCheckTypes && !checkTypesError



  const form = useForm<ServicesFormInputs>({
    resolver: zodResolver(servicesFormSchema),
    defaultValues: props.initialData || getDefaultValues([]),
    mode: "onChange",
  })
  useEffect(() => {
    if (props.initialData) {
      // console.log('ServicesStep: Using transformed data', transformedData)
      form.reset(props.initialData)
    }
  }, [form, props.initialData])

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
        console.log("value", value)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])
  // Custom submission hook
  const handleOnSave = () => { onSave }
  const {
    handleSubmit,
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
    formData: props.formData,
    existingFlightData: props.initialData,
    lineMaintenanceId: props.lineMaintenanceId
  })


  return (

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

        {/* Aircraft Checks Section */}
        <AircraftChecksSection
          form={form}
          onAdd={handleAddAircraftCheck}
          onRemove={handleRemoveAircraftCheck}

          checkTypes={props.checkTypesValuesOption?.checkTypes}
          checkSubTypes={props.checkSubTypesValuesOption?.checkSubTypes}

          isLoadingCheckTypes={props.checkTypesValuesOption?.isLoadingCheckTypes}
          isLoadingCheckSubTypes={props.checkSubTypesValuesOption?.isLoadingCheckSubTypes}
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
          acType={props.formData?.acTypeCode?.value || undefined}
        />

        <Separator />

        {/* Personnel Section */}
        <PersonnelSection
          form={form}
          onAdd={handleAddPersonnel}
          onRemove={handleRemovePersonnel}
          staffsTypesValuesOptions={props.staffsTypesValuesOptions}
          infoData={props.formData}
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
            if (props.initialData) {
              console.log('Reset to original transformed data')
              form.reset(props.initialData)
            }
          }}
          onSubmit={() => form.handleSubmit(handleSubmit)()}
          backText="← Back to flight"
          submitText="Next Step →"
          resetText="Reset"
          isSubmitting={isSubmitting}
          disableBack={isSubmitting}
          disableSubmit={isSubmitting || props.loading}
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
  )
}

export default CardFormServicesStep