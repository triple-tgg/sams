import React from 'react'
import StepWrapper from './step-wrapper'
import FlightStep from './FlightStep'
import ServicesStep from './ServicesStep'
import PartsAndToolsStep from './PartsAndToolsStep'
import EquipmentStep from './EquipmentStep'
import AttachFileStep from './AttachFile'
const steps = [
  { label: 'Flight', step: 1 },
  { label: 'Services', step: 2 },
  { label: 'Equipment', step: 3 },
  { label: 'Parts & Tools', step: 4 },
  { label: 'Attach file', step: 5 },
]

const StepForm = () => {
  return (
    <div className="p-4">
      <StepWrapper steps={steps}>
        <FlightStep />
        <ServicesStep />
        <EquipmentStep />
        <PartsAndToolsStep />
        <AttachFileStep />
      </StepWrapper>
    </div>
  )
}

export default StepForm
