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
    // const payload = makeFormPayload(uiFiles);
    // console.log("payload:", uiFiles)
    // don't pass File objects into form
    // form.setValue('attachFiles', payload, {
    //   shouldValidate: true,
    //   shouldDirty: true,
    //   shouldTouch: true,
    // });
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

    setFiles(prev => {
      const next = [...prev, ...fileData];
      // sync with form but only serializable data
      syncForm(next);
      return next;
    });
  }, [form]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const next = prev
        .map(file => {
          if (file.id === id) {
            if (String(file.id).startsWith('uploaded-')) {
              return null;
            }
            return { ...file, isDelete: true };
          }
          return file;
        })
        .filter(Boolean) as AttachFileData[];
      syncForm(next);

      return next;
    });
  }, [form]);

  // Update file name (UI only)
  const updateFileName = useCallback((id: string, name: string) => {
    setFiles(prev => {
      const next = prev.map(file => file.id === id ? { ...file, name } : file);
      // name is serializable, so sync
      syncForm(next);
      return next;
    });
  }, [form]);

  // Upload single file
  const uploadFile = useCallback(async (id: string) => {
    // find file
    const target = files.find(f => f.id === id);
    if (!target) return;

    // update status uploading (mutate object safely via setFiles functional update)
    setFiles(prev => {
      const next = prev.map(f => f.id === id ? { ...f, status: 'uploading' as const, progress: 0 } : f);
      // do not include File in form, but update form with other fields
      syncForm(next);
      return next;
    });

    try {
      if (!target.file) throw new Error('File is null');
      const response = await uploadFileMutation.mutateAsync({
        file: target.file,
        fileType: 'thfnumber',
        fileName: `${thfNumber}_${nanoid(5)}`
      });

      if (response?.responseData && response.responseData.length > 0) {
        const uploadedFile = response.responseData[0];

        setFiles(prev => {
          const next = prev.map(f =>
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
          );
          syncForm(next);
          return next;
        });
      }
    } catch (err: any) {
      setFiles(prev => {
        const next = prev.map(f =>
          f.id === id
            ? { ...f, status: 'error' as const, error: err?.message ?? 'Upload failed' }
            : f
        );
        syncForm(next);
        return next;
      });
    }
  }, [files, uploadFileMutation, thfNumber, form]);



  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

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
      .filter(file => file.status === 'completed' && file.storagePath && file.realName)
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
