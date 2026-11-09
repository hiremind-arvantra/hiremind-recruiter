const SIDEBAR_STEPS = [
  "Basic Info",
  "Professional Details",
  "Skills & Preferences",
  "Review & Submit",
];

const TIPS: Record<number, string[]> = {
  2: [
    "Add complete experience and projects",
    "Include all your education qualifications",
    "This helps in better job matching",
  ],
  3: [
    "Add relevant skills and certifications",
    "Highlight your key skills to stand out",
    "Set accurate preferences for better matches",
  ],
  4: [
    "Ensure your information is accurate",
    "A complete profile increases your chances",
    "You can update your profile anytime",
  ],
};

interface SidebarProgressProps {
  currentStep: number;
}

export default function SidebarProgress({ currentStep }: SidebarProgressProps) {
  const progress = currentStep === 4 ? 100 : ((currentStep - 1) / 3) * 100;
  const tips = TIPS[currentStep] ?? TIPS[4];

  return (
    <div className="space-y-3">
      {/* Progress widget */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-body-sm font-bold text-ink-900">
            Registration Progress
          </span>
          <span className="badge badge-brand tabular">
            Step {currentStep} of 4
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Registration progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="h-1.5 rounded-full bg-ink-100 overflow-hidden"
        >
          <div
            className="h-full rounded-full transition-[width] duration-500 bg-[image:var(--gradient-brand)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-3 space-y-1.5">
          {SIDEBAR_STEPS.map((s, i) => {
            const n = i + 1;
            const done = n < currentStep;
            const active = n === currentStep;
            return (
              <li key={s} aria-current={active ? "step" : undefined} className="flex items-center gap-2.5">
                <span
                  className={`grid place-items-center w-5 h-5 rounded-full text-nano font-bold shrink-0 ${
                    done
                      ? "bg-[image:var(--gradient-brand)] text-white"
                      : active
                        ? "bg-white text-brand-700 ring-2 ring-brand-500"
                        : "bg-white text-ink-400 ring-1 ring-ink-200"
                  }`}
                >
                  {done ? (
                    <svg aria-hidden="true" width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : n}
                </span>
                <span className={`text-caption ${active ? "font-bold text-ink-900" : done ? "font-medium text-ink-600" : "text-ink-400"}`}>
                  {s}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Tips */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="icon-tile w-7 h-7 rounded-lg bg-peach-50 text-peach-700">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span className="font-bold text-body-sm text-ink-900">Tips</span>
        </div>
        <ul className="space-y-2">
          {tips.map((tip) => (
            <li
              key={tip}
              className="flex items-start gap-2 text-body-sm text-ink-600 leading-snug"
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-success"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Need help */}
      <div className="flex items-start gap-3 px-1 py-1">
        <span className="icon-tile w-8 h-8 rounded-lg bg-white text-ink-500 border border-ink-200/70">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" /><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </span>
        <div className="min-w-0">
          <div className="font-bold text-body-sm text-ink-900">Need Help?</div>
          <p className="text-caption text-ink-500">
            Our support team is here to assist you.
          </p>
          <a
            href="mailto:contact@arvantra-ai.com"
            className="mt-0.5 inline-block text-body-sm text-brand-700 font-semibold hover:underline break-all"
          >
            contact@arvantra-ai.com
          </a>
        </div>
      </div>
    </div>
  );
}
