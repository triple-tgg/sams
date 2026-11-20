import { useState, useCallback, useRef } from 'react'
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
  /** Uploads every pending file and resolves with the latest file list (form is already in sync). */
  uploadAllFiles: () => Promise<AttachFileData[]>
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
  // Latest file list, readable synchronously (React state updaters may run lazily on the next render)
  const filesRef = useRef<AttachFileData[]>(initialData.attachFiles)
  const uploadFileMutation = useUploadFile()

  // Generate unique ID for files
  const generateId = () => Math.random().toString(36).substr(2, 9)
  // helper: convert UI state to serializable form data
  const makeFormPayload = (uiFiles: AttachFileData[]): AttachFileData[] => {
    console.log("makeFormPayload", uiFiles)
    return uiFiles.map(f => ({
      id: f.id && typeof f.id === 'string' ? f.id : null,
      file: null, // Always null in form data (File objects are not serializable)
      name: f.name,
      progress: f.progress,
      status: f.status,
      storagePath: f.storagePath ?? '',
      realName: f.realName ?? f.name ?? '',
      fileType: f.fileType,
      error: f.error,
      isDelete: !!f.isDelete
    }));
  };

  // sync UI state -> form (ONLY serializable fields)
  const syncForm = (uiFiles: AttachFileData[]) => {
    console.log("uiFiles:", uiFiles)
    const payload = makeFormPayload(uiFiles);
    console.log("payload:", payload)
    // don't pass File objects into form
    form.setValue('attachFiles', payload, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // Apply a change to the file list: update the ref, UI state and form synchronously,
  // so callers that await an upload can read the form right away.
  const commitFiles = (updater: (prev: AttachFileData[]) => AttachFileData[]) => {
    const next = updater(filesRef.current);
    filesRef.current = next;
    setFiles(next);
    syncForm(next);
    return next;
  };

  // Add files (keep File in UI state only)
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const fileData: AttachFileData[] = fileArray.map(file => ({
      id: `uploaded-${generateId()}`,
      file,
      name: file.name.split('.')[0],
      progress: 0,
      status: 'pending' as const,
      fileType: 'thfnumber',
      isDelete: false
    }));

    commitFiles(prev => [...prev, ...fileData]);
  }, [form]);

  const removeFile = useCallback((id: string) => {
    commitFiles(prev =>
      prev
        .map(file => {
          if (file.id === id) {
            if (String(file.id).startsWith('uploaded-')) {
              return null;
            }
            return { ...file, isDelete: true };
          }
          return file;
        })
        .filter(Boolean) as AttachFileData[]
    );
  }, [form]);

  // Update file name (UI only)
  const updateFileName = useCallback((id: string, name: string) => {
    commitFiles(prev => prev.map(file => file.id === id ? { ...file, name } : file));
  }, [form]);

  // Upload single file
  const uploadFile = useCallback(async (id: string) => {
    // find file
    const target = filesRef.current.find(f => f.id === id);
    if (!target) return;

    commitFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'uploading' as const, progress: 0, error: undefined } : f));

    try {
      if (!target.file) throw new Error('File is null');
      const response = await uploadFileMutation.mutateAsync({
        file: target.file,
        fileType: 'thfnumber',
        fileName: `${thfNumber}_${nanoid(5)}`
      });

      if (response?.responseData && response.responseData.length > 0) {
        const uploadedFile = response.responseData[0];

        commitFiles(prev =>
          prev.map(f =>
            f.id === id
              ? {
                ...f,
                status: 'completed' as const,
                progress: 100,
                storagePath: uploadedFile.filePath,
                realName: uploadedFile.fileName,
                // keep file: null or keep file to allow re-upload? recommended to keep file = null
                file: null
              }
              : f
          )
        );
      } else {
        throw new Error('Upload returned no file');
      }
    } catch (err: any) {
      commitFiles(prev =>
        prev.map(f =>
          f.id === id
            ? { ...f, status: 'error' as const, error: err?.message ?? 'Upload failed' }
            : f
        )
      );
    }
  }, [uploadFileMutation, thfNumber, form]);



  // Clear all files
  const clearFiles = useCallback(() => {
    commitFiles(() => [])
  }, [form])

  // Upload all pending files
  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = filesRef.current.filter(f => f.status === 'pending' && !f.isDelete)

    for (const file of pendingFiles) {
      await uploadFile(file.id || '')
    }
    return filesRef.current
  }, [uploadFile])

  const getCompletedFilesData = useCallback((): AttachFileOtherData[] => {
    return files
      .filter(file => file.status === 'completed' && file.storagePath && file.realName)
      .map(file => ({
        id: file.id && !String(file.id).startsWith('uploaded-') ? file.id : null,
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
