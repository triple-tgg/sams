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
  Trash2, AlertCircle, Eye
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
  const { goNext, goBack, onSave, setSubmitHandler, setDraftHandler, setIsSubmitting, closeModal } = useStep()
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

  return (
    <Form {...form}>
      <form className="space-y-6">

        {/* Flight Time Info Cards */}
        {flight && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FlightTimeCard
              title="Arrival (UTC Time)"
              flightNo={flight.arrivalFlightNo || ''}
              date={flight.arrivalDate || ''}
              timeLabels={['STA (UTC)', 'ATA (UTC)']}
              times={[flight.arrivalStatime || '', flight.arrivalAtaTime || '']}
            />
            <FlightTimeCard
              title="Departure (UTC Time)"
              flightNo={flight.departureFlightNo || ''}
              date={flight.departureDate || ''}
              timeLabels={['STD (UTC)', 'ATD (UTC)']}
              times={[flight.departureStdTime || '', flight.departureAtdtime || '']}
            />
          </div>
        )}

        {/* Upload Zone */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
              {pendingCount > 0 && (
                <Button
                  type="button"
                  onClick={() => uploadAllFiles()}
                  disabled={isUploading}
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
            {canAddMore && (
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
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
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

        {/* File List Grid */}
        {hasFiles && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* No Files - Empty State */}
        {!hasFiles && (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Files Attached
              </h3>
              <p className="text-sm text-gray-500 mb-2 max-w-md">
                Upload supporting documents for this THF (optional)
              </p>
            </div>
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
      </form>
    </Form>
  )
}

export default AttachFileStep
