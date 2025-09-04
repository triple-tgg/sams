import { z } from 'zod'

/**
 * Schema for individual attach file entry validation
 */
const attachFileEntrySchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string()
    .min(1, 'File name is required')
    .max(100, 'File name must be less than 100 characters'),
  file: z.any().nullable(), // File object or null for existing files
  fileType: z.string().min(1, 'File type is required'),
  status: z.enum(['pending', 'uploading', 'completed', 'error']),
  progress: z.number().min(0).max(100),
  storagePath: z.string().optional(),
  realName: z.string().optional(),
  error: z.string().optional()
})

/**
 * Main schema for attach file form validation
 */
export const attachFileFormSchema = z.object({
  attachFiles: z.array(attachFileEntrySchema)
    .min(1, 'At least one file is required')
    .max(10, 'Maximum 10 files allowed')
    .refine(
      (files) => files.some(file => file.status === 'completed' || file.file !== null),
      {
        message: 'At least one file must be selected or uploaded'
      }
    )
})

/**
 * Type inference from schema
 */
export type AttachFileFormSchema = z.infer<typeof attachFileFormSchema>

/**
 * Schema for API submission (only completed files)
 */
export const attachFileApiSchema = z.array(
  z.object({
    storagePath: z.string().min(1, 'Storage path is required'),
    realName: z.string().min(1, 'Real name is required'),
    fileType: z.string().min(1, 'File type is required')
  })
).min(1, 'At least one completed file is required')

/**
 * Custom validation for file size and type
 */
export const validateFileConstraints = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB')
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]

  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not supported. Please upload images, PDF, Word, Excel, or text files.')
  }

  // Check filename
  if (file.name.length > 255) {
    errors.push('Filename is too long (max 255 characters)')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
