import { AIInsight } from "@/components/ui/AIInsight";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ArrowRightLong, BoltIcon, CalendarIcon, CompareIcon, KebabIcon, RefreshIcon, ShareIcon, ShieldIcon } from "../../shared/icons";
import { Donut } from "../Donut";
import type { ApplicationCounts } from "../../services/applications.service";
import type { Candidate } from "./data";

/* Match-score buckets, derived from the loaded applicants' real match scores.
 * Bar tones follow the MatchScore tiers (neutral → amber → violet → green). */
const MATCH_BUCKETS: { label: string; min: number; max: number; barClass: string }[] = [
  { label: "Less than 60%", min: 0, max: 60, barClass: "bg-ink-300" },
  { label: "60% – 75%", min: 60, max: 75, barClass: "bg-warn" },
  { label: "75% – 89%", min: 75, max: 90, barClass: "bg-brand-500" },
  { label: "Above 90%", min: 90, max: 101, barClass: "bg-success" },
];

function MoreButton() {
  return (
    <button type="button" className="btn btn-ghost btn-icon text-ink-400" aria-label="More">
      <KebabIcon />
    </button>
  );
}

export function MatchDistributionPanel({ candidates }: { candidates: Candidate[] }) {
  const total = candidates.length;
  const rows = MATCH_BUCKETS.map((b) => {
    const count = candidates.filter((c) => c.match >= b.min && c.match < b.max).length;
    return { label: b.label, barClass: b.barClass, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });
  const max = Math.max(1, ...rows.map((d) => d.count));
  return (
    <AIInsight label="AI match distribution" title="Candidate Match Distribution" action={<MoreButton />}>
      <p className="text-caption text-ink-500 -mt-1 mb-4">See how candidates match with this job&apos;s requirements.</p>
      {total === 0 ? (
        <p className="text-caption text-ink-500 py-2">No applicants to analyse yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((d) => (
            <li key={d.label}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-caption text-ink-600">{d.label}</span>
                <span className="text-caption font-semibold text-ink-800 tabular">
                  {d.count} <span className="font-normal text-ink-500">({d.pct}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                <div className={`h-full rounded-full ${d.barClass}`} style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AIInsight>
  );
}

export function ApplicationSummaryPanel({ counts }: { counts: ApplicationCounts }) {
  // Segment colours mirror the application-status badges.
  const segments = [
    { label: "Applied", count: counts.applied, color: "var(--color-cobalt-500)" },
    { label: "Shortlisted", count: counts.shortlisted, color: "var(--color-success)" },
    { label: "Interview", count: counts.interview, color: "var(--color-brand-500)" },
    { label: "Offered", count: counts.offered, color: "var(--color-warn)" },
    { label: "Rejected", count: counts.rejected, color: "var(--color-danger)" },
  ].map((s) => ({ ...s, pct: counts.total ? Math.round((s.count / counts.total) * 100) : 0 }));
  return (
    <section className="card p-5">
      <SectionHeader as="h3" title="Application Summary" action={<MoreButton />} className="mb-4" />
      <Donut segments={segments} centerLabel="Total" centerValue={counts.total} />
    </section>
  );
}

export function FakeProfilesPanel({ fakeCount }: { fakeCount: number }) {
  return (
    <AIInsight
      label="Fake profile detection"
      title={<span className="inline-flex items-center gap-2"><ShieldIcon className="text-brand-600" /> Detect Fake Profiles</span>}
    >
      <p className="text-caption text-ink-500 leading-relaxed -mt-1">
        Our system uses AI to detect suspicious profiles based on resume patterns, contact info, and data verification.
      </p>
      {fakeCount > 0 ? (
        <>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-danger/20 bg-white px-4 py-3">
            <span className="font-display font-extrabold text-heading text-danger leading-none tabular">{fakeCount}</span>
            <div className="leading-tight">
              <div className="text-body-sm font-semibold text-danger">Suspected Fake Profile{fakeCount === 1 ? "" : "s"}</div>
              <div className="text-caption text-ink-500">Flagged in this list</div>
            </div>
          </div>
          <a className="mt-3 inline-flex items-center gap-1.5 h-10 text-body-sm text-brand-700 font-semibold hover:text-brand-800 cursor-pointer">
            View Flagged Profiles <ArrowRightLong size={13} />
          </a>
        </>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-success/20 bg-white px-4 py-3">
          <span className="font-display font-extrabold text-heading text-success leading-none tabular">0</span>
          <div className="leading-tight">
            <div className="text-body-sm font-semibold text-success">No Suspicious Profiles</div>
            <div className="text-caption text-ink-500">All applicants look genuine</div>
          </div>
        </div>
      )}
    </AIInsight>
  );
}

const QUICK_ACTIONS = [
  { icon: <ShareIcon />, title: "Share Job Link", sub: "Share this job with your network" },
  { icon: <CompareIcon />, title: "Create Comparison", sub: "Compare up to 4 candidates" },
  { icon: <RefreshIcon />, title: "Bulk Update Status", sub: "Update status for multiple applicants" },
  { icon: <CalendarIcon size={15} />, title: "Schedule Interview", sub: "Schedule interview for selected candidates" },
];

export function QuickActionsPanel() {
  return (
    <section className="card p-5">
      <SectionHeader as="h3" icon={<BoltIcon />} title="Quick Actions" className="mb-3" />
      <ul className="space-y-1">
        {QUICK_ACTIONS.map((a) => (
          <li key={a.title}>
            <button type="button" className="w-full min-h-12 flex items-center gap-3 text-left rounded-xl px-2.5 py-2 hover:bg-ink-100 transition-colors">
              <span className="icon-tile icon-tile-sm bg-brand-50 text-brand-600">{a.icon}</span>
              <div className="leading-tight min-w-0">
                <div className="text-body-sm font-semibold text-ink-900">{a.title}</div>
                <div className="text-caption text-ink-500">{a.sub}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
