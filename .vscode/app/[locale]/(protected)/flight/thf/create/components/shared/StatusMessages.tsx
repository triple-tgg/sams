import React from 'react'
import { Button } from "@/components/ui/button"

interface StatusMessagesProps {
  // Error state
  isError?: boolean
  error?: Error | null
  errorTitle?: string
  errorMessage?: string
  onDismissError?: () => void
  
  // Success state
  isSuccess?: boolean
  successTitle?: string
  successMessage?: string
  onDismissSuccess?: () => void
  
  // Warning state
  isWarning?: boolean
  warningTitle?: string
  warningMessage?: string
  onDismissWarning?: () => void
  
  // Info state
  isInfo?: boolean
  infoTitle?: string
  infoMessage?: string
  onDismissInfo?: () => void
  
  // Styling
  className?: string
}

const StatusMessages: React.FC<StatusMessagesProps> = ({
  isError = false,
  error,
  errorTitle = "Unable to Save Data",
  errorMessage,
  onDismissError,
  
  isSuccess = false,
  successTitle = "Data Saved Successfully",
  successMessage,
  onDismissSuccess,
  
  isWarning = false,
  warningTitle = "Warning",
  warningMessage,
  onDismissWarning,
  
  isInfo = false,
  infoTitle = "Information",
  infoMessage,
  onDismissInfo,
  
  className = ""
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Message */}
      {isError && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">✕</span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {errorTitle}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {errorMessage || error?.message || 'An error occurred while saving your information. Please check your entries and try again.'}
              </div>
              {onDismissError && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onDismissError}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Dismiss Error
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">
                {successTitle}
              </h3>
              <div className="mt-2 text-sm text-green-700">
                {successMessage || 'Your information has been securely saved. You can now proceed to the next step.'}
              </div>
              {onDismissSuccess && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onDismissSuccess}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning Message */}
      {isWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">⚠</span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {warningTitle}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                {warningMessage}
              </div>
              {onDismissWarning && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onDismissWarning}
                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Message */}
      {isInfo && (
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">ℹ</span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                {infoTitle}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                {infoMessage}
              </div>
              {onDismissInfo && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onDismissInfo}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatusMessages
