import React, { useCallback } from 'react'
import { useUploadFile } from '@/lib/api/hooks/useFileUpload'
import { nanoid } from '@/lib/utils/nanoidLike'
import type { AdditionalDefectAttachFile } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'

// ---------- Constants ----------
const MAX_SIZE_MB = 10
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// ---------- Hook: usePhotoUpload ----------
export function usePhotoUpload(opts: {
  maxSizeInMB?: number
  thfNumber: string
  fileType?: "thfnumber" | "service";
}) {
  const { maxSizeInMB = MAX_SIZE_MB, thfNumber, fileType = 'service' } = opts
  const uploadMutation = useUploadFile()

  const validateFile = useCallback((file: File): string | null => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    if (file.size > maxSizeInBytes) return `File size exceeds ${maxSizeInMB}MB limit`
    if (!ALLOWED_MIME_TYPES.includes(file.type)) return 'Only image files are allowed (JPG, PNG, GIF, WebP)'
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) return `File type ${ext} is not allowed`
    return null
  }, [maxSizeInMB])

  const uploadFile = useCallback(async (file: File, onProgress?: (p: number) => void) => {
    const validationError = validateFile(file)
    if (validationError) throw new Error(validationError)

    const fileName = `${thfNumber}_${nanoid(5)}`

    const result = await uploadMutation.mutateAsync({ file, fileType, fileName })

    const payload = result?.responseData
    const entry = Array.isArray(payload) ? payload[0] : payload
    if (!entry || !entry.filePath || !entry.fileName) {
      throw new Error('Upload response missing expected fields')
    }

    const uploaded: Partial<AdditionalDefectAttachFile> = {
      additionalDefectId: '',
      fileType,
      id: null,
      isDelete: false,
      realName: entry.fileName,
      storagePath: entry.filePath
    }

    return uploaded as AdditionalDefectAttachFile
  }, [uploadMutation, validateFile, thfNumber, fileType])

  return { uploadFile }
}
