
import React, { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { X, CheckCircle, CircleAlert } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AdditionalDefectAttachFile } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'

// ---------- Component: PhotoPreview ----------
export const PhotoPreview: React.FC<{
  file: AdditionalDefectAttachFile
  onRemove: (file: AdditionalDefectAttachFile) => void
  label?: string
}> = ({ file, onRemove, label = 'Photo' }) => {
  useEffect(() => {
    console.log("PhotoPreview file:", file);
  }, [file]);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleAlert className='w-4 h-4 text-gray-500' />
            </TooltipTrigger>
            <TooltipContent>
              <p>⚠️ Select a new file to replace the current one</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="relative flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
        <div className="flex items-center gap-3 flex-1 pr-8">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-green-800 truncate">{file.realName}</div>
            <div className="text-xs text-green-600 truncate">
              <a href={file.storagePath} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {file.storagePath}
              </a>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="soft"
          size="icon"
          color="destructive"
          onClick={() => onRemove(file)}
          className="absolute top-2 right-2 h-6 w-6 flex-shrink-0"
          title={`Remove ${file.realName}`}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
