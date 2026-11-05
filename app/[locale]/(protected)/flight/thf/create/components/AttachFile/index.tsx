'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Upload, X, FileText, Check, Loader2,
  Trash2, AlertCircle, AlertTriangle, Eye, RotateCcw
} from 'lucide-react'

import { useStep } from '../step-context'
import { StatusMessages } from '../shared'
import { FlightTimeCard } from './FlightTimeCard'

// Types and utilities
import { AttachFileFormInputs, validateFile, mapApiDataToAttachFileForm } from './types'
import { attachFileFormSchema } from './schema'
import { getDefaultValues, mapDataThfToAttachFileStep, formatFileSize, getFileExtension } from './utils'
import { useAttachFileSubmission } from './useAttachFileSubmission'
import { useAttachFileUpload } from '@/lib/api/hooks/useAttachFileUpload'

import { FlightFormData } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { splitUtcDateTime } from '@/lib/utils/flightDatetime'

interface AttachFileStepProps {
  initialData?: LineMaintenanceThfResponse | null
  flightInfosId?: number | null
  lineMaintenanceId?: number | null
  flightError?: Error | null
  loading?: boolean
  thfNumber: string
}

/**
 * Attach File Step component for THF modal (Step 5 — final step)
 * Drag & drop upload, file preview grid, upload progress, and API submission
 */
