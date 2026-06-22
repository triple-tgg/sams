import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UploadCloud, File, X } from 'lucide-react'

interface Props {
    isOpen: boolean
    onClose: () => void
    onUploadSuccess: (files: File[]) => void
}

export function EvidenceUploadModal({ isOpen, onClose, onUploadSuccess }: Props) {
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = () => {
        setIsUploading(true)
        // Simulate upload delay
        setTimeout(() => {
            onUploadSuccess(files)
            setIsUploading(false)
            setFiles([])
        }, 1000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Training Evidence</DialogTitle>
                    <DialogDescription>
                        Please attach required documents (e.g., Evaluation Form, Attendance Sheet) to complete this session.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-2">
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 relative">
                        <input 
                            type="file" 
                            multiple 
                            onChange={handleFileChange} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Click or drag files here to upload</p>
                        <p className="text-xs text-slate-500 mt-1">Supports PDF, JPG, PNG</p>
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-white border rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <File className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-xs font-medium truncate">{file.name}</span>
                                    </div>
                                    <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-2">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                        {isUploading ? 'Uploading...' : 'Upload & Complete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
