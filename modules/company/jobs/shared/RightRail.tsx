import type { JobDraft, StepNum } from "./types";
import { BriefIcon, PinIcon } from "./icons";

interface Props {
  current: StepNum;
  data: JobDraft;
  tips?: { title: string; tips: string[] };
  showJobSummary?: boolean;
  showProgress?: boolean;
}

const STEPS = [
  { n: 1, label: "Job Details" },
  { n: 2, label: "Requirements" },
  { n: 3, label: "Compensation" },
  { n: 4, label: "Review & Publish" },
] as const;

export default function RightRail({ current, data, tips, showJobSummary = true, showProgress = true }: Props) {
  return (
    <aside className="w-full flex flex-col gap-4 xl:sticky xl:top-2">
      {/* Job Posting Progress */}
      {showProgress && (
      <div className="card p-5">
        <h3 className="section-title mb-3">Job Posting Progress</h3>
        <ul className="space-y-2.5">
          {STEPS.map((s) => {
            const done   = s.n < current;
            const active = s.n === current;
            return (
              <li key={s.n} className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full grid place-items-center text-micro font-bold ${
                  done   ? "bg-success text-white" :
                  active ? "bg-brand-600 text-white" :
                            "bg-ink-100 text-ink-500"
                }`}>
                  {done ? "✓" : s.n}
                </span>
                <span className={`text-body-sm font-semibold ${active ? "text-brand-700" : done ? "text-ink-900" : "text-ink-500"}`}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      )}

      {/* Job Summary — live preview of what the recruiter has entered so far */}
      {showJobSummary && (
        <div className="card-elevated overflow-hidden">
          <div className="px-5 pt-5 pb-4 bg-linear-to-b from-brand-50/70 to-white border-b border-ink-100">
            <h3 className="section-title">
              Job Summary <span className="text-micro font-medium text-ink-500">(Auto-fill)</span>
            </h3>
            <div className="mt-3 flex items-start gap-3">
              <span className="icon-tile bg-white text-brand-600 border border-brand-100 shadow-card"><BriefIcon size={18} /></span>
              <div className="min-w-0">
                <div className="font-display font-bold text-body-lg text-ink-900 leading-snug truncate">{data.details.title || "-"}</div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-caption text-ink-500 min-w-0">
                  <PinIcon className="shrink-0" /> <span className="truncate">{data.details.workplaceLocation || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          <dl className="px-5 py-3">
            <SummaryItem label="Job Title"        value={data.details.title} />
            <SummaryItem label="Location"         value={data.details.workplaceLocation} />
            <SummaryItem label="Employment Type"  value={data.details.employmentType} />
            <SummaryItem label="Experience"       value={data.details.experienceMin && data.details.experienceMax ? `${data.details.experienceMin} - ${data.details.experienceMax} Years` : data.details.experienceRange} />
            <SummaryItem label="Salary Range"     value={salaryRangeText(data)} />
            <SummaryItem label="Openings"         value={String(data.details.openings ?? "")} />
          </dl>
          {current < 5 && (
            <div className="px-5 pb-4 flex items-center gap-1.5 text-caption text-ink-500">
              <InfoIcon /> Complete all sections to see summary
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {tips && (
        <div className="card p-5">
          <h3 className="section-title mb-3 flex items-center gap-2">
            <span className="icon-tile icon-tile-sm bg-warn/10 text-warn"><BulbIcon /></span>
            {tips.title}
          </h3>
          <ul className="space-y-2">
            {tips.tips.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-body-sm text-ink-700 leading-snug">
                <CheckIcon /> <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

/** Salary Range for the Job Summary — Salary Range type → "₹ min – max", else the fixed CTC. */
function salaryRangeText(data: JobDraft): string {
  const c = data.compensation;
  const symbol = c.currency?.includes("$") ? "$" : c.currency?.includes("€") ? "€" : "₹";
  if (c.salaryType === "Salary Range") {
    if (c.salaryMin || c.salaryMax) return `${symbol} ${c.salaryMin || "?"} – ${c.salaryMax || "?"}`;
    return "";
  }
  return c.annualCtc ? `${symbol} ${c.annualCtc}` : "";
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b last:border-0 border-ink-100">
      <dt className="text-caption text-ink-500 shrink-0">{label}</dt>
      <dd className={`text-caption font-semibold text-right truncate max-w-[60%] ${value ? "text-ink-900" : "text-ink-400"}`}>{value || "-"}</dd>
    </div>
  );
}

function BulbIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11c1 .6 1.5 1.5 1.5 2.5V17h3v-.5c0-1 .5-1.9 1.5-2.5A6 6 0 0 0 12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function InfoIcon() { return (<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>); }
function CheckIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-success"><circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.12" /><path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
