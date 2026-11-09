import Link from "next/link";
import { encodeId } from "@/lib/urlId";
import type { JobApiResponse, JobCountsResponse } from "../../services/job.service";
import type { CandidateRecommendation } from "../../services/recommendations.service";
import { KebabIcon } from "../../shared/icons";
import { Donut } from "../Donut";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AIInsight } from "@/components/ui/AIInsight";
import { MatchScore } from "@/components/ui/MatchScore";

/* Right-rail panels for the Jobs list. Job Insights is live from the global job
 * counts; Recommended Candidates is scoped to the currently-selected job. */

function PanelEmpty({ message }: { message: string }) {
  return <p className="text-caption text-ink-500 py-2">{message}</p>;
}

export function JobInsightsPanel({ counts }: { counts: JobCountsResponse }) {
  const closed = Math.max(counts.total - counts.published - counts.drafts, 0);
  const segments = [
    { label: "Active", count: counts.published, color: "var(--color-success)" },
    { label: "Draft", count: counts.drafts, color: "var(--color-cobalt-500)" },
    { label: "Closed", count: closed, color: "var(--color-ink-400)" },
    { label: "Paused", count: 0, color: "var(--color-warn)" },
  ];
  return (
    <div className="card p-5">
      <SectionHeader
        as="h3"
        title="Job Insights"
        action={
          <button type="button" className="w-10 h-10 -mr-2 -mt-2 grid place-items-center rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors" aria-label="More">
            <KebabIcon />
          </button>
        }
      />
      <div className="mt-4">
        <Donut segments={segments} total={counts.total} centerLabel="Total Jobs" centerValue={counts.total} />
      </div>
    </div>
  );
}

/** Top candidates for the selected job, ranked by the weighted match-score algorithm. */
export function RecommendedCandidatesPanel({
  job,
  candidates,
  loading,
}: {
  job: JobApiResponse | null;
  candidates: CandidateRecommendation[];
  loading: boolean;
}) {
  const initials = (name: string | null) =>
    (name?.trim() || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  // Only surface strong matches (>80%) for the selected job, best first.
  const strong = candidates.filter((c) => c.score > 80).sort((a, b) => b.score - a.score).slice(0, 4);
  return (
    <AIInsight
      label="AI recommendations"
      title="Recommended Candidates"
      action={
        job && strong.length > 0 ? (
          <Link href={`/company/jobs/${encodeId(job.id)}/applications`} className="inline-flex items-center h-10 text-caption text-brand-700 font-semibold hover:text-brand-900 transition-colors">
            View all
          </Link>
        ) : undefined
      }
    >
      {job && !loading && (
        <p className="text-caption text-ink-500 -mt-1 mb-3 truncate">
          For <span className="font-semibold text-ink-700">{job.title}</span>
        </p>
      )}
      {loading ? (
        <PanelEmpty message="Loading candidates…" />
      ) : !job ? (
        <PanelEmpty message="No active jobs to recommend candidates for." />
      ) : strong.length === 0 ? (
        <PanelEmpty message="No candidates above 80% match for this job yet." />
      ) : (
        <ul className="-mx-2 space-y-1">
          {strong.map((c) => (
            <li key={c.userId} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/80 transition-colors">
              <span className="w-9 h-9 rounded-full bg-brand-50 border border-brand-100 text-brand-700 grid place-items-center text-caption font-bold shrink-0">{initials(c.fullName)}</span>
              <div className="flex-1 leading-snug min-w-0">
                <div className="text-body-sm font-semibold text-ink-900 truncate">{c.fullName ?? "Candidate"}</div>
                <div className="text-micro text-ink-500 truncate">
                  {c.currentRole ?? "—"}
                  {c.skillsRequired > 0 && ` · ${c.skillsMatched}/${c.skillsRequired} skills`}
                </div>
              </div>
              <MatchScore value={c.score} size="sm" label="Match" />
            </li>
          ))}
        </ul>
      )}
    </AIInsight>
  );
}

export interface SkillDemand {
  name: string;
  jobs: number;
}

/** Top skills aggregated from the loaded jobs (skill → number of jobs requesting it). */
export function TopSkillsPanel({ skills }: { skills: SkillDemand[] }) {
  const max = skills.length ? Math.max(...skills.map((s) => s.jobs)) : 1;
  return (
    <div className="card p-5">
      <SectionHeader
        as="h3"
        title="Top Skills in Demand"
        action={<button type="button" className="inline-flex items-center h-10 text-caption text-brand-700 font-semibold hover:text-brand-900 transition-colors">View all</button>}
      />
      {skills.length === 0 ? (
        <p className="mt-3 text-caption text-ink-500">No skill data for your jobs yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {skills.map((s) => (
            <li key={s.name}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-caption text-ink-800 font-medium truncate">{s.name}</span>
                <span className="text-micro text-ink-500 shrink-0 tabular">{s.jobs} {s.jobs === 1 ? "job" : "jobs"}</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full rounded-full bg-linear-to-r from-brand-600 to-cobalt-400" style={{ width: `${(s.jobs / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
