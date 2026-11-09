"use client";

const STEP_LABELS = [
  "Basic Information",
  "Professional Details",
  "Skills & Preferences",
  "Review & Submit",
];

/*
 * Guided-flow stepper. A single track runs through the four step nodes and its fill
 * slides forward as the candidate advances. Labels sit under every node from `sm`; on a
 * phone the current step's label is spelled out above the track instead, so the
 * control always fits a 320px screen.
 */
export default function ProgressStepper({ current }: { current: number }) {
  const total = STEP_LABELS.length;
  const pct = ((Math.min(Math.max(current, 1), total) - 1) / (total - 1)) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-3 sm:hidden">
        <span className="text-caption font-semibold text-ink-500 tabular">Step {current} of {total}</span>
        <span className="text-body-sm font-semibold text-ink-900 truncate">{STEP_LABELS[current - 1]}</span>
      </div>

      <ol aria-label="Registration progress" className="relative grid grid-cols-4">
        {/* track + sliding fill, spanning node centre to node centre */}
        <span aria-hidden="true" className="absolute top-4 left-[12.5%] right-[12.5%] h-1 -translate-y-1/2 rounded-full bg-ink-200/80">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-[image:var(--gradient-brand)] transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </span>

        {STEP_LABELS.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className="relative flex flex-col items-center text-center"
            >
              <span
                className={`relative grid place-items-center w-8 h-8 rounded-full text-caption font-bold transition-all duration-300 ${
                  done
                    ? "bg-[image:var(--gradient-brand)] text-white shadow-glow"
                    : active
                      ? "bg-white text-brand-700 ring-2 ring-brand-500 outline-4 outline-offset-2 outline-brand-500/15"
                      : "bg-white text-ink-400 ring-1 ring-ink-200"
                }`}
              >
                {done ? (
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
                <span className="sr-only">{done ? " (completed)" : active ? " (current)" : ""}</span>
              </span>
              <span
                className={`mt-2 hidden sm:block px-1 text-caption font-semibold leading-tight ${
                  active ? "text-ink-900" : done ? "text-brand-700" : "text-ink-400"
                }`}
              >
                {label}
              </span>
              <span className="sr-only sm:hidden">{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
