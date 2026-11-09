interface Props {
  current: 1 | 2 | 3;
}

const STEPS = [
  { n: 1, label: "Company Details" },
  { n: 2, label: "Admin Details"   },
  { n: 3, label: "Verification"    },
] as const;

/*
 * Three-node progress track for company registration. The fill slides between node
 * centres as the recruiter advances; labels wrap under their node so the control fits a
 * 320px screen.
 */
export default function HorizontalStepper({ current }: Props) {
  const pct = ((current - 1) / (STEPS.length - 1)) * 100;
  return (
    <ol aria-label="Registration progress" className="relative grid grid-cols-3 w-full sm:w-[360px] shrink-0">
      <span aria-hidden="true" className="absolute top-4 left-[16.667%] right-[16.667%] h-1 -translate-y-1/2 rounded-full bg-ink-200/80">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-[image:var(--gradient-brand)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </span>
      {STEPS.map((s) => {
        const done    = s.n < current;
        const active  = s.n === current;
        return (
          <li key={s.n} aria-current={active ? "step" : undefined} className="relative flex flex-col items-center text-center">
            <span className={`grid place-items-center w-8 h-8 rounded-full text-caption font-bold transition-all duration-300 ${
              done   ? "bg-[image:var(--gradient-brand)] text-white shadow-glow" :
              active ? "bg-white text-brand-700 ring-2 ring-brand-500 outline-4 outline-offset-2 outline-brand-500/15" :
                        "bg-white text-ink-400 ring-1 ring-ink-200"
            }`}>
              {done ? (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : s.n}
              <span className="sr-only">{done ? " (completed)" : active ? " (current)" : ""}</span>
            </span>
            <span className={`mt-2 px-1 text-micro sm:text-caption font-semibold leading-tight ${active ? "text-ink-900" : done ? "text-brand-700" : "text-ink-400"}`}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
