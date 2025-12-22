"use client"

import React, { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { useStep } from "../step-context"
import CardContentStep from "../CardContentStep"
import FlightTimeCard from "./FlightTimeCard"
import { FormActions, StatusMessages } from "../shared"

// Types and utilities
import { AttachFileFormInputs } from './types'
import { attachFileFormSchema } from './schema'
import { getDefaultValues, mapDataThfToAttachFileStep } from './utils'
import { useAttachFileUpload } from '@/lib/api/hooks/useAttachFileUpload'
import { usePutAttachFileOtherWithLoading } from '@/lib/api/hooks/usePutAttachfileOther'
import { LineMaintenanceThfResponse } from "@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId"
import { formatFromPicker } from "@/lib/utils/formatPicker"
import { AttachFileOtherData } from "@/lib/api/lineMaintenances/attachfile-other/putAttachfileOther"

// Icons
import {
  Upload,
  X,
  FileText,
  Check,
  Loader2,
  ExternalLink,
  Trash2,
  AlertCircle,
  Download,
  Eye
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

/**
 * AttachFile Step component for THF form
 * Comprehensive file upload with drag & drop, progress tracking, and preview
 */
type Props = {
  lineMaintenanceId?: number | null
  flightInfosId?: number | null
  initialData?: LineMaintenanceThfResponse | null
  loading?: boolean
  flightError?: Error | null
  thfNumber: string
}

const AttachFileStep: React.FC<Props> = ({
  lineMaintenanceId,
  flightInfosId,
  initialData,
  loading,
  flightError,
  thfNumber
}) => {
  const { goNext, onSave, goBack } = useStep()
  const queryClient = useQueryClient()

  // Memoize default values
  const memoizedDefaultValues = useMemo(() => getDefaultValues(), [])

  // Transform existing data for form
  const transformedData = useMemo(() => {
    if (!initialData || loading) return null
    return mapDataThfToAttachFileStep(initialData)
  }, [initialData, loading])

  // Initialize form
  const form = useForm<AttachFileFormInputs>({
    resolver: zodResolver(attachFileFormSchema),
    defaultValues: transformedData || memoizedDefaultValues,
    mode: "onChange",
  })

  // File upload management hook
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
  } = useAttachFileUpload(form, transformedData || memoizedDefaultValues, thfNumber)

  const router = useRouter()
  const { locale } = useParams()

  // Submit mutation
  const {
    updateAttachFileOther,
    isLoading: isSubmitting,
    isSuccess: isSubmitSuccess,
    isError: isSubmitError,
    error: submitError,
    reset: resetMutation
  } = usePutAttachFileOtherWithLoading({
    lineMaintenancesId: lineMaintenanceId || 0,
    onSuccess: async () => {
      console.log('✅ Attach files updated successfully')
      await queryClient.invalidateQueries({ queryKey: ['flightList'] })
      onSave({})
      toast.success(`Attach file data prepared successfully`)
      // goNext()
      router.push(`/${locale}/flight/list`)
    },
    onError: (error) => {
      toast.error(`Failed to prepare attach file data ${error}`)
      console.error('❌ Failed to update attach files:', error)
    }
  })

  // Load initial data when available
  useEffect(() => {
    if (transformedData) {
      form.reset(transformedData)
    } else if (!loading && !flightError) {
      form.reset(memoizedDefaultValues)
    }
  }, [transformedData, loading, flightError, form, memoizedDefaultValues])

  // Computed states
  const hasLineMaintenanceId = !!lineMaintenanceId
  // const hasActiveFiles = files.some(f => !f.isDelete)
  const hasPendingFiles = files.some(f => f.status === 'pending' && !f.isDelete)
  const allFilesUploaded = files.every(f => f.isDelete || f.status === 'completed')
  const canSubmit = hasLineMaintenanceId && form.formState.isValid && !isSubmitting && allFilesUploaded

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle file selection from input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
    }
  }

  // Preview file
  const handlePreviewFile = (file: typeof files[0]) => {
    if (file.storagePath) {
      window.open(file.storagePath, '_blank')
    } else if (file.file) {
      const url = URL.createObjectURL(file.file)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }

  // Handle form submission
  const onSubmit = async (formData: AttachFileFormInputs) => {
    // Check if all files are uploaded
    if (!allFilesUploaded) {
      // toast({
      //   variant: "destructive",
      //   title: "Upload Required",
      //   description: "Please upload all files before submitting"
      // })
      // Automatically upload pending files
      await uploadAllFiles()
      return
    }

    // Prepare data for API
    const completedFiles = getCompletedFilesData()
    const submitData: AttachFileOtherData[] = completedFiles.map(file => ({
      id: file.id?.startsWith('uploaded') ? null : file.id,
      storagePath: file.storagePath,
      realName: file.realName,
      fileType: file.fileType,
      isDelete: file.isDelete || false
    }))

    console.log('📤 Submitting files:', submitData)
    updateAttachFileOther(submitData)
  }

  // Handle back navigation
  const handleOnBackStep = () => {
    goBack()
  }

  return (
    <CardContentStep
      stepNumber={5}
      title="Attach Files"
      description="Upload and manage supporting documents for this maintenance record"
    >
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading attach file data...</span>
        </div>
      )}

      {/* Error State */}
      {flightError && (
        <StatusMessages
          isError={true}
          errorTitle="Error loading data"
          errorMessage={flightError.message || 'Failed to load attach file information'}
        />
      )}

      {/* Warning: Missing Line Maintenance ID */}
      {!hasLineMaintenanceId && !loading && (
        <StatusMessages
          isWarning={true}
          warningTitle="Line Maintenance ID Missing"
          warningMessage="Line maintenance information is required to save attach file data."
        />
      )}

      {/* Flight Time Cards */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <FlightTimeCard
          title="Arrival (UTC Time)"
          flightNo={initialData?.responseData?.flight.arrivalFlightNo || ""}
          date={initialData?.responseData?.flight.arrivalDate ? formatFromPicker(initialData.responseData.flight.arrivalDate) : ""}
          timeLabels={["STA (UTC)", "ATA (UTC)"]}
          times={[
            initialData?.responseData?.flight.arrivalStatime ?? "",
            initialData?.responseData?.flight.arrivalAtaTime ?? ""
          ]}
        />
        <FlightTimeCard
          title="Departure (UTC Time)"
          flightNo={initialData?.responseData?.flight.departureFlightNo || ""}
          date={initialData?.responseData?.flight.departureDate ? formatFromPicker(initialData.responseData.flight.departureDate) : ""}
          timeLabels={["STD (UTC)", "ATD (UTC)"]}
          times={[
            initialData?.responseData?.flight.departureStdTime ?? "",
            initialData?.responseData?.flight.departureAtdtime ?? ""
          ]}
        />
      </div>

      {/* Main Form */}
      {!loading && !flightError && (
        <Form {...form}>
          <form className="space-y-6">
            {/* Upload Section Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upload Files</h3>
              {hasPendingFiles && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={uploadAllFiles}
                  disabled={isUploading || isSubmitting}
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload All
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* File Drop Zone */}
            <Card>
              <CardContent className="p-6">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50/50"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-700">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Support for images, PDF, Word, Excel (Max 10MB per file)
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                </div>
              </CardContent>
            </Card>

            {/* File List */}
            {hasFiles && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Files ({files.filter(f => !f.isDelete).length}/{files.length})
                </h4>
                <div className="grid gap-2 grid-cols-3">
                  {files.map(file => (
                    <Card
                      key={file.id}
                      className={`transition-all ${file.isDelete ? 'opacity-50 bg-gray-50' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* File Icon */}
                          <div className="flex-shrink-0">
                            <FileText className={`h-8 w-8 ${file.isDelete ? 'text-gray-400' : 'text-primary'}`} />
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {/* File Name (Editable for completed files) */}
                              <p className="font-medium truncate">{file.name || file.realName}</p>

                              {/* Status Badge */}
                              {file.isDelete ? (
                                <Badge className="shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  <X className="h-3 w-3 mr-1" />
                                  Deleted
                                </Badge>
                              ) : file.status === 'completed' ? (
                                <Badge className="bg-green-500 hover:bg-green-600 shrink-0">
                                  <Check className="h-3 w-3 mr-1" />
                                  Uploaded
                                </Badge>
                              ) : file.status === 'uploading' ? (
                                <Badge className="shrink-0 bg-secondary text-secondary-foreground">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Uploading
                                </Badge>
                              ) : file.status === 'error' ? (
                                <Badge className="shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              ) : (
                                <Badge className="shrink-0 border border-border bg-background text-gray-500">
                                  Pending
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground truncate">
                              {file.realName || 'No filename'}
                            </p>

                            {/* Progress Bar */}
                            {file.status === 'uploading' && (
                              <Progress value={file.progress} className="mt-2 h-1" />
                            )}

                            {/* Error Message */}
                            {file.status === 'error' && file.error && (
                              <p className="text-xs text-red-500 mt-1">{file.error}</p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Preview Button */}
                            {(file.storagePath || file.file) && !file.isDelete && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePreviewFile(file)}
                                title="Preview file"
                              >
                                {/* <ExternalLink className="h-4 w-4" /> */}
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Upload Button (for pending files) */}
                            {file.status === 'pending' && !file.isDelete && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => uploadFile(file.id || '')}
                                disabled={isUploading}
                                title="Upload this file"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Delete Button */}
                            {!file.isDelete && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(file.id || '')}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Remove file"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Card */}
            {/* {hasCompletedFiles && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {getCompletedFilesData().length} file(s) ready for submission
                    </span>
                  </div>
                </CardContent>
              </Card>
            )} */}

            {/* Validation Warning */}
            {hasPendingFiles && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Please upload all files before submitting
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Validation Errors */}
            {Object.keys(form.formState.errors).length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Please fix the following errors:
                      </p>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {form.formState.errors.attachFiles?.message && (
                          <li>{form.formState.errors.attachFiles.message}</li>
                        )}
                        {form.formState.errors.root?.message && (
                          <li>{form.formState.errors.root.message}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Debug Information (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="bg-gray-100 border-gray-300">
                <CardContent className="p-4 text-xs space-y-1 font-mono">
                  <div className="font-semibold text-sm mb-2">Debug Info:</div>
                  <div>Line Maintenance ID: {lineMaintenanceId || 'N/A'}</div>
                  <div>Has Line Maintenance ID: {hasLineMaintenanceId ? 'Yes' : 'No'}</div>
                  <div>Form Valid: {form.formState.isValid ? 'Yes' : 'No'}</div>
                  <div>Is Submitting: {isSubmitting ? 'Yes' : 'No'}</div>
                  <div>Is Uploading: {isUploading ? 'Yes' : 'No'}</div>
                  <div>Total Files: {files.length}</div>
                  <div>Active Files: {files.filter(f => !f.isDelete).length}</div>
                  <div>Completed Files: {hasCompletedFiles ? getCompletedFilesData().length : 0}</div>
                  <div>Pending Files: {files.filter(f => f.status === 'pending').length}</div>
                  <div>All Uploaded: {allFilesUploaded ? 'Yes' : 'No'}</div>
                  <div>Can Submit: {canSubmit ? 'Yes' : 'No'}</div>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <FormActions
              onBack={handleOnBackStep}
              onSubmit={form.handleSubmit(onSubmit)}
              backText="← Back to Parts & Tools"
              submitText={isSubmitting ? 'Saving...' : 'Save & Continue'}
              isSubmitting={isSubmitting}
              disableBack={isSubmitting}
              disableSubmit={!canSubmit}
              showReset={false}
            />

            {/* Status Messages */}
            {isSubmitError && submitError && (
              <StatusMessages
                isError={true}
                errorTitle="Error Saving Files"
                errorMessage={submitError.message || 'Failed to save attach file data. Please try again.'}
                onDismissError={resetMutation}
              />
            )}

            {isSubmitSuccess && (
              <StatusMessages
                isSuccess={true}
                successTitle="Files Saved Successfully"
                successMessage="Your files have been saved and the maintenance record is now complete."
              />
            )}
          </form>
        </Form>
      )
      }
    </CardContentStep >
  )
}

export default AttachFileStep
