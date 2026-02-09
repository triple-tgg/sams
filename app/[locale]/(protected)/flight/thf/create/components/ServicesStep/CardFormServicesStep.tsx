"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { FormActions, StatusMessages } from "../shared"

import { useStep } from "../step-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FlightFormData } from "@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId"
import { StaffTypeOption } from "@/lib/api/hooks/useStaffsTypes"
import { getDefaultValues } from "./utils"
import { ServicesFormInputs } from "./types"
import { servicesFormSchema } from "./schema"
import { useServicesSubmission } from './useServicesSubmission'
import { FluidSection, OperationalSections } from './FluidSection'
import { AircraftCheckSubType, AircraftCheckType } from "@/lib/api/master/aircraft-check-types/airlines.interface"
import { AircraftTypeFlags } from "@/lib/api/master/aircraft-types/getAircraftTypeById"
import PersonnelSection from "./formSection/PersonnelSection"
import AircraftChecksSection from "./formSection/AircraftChecksSection"
import AdditionalDefectsSection from "./formSection/AdditionalDefectsSection"

// Determine if all required data is loaded
const isDataReady = (loading: boolean, error: Error | null, checkTypesLoading: boolean, checkTypesError: Error | null) => {
  return !loading && !error && !checkTypesLoading && !checkTypesError
}

/**
 * Props for CardForm component
 */

