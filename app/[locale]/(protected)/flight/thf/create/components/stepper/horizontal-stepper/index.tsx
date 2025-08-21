import clsx from 'clsx'
import { Check } from 'lucide-react'

interface Step {
  label: string
  step: number // 1-based
}

interface StepperProps {
  steps: Step[]
  activeStep: number // 1-based
  onStepClick?: (n: number) => void
}

const Stepper: React.FC<StepperProps> = ({ steps, activeStep, onStepClick }) => {
  const total = steps.length
  const segments = Math.max(1, total - 1)
  const clamped = Math.min(Math.max(activeStep, 1), Math.max(total, 1))
  const width = `${((clamped - 1) / segments) * 100}%`

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10">
      <div className="before:transform-y-1/2 relative mt-14 flex justify-between before:absolute before:top-1/2 before:left-0 before:h-1 before:w-full before:bg-slate-200">
        {steps.map(({ step, label }) => (
          <div className="relative z-10" key={step}>
            <div
              className={clsx(`flex size-16 items-center justify-center rounded-full border-2 border-zinc-200 bg-white transition-all delay-200 ease-in`, activeStep >= step ? 'border-lime-600' : ''
              )}
            >
              {activeStep > step ? (
                <div className="-scale-x-100 rotate-45 text-2xl font-semibold text-lime-600">
                  L
                </div>
              ) : (
                <span className="text-lg font-medium text-zinc-400">{step}</span>
              )}
            </div>
            <div className="absolute top-20 left-3/4  -translate-x-2/4 -translate-y-2/4 w-[80px]">
              <span className="text-xs font-semibold text-zinc-400">{label}</span>
            </div>
          </div>
        ))}
        <div
          className="transform-y-1/2 absolute top-1/2 left-0 h-1 w-full bg-lime-600 transition-all delay-200 ease-in"
          style={{ width: width }}
        ></div>
      </div>

    </div>
  )
}

export default Stepper
