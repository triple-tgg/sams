import { createContext, useContext } from 'react'

type StepContextType = {
  activeStep: number
  currentStep: number
  totalSteps: number
  goToStep: (index: number) => void
  goNext: () => void
  goBack: () => void
  onSave: (data: any) => void
  setSubmitHandler?: (handler: () => void) => void
  setDraftHandler?: (handler: () => void) => void
  isModal?: boolean
  setIsSubmitting?: (isSubmitting: boolean) => void
  closeModal?: () => void
}

export const StepContext = createContext<StepContextType | undefined>(undefined)

export const useStep = () => {
  const context = useContext(StepContext)
  if (!context) {
    throw new Error('useStep must be used within a StepProvider')
  }
  return context
}
