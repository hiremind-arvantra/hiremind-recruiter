"use client";

import { useState } from "react";
import { TabLayout } from "../chrome";
import {
  BulbIcon,
  CheckDot,
  CheckboxIcon,
  ChevronDown,
  ChevronUp,
  ClockIcon,
  DocIcon,
  InfoIcon,
  ListIcon,
  ShieldCheckIcon,
  TrophyIcon,
  XCircleIcon,
} from "../icons";
import { skillBreakdown, type SkillBreakdown, type SkillRow } from "../model";
import { Panel, Pill, RingGauge, ScoreBar, StatTile, StatusList, TD, TH } from "../ui";
import { datedWork } from "../../matchAnalysis.service";
import { estimateSkillYears } from "../../skillExperience";
import type { TabProps } from "./types";

const PREVIEW = 6;

export function SkillsTab({ analysis, job, applicant }: TabProps) {
  const years = estimateSkillYears((job.skills ?? []).map((skill) => skill.name), applicant.skillDetails ?? [], datedWork(applicant));
  const skills = skillBreakdown(analysis, job, applicant.skills ?? [], years);
  return (
    <TabLayout
      tab="skills"
      main={
        skills.total === 0 ? (
          <Panel id="skills-empty" title="Skill Match Overview" subtitle="Comparison of candidate skills with job requirements">
            <p className="text-body-sm text-ink-500">
              This job does not list any skills, so there is nothing to compare skill by skill. Add skills to the job to see
              this breakdown.
            </p>
          </Panel>
        ) : (
          <>
            <Overview skills={skills} />
            <div className="grid gap-5 lg:grid-cols-2 items-start">
              <MatchedPanel rows={skills.matched} />
              <PartialPanel rows={skills.partial} />
            </div>
            <MissingPanel rows={skills.missing} />
          </>
        )
      }
      rail={
        <>
          <KeyInsights skills={skills} />
          <TopSkills skills={skills} />
          <NextSteps skills={skills} />
        </>
      }
    />
  );
}

function Overview({ skills }: { skills: SkillBreakdown }) {
  const covered = skills.matched.length + skills.partial.length;
  return (
    <Panel id="skill-overview" title="Skill Match Overview" subtitle="Comparison of candidate skills with job requirements">
      <div className="flex flex-col lg:flex-row gap-5 lg:items-center">
        <div className="@container flex-1 min-w-0">
        <div className="grid gap-3 grid-cols-1 @xs:grid-cols-2 @2xl:grid-cols-4">
          <StatTile tone="success" icon={<ShieldCheckIcon size={24} />} value={skills.matched.length} label="Matched Skills" caption="Candidate has these skills" />
          <StatTile tone="info" icon={<ClockIcon size={24} />} value={skills.partial.length} label="Partially Matched" caption="Related or some experience found" />
          <StatTile tone="danger" icon={<XCircleIcon size={24} />} value={skills.missing.length} label="Missing Skills" caption="Not found in resume" />
          <StatTile tone="brand" icon={<ListIcon size={24} />} value={skills.total} label="Total Required Skills" caption="For this job" />
        </div>
        </div>
        <div className="flex flex-col items-center shrink-0 lg:w-40">
          <RingGauge value={skills.coverage} tone="brand" size={120} stroke={11} label="Skill coverage">
            <span className="font-display text-heading-lg font-extrabold text-ink-900 tabular">{skills.coverage}%</span>
          </RingGauge>
          <div className="mt-2 inline-flex items-center gap-1.5 text-body-sm font-medium text-ink-900">
            Skill Coverage
            <span className="text-ink-400" title="Share of required skills with full or partial evidence">
              <InfoIcon size={15} />
            </span>
          </div>
          <div className="text-body-sm text-ink-600 tabular">{covered} of {skills.total} skills</div>
        </div>
      </div>
      {skills.listedOnJob > skills.total && (
        <p className="mt-4 text-caption text-ink-500">
          The first {skills.total} of the {skills.listedOnJob} skills listed on this job are assessed.
        </p>
      )}
    </Panel>
  );
}

