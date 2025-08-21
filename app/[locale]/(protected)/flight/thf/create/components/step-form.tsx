import React from 'react'
import StepWrapper from './step-wrapper'
import FlightStep from './Flight.step'
import FluidStep from './Fluid.step'
import ServicesStep from './Services.step'
import PersonnelStep from './Personnel.step'
import PartsAndToolsStep from './PartsAndTools.step'
import EquipmentStep from './Equipment.step'
import AttachFileStep from './AttachFile.step'

const steps = [
  { label: 'Flight', step: 1 },
  // { label: 'Fluid' },
  { label: 'Services', step: 2 },
  // { label: 'Personnel' },
  { label: 'Equipment', step: 3 },
  { label: 'Parts & Tools', step: 4 },
  { label: 'Attach file', step: 5 },
]

const StepForm = () => {
  return (
    <div className="p-4">
      <StepWrapper steps={steps}>
        <FlightStep />
        <ServicesStep flightNumber={''} />
        <EquipmentStep />
        <PartsAndToolsStep />
        <AttachFileStep />
      </StepWrapper>
    </div>
  )
}

export default StepForm
