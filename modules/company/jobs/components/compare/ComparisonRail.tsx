import { AI_RECOMMENDATIONS, matchText, type Candidate } from "./data";
import { QuickAction } from "./pieces";
import {
  CalendarIcon,
  CheckIcon,
  DownloadIcon,
  EyeIcon,
  SparkleIcon,
  TrophyIcon,
  UserPlusIcon,
} from "./icons";

/* Right-rail: AI summary + ranking, recommendations, quick actions. */
export function ComparisonRail({ ranked, best }: { ranked: Candidate[]; best: Candidate }) {
  return (
    <aside className="w-full xl:w-[320px] shrink-0 space-y-4 hidden xl:block">
      {/* AI Summary */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand-600">
            <SparkleIcon />
          </span>
          <h3 className="font-display font-bold text-[0.9375rem] text-ink-900">AI Summary</h3>
        </div>
        <p className="text-[0.71875rem] text-ink-400 mb-3">AI-powered insights</p>

        <div className="text-[0.75rem] font-semibold text-ink-700 mb-1.5">Best Overall Match</div>
        <div className="rounded-xl border border-green-200 bg-green-50/60 p-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-green-600">
              <TrophyIcon />
            </span>
            <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold text-[0.6875rem]">
              {best.initials}
            </span>
            <div>
              <div className="font-bold text-[0.8125rem] text-ink-900">{best.name}</div>
              <div className="text-[0.6875rem] font-semibold text-green-600">{best.match}% Match Score</div>
            </div>
          </div>
          <p className="text-[0.6875rem] text-ink-600 mt-2 leading-snug">
            Best combination of skills, experience and role fit for this position.
          </p>
        </div>

        <div className="text-[0.75rem] font-semibold text-ink-700 mb-2">Candidate Ranking</div>
        <ul className="space-y-2">
          {ranked.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[0.625rem] font-bold grid place-items-center shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-[0.78125rem] text-ink-700">{c.name}</span>
              <span className={`text-[0.71875rem] font-bold ${matchText(c.match)}`}>{c.match}%</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AI Recommendations */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-brand-600">
            <SparkleIcon />
          </span>
          <h3 className="font-display font-bold text-[0.9375rem] text-ink-900">AI Recommendations</h3>
        </div>
        <ul className="space-y-2.5">
          {AI_RECOMMENDATIONS.map((r) => (
            <li key={r} className="flex items-start gap-2 text-[0.75rem] text-ink-700">
              <span className="text-green-600 mt-0.5 shrink-0">
                <CheckIcon />
              </span>{" "}
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-[0.9375rem] text-ink-900 mb-3">Quick Actions</h3>
        <ul className="space-y-1">
          <QuickAction icon={<EyeIcon />} label="View Detailed Report" />
          <QuickAction icon={<CalendarIcon />} label="Schedule Interview" />
          <QuickAction icon={<UserPlusIcon />} label="Add to Talent Pool" />
          <QuickAction icon={<DownloadIcon />} label="Download Comparison" />
        </ul>
      </div>
    </aside>
  );
}
