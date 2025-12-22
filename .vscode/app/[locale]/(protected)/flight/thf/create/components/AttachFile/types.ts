import { AttachFileOtherData } from '@/lib/api/lineMaintenances/attachfile-other/putAttachfileOther'

/**
 * Form inputs for the AttachFile step
 */
export interface AttachFileFormInputs {
  attachFiles: AttachFileEntry[]
}

/**
 * Individual attach file entry in the form
 */
export interface AttachFileEntry {
  id: string | null
  name: string
  file: File | null
  fileType: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  storagePath?: string
  realName?: string
  error?: string
  isDelete: boolean
}

/**
 * Props for AttachFileStep component
 */
export interface AttachFileStepProps {
  initialData?: AttachFileOtherData[] | null
}

/**
 * Default values for the attach file form
 */
export const getDefaultAttachFileValues = (): AttachFileFormInputs => ({
  attachFiles: [] // Start with empty array - files are optional
})

/**
 * Map API data to form data
 */
export const mapApiDataToAttachFileForm = (
  apiData?: AttachFileOtherData[] | null
): AttachFileFormInputs => {
  if (!apiData || apiData.length === 0) {
    return getDefaultAttachFileValues()
  }

  const attachFiles: AttachFileEntry[] = apiData.map((item, index) => ({
    id: item.id,//`existing-${index}`,
    name: item.realName.split('.')[0], // Remove extension
    file: null, // Existing files don't have File objects
    fileType: item.fileType,
    status: 'completed',
    progress: 100,
    storagePath: item.storagePath,
    realName: item.realName,
    isDelete: false
  }))

  return { attachFiles }
}

/**
 * Validate file type and size
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB'
    }
  }

  // Check file type (allow common file types)
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload images, PDF, or Office documents.'
    }
  }

  return { valid: true }
}
