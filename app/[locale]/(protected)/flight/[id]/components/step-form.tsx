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
  { label: 'Flight' },
  // { label: 'Fluid' },
  { label: 'Services' },
  // { label: 'Personnel' },
  { label: 'Equipment' },
  { label: 'Parts & Tools' },
  { label: 'Attach file' },
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
