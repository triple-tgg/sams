import React, { useState, useMemo, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PlusIcon, TrashIcon, X, CheckCircle, CircleAlert } from 'lucide-react'
import { ServicesFormInputs, transformAircraftCheckTypesToOptions, transformAircraftCheckSubTypesToOptions } from './types'
import { useStaff } from '@/lib/api/hooks/useStaff'
import { useUploadFile } from '@/lib/api/hooks/useFileUpload'
import { AircraftCheckSubType, AircraftCheckType } from '@/lib/api/master/aircraft-check-types/airlines.interface'
import { AdditionalDefectAttachFile } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'



// Component for photo upload with automatic file upload
const PhotoUploadField: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  fieldName: string
  label?: string
  value?: AdditionalDefectAttachFile | null
  maxFiles?: number
  maxSizeInMB?: number
  single?: boolean
}> = ({
  form,
  fieldName,
  label = "Photo",
  value,
  maxFiles = 1,
  maxSizeInMB = 10,
  single = true
}) => {
    const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileName: string; filePath: string; originalName?: string; size?: number; uploadedAt?: Date }>>(
      value?.storagePath ? [{
        fileName: value.realName,
        filePath: value.storagePath,
        originalName: value.realName,
        uploadedAt: new Date()
      }] : []
    )
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
    const [uploadErrors, setUploadErrors] = useState<Array<{ fileName: string; error: string }>>([])

    const uploadMutation = useUploadFile()

    // Sync with form field value on mount and when value changes
    useEffect(() => {
      const fieldValue = form.getValues(fieldName as any)
      console.log("fieldName", fieldName)
      console.log("value", fieldValue)
      // If there's a field value but no uploaded files state, sync it
      if (fieldValue && Array.isArray(fieldValue) && fieldValue.length > 0 && uploadedFiles.length === 0) {
        const syncedFiles = fieldValue.map((filePath: string, index: number) => ({
          fileName: `File ${index + 1}`,
          filePath: filePath,
          originalName: `Existing file ${index + 1}`,
          uploadedAt: new Date()
        }))
        setUploadedFiles(syncedFiles)
      }
    }, [fieldName, form, uploadedFiles.length, value])

    // Validate file before upload
    const validateFile = (file: File): string | null => {
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024

      if (file.size > maxSizeInBytes) {
        return `File size exceeds ${maxSizeInMB}MB limit`
      }

      if (!file.type.startsWith('image/')) {
        return 'Only image files are allowed'
      }

      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

      if (!allowedExtensions.includes(fileExtension)) {
        return `File type ${fileExtension} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`
      }

      return null
    }

    // Enhanced file upload with progress tracking and validation
    const handleFileUpload = async (files: FileList | null) => {
      if (!files || files.length === 0) return

      // For single file mode, replace existing file
      if (single) {
        if (files.length > 1) {
          setUploadErrors([{
            fileName: 'Multiple files',
            error: 'Only one file can be uploaded at a time'
          }])
          return
        }
        // Clear existing files for single mode
        setUploadedFiles([])
      } else {
        // Check if adding these files would exceed the maximum
        if (uploadedFiles.length + files.length > maxFiles) {
          setUploadErrors(prev => [...prev, {
            fileName: 'Limit exceeded',
            error: `Maximum ${maxFiles} files allowed. Currently have ${uploadedFiles.length} files.`
          }])
          return
        }
      }

      setIsUploading(true)
      setUploadErrors([]) // Clear previous errors

      const validFiles: File[] = []
      const fileErrors: Array<{ fileName: string; error: string }> = []

      // Validate all files first
      Array.from(files).forEach(file => {
        const validationError = validateFile(file)
        if (validationError) {
          fileErrors.push({ fileName: file.name, error: validationError })
        } else {
          validFiles.push(file)
        }
      })

      if (fileErrors.length > 0) {
        setUploadErrors(fileErrors)
      }

      if (validFiles.length === 0) {
        setIsUploading(false)
        return
      }

      const uploadPromises = validFiles.map(async (file, index) => {
        const fileKey = `${file.name}-${Date.now()}-${index}`

        try {
          // Set initial progress
          setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }))

          const result = await uploadMutation.mutateAsync({
            file,
            fileType: "other"
          })

          // Complete progress
          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }))

          if (result.responseData && result.responseData.length > 0) {
            return {
              fileName: result.responseData[0].fileName,
              filePath: result.responseData[0].filePath,
              originalName: file.name,
              size: file.size,
              uploadedAt: new Date()
            }
          }
          return null
        } catch (error) {
          console.error('Failed to upload file:', file.name, error)
          setUploadErrors(prev => [...prev, {
            fileName: file.name,
            error: error instanceof Error ? error.message : 'Upload failed'
          }])
          return null
        } finally {
          // Clean up progress after delay
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev }
              delete newProgress[fileKey]
              return newProgress
            })
          }, 2000)
        }
      })

      try {
        const results = await Promise.all(uploadPromises)
        const successfulUploads = results.filter(Boolean) as Array<{
          fileName: string;
          filePath: string;
          originalName?: string;
          size?: number;
          uploadedAt?: Date
        }>

        if (successfulUploads.length > 0) {
          const newFiles = single ? successfulUploads : [...uploadedFiles, ...successfulUploads]
          setUploadedFiles(newFiles)

          // Update form value - single file returns string, multiple files return array
          const formValue = single ? newFiles[0]?.filePath || '' : newFiles.map(file => file.filePath)
          form.setValue(fieldName as any, formValue, {
            shouldValidate: true,
            shouldDirty: true
          })

          // Trigger field validation
          form.trigger(fieldName as any)
        }
      } catch (error) {
        console.error('Error uploading files:', error)
        setUploadErrors(prev => [...prev, {
          fileName: 'Upload Error',
          error: 'Failed to process uploads'
        }])
      } finally {
        setIsUploading(false)
      }
    }

    // Enhanced remove file with confirmation for multiple files
    const removeFile = (index: number) => {
      const fileToRemove = uploadedFiles[index]

      // Show confirmation for important files
      const confirmMessage = single || uploadedFiles.length === 1
        ? 'Remove this file?'
        : `Remove "${fileToRemove.originalName || fileToRemove.fileName}"?`

      if (!window.confirm(confirmMessage)) return

      const newFiles = uploadedFiles.filter((_, i) => i !== index)
      setUploadedFiles(newFiles)

      // Update form value - handle single vs multiple modes
      const formValue = single ? '' : newFiles.map(file => file.filePath)
      form.setValue(fieldName as any, formValue, {
        shouldValidate: true,
        shouldDirty: true
      })

      // Trigger field validation
      form.trigger(fieldName as any)
    }

    // Clear all files
    const clearAllFiles = () => {
      if (uploadedFiles.length === 0) return

      const confirmMessage = single ? 'Remove this file?' : `Remove all ${uploadedFiles.length} files?`
      if (window.confirm(confirmMessage)) {
        setUploadedFiles([])
        const formValue = single ? '' : []
        form.setValue(fieldName as any, formValue, {
          shouldValidate: true,
          shouldDirty: true
        })
        form.trigger(fieldName as any)
      }
    }

    // Format file size
    const formatFileSize = (bytes?: number): string => {
      if (!bytes) return 'Unknown size'
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
      <FormField
        control={form.control}
        name={fieldName as any}
        render={({ field, fieldState }) => (
          <FormItem className="col-span-2">
            {uploadedFiles.length < 1 && (
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  {label}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CircleAlert className='w-4 h-4' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p> Supported formats: JPG, PNG, GIF, WebP • Max size: {maxSizeInMB}MB {single ? '' : 'per file'}  </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
              </div>
            )}

            <FormControl>
              <div className="space-y-3">
                {/* File input */}
                {uploadedFiles.length < 1 && (
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.gif,.webp"
                      multiple={!single}
                      onChange={(e) => handleFileUpload(e.target.files)}
                      disabled={isUploading || (single && uploadedFiles.length >= 1) || (!single && uploadedFiles.length >= maxFiles)}
                      className="flex-1"
                    />
                    {isUploading && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload progress */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(uploadProgress).map(([key, progress]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{progress}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload errors */}
                {uploadErrors.length > 0 && (
                  <div className="space-y-2">
                    {uploadErrors.map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex items-center gap-2 text-red-800">
                          <X className="h-4 w-4" />
                          <div>
                            <div className="font-medium text-sm">{error.fileName}</div>
                            <div className="text-xs">{error.error}</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadErrors(prev => prev.filter((_, i) => i !== index))}
                            className="ml-auto h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {label}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CircleAlert className='w-4 h-4' />
                          </TooltipTrigger>
                          <TooltipContent>
                            ⚠️  select a new file to replace the current one
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={`${file.filePath}-${index}`}
                        className="relative flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3 overflow-hidden"
                      >
                        <div className="flex items-center gap-3 flex-1 pr-8">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-green-800 truncate">
                              {file.originalName || file.fileName}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-green-600 !text-wrap ">
                              <span className="font-mono truncate">{file.filePath}</span>
                              {file.size && (<span className="text-gray-500">({formatFileSize(file.size)})</span>)}
                            </div>
                            {file.uploadedAt && (
                              <div className="text-xs text-gray-500">
                                Uploaded: {file.uploadedAt.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="soft"
                          size="icon"
                          color="destructive"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 h-6 w-6 flex-shrink-0"
                          title={`Remove ${file.originalName || file.fileName}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload hints and limits */}
                <div className="text-xs text-gray-500 space-y-1">
                  {uploadedFiles.length === 0 && !isUploading ? (
                    <div>💡 Select {single ? 'an image file' : 'image files'} to automatically upload to the server</div>
                  ) : ""
                    // : (
                    // ((single && uploadedFiles.length >= 1) || (!single && uploadedFiles.length >= maxFiles)) && (
                    //   <div className="text-amber-600">
                    //     ⚠️ {single ? 'File uploaded' : `Maximum file limit reached (${maxFiles} files)`}
                    //     {single && ' - select a new file to replace the current one'}
                    //   </div>
                    // )
                    // )
                  }

                </div>
              </div>
            </FormControl>

            <FormMessage />

            {/* Field state debugging in development
            {process.env.NODE_ENV === 'development' && fieldState.error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                Field Error: {fieldState.error.message}
              </div>
            )} */}
          </FormItem>
        )}
      />
    )
  }

// Component for searchable staff selection
const SearchableStaffSelect: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  index: number
  onStaffSelect: (staff: any) => void
}> = ({ form, index, onStaffSelect }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchBy, setSearchBy] = useState<'code' | 'name'>('code')
  const [showResults, setShowResults] = useState(false)

  // Get current personnel list to exclude already selected staff
  const personnel = form.watch('personnel') || []
  const existingStaffIds = personnel.map(p => p.staffId).filter(Boolean)

  // Get staff data based on search criteria
  const { data: staffData, isLoading } = useStaff(
    {
      code: searchBy === 'code' ? searchTerm : '',
      name: searchBy === 'name' ? searchTerm : '',
      id: ''
    },
    searchTerm.length > 1 // Only search when there are at least 2 characters
  )

  // Transform staff data to options and filter out already selected staff
  const staffOptions = useMemo(() => {
    if (!staffData?.responseData) return []

    return staffData.responseData
      .filter(staff => !existingStaffIds.includes(staff.id)) // Filter out already selected staff
      .map(staff => ({
        value: staff.code,
        label: `${staff.code} - ${staff.name}`,
        staff: staff
      }))
  }, [staffData, existingStaffIds])

  const handleStaffSelection = (staffCode: string) => {
    const selectedStaff = staffData?.responseData.find(staff => staff.code === staffCode)
    if (selectedStaff) {
      // Check if staff is already selected (extra validation)
      if (existingStaffIds.includes(selectedStaff.id)) {
        alert('This staff member has already been added to the personnel list.')
        return
      }

      // Set form values
      form.setValue(`personnel.${index}.staffId`, selectedStaff.id)
      form.setValue(`personnel.${index}.staffCode`, selectedStaff.code)
      form.setValue(`personnel.${index}.name`, selectedStaff.name)
      form.setValue(`personnel.${index}.type`, selectedStaff.position.code)

      // Clear search
      setSearchTerm('')
      setShowResults(false)

      onStaffSelect(selectedStaff)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setShowResults(value.length > 1)
  }

  // Get current selected staff info
  const currentStaffId = form.watch(`personnel.${index}.staffId`)
  const currentStaffName = form.watch(`personnel.${index}.name`)

  return (
    <div className="space-y-2 relative">
      {/* Current selection display */}
      {currentStaffId && currentStaffName && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-800">
                Selected: {currentStaffName}
              </div>
              <div className="text-xs text-green-600">
                ID: {currentStaffId}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue(`personnel.${index}.staffId`, 0)
                form.setValue(`personnel.${index}.name`, '')
                form.setValue(`personnel.${index}.type`, '')
              }}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Search controls */}
      <div className="flex gap-2">
        <Select value={searchBy} onValueChange={(value: 'code' | 'name') => setSearchBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="code">By Code</SelectItem>
            <SelectItem value="name">By Name</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 relative">
          <Input
            placeholder={`Search staff by ${searchBy}... (min 2 chars)`}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchTerm.length > 1 && setShowResults(true)}
            className="flex-1"
          />

          {/* Search results dropdown */}
          {showResults && searchTerm.length > 1 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
              {isLoading ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  Searching staff...
                </div>
              ) : staffOptions.length > 0 ? (
                <div className="py-1">
                  {staffOptions.map((option) => (
                    <div
                      key={option.value}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleStaffSelection(option.value)}
                    >
                      <div className="font-medium text-gray-900">{option.staff.name}</div>
                      <div className="text-sm text-gray-500">
                        Code: <span className="font-mono">{option.staff.code}</span> |
                        Position: <span className="font-semibold">{option.staff.position.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : staffData?.responseData && staffData.responseData.length > 0 ? (
                <div className="p-3 text-sm text-amber-600 text-center">
                  <div className="font-medium">All matching staff already added</div>
                  <div className="text-xs mt-1">
                    Found {staffData.responseData.length} staff member(s), but they are already in the personnel list.
                  </div>
                </div>
              ) : (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No staff found for &quot;{searchTerm}&quot;
                </div>
              )}

              {/* Close button */}
              <div className="border-t border-gray-200 p-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResults(false)}
                  className="w-full text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search hint with personnel count */}
      {!currentStaffId && (
        <div className="text-xs text-gray-500">
          💡 Tip: Start typing to search for staff by {searchBy}. Select a staff member to auto-fill the fields below.
          {existingStaffIds.length > 0 && (
            <div className="mt-1 text-amber-600">
              ⚠️ {existingStaffIds.length} staff member(s) already added and will be excluded from search results.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const AircraftChecksSection: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  onAdd: () => void
  onRemove: (index: number) => void
  checkTypes: AircraftCheckType[]
  checkSubTypes: AircraftCheckSubType[]
  isLoadingCheckTypes: boolean
  isLoadingCheckSubTypes: boolean

}> = ({ form, onAdd, onRemove, ...props }) => {
  const maintenanceOptions = useMemo(() =>
    transformAircraftCheckTypesToOptions(props.checkTypes || []), [props.checkTypes]
  )

  const subTypeOptions = useMemo(() =>
    transformAircraftCheckSubTypesToOptions(props.checkSubTypes || []), [props.checkSubTypes]
  )

  const aircraftChecks = form.watch('aircraftChecks')

  // Don't render if still loading critical data
  if (props.isLoadingCheckTypes) {
    return (
      <Card className='border border-blue-200'>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Aircraft Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading aircraft check types...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border border-blue-200'>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Aircraft Checks</CardTitle>
        <Button type="button" onClick={onAdd} size="sm" color='primary'>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Check
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {aircraftChecks.map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Check {index + 1}</h4>
              {aircraftChecks.length > 1 && (
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  color="destructive"
                  onClick={() => onRemove(index)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`aircraftChecks.${index}.maintenanceTypes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Type *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        console.log("field.value:", field.value)
                        field.onChange(value)
                        // Clear sub types if TR is selected
                        if (value !== "TR") {
                          form.setValue(`aircraftChecks.${index}.maintenanceSubTypes`, [])
                        }
                      }}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select maintenance type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {maintenanceOptions && maintenanceOptions.length > 0 ? (
                          maintenanceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No maintenance types available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`aircraftChecks.${index}.maintenanceSubTypes`}
                render={({ field }) => {
                  const selectedMaintenanceType = form.watch(`aircraftChecks.${index}.maintenanceTypes`)
                  const isSubTypesDisabled = selectedMaintenanceType !== "TR"

                  return (
                    <FormItem>
                      <FormLabel>Sub Types</FormLabel>
                      <div className="space-y-2">
                        {subTypeOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              className=''
                              color='primary'
                              disabled={isSubTypesDisabled}
                              id={`${index}-${option.value}`}
                              checked={field.value?.includes(option.value)}
                              onCheckedChange={(checked) => {
                                console.log("onCheckedChange field.value:", checked, field.value)

                                if (isSubTypesDisabled) return
                                const updatedValue = checked
                                  ? [...(field.value || []), option.value]
                                  : (field.value || []).filter((value) => value !== option.value)
                                field.onChange(updatedValue)
                              }}
                            />
                            <label
                              htmlFor={`${index}-${option.value}`}
                              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isSubTypesDisabled ? 'text-gray-400' : ''
                                }`}
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      {isSubTypesDisabled && (
                        <p className="text-xs text-gray-400 mt-2">
                          **Subtypes can be used with TR maintenance types.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export const AdditionalDefectsSection: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  onAdd: () => void
  onRemove: (index: number) => void
}> = ({ form, onAdd, onRemove }) => {
  const additionalDefectRectification = form.watch('additionalDefectRectification')
  const additionalDefects = form.watch('additionalDefects') || []

  return (
    <Card className='border border-blue-200'>
      <CardHeader>
        <CardTitle>Additional Defect Rectification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="additionalDefectRectification"
          render={({ field }) => {
            console.log("additionalDefectRectification :object", field.value)
            return (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    color='primary'
                    checked={field.value}
                    onCheckedChange={() => {
                      field.onChange(!field.value)
                      // Clear defects if unchecked
                      if (field.value) {
                        form.setValue('additionalDefects', [])
                      } else {
                        onAdd() // Add initial defect when enabling
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Enable Additional Defect Rectification</FormLabel>
                </div>
              </FormItem>
            )
          }}
        />

        {additionalDefectRectification && (
          <>
            {/* <div className="flex justify-between items-center">
              <h4 className="font-medium">Defects List</h4>
              {additionalDefects.length < 6 && (
                <Button type="button" onClick={onAdd} size="sm" color='primary'>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Defect
                </Button>
              )}
            </div> */}

            {additionalDefects.length >= 6 && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Maximum 6 defects allowed. Remove an existing defect to add a new one.</span>
                </div>
              </div>
            )}

            {additionalDefects.map((_, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Defect {index + 1}</h5>
                  {additionalDefects.length > 1 ? (
                    <Button
                      type="button"
                      variant="soft"
                      size="sm"
                      color="destructive"
                      onClick={() => onRemove(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`additionalDefects.${index}.defect`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>Defect Details *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the defect..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`additionalDefects.${index}.ataChapter`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>ATA Chapter *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., 32-41-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`additionalDefects.${index}.laeMH`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LAE MH</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`additionalDefects.${index}.mechMH`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mech MH</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <PhotoUploadField
                    form={form}
                    fieldName={`additionalDefects.${index}.attachFiles`}
                    label="Attach Files"
                    value={form.getValues(`additionalDefects.${index}.attachFiles`) || null}
                  />
                </div>
                <div className="flex justify-end"></div>
              </div>
            ))}
            <div className="flex justify-end items-center">
              {/* <h4 className="font-medium">Defects List</h4> */}
              {additionalDefects.length < 6 && (
                <Button type="button" onClick={onAdd} size="sm" color='primary' >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Defect
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export const PersonnelSection: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  onAdd: () => void
  onRemove: (index: number) => void
}> = ({ form, onAdd, onRemove }) => {
  const addPersonnels = form.watch('addPersonnels')
  const personnel = form.watch('personnel') || []

  return (
    <Card className='border border-blue-200'>
      <CardHeader>
        <CardTitle>Personnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="addPersonnels"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  color='primary'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Add Personnel</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {addPersonnels && (
          <>
            <div className="space-y-4">
              <h4 className="font-medium">Staff Search & Selection</h4>
              <SearchableStaffSelect
                form={form}
                index={personnel.length} // Use current personnel length as next index
                onStaffSelect={(staff) => {
                  console.log('Selected staff:', staff)
                  // Add new personnel when staff is selected
                  onAdd()
                }}
              />
            </div>

            {personnel.length > 0 && (
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Personnel List ({personnel.length})</h4>
              </div>
            )}

            {/* personnel list */}
            {personnel.map((_, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h5 className="font-medium">Personnel {index + 1}</h5>
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    color='destructive'
                    onClick={() => onRemove(index)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.staffId`}
                      render={({ field }) => (
                        <FormItem className='hidden'>
                          <FormLabel>ID *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Selected staff ID"
                              {...field}
                              readOnly
                              className="bg-gray-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.staffCode`}
                      render={({ field }) => (
                        <FormItem >
                          <FormLabel>Staff Code *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Selected staff code"
                              {...field}
                              readOnly
                              className="bg-gray-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-6">
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Selected staff name"
                              {...field}
                              readOnly
                              className="bg-gray-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Staff position/type"
                              {...field}
                              readOnly
                              className="bg-gray-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='col-span-6  grid grid-cols-1 md:grid-cols-12 gap-4'>
                    <div className='col-span-12'> <FormLabel>From *</FormLabel> </div>
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.formDate`}
                      render={({ field }) => (
                        <FormItem className='col-span-6'>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.formTime`}
                      render={({ field }) => (
                        <FormItem className='col-span-6'>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='col-span-6 grid grid-cols-1 md:grid-cols-12 gap-4'>
                    <div className='col-span-12'>
                      <FormLabel>To *</FormLabel>
                    </div>
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.toDate`}
                      render={({ field }) => (
                        <FormItem className='col-span-6'>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.toTime`}
                      render={({ field }) => (
                        <FormItem className='col-span-6'>
                          <FormControl >
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`personnel.${index}.remark`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-12">
                        <FormLabel>Remark</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card >
  )
}
