import Link from "next/link";
import { encodeId } from "@/lib/urlId";
import type { JobApiResponse } from "../../services/job.service";
import { formatDate, formatExperience, formatSalary } from "../../shared/format";
import { BriefIcon, ClockIcon, KebabIcon, PinIcon, RupeeIcon } from "../../shared/icons";
import { JobStatusBadge } from "../JobStatusBadge";

/* One job row in the Jobs list. Clicking the card selects it. */
export function JobCard({ job, selected, onSelect }: { job: JobApiResponse; selected?: boolean; onSelect?: () => void }) {
  const skills = job.skills ?? []; // backend may not expose skills until redeployed
  const skillChips = skills.slice(0, 4);
  const extraSkills = skills.length - skillChips.length;
  return (
    <div
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`card card-interactive relative overflow-hidden cursor-pointer p-4 sm:p-5 ${selected ? "card-highlight" : ""}`}
    >
      {/* Selected: a violet light edge on the left. */}
      {selected && <span aria-hidden="true" className="absolute left-0 top-4 bottom-4 w-0.75 rounded-r-full bg-[image:var(--gradient-brand)]" />}
      <button
        type="button"
        className="absolute top-2 right-2 w-10 h-10 grid place-items-center rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
        aria-label="More options"
      >
        <KebabIcon size={18} />
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 pr-8 lg:pr-10">
        {/* Identity */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <span className={`icon-tile w-12 h-12 rounded-2xl ${selected ? "bg-[image:var(--gradient-brand)] text-white shadow-glow" : "bg-brand-50 text-brand-600"}`}>
            <BriefIcon size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-title-sm text-ink-900 leading-snug">{job.title}</h3>
              <JobStatusBadge status={job.status} />
            </div>
            {job.department && <div className="text-body-sm text-ink-600 font-medium mt-0.5">{job.department}</div>}
            <div className="flex items-center gap-x-4 gap-y-1 mt-2 text-caption text-ink-500 flex-wrap">
              <span className="inline-flex items-center gap-1.5"><PinIcon className="text-ink-400" />{job.workplaceLocation || "—"}{job.workMode ? ` · ${job.workMode}` : ""}</span>
              <span className="inline-flex items-center gap-1.5"><BriefIcon className="text-ink-400" />{job.employmentType || "—"}</span>
              <span className="inline-flex items-center gap-1.5"><ClockIcon className="text-ink-400" />{formatExperience(job.experienceMinYears, job.experienceMaxYears)}</span>
              <span className="inline-flex items-center gap-1.5 tabular"><RupeeIcon className="text-ink-400" />{formatSalary(job.annualCtc, job.currency)}</span>
            </div>
            {skillChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {skillChips.map((s) => (
                  <span key={s.name} className="badge badge-neutral">{s.name}</span>
                ))}
                {extraSkills > 0 && (
                  <span className="badge badge-brand">+{extraSkills}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Posted + openings */}
        <div className="flex lg:flex-col gap-x-8 gap-y-3 lg:w-28 shrink-0 text-caption lg:pl-6 lg:border-l lg:border-ink-100">
          <div>
            <div className="text-ink-500">Posted on</div>
            <div className="font-semibold text-ink-800 mt-0.5 tabular">{formatDate(job.publishedAt ?? job.createdAt)}</div>
          </div>
          <div>
            <div className="text-ink-500">Openings</div>
            <div className="kpi-value text-title-lg mt-1">{job.openings}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row lg:flex-col gap-2 lg:w-39 shrink-0">
          <Link href={`/company/jobs/${encodeId(job.id)}/applications`} onClick={(e) => e.stopPropagation()} className="btn btn-secondary flex-1 text-body-sm">
            View Applications
          </Link>
          <Link href={`/company/jobs/${encodeId(job.id)}/edit`} onClick={(e) => e.stopPropagation()} className="btn btn-outline flex-1 text-body-sm">
            Edit Job
          </Link>
        </div>
      </div>
    </div>
  );
}
