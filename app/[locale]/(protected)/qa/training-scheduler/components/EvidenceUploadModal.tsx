import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UploadCloud, File as FileIcon, X, Loader2, CheckCircle } from 'lucide-react'
import { uploadFile, type UploadedFile } from '@/lib/api/uploadFile/fileUpload'
import { upsertScheduleAttachment } from '@/lib/api/qa/schedule-attachment'
import { updateSchedulerStatus } from '@/lib/api/qa/scheduler'
import { schedulerKeys } from '@/lib/api/qa/scheduler.hooks'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Props {
    isOpen: boolean
    onClose: () => void
    scheduleId: number
    completedStatusId: number | null
    onUploadSuccess: (uploadedFiles: UploadedFile[]) => void
}

export function EvidenceUploadModal({ isOpen, onClose, scheduleId, completedStatusId, onUploadSuccess }: Props) {
    const qc = useQueryClient()
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedCount, setUploadedCount] = useState(0)
    const [statusText, setStatusText] = useState('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (files.length === 0) return
        setIsUploading(true)
        setUploadedCount(0)
        setStatusText('Uploading files...')

        const allUploaded: UploadedFile[] = []

        try {
            // Step 1: Upload all files
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
                const fileName = `${scheduleId}_${fileNameWithoutExt}`

                setStatusText(`Uploading file ${i + 1} of ${files.length}...`)
                const res = await uploadFile(file, 'training_materials', fileName)

                if (res.responseData && res.responseData.length > 0) {
                    allUploaded.push(...res.responseData)
                }
                setUploadedCount(i + 1)
            }

            // Step 2: Upsert each attachment record
            setStatusText('Saving attachment records...')
            for (const uploaded of allUploaded) {
                await upsertScheduleAttachment({
                    id: 0,
                    trainingScheduleId: scheduleId,
                    fileName: uploaded.fileName,
                    filePath: uploaded.filePath,
                    fileType: uploaded.fileType,
                    fileSize: 0,
                })
            }

            // Step 3: Update scheduler status to Completed
            if (completedStatusId) {
                setStatusText('Updating status to Completed...')
                await updateSchedulerStatus({
                    trainingScheduleId: scheduleId,
                    trainingDataStatusesId: completedStatusId,
                })
                // Invalidate scheduler queries so the UI refreshes
                qc.invalidateQueries({ queryKey: schedulerKeys.detail(scheduleId) })
                qc.invalidateQueries({ queryKey: schedulerKeys.all })
            }

            toast.success(`Successfully uploaded ${allUploaded.length} evidence file(s). Status updated to Completed.`)
            onUploadSuccess(allUploaded)
            setFiles([])
            setUploadedCount(0)
            setStatusText('')
        } catch (err: any) {
            console.error('Evidence upload failed:', err)
            toast.error(err?.message || 'Failed to upload files. Please try again.')
            setStatusText('')
        } finally {
            setIsUploading(false)
        }
    }

    const handleClose = () => {
        if (!isUploading) {
            setFiles([])
            setUploadedCount(0)
            setStatusText('')
            onClose()
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Training Evidence</DialogTitle>
                    <DialogDescription>
                        Please attach required documents (e.g., Evaluation Form, Attendance Sheet) to complete this session.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-2">
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 relative hover:border-primary/40 hover:bg-primary/5 transition-colors">
                        <input 
                            type="file" 
                            multiple 
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploading}
                        />
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Click or drag files here to upload</p>
                        <p className="text-xs text-slate-500 mt-1">Supports PDF, JPG, PNG</p>
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-white border rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                        {isUploading && idx < uploadedCount ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <FileIcon className="w-4 h-4 text-primary shrink-0" />
                                        )}
                                        <span className="text-xs font-medium truncate">{file.name}</span>
                                        <span className="text-[10px] text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                                    </div>
                                    {!isUploading && (
                                        <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-2 border-none bg-transparent cursor-pointer">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {isUploading && statusText && (
                        <div className="text-xs text-muted-foreground text-center">
                            {statusText}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isUploading}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                        {isUploading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Upload & Complete'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
