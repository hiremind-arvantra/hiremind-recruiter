import { JOB_STEPS, type StepNum } from "./types";

interface Props {
  current: StepNum;
}

/* Wizard progress: numbered nodes joined by a track that fills as steps complete.
 * Below `sm` the labels collapse to a single "Step n of 4 · Label" line. */
export default function JobStepper({ current }: Props) {
  const activeStep = JOB_STEPS.find((s) => s.n === current);
  return (
    <div className="w-full">
      <ol aria-label="Job posting progress" className="flex items-start w-full">
        {JOB_STEPS.map((s, i) => {
          const done   = s.n < current;
          const active = s.n === current;
          const last   = i === JOB_STEPS.length - 1;
          return (
            <li key={s.n} aria-current={active ? "step" : undefined} className="flex items-start flex-1 last:flex-none min-w-0">
              <div className="flex flex-col items-center sm:min-w-24">
                <span
                  className={`w-9 h-9 rounded-full grid place-items-center text-body-sm font-bold tabular transition-all duration-300 ${
                    done   ? "bg-brand-600 text-white shadow-glow" :
                    active ? "bg-[image:var(--gradient-brand)] text-white shadow-glow ring-4 ring-brand-100" :
                              "bg-white text-ink-500 border border-ink-200"
                  }`}
                >
                  {done ? (
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : s.n}
                  <span className="sr-only">{done ? " (completed)" : ""}</span>
                </span>
                <span className={`hidden sm:block mt-2 text-caption font-semibold whitespace-nowrap ${
                  active ? "text-ink-900" : done ? "text-ink-700" : "text-ink-500"
                }`}>
                  {s.label}
                </span>
              </div>
              {!last && (
                <span aria-hidden="true" className="relative flex-1 h-1 mt-4 mx-2 sm:mx-1 rounded-full bg-ink-100 overflow-hidden">
                  <span className={`absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-brand-600 to-brand-400 transition-all duration-300 ${done ? "w-full" : "w-0"}`} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {activeStep && (
        <p className="sm:hidden mt-3 text-caption text-ink-500">
          Step {current} of {JOB_STEPS.length} · <span className="font-semibold text-ink-900">{activeStep.label}</span>
        </p>
      )}
    </div>
  );
}
