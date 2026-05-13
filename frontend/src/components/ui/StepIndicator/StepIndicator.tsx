const STEPS = [
  { step: 1, label: 'Upload' },
  { step: 2, label: 'Clarify' },
  { step: 3, label: 'Tickets' },
] as const

type StepIndicatorProps = {
  activeStep: 1 | 2 | 3
}

export function StepIndicator({ activeStep }: StepIndicatorProps) {
  return (
    <nav
      aria-label="Progress"
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm"
    >
      {STEPS.map(({ step, label }, i) => {
        const isActive = step === activeStep
        const isDone = step < activeStep
        return (
          <div key={step} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                  isActive
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                    : isDone
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200'
                      : 'border-slate-600 bg-slate-900 text-slate-500',
                ].join(' ')}
              >
                {isDone ? '✓' : step}
              </span>
              <span
                className={
                  isActive
                    ? 'font-semibold text-white'
                    : isDone
                      ? 'text-emerald-200/90'
                      : 'text-slate-500'
                }
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <span
                className="hidden sm:inline text-slate-600"
                aria-hidden
              >
                →
              </span>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
