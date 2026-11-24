import { createContext, useContext } from 'react'

export type SubmitPhase =
  | 'idle'
  | 'saving_files'
  | 'validating'
  | 'validation_error'
  | 'sharepoint'
  | 'sharepoint_error'
  | 'success'
  | 'error'

/** Field to highlight after "Fix" on a failed THF validation (form field name + message to show under it). */
export type FixFieldTarget = { name: string; message: string }

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
  setIsDrafting?: (isDrafting: boolean) => void
  closeModal?: () => void
  submitPhase?: SubmitPhase
  setSubmitPhase?: (phase: SubmitPhase) => void
  /** Fields the target step should mark as errors and focus once it mounts (consumed then cleared). */
  fixTargets?: FixFieldTarget[] | null
  setFixTargets?: (targets: FixFieldTarget[] | null) => void
}

export const StepContext = createContext<StepContextType | undefined>(undefined)

export const useStep = () => {
  const context = useContext(StepContext)
  if (!context) {
    throw new Error('useStep must be used within a StepProvider')
  }
  return context
}
