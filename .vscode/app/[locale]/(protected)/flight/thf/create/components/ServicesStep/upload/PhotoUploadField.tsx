import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, CircleAlert } from 'lucide-react'
import { ServicesFormInputs } from '../types'
import { useUploadFile } from '@/lib/api/hooks/useFileUpload'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { nanoid } from '@/lib/utils/nanoidLike'
import type { AdditionalDefectAttachFile } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { usePhotoUpload } from './usePhotoUpload'
import { PhotoPreview } from './PhotoPreview'

// ---------- Constants ----------
const MAX_SIZE_MB = 10
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']


// ---------- Main Component: PhotoUploadField ----------
interface PhotoUploadFieldProps {
  form: UseFormReturn<ServicesFormInputs>
  fieldName: string
  label?: string
  value?: AdditionalDefectAttachFile | null
  onChange?: (value: AdditionalDefectAttachFile[]) => void
  maxSizeInMB?: number
  thfNumber: string
}

// Helper function to compare file objects
const areFilesEqual = (a: AdditionalDefectAttachFile | null, b: AdditionalDefectAttachFile | null): boolean => {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.id === b.id &&
    a.realName === b.realName &&
    a.storagePath === b.storagePath &&
    a.isDelete === b.isDelete &&
    a.additionalDefectId === b.additionalDefectId
  )
}



const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({
  form,
  fieldName,
  label = 'Photo',
  value = null,
  onChange,
  maxSizeInMB = MAX_SIZE_MB,
  thfNumber
}) => {
  // Internal state
  // const valueParser = useMemo(() => {
  //   if (!value) return null;
  //   return getActiveFile(Array.isArray(value) ? value : [value]);
  // }, [value]);

  const [fileData, setFileData] = useState<AdditionalDefectAttachFile | null>(() => value)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  console.log("value:PhotoUploadField:value", value)
  console.log("value:PhotoUploadField:fileData", fileData)

  const lastExternalValueRef = useRef<AdditionalDefectAttachFile | null>(value)
  // Prevent update loops
  const updateInProgressRef = useRef(false)
  const initializedRef = useRef(false)
  const { uploadFile } = usePhotoUpload({ maxSizeInMB, thfNumber, fileType: 'service' })
  // Function to update form and notify parent
  const updateForm = useCallback(
    (value: AdditionalDefectAttachFile | AdditionalDefectAttachFile[] | null) => {
      if (updateInProgressRef.current) return;

      // Normalize input → always array
      const newArray: AdditionalDefectAttachFile[] = Array.isArray(value)
        ? value
        : value
          ? [value]
          : [];
      const current = form.getValues(fieldName as any);
      const currentArray: AdditionalDefectAttachFile[] = Array.isArray(current)
        ? current
        : [];

      // Compare arrays deeply
      const isSame =
        currentArray.length === newArray.length &&
        currentArray.every((item, index) => areFilesEqual(item, newArray[index]));

      if (isSame) return;

      updateInProgressRef.current = true;

      form.setValue(fieldName as any, newArray, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });

      if (onChange) {
        Promise.resolve().then(() => {
          onChange(newArray);
          updateInProgressRef.current = false;
        });
      } else {
        updateInProgressRef.current = false;
      }
    },
    [form, fieldName, onChange]
  );

  useEffect(() => {
    // Skip if we're updating
    if (updateInProgressRef.current) return
    // Check if external value changed
    const externalChanged = !areFilesEqual(lastExternalValueRef.current, value)

    if (externalChanged || !initializedRef.current) {
      lastExternalValueRef.current = value
      initializedRef.current = true

      // Update internal state if different
      if (!areFilesEqual(fileData, value)) {
        setFileData(value)
        updateForm(value)
      }
    }
  }, [value, fileData, updateForm])

  const shouldShowFile = useMemo(() => !!fileData && !fileData.isDelete, [fileData])
  // Handle file upload
  const handleFileInput = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]

    setUploadError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploaded = await uploadFile(file, (p: number) => setUploadProgress(p))

      const normalized: AdditionalDefectAttachFile = {
        additionalDefectId: fileData?.additionalDefectId ?? '',
        fileType: uploaded.fileType ?? 'service',
        id: null,
        isDelete: false,
        realName: uploaded.realName,
        storagePath: uploaded.storagePath
      }

      setFileData(normalized)
      updateForm(normalized)
      setUploadProgress(100)
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed')
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1200)
    }
  }, [uploadFile, updateForm, fileData])

  // Handle file removal
  const handleRemove = useCallback((file: AdditionalDefectAttachFile | null) => {
    if (!file) return

    const confirmed = window.confirm('Remove this file?')
    if (!confirmed) return
    // Use microtask to avoid synchronous state updates
    Promise.resolve().then(() => {
      if (file.id) {
        // Existing file: mark as deleted
        const deleted = { ...file, isDelete: true }
        setFileData(deleted)
        updateForm(deleted)
      } else {
        // New file: remove completely
        setFileData(null)
        updateForm(null)
        console.log("file:deleted :null")
      }
    })
  }, [updateForm])

  // Handle input reset (for form reset scenarios)
  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name === fieldName) {
        const formValue = form.getValues(fieldName as any)
        if (!formValue || (Array.isArray(formValue) && formValue.length === 0)) {
          if (fileData && !updateInProgressRef.current) {
            setFileData(null)
          }
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, fieldName, fileData])

  return (
    <FormField
      control={form.control}
      name={fieldName as any}
      render={({ field, fieldState }) => (
        <FormItem className="col-span-2">
          {!shouldShowFile && (
            <div className="flex items-center gap-2">
              <FormLabel>{label}</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CircleAlert className='w-4 h-4 text-gray-500' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supported formats: JPG, PNG, GIF, WebP • Max size: {maxSizeInMB}MB</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          <FormControl>
            <div className="space-y-3">
              {!shouldShowFile && (
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept={ALLOWED_EXTENSIONS.join(',')}
                    onChange={(e) => handleFileInput(e.target.files)}
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
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{uploadProgress}%</span>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <X className="h-4 w-4" />
                    <div className="text-sm">{uploadError}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadError(null)}
                      className="ml-auto h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {shouldShowFile && fileData && (
                <PhotoPreview file={fileData} onRemove={handleRemove} label={label} />
              )}

              {!shouldShowFile && !isUploading && (
                <div className="text-xs text-gray-500">💡 Select an image file to automatically upload to the server</div>
              )}
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default PhotoUploadField