interface Props {
  thfNumber: string;
  initialData?: ServicesFormInputs | null
  flightInfosId: number | null
  formData: FlightFormData | null;
  loading: boolean;
  flightError: Error | null;
  acType?: string;
  lineMaintenanceId: number | null;
  aircraftTypeFlags?: AircraftTypeFlags | null;
  isLoadingAircraftTypeFlags?: boolean;
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
  const { goNext, onSave, goBack, isModal, setSubmitHandler, setIsSubmitting } = useStep()

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
  }, [form])

  // Auto-set servicingPerformed and initialize fluid sets when aircraft type flags load
  useEffect(() => {
    const flags = props.aircraftTypeFlags
    if (!flags) return
    const hasAnyFlag =
      flags.engineCount > 0 ||
      flags.csdCount > 0 ||
      flags.flagHydrolicGreen ||
      flags.flagHydrolicBlue ||
      flags.flagHydrolicYellow ||
      flags.flagApu
    if (hasAnyFlag) {
      form.setValue('servicingPerformed', true)

      // Auto-initialize Engine Oil sets to match flag count
      const currentEngSets = form.getValues('fluid.engOilSets')
      if (flags.engineCount > 0 && (!currentEngSets || currentEngSets.length === 0)) {
        const engSets = Array.from({ length: flags.engineCount }, () => ({ left: 0, right: 0 }))
        form.setValue('fluid.engOilSets', engSets)
      }

      // Auto-initialize CSD/IDG/VSFG sets to match flag count
      const currentCsdSets = form.getValues('fluid.csdIdgVsfgSets')
      if (flags.csdCount > 0 && (!currentCsdSets || currentCsdSets.length === 0)) {
        const csdSets = Array.from({ length: flags.csdCount }, () => ({ quantity: 0 }))
        form.setValue('fluid.csdIdgVsfgSets', csdSets)
      }
    }
  }, [props.aircraftTypeFlags, form])

  // Flag-based validation: check required fluid fields before submission
  const validateAircraftTypeFlags = useCallback((): boolean => {
    const flags = props.aircraftTypeFlags
    if (!flags) return true // No flags = skip validation

    const servicingPerformed = form.getValues('servicingPerformed')
    if (!servicingPerformed) return true // Servicing not enabled = skip

    let isValid = true

    // Validate Engine Oil sets
    if (flags.engineCount > 0) {
      const engSets = form.getValues('fluid.engOilSets')
      if (!engSets || engSets.length < flags.engineCount) {
        form.setError('fluid.engOilSets', {
          type: 'manual',
          message: `At least ${flags.engineCount} engine oil set(s) required for this aircraft type`,
        })
        isValid = false
      }
    }

    // Validate CSD/IDG/VSFG sets
    if (flags.csdCount > 0) {
      const csdSets = form.getValues('fluid.csdIdgVsfgSets')
      if (!csdSets || csdSets.length < flags.csdCount) {
        form.setError('fluid.csdIdgVsfgSets', {
          type: 'manual',
          message: `At least ${flags.csdCount} CSD/IDG/VSFG set(s) required for this aircraft type`,
        })
        isValid = false
      }
    }

    // Validate Hydraulic oils
    if (flags.flagHydrolicBlue) {
      const val = form.getValues('fluid.hydOilBlue')
      if (val === undefined || val === null) {
        form.setError('fluid.hydOilBlue', { type: 'manual', message: 'Hyd Oil Blue is required' })
        isValid = false
      }
    }
    if (flags.flagHydrolicGreen) {
      const val = form.getValues('fluid.hydOilGreen')
      if (val === undefined || val === null) {
        form.setError('fluid.hydOilGreen', { type: 'manual', message: 'Hyd Oil Green is required' })
        isValid = false
      }
    }
    if (flags.flagHydrolicYellow) {
      const val = form.getValues('fluid.hydOilYellow')
      if (val === undefined || val === null) {
        form.setError('fluid.hydOilYellow', { type: 'manual', message: 'Hyd Oil Yellow is required' })
        isValid = false
      }
    }

    // Validate APU Oil
    if (flags.flagApu) {
      const val = form.getValues('fluid.apuOil')
      if (val === undefined || val === null) {
        form.setError('fluid.apuOil', { type: 'manual', message: 'APU Oil is required' })
        isValid = false
      }
    }

    return isValid
  }, [props.aircraftTypeFlags, form])

  // Wrapper: validate flags then run form submission
  const handleSubmitWithFlagValidation = useCallback(() => {
    // Clear previous manual errors first
    form.clearErrors([
      'fluid.engOilSets', 'fluid.csdIdgVsfgSets',
      'fluid.hydOilBlue', 'fluid.hydOilGreen', 'fluid.hydOilYellow',
      'fluid.apuOil'
    ])
    const flagsValid = validateAircraftTypeFlags()
    if (!flagsValid) {
      // Auto-focus the first errored field after React re-renders with errors
      setTimeout(() => {
        const errorFieldOrder = [
          'fluid.engOilSets', 'fluid.csdIdgVsfgSets',
          'fluid.hydOilBlue', 'fluid.hydOilGreen', 'fluid.hydOilYellow',
          'fluid.apuOil'
        ]
        for (const fieldName of errorFieldOrder) {
          // Try data-error-field elements (for section-level errors)
          const errorEl = document.querySelector(`[data-error-field="${fieldName}"]`)
          if (errorEl) {
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Try to focus the nearest input in the same section
            const section = errorEl.closest('.space-y-3')
            const input = section?.querySelector('input')
            if (input) input.focus()
            return
          }
          // Try input by name (for individual fields like hydraulic / APU)
          const input = document.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`)
          if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' })
            input.focus()
            return
          }
        }
      }, 100)
      return
    }
    // Proceed with normal Zod validation + submit
    form.handleSubmit((data) => handleSubmitRef.current(data))()
  }, [form, validateAircraftTypeFlags])

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
    handleAddCsdIdgVsfgSet,
    handleRemoveCsdIdgVsfgSet,
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


  // Track if component is mounted to guard against stale mutation state
  const [isMounted, setIsMounted] = useState(false)

  // Reset mutation state on component mount to clear any stale state
  useEffect(() => {
    resetMutation()
    // Small delay to ensure mutation state is fully reset before allowing button interaction
    const timer = setTimeout(() => setIsMounted(true), 100)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Only show isSubmitting after component is properly mounted
  const actualIsSubmitting = isMounted ? isSubmitting : false

  // Register submit handler for Modal Footer
  const handleSubmitRef = React.useRef(handleSubmit)
  handleSubmitRef.current = handleSubmit

  useEffect(() => {
    if (isModal && setSubmitHandler) {
      setSubmitHandler(() => {
        // Trigger flag validation then form validation and submission
        handleSubmitWithFlagValidation()
      })
    }
  }, [isModal, setSubmitHandler, form, props.lineMaintenanceId, handleSubmitWithFlagValidation])

  // Sync submitting state with modal context
  useEffect(() => {
    if (isModal && setIsSubmitting) {
      setIsSubmitting(isSubmitting)
    }
  }, [isModal, setIsSubmitting, isSubmitting])

  return (

    <Form {...form}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmitWithFlagValidation() }} className="space-y-6">

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
          thfNumber={props.thfNumber}
        />

        <Separator />

        {/* Fluid Section */}
        <FluidSection
          form={form}
          onAddEngineOilSet={handleAddEngineOilSet}
          onRemoveEngineOilSet={handleRemoveEngineOilSet}
          onAddCsdIdgVsfgSet={handleAddCsdIdgVsfgSet}
          onRemoveCsdIdgVsfgSet={handleRemoveCsdIdgVsfgSet}
          acType={props.formData?.acTypeCode?.value || undefined}
          aircraftTypeFlags={props.aircraftTypeFlags || null}
          isLoadingFlags={props.isLoadingAircraftTypeFlags || false}
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
        {!isModal && (
          <FormActions
            onBack={handleOnBackStep}
            onReset={() => {
              // Reset to original transformed data if available, otherwise use defaults
              if (props.initialData) {
                console.log('Reset to original transformed data')
                form.reset(props.initialData)
              }
            }}
            onSubmit={() => handleSubmitWithFlagValidation()}
            backText="← Back to flight"
            submitText="Next Step →"
            resetText="Reset"
            isSubmitting={actualIsSubmitting}
            disableBack={actualIsSubmitting}
            disableSubmit={actualIsSubmitting || props.loading || !isMounted}
            disableReset={actualIsSubmitting}
            showReset={true}
          />
        )}

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