const AttachFileStep: React.FC<AttachFileStepProps> = ({
  initialData,
  flightInfosId,
  lineMaintenanceId,
  flightError,
  loading,
  thfNumber,
}) => {
  const { goNext, goBack, onSave, setSubmitHandler, setDraftHandler, setIsSubmitting, closeModal, submitPhase, setSubmitPhase } = useStep()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileErrors, setFileErrors] = useState<string[]>([])

  // Default values
  const memoizedDefaultValues = useMemo(() => getDefaultValues(), [])

  // Transform existing API data
  const transformedData = useMemo(() => {
    if (!initialData) return null
    return mapDataThfToAttachFileStep(initialData)
  }, [initialData])

  // Initialize form
  const form = useForm<AttachFileFormInputs>({
    resolver: zodResolver(attachFileFormSchema),
    defaultValues: transformedData || memoizedDefaultValues,
    mode: 'onChange',
  })

  // File upload hook
  const {
    files,
    addFiles,
    removeFile,
    uploadFile,
    uploadAllFiles,
    getCompletedFilesData,
    hasFiles,
    hasCompletedFiles,
    isUploading,
  } = useAttachFileUpload(form, transformedData || memoizedDefaultValues, thfNumber)

  // Submission hook
  const {
    handleSubmit,
    handleDraft,
    handleOnBackStep,
    isSubmitting: isSubmittingMutation,
    isDrafting,
    isSubmitSuccess,
    isSubmitError,
    submitError,
    sharePointError,
    resetMutation,
    hasLineMaintenanceId,
  } = useAttachFileSubmission({
    form,
    onNextStep: goNext,
    onBackStep: goBack,
    onUpdateData: () => onSave({}),
    existingFlightData: initialData,
    lineMaintenanceId: lineMaintenanceId || null,
    closeModal,
    setSubmitPhase,
  })

  // Load initial data
  useEffect(() => {
    if (transformedData && transformedData.attachFiles.length > 0) {
      form.reset(transformedData)
    }
  }, [transformedData, form])

  // Register submit handler for modal wrapper
  useEffect(() => {
    if (setSubmitHandler) {
      setSubmitHandler(async () => {
        // First upload any pending files
        const pendingFiles = files.filter(f => f.status === 'pending')
        if (pendingFiles.length > 0) {
          await uploadAllFiles()
        }

        // Submit via form validation → handleSubmit
        form.handleSubmit(
          (data) => handleSubmit(data),
          (errors) => console.log('AttachFile validation errors:', errors)
        )()
      })
    }
  }, [setSubmitHandler, form, handleSubmit, files, uploadAllFiles])

  // Register draft handler for modal wrapper
  useEffect(() => {
    if (setDraftHandler) {
      setDraftHandler(async () => {
        // First upload any pending files
        const pendingFiles = files.filter(f => f.status === 'pending')
        if (pendingFiles.length > 0) {
          await uploadAllFiles()
        }

        // Draft via form validation → handleDraft
        form.handleSubmit(
          (data) => handleDraft(data),
          (errors) => console.log('AttachFile validation errors:', errors)
        )()
      })
    }
  }, [setDraftHandler, form, handleDraft, files, uploadAllFiles])

  // Sync submitting state
  useEffect(() => {
    if (setIsSubmitting) {
      setIsSubmitting(isSubmittingMutation || isDrafting || isUploading)
    }
  }, [isSubmittingMutation, isDrafting, isUploading, setIsSubmitting])

  // ─── Drag & Drop Handlers ───
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const errors: string[] = []
    const validFiles: File[] = []

    Array.from(fileList).forEach(file => {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (errors.length > 0) setFileErrors(errors)
    if (validFiles.length > 0) addFiles(validFiles)
  }, [addFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files)
      // Reset input so same file can be selected again
      e.target.value = ''
    }
  }, [processFiles])

  // ─── File Preview ───
  const handlePreviewFile = useCallback((file: typeof files[0]) => {
    if (file.storagePath) {
      window.open(file.storagePath, '_blank')
    } else if (file.file) {
      const url = URL.createObjectURL(file.file)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }, [])

  // ─── Status Badge ───
  const renderStatusBadge = (file: typeof files[0]) => {
    if (file.isDelete) {
      return <Badge color="destructive" className="text-xs">Deleted</Badge>
    }

    switch (file.status) {
      case 'pending':
        return <Badge color="secondary" className="text-xs">Pending</Badge>
      case 'uploading':
        return (
          <Badge color="default" className="text-xs bg-blue-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Uploading
          </Badge>
        )
      case 'completed':
        return (
          <Badge color="default" className="text-xs bg-green-500">
            <Check className="h-3 w-3 mr-1" />
            Uploaded
          </Badge>
        )
      case 'error':
        return <Badge color="destructive" className="text-xs">Failed</Badge>
      default:
        return null
    }
  }

  // ─── File Icon by Extension ───
  const getFileIcon = (name: string, fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><FileText className="h-5 w-5 text-purple-600" /></div>
    }
    if (fileType === 'application/pdf') {
      return <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><FileText className="h-5 w-5 text-red-600" /></div>
    }
    return <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="h-5 w-5 text-blue-600" /></div>
  }

  // ─── Flight info from API data ───
  const flight = initialData?.responseData?.flight

  // Derived states
  const pendingCount = files.filter(f => f.status === 'pending').length
  const canAddMore = files.filter(f => !f.isDelete).length < 10
  const isCompletedPhase = submitPhase === 'success' || submitPhase === 'sharepoint_error'

  const handleReopenUpload = useCallback(() => {
    resetMutation()
    setSubmitPhase?.('idle')
  }, [resetMutation, setSubmitPhase])

  return (
    <Form {...form}>
      <form className="space-y-6">

        {/* Flight Time Info Cards */}
        {flight && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FlightTimeCard
              title="Arrival (UTC)"
              flightNo={flight.arrivalFlightNo || ''}
              date={splitUtcDateTime(flight.arrivalStaDate).date}
              timeLabels={['STA (UTC)', 'ATA (UTC)']}
              times={[splitUtcDateTime(flight.arrivalStaDate).time, splitUtcDateTime(flight.arrivalAtaDate).time]}
            />
            <FlightTimeCard
              title="Departure (UTC)"
              flightNo={flight.departureFlightNo || ''}
              date={splitUtcDateTime(flight.departureStdDate).date}
              timeLabels={['STD (UTC)', 'ATD (UTC)']}
              times={[splitUtcDateTime(flight.departureStdDate).time, splitUtcDateTime(flight.departureAtdDate).time]}
            />
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        {/* Upload Zone */}
        {!isCompletedPhase && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
                {pendingCount > 0 && (
                  <Button
                    type="button"
                    onClick={() => uploadAllFiles()}
                    disabled={isUploading || isSubmittingMutation || submitPhase === 'saving_files' || submitPhase === 'sharepoint'}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload All ({pendingCount})
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Drag & Drop Zone */}
              {!hasFiles && canAddMore && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                    ${isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <Upload className={`mx-auto h-10 w-10 mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-gray-700">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Images, PDF, Word, Excel (Max 10MB per file, up to 10 files)
                  </p>
                </div>
              )}

              {/* File Validation Errors */}
              {fileErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">File validation errors:</p>
                      <ul className="text-xs text-red-700 list-disc list-inside mt-1">
                        {fileErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => setFileErrors([])} className="text-red-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* File List Grid */}
        {hasFiles && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Small Dropzone Card (when there are files and can add more) */}
            {canAddMore && !isCompletedPhase && (
              <Card
                className={`relative overflow-hidden transition-all border-2 border-dashed cursor-pointer flex flex-col items-center justify-center min-h-[140px] shadow-sm hover:shadow-md ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={`h-8 w-8 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="text-sm font-medium text-gray-700">Add more files</p>
              </Card>
            )}

            {files.filter(f => !f.isDelete).map((file) => (
              <Card
                key={file.id}
                className={`relative overflow-hidden transition-all ${file.status === 'error' ? 'border-red-200 bg-red-50' : ''
                  }`}
              >
                <CardContent className="p-4">
                  {/* File Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {getFileIcon(file.name, file.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                        {file.realName && (
                          <span className="text-gray-400">.{getFileExtension(file.realName)}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStatusBadge(file)}
                        {file.file && (
                          <span className="text-xs text-gray-500">
                            {formatFileSize(file.file.size)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1.5 mb-3" />
                  )}

                  {/* Error Message */}
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-600 mb-3">{file.error}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2">
                    {/* Upload single file (pending) */}
                    {file.status === 'pending' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => file.id && uploadFile(file.id)}
                        disabled={isUploading}
                        className="h-8 text-xs"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Upload
                      </Button>
                    )}

                    {/* Preview (completed or has local file) */}
                    {(file.storagePath || file.file) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewFile(file)}
                        className="h-8 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}

                    {/* Delete */}
                    <Button
                      type="button"
                      variant="soft"
                      size="icon"
                      color="destructive"
                      onClick={() => file.id && removeFile(file.id)}
                      disabled={isSubmittingMutation || submitPhase === 'saving_files' || submitPhase === 'sharepoint' || submitPhase === 'success'}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Status Messages */}
        {/* {isSubmitError && submitError && (
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
            successMessage="Your attach file data has been saved."
          />
        )} */}

        {/* Submit Progress UI */}
        {(submitPhase === 'saving_files' || submitPhase === 'sharepoint' || submitPhase === 'sharepoint_error' || submitPhase === 'success' || submitPhase === 'error') && (
          <Card className={`border ${
            submitPhase === 'success' ? 'border-green-200 bg-green-50' :
            submitPhase === 'sharepoint_error' ? 'border-amber-300 bg-amber-50' :
            submitPhase === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {submitPhase === 'success' ? (
                  <>
                    <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-green-700">Submit Completed Successfully</span>
                  </>
                ) : submitPhase === 'sharepoint_error' ? (
                  <>
                    <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-amber-800">Submit Completed — SharePoint Upload Failed</span>
                  </>
                ) : submitPhase === 'error' ? (
                  <>
                    <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <X className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-red-700">Submit Failed</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
                    <span className="text-blue-900">Processing Submit...</span>
                  </>
                )}
              </h3>

              <div className="space-y-4 ml-2 border-l-2 border-slate-200 pl-4">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  {submitPhase === 'saving_files' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                  ) : submitPhase === 'error' ? (
                    <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <X className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <span className={`text-sm font-medium ${submitPhase === 'saving_files' ? 'text-blue-800' : submitPhase === 'error' ? 'text-red-700' : 'text-slate-700'}`}>
                    1. Saving Attached Files
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  {submitPhase === 'saving_files' ? (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300 mt-0.5 shrink-0" />
                  ) : submitPhase === 'sharepoint' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 mt-0.5 shrink-0" />
                  ) : submitPhase === 'sharepoint_error' ? (
                    <div className="h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center mt-0.5 shrink-0">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                  ) : submitPhase === 'error' ? (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300 mt-0.5 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div>
                    <span className={`text-sm font-medium ${
                      submitPhase === 'saving_files' ? 'text-slate-400' :
                      submitPhase === 'sharepoint' ? 'text-blue-800' :
                      submitPhase === 'sharepoint_error' ? 'text-amber-800' :
                      submitPhase === 'error' ? 'text-slate-400' :
                      'text-slate-700'
                    }`}>
                      2. Sending to SharePoint{submitPhase === 'sharepoint_error' ? ' (Failed)' : ''}
                    </span>
                    {submitPhase === 'sharepoint_error' && (
                      <p className="text-xs text-amber-700 mt-1">
                        {sharePointError?.message || 'One or more files failed to upload.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {submitPhase === 'success' && (
                <div className="mt-6 p-3 bg-white rounded-md border border-green-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-sm text-green-800 font-medium text-center sm:text-left">
                    All processes completed. You can now close this window.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReopenUpload}
                    className="shrink-0 border-green-300 text-green-800 hover:bg-green-100"
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    Upload Files Again
                  </Button>
                </div>
              )}

              {submitPhase === 'sharepoint_error' && (
                <div className="mt-6 p-3 bg-white rounded-md border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-amber-800 font-medium text-center sm:text-left">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      Attached files were saved, but SharePoint upload failed. You can re-open upload to try again.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReopenUpload}
                    className="shrink-0 border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Re-open Upload Files
                  </Button>
                </div>
              )}

              {submitPhase === 'error' && (
                <div className="mt-6 p-3 bg-white rounded-md border border-red-200 text-sm text-red-800 font-medium text-center">
                  An error occurred during submission. You can edit the form and try submitting again using the buttons below.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  )
}

export default AttachFileStep
