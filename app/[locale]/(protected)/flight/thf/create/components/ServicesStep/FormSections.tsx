import React, { useState, useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PlusIcon, TrashIcon, Upload, X, CheckCircle } from 'lucide-react'
import { ServicesFormInputs, staffList, FluidOption, transformAircraftCheckTypesToOptions, transformAircraftCheckSubTypesToOptions } from './types'
import { useAircraftCheckMasterData } from '@/lib/api/hooks/useAircraftCheckMasterData'
import { useStaff, transformStaffToOptions } from '@/lib/api/hooks/useStaff'
import { useUploadFile } from '@/lib/api/hooks/useFileUpload'

interface FormFieldsProps {
  form: UseFormReturn<ServicesFormInputs>
  onAddAircraftCheck: () => void
  onRemoveAircraftCheck: (index: number) => void
  onAddDefect: () => void
  onRemoveDefect: (index: number) => void
  onAddPersonnel: () => void
  onRemovePersonnel: (index: number) => void
  onAddEngineOilSet: () => void
  onRemoveEngineOilSet: (index: number) => void
}

// Component for photo upload with automatic file upload
const PhotoUploadField: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  fieldName: string
  label?: string
}> = ({ form, fieldName, label = "Photo" }) => {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileName: string; filePath: string }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const uploadMutation = useUploadFile()

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const result = await uploadMutation.mutateAsync({
          file,
          fileType: "other"
        })

        if (result.responseData && result.responseData.length > 0) {
          return {
            fileName: result.responseData[0].fileName,
            filePath: result.responseData[0].filePath
          }
        }
        return null
      } catch (error) {
        console.error('Failed to upload file:', file.name, error)
        return null
      }
    })

    try {
      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(Boolean) as Array<{ fileName: string; filePath: string }>

      if (successfulUploads.length > 0) {
        const newFiles = [...uploadedFiles, ...successfulUploads]
        setUploadedFiles(newFiles)

        // Update form value with file paths
        const filePaths = newFiles.map(file => file.filePath)
        form.setValue(fieldName as any, filePaths)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)

    // Update form value
    const filePaths = newFiles.map(file => file.filePath)
    form.setValue(fieldName as any, filePaths)
  }

  return (
    <FormField
      control={form.control}
      name={fieldName as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="space-y-3">
              {/* File input */}
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={isUploading}
                  className="flex-1"
                />
                {isUploading && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
              </div>

              {/* Upload progress */}
              {uploadMutation.isPending && (
                <div className="text-sm text-blue-600 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Uploading files...
                </div>
              )}

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Uploaded Files ({uploadedFiles.length}):
                  </div>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="text-sm font-medium text-green-800">
                            {file.fileName}
                          </div>
                          <div className="text-xs text-green-600 font-mono">
                            {file.filePath}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload hint */}
              {uploadedFiles.length === 0 && !isUploading && (
                <div className="text-xs text-gray-500">
                  💡 Select image files to automatically upload them to the server
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
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
      .filter(staff => !existingStaffIds.includes(staff.code)) // Filter out already selected staff
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
      if (existingStaffIds.includes(selectedStaff.code)) {
        alert('This staff member has already been added to the personnel list.')
        return
      }

      // Set form values
      form.setValue(`personnel.${index}.staffId`, selectedStaff.code)
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
                form.setValue(`personnel.${index}.staffId`, '')
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
}> = ({ form, onAdd, onRemove }) => {
  const { checkTypes, checkSubTypes, isLoadingCheckTypes, isLoadingCheckSubTypes } = useAircraftCheckMasterData()
  const maintenanceOptions = useMemo(() => 
    transformAircraftCheckTypesToOptions(checkTypes || []), [checkTypes]
  )

  const subTypeOptions = useMemo(() => 
    transformAircraftCheckSubTypesToOptions(checkSubTypes || []), [checkSubTypes]
  )

  const aircraftChecks = form.watch('aircraftChecks')

  // Don't render if still loading critical data
  if (isLoadingCheckTypes) {
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
                <FormLabel>Enable Additional Defect Rectification</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {additionalDefectRectification && (
          <>
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Defects</h4>
              {additionalDefects.length < 6 && (
                <Button type="button" onClick={onAdd} size="sm" color='primary'>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Defect
                </Button>
              )}
            </div>

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
                      <FormItem className="md:col-span-2">
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
                      <FormItem>
                        <FormLabel>ATA Chapter *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 32-41-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <PhotoUploadField
                    form={form}
                    fieldName={`additionalDefects.${index}.photo`}
                    label="Photo"
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
                </div>
              </div>
            ))}
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
                <div className="flex justify-between items-center">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`personnel.${index}.staffId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff ID *</FormLabel>
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

                  <FormField
                    control={form.control}
                    name={`personnel.${index}.from`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`personnel.${index}.to`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`personnel.${index}.remark`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remark</FormLabel>
                        <FormControl>
                          <Input placeholder="Additional notes" {...field} />
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
    </Card>
  )
}
