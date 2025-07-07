import React from 'react'
import StepWrapper from './step-wrapper'
import FlightStep from './Flight.step'
import FluidStep from './Fluid.step'
import ServicesStep from './Services.step'
import PersonnelStep from './Personnel.step'
import PartsAndToolsStep from './PartsAndTools.step'
import EquipmentStep from './Equipment.step'

const steps = [
  { label: 'Flight' },
  { label: 'Fluid' },
  { label: 'Services' },
  { label: 'Personnel' },
  { label: 'Equipment' },
  { label: 'Parts & Tools' },
]

const StepForm = () => {
  return (
    <div className="p-4">
      <StepWrapper steps={steps}>
        <FlightStep />
        <FluidStep flightNumber={''} />
        <ServicesStep />
        <PersonnelStep />
        <EquipmentStep />
        <PartsAndToolsStep />
      </StepWrapper>
    </div>
  )
}

export default StepForm
