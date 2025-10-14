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
  const attachFileOtherData: AttachFileOtherData[] = data.responseData.attachFilesOthers.map(file => ({
    storagePath: file.storagePath,
    realName: file.realName,
    fileType: file.fileType
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
      storagePath: file.storagePath!,
      realName: file.realName!,
      fileType: file.fileType
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
