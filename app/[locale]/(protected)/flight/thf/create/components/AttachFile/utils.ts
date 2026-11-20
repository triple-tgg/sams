import { AttachFileFormInputs, getDefaultAttachFileValues, mapApiDataToAttachFileForm } from './types'
import { AttachFileOtherData } from '@/lib/api/lineMaintenances/attachfile-other/putAttachfileOther'
import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'

/**
 * Get default values for the attach file form
 */
export const getDefaultValues = (): AttachFileFormInputs => {
  return getDefaultAttachFileValues()
}

/**
 * Map THF data to attach file form data
 * @param data - THF response data
 * @returns Transformed form data
 */
export const mapDataThfToAttachFileStep = (
  data?: LineMaintenanceThfResponse | null
): AttachFileFormInputs => {
  if (!data?.responseData?.attachFilesOthers || data.responseData.attachFilesOthers.length === 0) {
    return getDefaultValues()
  }

  // Transform AttachFile to AttachFileOtherData format
  const attachFileOtherData: AttachFileOtherData[] = data?.responseData?.attachFilesOthers.map(file => ({
    id: file.id || "",
    storagePath: file.storagePath || "",
    realName: file.realName || "",
    fileType: file.fileType || "",
    isDelete: file.isDelete || false
  }))
  console.log("mapApiDataToAttachFileForm(attachFileOtherData)", mapApiDataToAttachFileForm(attachFileOtherData))
  return mapApiDataToAttachFileForm(attachFileOtherData)
}

/**
 * Prepare form data for API submission
 * @param formData - Form data from React Hook Form
 * @returns Array of attach file data for API
 */
export const prepareAttachFileDataForApi = (
  formData: AttachFileFormInputs
): AttachFileOtherData[] => {
  // Handle case where attachFiles might be undefined
  if (!formData.attachFiles || formData.attachFiles.length === 0) {
    return []
  }

  return formData.attachFiles
    .filter(file => file.status === 'completed' && file.storagePath && file.realName)
    .map(file => ({
      id: file.id && !String(file.id).startsWith('uploaded-') ? file.id : null,
      storagePath: file.storagePath!,
      realName: file.realName!,
      fileType: file.fileType,
      isDelete: file.isDelete || false
    }))
}

/**
 * Generate a unique ID for file entries
 */
export const generateFileId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 * @param filename - File name
 * @returns File extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Check if file is an image
 * @param file - File object
 * @returns Boolean indicating if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

/**
 * Sanitize filename for display
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * THF modal step (0-based index, same order as `steps` in CreateThfModal) that a
 * thf-validate-for-done error message most likely belongs to, so the user can jump there to fix it.
 * Matching is keyword based because the API returns plain text messages.
 * Order matters: more specific keywords (parts/tools) are checked before broader ones (equipment).
 */
const VALIDATION_STEP_RULES: { step: number; label: string; keywords: RegExp }[] = [
  { step: 3, label: 'Parts & Tools', keywords: /\b(parts?|tools?|p\/n|part ?no|serial)\b/i },
  { step: 2, label: 'Equipment', keywords: /\bequipment|gse\b/i },
  { step: 1, label: 'Services', keywords: /\b(services?|check ?types?|checks?|personnel|staff|mech|engineer|cs|lae|defects?|fluid|oil|hydraulic|fuel|uplift|flight ?deck)\b/i },
  { step: 0, label: 'Flight Info', keywords: /\b(flight|sta|std|ata|atd|eta|arrival|departure|station|airline|a\/?c ?(reg|type)|aircraft|registration|bay|towing|route)\b/i },
  { step: 5, label: 'Attach File', keywords: /\b(attach(ment|ed)?|files?|documents?)\b/i },
]

export const getStepForValidationError = (message: string): { step: number; label: string } | null => {
  const rule = VALIDATION_STEP_RULES.find(r => r.keywords.test(message))
  return rule ? { step: rule.step, label: rule.label } : null
}
