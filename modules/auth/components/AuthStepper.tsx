interface AuthStepperProps {
  steps: string[];
  activeStep?: number;
}

export default function AuthStepper({ steps, activeStep = 0 }: AuthStepperProps) {
  return (
    <div className="shrink-0 border-b border-ink-100 py-2.5">
      <div className="mx-auto max-w-[520px] px-6">
        <div className="flex items-start justify-between">
          {steps.map((step, i) => {
            const isActive = i === activeStep;
            const isPast   = i < activeStep;
            const isDone   = isActive || isPast;
            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-body-sm border-2 transition-colors ${
                    isDone
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "bg-white border-ink-300 text-ink-400"
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-micro font-semibold whitespace-nowrap transition-colors ${
                    isDone ? "text-brand-600" : "text-ink-400"
                  }`}>
                    {step}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-2 transition-colors ${
                    isPast ? "bg-brand-400" : "bg-ink-200"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
