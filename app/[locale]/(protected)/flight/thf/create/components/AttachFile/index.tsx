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

/**
 * AttachFile Step component for THF form
 * Handles file attachment and upload functionality
 */
type Props = {
  lineMaintenanceId?: number | null;
  flightInfosId?: number | null;
  initialData?: any; // Replace 'any' with actual type if available
  loading?: boolean;
  flightError?: Error | null;
}
const AttachFileStep: React.FC<Props> = ({ lineMaintenanceId, flightInfosId, initialData, loading, flightError }) => {
  const { goNext, onSave, goBack } = useStep()

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
  } = useAttachFileUpload()

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
    defaultValues: memoizedDefaultValues,
    mode: "onChange",
  })

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
    console.log("onSubmit called with formData:", formData)
    const completedFiles = getCompletedFilesData()

    // Merge uploaded files with form data
    const updatedFormData: AttachFileFormInputs = {
      ...formData,
      attachFiles: [
        ...formData.attachFiles,
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

      {!loading && !flightError && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

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

            {/* Form Actions */}
            <FormActions
              onBack={handleOnBackStep}
              onSubmit={form.handleSubmit(onSubmit)}
              backText="← Back to Parts & Tools"
              submitText={isSubmitting ? 'Saving...' : 'Save'}
              isSubmitting={isSubmitting}
              disableBack={isSubmitting}
              disableSubmit={isSubmitting || !hasLineMaintenanceId}
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
