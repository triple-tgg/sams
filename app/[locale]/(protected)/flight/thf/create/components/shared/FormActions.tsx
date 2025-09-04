import React from 'react'
import { Button } from "@/components/ui/button"

interface FormActionsProps {
  // Navigation props
  onBack: () => void
  onSubmit?: () => void
  onReset?: () => void
  
  // Loading states
  isLoading?: boolean
  isSubmitting?: boolean
  
  // Button text customization
  backText?: string
  submitText?: string
  resetText?: string
  loadingText?: string
  
  // Button states
  disableBack?: boolean
  disableSubmit?: boolean
  disableReset?: boolean
  
  // Show/hide buttons
  showReset?: boolean
  showSubmit?: boolean
  
  // Styling
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'soft'
}

const FormActions: React.FC<FormActionsProps> = ({
  onBack,
  onSubmit,
  onReset,
  isLoading = false,
  isSubmitting = false,
  backText = "← Back",
  submitText = "Next Step →",
  resetText = "Reset",
  loadingText = "Saving...",
  disableBack = false,
  disableSubmit = false,
  disableReset = false,
  showReset = true,
  showSubmit = true,
  className = "",
  variant = 'default'
}) => {
  const isAnyLoading = isLoading || isSubmitting

  return (
    <div className={`bg-gray-50 rounded-lg p-6 border border-gray-200 ${className}`}>
      <div className="flex justify-between items-center">
        {/* Back Button */}
        <Button
          type="button"
          color="secondary"
          variant="soft"
          onClick={onBack}
          disabled={disableBack || isAnyLoading}
        >
          {backText}
        </Button>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Reset Button */}
          {showReset && onReset && (
            <Button
              type="button"
              variant="outline"
              color="primary"
              onClick={onReset}
              disabled={disableReset || isAnyLoading}
            >
              {resetText}
            </Button>
          )}

          {/* Submit Button */}
          {showSubmit && (
            <Button
              type={onSubmit ? "button" : "submit"}
              onClick={onSubmit}
              disabled={disableSubmit || isAnyLoading}
              color="primary"
            >
              {isAnyLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {loadingText}
                </div>
              ) : (
                submitText
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FormActions