/** A panel whose header count toggles the body, with a "Show all" footer. */
function SkillPanel({
  id,
  title,
  subtitle,
  icon,
  count,
  showAllLabel,
  rows,
  renderTable,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  count: number;
  showAllLabel: string;
  rows: SkillRow[];
  renderTable: (rows: SkillRow[]) => React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? rows : rows.slice(0, PREVIEW);
  const bodyId = `${id}-body`;
  return (
    <Panel
      id={id}
      title={title}
      subtitle={subtitle}
      icon={icon}
      action={
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 text-body-sm text-ink-600 hover:text-ink-900"
        >
          {count} {count === 1 ? "skill" : "skills"}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      }
    >
      <div id={bodyId} hidden={!open}>
        {rows.length === 0 ? (
          <p className="text-body-sm text-ink-500">None.</p>
        ) : (
          <>
            <div className="@container -mx-2 [&_td]:px-2 [&_th]:px-2 [&_th]:whitespace-normal">{renderTable(visible)}</div>
            {rows.length > PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAll((value) => !value)}
                className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-cobalt-600 hover:text-brand-700"
              >
                {showAll ? "Show fewer" : showAllLabel}
                {showAll ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}

/** "4.2 / 3+" — the candidate's years against the years asked, with the basis on hover. */
function YearsCell({ row }: { row: SkillRow }) {
  const asked = row.required ? row.required.replace(/\s*(yrs|mo)$/, "") : "any";
  if (!row.yours) {
    return (
      <span title="Years of use not evidenced in the profile">
        <span className="text-ink-400">—</span> / {asked}
      </span>
    );
  }
  const short = row.required ? row.yours.years < Number.parseFloat(row.required) : false;
  return (
    <span title={`${row.yours.years} years — ${row.yours.basis}`}>
      <span className={`font-semibold tabular ${short ? "text-warn" : "text-ink-900"}`}>{row.yours.years}</span>
      {row.yours.source === "work-history" && <span className="text-ink-400">*</span>} / {asked}
    </span>
  );
}

function SmallTag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "info" }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-micro font-medium whitespace-nowrap ${
        tone === "info" ? "bg-cobalt-50 text-cobalt-700" : "bg-ink-100 text-ink-600"
      }`}
    >
      {children}
    </span>
  );
}

function MatchedPanel({ rows }: { rows: SkillRow[] }) {
  return (
    <SkillPanel
      id="matched-skills"
      title="Matched Skills"
      subtitle="Skills found in candidate's profile that match job requirements"
      icon={<CheckDot size={30} className="text-success" />}
      count={rows.length}
      showAllLabel={`Show all ${rows.length} matched skills`}
      rows={rows}
      renderTable={(visible) => (
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-ink-50/80">
              <th scope="col" className={TH}>Skill</th>
              <th scope="col" className={`${TH} w-20 @md:w-24`}>Strength</th>
              <th scope="col" className={`${TH} w-18`}>Evidence</th>
              <th scope="col" className={`${TH} w-24 hidden @xs:table-cell`} title="The candidate's years with the skill / the years this job asks for">Years / Asked</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.name} className="[&>td]:border-b [&>td]:border-ink-100 last:[&>td]:border-b-0">
                <td className={`${TD} font-medium text-ink-900 wrap-break-word`}>{row.name}</td>
                <td className={TD}>
                  <ScoreBar value={row.score} tone="success" label={`${row.name} match strength`} className="w-full" />
                </td>
                <td className={TD}>
                  <span title={row.evidence ?? undefined}>
                    <SmallTag>{row.source === "skills" ? "Profile" : "Resume"}</SmallTag>
                  </span>
                </td>
                <td className={`${TD} text-ink-600 whitespace-nowrap hidden @xs:table-cell`}>
                  <YearsCell row={row} />
                </td>
              </tr>
            ))}
          </tbody>
          <caption className="caption-bottom px-2 pt-2 text-left text-micro text-ink-500">
            Years: stated on the profile, or <span aria-hidden="true">*</span> measured from dated roles and projects that mention the skill.
          </caption>
        </table>
      )}
    />
  );
}

function PartialPanel({ rows }: { rows: SkillRow[] }) {
  return (
    <SkillPanel
      id="partial-skills"
      title="Partially Matched Skills"
      subtitle="Related skills found, but not a full match"
      icon={
        <span className="grid place-items-center w-[30px] h-[30px] rounded-full bg-cobalt-500 text-white">
          <ClockIcon size={17} />
        </span>
      }
      count={rows.length}
      showAllLabel={`Show all ${rows.length} partially matched skills`}
      rows={rows}
      renderTable={(visible) => (
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-ink-50/80">
              <th scope="col" className={TH}>Skill</th>
              <th scope="col" className={`${TH} w-24 @md:w-28`}>Match Level</th>
              <th scope="col" className={`${TH} w-26`}>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.name} className="[&>td]:border-b [&>td]:border-ink-100 last:[&>td]:border-b-0">
                <td className={`${TD} font-medium text-ink-900 wrap-break-word`}>{row.name}</td>
                <td className={TD}>
                  <ScoreBar value={row.score} tone="warn" label={`${row.name} match level`} className="w-full" />
                </td>
                <td className={TD}>
                  <span title={[row.relationship, row.evidence].filter(Boolean).join(" — ")}>
                    <SmallTag>{row.score >= 65 ? "Related" : "Some evidence"}</SmallTag>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    />
  );
}

function MissingPanel({ rows }: { rows: SkillRow[] }) {
  return (
    <SkillPanel
      id="missing-skills"
      title="Missing Skills"
      subtitle="Skills required for this job but not found in candidate's profile"
      icon={
        <span className="grid place-items-center w-[30px] h-[30px] rounded-full bg-danger text-white">
          <XCircleIcon size={18} className="[&_circle]:hidden" />
        </span>
      }
      count={rows.length}
      showAllLabel={`Show all ${rows.length} missing skills`}
      rows={rows}
      renderTable={(visible) => (
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-ink-50/80">
              <th scope="col" className={`${TH} w-[34%] @xl:w-[28%]`}>Skill</th>
              <th scope="col" className={`${TH} w-24 text-center`}>Importance</th>
              <th scope="col" className={TH}>Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.name} className="[&>td]:border-b [&>td]:border-ink-100 last:[&>td]:border-b-0">
                <td className={`${TD} font-medium text-ink-900 wrap-break-word`}>{row.name}</td>
                <td className={`${TD} text-center`}>
                  <Pill tone={row.mandatory ? "danger" : "warn"} size="sm" className="min-w-16 justify-center">
                    {row.mandatory ? "High" : "Medium"}
                  </Pill>
                </td>
                <td className={`${TD} text-ink-600 wrap-break-word`}>
                  {row.score > 5
                    ? "Related experience may apply. Validate in interview."
                    : row.mandatory
                      ? "No evidence found in resume. Consider asking in interview."
                      : "No evidence found. Nice to have — consider a screening question."}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    />
  );
}

function names(rows: SkillRow[], max: number): string {
  const list = rows.slice(0, max).map((row) => row.name);
  const extra = rows.length - list.length;
  return `${list.join(", ")}${extra > 0 ? ` and ${extra} more` : ""}`;
}

function KeyInsights({ skills }: { skills: SkillBreakdown }) {
  const missingMandatory = skills.missing.filter((row) => row.mandatory);
  const missingPreferred = skills.missing.filter((row) => !row.mandatory);
  const items: { key: string; ok: boolean | "warn"; title: string }[] = [];
  if (skills.matched.length) items.push({ key: "matched", ok: true, title: `Strong alignment in ${names(skills.matched, 3)}.` });
  if (skills.matched.length > 3) {
    items.push({ key: "matched-count", ok: true, title: `${skills.matched.length} of ${skills.total} required skills fully evidenced.` });
  }
  if (skills.partial.length) items.push({ key: "partial", ok: "warn", title: `Some related experience in ${names(skills.partial, 2)}.` });
  if (missingMandatory.length) {
    items.push({ key: "missing-mandatory", ok: false, title: `Key skills (${names(missingMandatory, 2)}) were not found in the resume.` });
  }
  if (missingPreferred.length) {
    items.push({ key: "missing-preferred", ok: false, title: `No explicit mention of ${names(missingPreferred, 2)}.` });
  }
  return (
    <Panel id="skill-insights" title="Key Insights" icon={<BulbIcon size={24} />} iconClass="text-warn">
      <StatusList items={items} empty="No skills to summarise for this job." />
    </Panel>
  );
}

function TopSkills({ skills }: { skills: SkillBreakdown }) {
  const top = [...skills.matched, ...skills.partial].sort((a, b) => b.score - a.score).slice(0, 5);
  return (
    <Panel id="top-skills" title="Top Matched Skills" icon={<TrophyIcon size={24} />} iconClass="text-warn">
      {top.length === 0 ? (
        <p className="text-body-sm text-ink-500">No required skills were evidenced in the profile.</p>
      ) : (
        <ol className="space-y-3.5">
          {top.map((row, index) => (
            <li key={row.name} className="flex items-center gap-3">
              <span className="grid place-items-center w-6 h-6 rounded-full border border-ink-200 text-caption text-ink-600 shrink-0 tabular">
                {index + 1}
              </span>
              <span className="w-24 truncate text-body-sm font-medium text-ink-900" title={row.name}>{row.name}</span>
              <ScoreBar value={row.score} tone={row.bucket === "matched" ? "success" : "warn"} className="flex-1" />
              <span className="w-10 text-right text-body-sm font-bold text-ink-900 tabular">{row.score}%</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function NextSteps({ skills }: { skills: SkillBreakdown }) {
  const missingMandatory = skills.missing.filter((row) => row.mandatory);
  const steps: string[] = [];
  if (missingMandatory.length) {
    steps.push(`Validate ${missingMandatory.length === 1 ? "the missing high-priority skill" : `${missingMandatory.length} missing high-priority skills`} in the interview.`);
  } else if (skills.missing.length) {
    steps.push("Validate the missing skills in the interview.");
  }
  if (skills.partial.length) steps.push(`Ask technical questions on ${names(skills.partial, 2)}.`);
  if (skills.missing.length || skills.partial.length) steps.push("Consider a short technical assessment.");
  if (steps.length === 0 && skills.total > 0) steps.push("Every required skill is evidenced — use the interview to probe depth.");

  return (
    <Panel id="skill-next" title="Recommended Next Steps" icon={<DocIcon size={24} />} iconClass="text-cobalt-600">
      {steps.length === 0 ? (
        <p className="text-body-sm text-ink-500">No skill-specific follow-ups.</p>
      ) : (
        <ul className="space-y-3.5">
          {steps.map((step) => (
            <li key={step} className="flex items-start gap-3 text-body-sm text-ink-700">
              <CheckboxIcon size={20} className="text-cobalt-600 shrink-0" />
              {step}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
