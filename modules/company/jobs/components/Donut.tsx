/* Conic-gradient donut + colour legend, shared by the job-insights and
 * application-summary panels. Pass an explicit `pct` per segment to control the
 * wedge size + legend percentage; otherwise it is derived from count / total.
 * `color` is any CSS colour (prefer theme vars, e.g. "var(--color-success)"). */
export interface DonutSegment {
  label: string;
  count: number;
  color: string;
  pct?: number;
}

export function Donut({ segments, total, centerLabel, centerValue }: {
  segments: DonutSegment[];
  total?: number;
  centerLabel: string;
  centerValue: number | string;
}) {
  const sum = (total ?? segments.reduce((acc, s) => acc + s.count, 0)) || 1;
  let acc = 0;
  const stops = segments
    .map((s) => {
      const span = s.pct ?? (s.count / sum) * 100;
      const start = acc;
      acc += span;
      return `${s.color} ${start}% ${acc}%`;
    })
    .join(", ");

  return (
    <div className="flex flex-wrap items-center gap-5">
      {/* Ring: a lit track behind the data wedges, and a raised centre disc. */}
      <div className="relative w-28 h-28 shrink-0 mx-auto sm:mx-0" role="img" aria-label={`${centerLabel}: ${centerValue}`}>
        <div aria-hidden="true" className="absolute inset-0 rounded-full bg-ink-100" />
        {/* With no data every stop sits at 0% and the last colour would fill the ring — show the bare track instead. */}
        {acc > 0 && (
          <div aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${stops})` }} />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-4 rounded-full bg-white border border-ink-100 shadow-elevated flex flex-col items-center justify-center"
        >
          <span className="text-nano uppercase tracking-wider text-ink-500 font-semibold">{centerLabel}</span>
          <span className="kpi-value text-title-lg mt-0.5">{centerValue}</span>
        </div>
      </div>
      <ul className="flex-1 min-w-37.5 space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              <span aria-hidden="true" className="w-2.5 h-2.5 rounded-sm shrink-0 ring-2 ring-white shadow-card" style={{ background: s.color }} />
              <span className="text-caption text-ink-600 truncate">{s.label}</span>
            </span>
            <span className="text-caption tabular text-ink-500 shrink-0">
              <span className="font-semibold text-ink-900">{s.count}</span> ({s.pct ?? Math.round((s.count / sum) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
