"use client"

import React, { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { useStep } from "../step-context"
import { FormActions, StatusMessages } from "../shared"

// Import modular components
import { AttachFileFormInputs } from './types'
import { attachFileFormSchema } from './schema'
import { getDefaultValues, mapDataThfToAttachFileStep } from './utils'
import { useAttachFileSubmission } from './useAttachFileSubmission'
import { useAttachFileUpload } from '@/lib/api/hooks/useAttachFileUpload'
import { FileUploadCard, FileDropZone } from './FileUploadComponents'
import { useLineMaintenancesQueryThfByFlightId } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import CardContentStep from '../CardContentStep'
import { LineMaintenanceThfResponse } from "@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId"
import FlightTimeCard from "./FlightTimeCard"
import { formatForDisplay, formatFromPicker } from "@/lib/utils/formatPicker"

/**
 * AttachFile Step component for THF form
 * Handles file attachment and upload functionality
 */
type Props = {
  lineMaintenanceId?: number | null;
  flightInfosId?: number | null;
  initialData?: LineMaintenanceThfResponse | null; // Replace 'any' with actual type if available
  loading?: boolean;
  flightError?: Error | null;
}
const AttachFileStep: React.FC<Props> = ({ lineMaintenanceId, flightInfosId, initialData, loading, flightError }) => {
  const { goNext, onSave, goBack } = useStep()


  // Memoize default values to prevent unnecessary re-calculations
  const memoizedDefaultValues = useMemo(() => {
    return getDefaultValues()
  }, [])

  // Transform existing data for form
  const transformedData = useMemo(() => {
    if (!initialData || loading) {
      return null
    }
    return mapDataThfToAttachFileStep(initialData)
  }, [initialData, loading])

  // Initialize form with validation
  const form = useForm<AttachFileFormInputs>({
    resolver: zodResolver(attachFileFormSchema),
    defaultValues: initialData ? mapDataThfToAttachFileStep(initialData) : memoizedDefaultValues,
    mode: "onChange",
  })
  // File upload management
  const {
    files,
    addFiles,
    removeFile,
    updateFileName,
    uploadFile,
    uploadAllFiles,
    getCompletedFilesData,
    hasFiles,
    hasCompletedFiles,
    isUploading
  } = useAttachFileUpload(mapDataThfToAttachFileStep(initialData))

  // Submission hook
  const {
    handleSubmit,
    handleOnBackStep,
    isSubmitting,
    isSubmitSuccess,
    isSubmitError,
    submitError,
    resetMutation,
    hasLineMaintenanceId
  } = useAttachFileSubmission({
    form,
    onNextStep: goNext,
    onBackStep: goBack,
    onUpdateData: () => onSave({}),
    lineMaintenanceId: lineMaintenanceId || 0,
  })

  // Load initial data when available
  useEffect(() => {
    if (transformedData) {
      console.log('AttachFileStep: Using transformed data', transformedData)
      form.reset(transformedData)
      console.log('AttachFileStep: Form reset completed')
    } else if (!loading && !flightError) {
      console.log('AttachFileStep: No data available, using default values')
      form.reset(memoizedDefaultValues)
    }
  }, [transformedData, loading, flightError, form, memoizedDefaultValues])

  // Handle file selection from drop zone
  const handleFilesSelected = (fileList: FileList) => {
    addFiles(fileList)
  }

  // Handle form submission with file data
  const onSubmit = (formData: AttachFileFormInputs) => {
    // Add completed file data to form before submission
    console.log("🚀 AttachFileStep onSubmit called with formData:", formData)
    const completedFiles = getCompletedFilesData()
    console.log("📁 Completed files from upload manager:", completedFiles)

    // Merge uploaded files with form data
    const updatedFormData: AttachFileFormInputs = {
      ...formData,
      attachFiles: [
        // ...(formData.attachFiles || []), // Handle undefined attachFiles
        ...completedFiles.map((file, index) => ({
          id: `uploaded-${index}`,
          name: file.realName.split('.')[0],
          file: null,
          fileType: file.fileType,
          status: 'completed' as const,
          progress: 100,
          storagePath: file.storagePath,
          realName: file.realName
        }))
      ]
    }

    console.log("✨ Final form data before submission:", updatedFormData)
    console.log("🔗 Calling handleSubmit with lineMaintenanceId:", lineMaintenanceId)

    handleSubmit(updatedFormData)
  }

  return (
    <CardContentStep
      stepNumber={5}
      title="Attach Files"
      description="Upload and manage supporting documents and files for this maintenance record"
    >
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading attach file data...</span>
        </div>
      )}

      {flightError && (
        <StatusMessages
          isError={true}
          errorTitle="Error loading data"
          errorMessage={flightError.message || 'Failed to load attach file information'}
        />
      )}

      {!hasLineMaintenanceId && !loading && (
        <StatusMessages
          isWarning={true}
          warningTitle="Line Maintenance ID Missing"
          warningMessage="Line maintenance information is required to save attach file data."
        />
      )}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <FlightTimeCard
          title="Arrival (UTC Time)"
          flightNo="6E1061"
          date={initialData?.responseData?.flight.arrivalDate ? formatFromPicker(initialData.responseData.flight.arrivalDate) : ""}
          timeLabels={["STA (UTC)", "ATA (UTC)"]}
          times={[initialData?.responseData?.flight.arrivalStatime ?? "", initialData?.responseData?.flight.arrivalAtaTime ?? ""]}
        />
        <FlightTimeCard
          title="Departure (UTC Time)"
          flightNo="6E1062"
          date={initialData?.responseData?.flight.departureDate ? formatFromPicker(initialData.responseData.flight.departureDate) : ""}
          timeLabels={["STD (UTC)", "ATD (UTC)"]}
          times={[initialData?.responseData?.flight.departureStdTime ?? "", initialData?.responseData?.flight.departureAtdtime ?? ""]}
        />
      </div>
      {!loading && !flightError && (
        <Form {...form}>
          <form className="space-y-6">

            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Upload Files</h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={uploadAllFiles}
                    disabled={!hasFiles || isUploading || isSubmitting}
                    size="sm"
                  >
                    {isUploading ? 'Uploading...' : 'Upload All'}
                  </Button>
                </div>
              </div>

              {/* File Drop Zone */}
              <FileDropZone
                onFilesSelected={handleFilesSelected}
                disabled={isSubmitting || isUploading}
                maxFiles={10}
                currentFileCount={files.length}
              />

              {/* File List */}
              {hasFiles && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">
                    Selected Files ({files.length}/10)
                  </h4>
                  {files.map(file => (
                    <FileUploadCard
                      key={file.id}
                      file={file}
                      onRemove={removeFile}
                      onUpdateName={updateFileName}
                      onUpload={uploadFile}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            {hasCompletedFiles && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">
                    {getCompletedFilesData().length} file(s) ready for submission
                  </span>
                </div>
              </div>
            )}

            {/* Form Validation Errors */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </span>
                </div>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  {form.formState.errors.attachFiles?.message && (
                    <li>{form.formState.errors.attachFiles.message}</li>
                  )}
                  {form.formState.errors.root?.message && (
                    <li>{form.formState.errors.root.message}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Debug Information */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-xs">
                <div className="font-semibold mb-2">Debug Info:</div>
                <div>Line Maintenance ID: {lineMaintenanceId}</div>
                <div>Has Line Maintenance ID: {hasLineMaintenanceId ? 'Yes' : 'No'}</div>
                <div>Form Valid: {form.formState.isValid ? 'Yes' : 'No'}</div>
                <div>Is Submitting: {isSubmitting ? 'Yes' : 'No'}</div>
                <div>Files Count: {files.length}</div>
                <div>Completed Files: {hasCompletedFiles ? getCompletedFilesData().length : 0}</div>
                <div>Submit Disabled: {isSubmitting || !hasLineMaintenanceId || !form.formState.isValid ? 'Yes' : 'No'}</div>
              </div>
            )}

            {/* Form Actions */}
            <FormActions
              onBack={handleOnBackStep}
              onSubmit={form.handleSubmit(onSubmit)}
              backText="← Back to Parts & Tools"
              submitText={isSubmitting ? 'Saving...' : 'Save & Complete'}
              isSubmitting={isSubmitting}
              disableBack={isSubmitting}
              disableSubmit={isSubmitting || !hasLineMaintenanceId || !form.formState.isValid}
              showReset={false}
            />

            {/* Status Messages */}
            {isSubmitError && submitError && (
              <StatusMessages
                isError={true}
                errorTitle="Error Saving Attach Files"
                errorMessage={submitError.message || 'Failed to save attach file data. Please try again.'}
                onDismissError={resetMutation}
              />
            )}

            {isSubmitSuccess && (
              <StatusMessages
                isSuccess={true}
                successTitle="Files Attached Successfully"
                successMessage="Your files have been saved and the maintenance record is now complete."
              />
            )}
          </form>
        </Form>
      )}
    </CardContentStep>
  )
}

export default AttachFileStep
