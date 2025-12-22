import { Check } from 'lucide-react'

interface Step {
  label: string
  step: number // 1-based
}

interface StepperProps {
  steps: Step[];
  activeStep: number;
  onStepClick?: (n: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, activeStep, onStepClick }) => {
  const total = steps.length
  const segments = Math.max(1, total - 1)
  const clamped = Math.min(Math.max(activeStep, 1), Math.max(total, 1))
  const width = `${((clamped - 1) / segments) * 100}%`

  return (
    <div
      className="mx-auto w-full max-w-2xl px-4 pb-10"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total || 1}
      aria-valuenow={clamped}
    >
      <div className="relative mt-14 flex justify-between before:absolute before:top-1/2 before:left-0 before:h-1 before:w-full before:-translate-y-1/2 before:bg-slate-200">
        {steps.map(({ step, label }) => {
          const isDone = clamped > step
          const isActive = clamped === step
          return (
            <button
              type="button"
              key={step}
              onClick={onStepClick ? () => onStepClick(step) : undefined}
              className="relative z-10 select-none"
            >
              <div
                className={[
                  'flex size-16 items-center justify-center rounded-full border-2 bg-white transition-all delay-200 ease-in',
                  isDone || isActive ? 'border-slate-400' : 'border-zinc-200',
                ].join(' ')}
              >
                {isDone ? (
                  <Check className="text-slate-400" />
                ) : (
                  <span className="text-lg font-medium text-zinc-400">{step}</span>
                )}
              </div>

              <div className="absolute top-24 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="text-lg font-semibold text-zinc-400">{label}</span>
              </div>
            </button>
          )
        })}

        {/* progress line */}
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-slate-400 transition-all delay-200 ease-in"
          style={{ width }}
        />
      </div>
    </div>
  )
}

export default Stepper
