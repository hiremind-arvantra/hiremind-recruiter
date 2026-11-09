interface Step {
  n: number;
  title: string;
  caption: string;
  done: boolean;
}

interface Props {
  current: number;
  steps: Step[];
}

export default function VerticalStepper({ current, steps }: Props) {
  return (
    <ol aria-label="Registration progress" className="card p-4">
      {steps.map((s, i) => {
        const active = s.n === current;
        const last   = i === steps.length - 1;
        return (
          <li key={s.n} aria-current={active ? "step" : undefined}
            className={`relative flex items-start gap-3.5 rounded-2xl px-2 py-2.5 ${active ? "bg-brand-50/70" : ""}`}>
            {!last && (
              <span aria-hidden="true"
                className={`absolute left-6 top-11 -bottom-2.5 w-px ${s.done ? "bg-brand-300" : "bg-ink-200"}`} />
            )}
            <span className={`relative grid place-items-center w-8 h-8 rounded-full text-caption font-bold shrink-0 ${
              s.done   ? "bg-[image:var(--gradient-brand)] text-white" :
              active   ? "bg-white text-brand-700 ring-2 ring-brand-500" :
                          "bg-white text-ink-400 ring-1 ring-ink-200"
            }`}>
              {s.done ? (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : s.n}
            </span>
            <div className="min-w-0 pt-0.5">
              <div className={`text-body-sm font-bold ${active ? "text-ink-900" : s.done ? "text-ink-800" : "text-ink-500"}`}>{s.title}</div>
              <div className={`text-caption ${s.done ? "text-green-700 font-semibold" : "text-ink-500"}`}>{s.caption}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
