import { createContext, useContext } from 'react'

type StepContextType = {
  currentStep: number
  totalSteps: number
  goToStep: (index: number) => void
  goNext: () => void
  goBack: () => void
  onSave: (data: any) => void
}

export const StepContext = createContext<StepContextType | undefined>(undefined)

export const useStep = () => {
  const context = useContext(StepContext)
  if (!context) {
    throw new Error('useStep must be used within a StepProvider')
  }
  return context
}
