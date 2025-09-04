import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, X, FileText, Image as ImageIcon, File, CheckCircle, AlertCircle } from 'lucide-react'
import { AttachFileData } from '@/lib/api/hooks/useAttachFileUpload'
import { formatFileSize, isImageFile } from './utils'
import { validateFileConstraints } from './schema'

interface FileUploadCardProps {
  file: AttachFileData
  onRemove: (id: string) => void
  onUpdateName: (id: string, name: string) => void
  onUpload: (id: string) => void
  disabled?: boolean
}

/**
 * Individual file upload card component
 */
export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  file,
  onRemove,
  onUpdateName,
  onUpload,
  disabled = false
}) => {
  const [nameEdit, setNameEdit] = useState(file.name)

  // Get appropriate icon based on file type
  const getFileIcon = () => {
    if (!file.file) return <File className="w-5 h-5" />
    
    if (isImageFile(file.file)) {
      return <ImageIcon className="w-5 h-5" />
    }
    
    return <FileText className="w-5 h-5" />
  }

  // Get status color
  const getStatusColor = () => {
    switch (file.status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'uploading':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get status icon
  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
      default:
        return null
    }
  }

  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* File Icon */}
          <div className="flex-shrink-0 mt-1">
            {getFileIcon()}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            {/* File Name Input */}
            <div className="mb-2">
              <Input
                value={nameEdit}
                onChange={(e) => setNameEdit(e.target.value)}
                onBlur={() => onUpdateName(file.id, nameEdit)}
                placeholder="Enter file name"
                disabled={disabled || file.status === 'uploading'}
                className="text-sm"
              />
            </div>

            {/* File Details */}
            {file.file && (
              <div className="text-xs text-gray-500 mb-2">
                {file.file.name} • {formatFileSize(file.file.size)}
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-xs ${getStatusColor()}`}>
                <div className="flex items-center gap-1">
                  {getStatusIcon()}
                  {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                </div>
              </Badge>
            </div>

            {/* Progress Bar (show only when uploading) */}
            {file.status === 'uploading' && (
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {file.progress}% uploaded
                </div>
              </div>
            )}

            {/* Error Message */}
            {file.status === 'error' && file.error && (
              <div className="text-xs text-red-600 mt-1">
                {file.error}
              </div>
            )}

            {/* Upload Button */}
            {file.status === 'pending' && file.file && (
              <Button
                size="sm"
                onClick={() => onUpload(file.id)}
                disabled={disabled}
                className="mt-2"
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </Button>
            )}
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(file.id)}
            disabled={disabled || file.status === 'uploading'}
            className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface FileDropZoneProps {
  onFilesSelected: (files: FileList) => void
  disabled?: boolean
  maxFiles?: number
  currentFileCount?: number
}

/**
 * File drop zone component for selecting files
 */
export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  disabled = false,
  maxFiles = 10,
  currentFileCount = 0
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const remainingSlots = maxFiles - currentFileCount
  const canAddFiles = remainingSlots > 0 && !disabled

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !canAddFiles) return

    // Validate files before adding
    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(files).forEach(file => {
      const validation = validateFileConstraints(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.forEach(error => errors.push(`${file.name}: ${error}`))
      }
    })

    if (errors.length > 0) {
      // You could show these errors via toast or other notification
      console.warn('File validation errors:', errors)
    }

    if (validFiles.length > 0) {
      const fileList = new DataTransfer()
      validFiles.slice(0, remainingSlots).forEach(file => fileList.items.add(file))
      onFilesSelected(fileList.files)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
        ${isDragOver && canAddFiles ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
        ${canAddFiles ? 'hover:border-blue-400 hover:bg-blue-50 cursor-pointer' : 'bg-gray-50 cursor-not-allowed'}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => canAddFiles && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={!canAddFiles}
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      
      <div className="flex flex-col items-center gap-4">
        <Upload className={`w-12 h-12 ${canAddFiles ? 'text-gray-400' : 'text-gray-300'}`} />
        
        {canAddFiles ? (
          <>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-1">
                You can add {remainingSlots} more file{remainingSlots !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Supports: Images, PDF, Word, Excel, Text files (max 10MB each)
            </div>
          </>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-500">
              {disabled ? 'File upload disabled' : 'Maximum files reached'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Remove some files to add new ones
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
