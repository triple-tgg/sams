import { useState, useCallback } from 'react'
import { AttachFileOtherData } from '../lineMaintenances/attachfile-other/putAttachfileOther'
import { useUploadFile } from './useFileUpload'
import { AttachFileFormInputs } from '@/app/[locale]/(protected)/flight/thf/create/components/AttachFile/types'
import { nanoid } from '@/lib/utils/nanoidLike'
import { UseFormReturn } from 'react-hook-form'

export interface AttachFileData {
  id: string | null
  file: File | null
  name: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  storagePath?: string
  realName?: string
  fileType: string
  error?: string
  isDelete: boolean
}

export interface UseAttachFileUploadReturn {
  files: AttachFileData[]
  addFiles: (files: FileList | File[]) => void
  removeFile: (id: string) => void
  updateFileName: (id: string, name: string) => void
  clearFiles: () => void
  uploadFile: (id: string) => Promise<void>
  uploadAllFiles: () => Promise<void>
  getCompletedFilesData: () => AttachFileOtherData[]
  hasFiles: boolean
  hasCompletedFiles: boolean
  isUploading: boolean
}

/**
 * Hook for managing file uploads in the AttachFile step
 * Handles file selection, upload progress, and data preparation for API calls
 */
export const useAttachFileUpload = (form: UseFormReturn<AttachFileFormInputs>, initialData: AttachFileFormInputs, thfNumber: string): UseAttachFileUploadReturn => {
  const [files, setFiles] = useState<AttachFileData[]>(initialData.attachFiles)
  const uploadFileMutation = useUploadFile()

  // Generate unique ID for files
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Add files to the upload queue
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const fileData: AttachFileData[] = fileArray.map(file => ({
      id: `uploaded-${generateId()}`,
      file,
      name: file.name.split('.')[0], // Remove extension for name
      progress: 0,
      status: 'pending',
      fileType: 'thfnumber', // Default to 'thfnumber' as specified in API
      isDelete: false
    }))

    setFiles(prev => [...prev, ...fileData])
  }, [])

  // Remove a file from the upload queue
  // const removeFile = useCallback((id: string) => {
  //   setFiles(prev => prev.map(file =>
  //     file.id === id ? { ...file, isDelete: true } : file
  //   ))
  // }, [])
  const removeFile = useCallback((id: string) => {
    const newData = files.filter(file => file.id !== id)
    // const newData = files.map(file => file.id === id ? { ...file, isDelete: true } : file)
    console.log("removeFile newData", newData)
    form.setValue('attachFiles', files)

    setFiles(newData)
    // setFiles(prev => prev.filter(file => file.id !== id))
  }, [files, form])

  // Update file name
  const updateFileName = useCallback((id: string, name: string) => {
    setFiles(prev => prev.map(file =>
      file.id === id ? { ...file, name } : file
    ))
  }, [])

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  // Upload a single file
  const uploadFile = useCallback(async (id: string) => {
    const fileIndex = files.findIndex(f => f.id === id)
    if (fileIndex === -1) return

    const fileData = files[fileIndex]

    // Update status to uploading
    setFiles(prev => prev.map(file =>
      file.id === id
        ? { ...file, status: 'uploading', progress: 0 }
        : file
    ))

    try {
      // Use the existing upload hook
      if (fileData.file === null) {
        throw new Error("File is null");
      }
      const response = await uploadFileMutation.mutateAsync({
        file: fileData.file,
        fileType: 'thfnumber',
        fileName: `${thfNumber}_${nanoid(5)}`
      })

      if (response.responseData && response.responseData.length > 0) {
        const uploadedFile = response.responseData[0]

        setFiles(prev => prev.map(file =>
          file.id === id
            ? {
              ...file,
              status: 'completed',
              progress: 100,
              storagePath: uploadedFile.filePath,
              realName: uploadedFile.fileName
            }
            : file
        ))
      }
    } catch (error) {
      setFiles(prev => prev.map(file =>
        file.id === id
          ? {
            ...file,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          }
          : file
      ))
    }
  }, [files, uploadFileMutation, thfNumber])

  // Upload all pending files
  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')

    for (const file of pendingFiles) {
      await uploadFile(file.id || '')
    }
  }, [files, uploadFile])

  // Get completed files data for API submission
  const getCompletedFilesData = useCallback((): AttachFileOtherData[] => {
    return files
      .filter(file => !file.isDelete && file.status === 'completed' && file.storagePath && file.realName)
      .map(file => ({
        id: file.id,
        storagePath: file.storagePath!,
        realName: file.realName!,
        fileType: file.fileType,
        isDelete: file.isDelete || false
      }))
  }, [files])

  // Computed properties
  // const hasFiles = files.filter(f => !f.isDelete).length > 0
  // const hasCompletedFiles = files.some(f => !f.isDelete && f.status === 'completed')
  // const isUploading = files.some(f => !f.isDelete && f.status === 'uploading') || uploadFileMutation.isPending
  const hasFiles = files.length > 0
  const hasCompletedFiles = files.some(f => f.status === 'completed')
  const isUploading = files.some(f => f.status === 'uploading') || uploadFileMutation.isPending

  return {
    files,
    addFiles,
    removeFile,
    updateFileName,
    clearFiles,
    uploadFile,
    uploadAllFiles,
    getCompletedFilesData,
    hasFiles,
    hasCompletedFiles,
    isUploading
  }
}
