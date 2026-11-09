"use client";

import { useState } from "react";
import { TabLayout } from "../chrome";
import {
  BookIcon,
  BulbIcon,
  CalendarCheckIcon,
  CapIcon,
  CertIcon,
  CheckDot,
  AlertDot,
  ChartUpIcon,
  ChevronDown,
  DocIcon,
  SparkleIcon,
  TrophyIcon,
} from "../icons";
import { categoryOf, degreeRows, levelOf, type DegreeRow } from "../model";
import { Panel, ScoreBar, StatTile, StatusList, TONE } from "../ui";
import type { TabProps } from "./types";

const SHORT_LEVEL: Record<string, string> = {
  "Bachelor's": "UG",
  "Master's": "PG",
  Doctorate: "PhD",
  Diploma: "Diploma",
  Secondary: "School",
};

function levelBreakdown(rows: DegreeRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.level ? SHORT_LEVEL[row.level] ?? row.level : "Other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => `${count} ${label}`).join(" • ");
}

export function EducationTab(props: TabProps) {
  const { analysis, job, applicant } = props;
  const rows = degreeRows(job, applicant.educationDegrees ?? []);
  const qualifications = categoryOf(analysis, "qualifications");
  const educationScore = qualifications?.assessable ? qualifications.score : null;
  const highest = rows[0] ?? null;
  const certificationNames = applicant.certifications ?? [];
  const certificationCount = Math.max(applicant.certificationCount ?? 0, certificationNames.length);
  const requirement = job.educationQualification?.trim() || null;

  return (
    <TabLayout
      tab="education"
      main={
        <>
          <Panel id="education" title="Education" subtitle="Academic background and qualifications from the candidate's profile.">
            <div className="@container">
            <div className="grid gap-3 grid-cols-1 @sm:grid-cols-2 @3xl:grid-cols-4">
              <StatTile
                compact
                tone="info"
                icon={<CapIcon size={24} />}
                value={rows.length}
                label={rows.length === 1 ? "Degree" : "Degrees"}
                caption={rows.length ? levelBreakdown(rows) : "None listed"}
              />
              <StatTile
                compact
                tone="warn"
                icon={<TrophyIcon size={24} />}
                value={educationScore != null ? `${educationScore}%` : "—"}
                label="Education Match"
                caption={requirement ? "Against the job's requirement" : "No requirement set on this job"}
              />
              <StatTile
                compact
                tone="info"
                icon={<DocIcon size={24} />}
                value={highest?.level ?? "—"}
                label="Highest Qualification"
                caption={highest?.degree ?? "Not stated"}
              />
              <StatTile
                compact
                tone="brand"
                icon={<CertIcon size={24} />}
                value={certificationCount}
                label={certificationCount === 1 ? "Certification" : "Certifications"}
                caption={certificationNames.length ? "Listed below" : "Listed on profile"}
              />
            </div>
            </div>
          </Panel>

          <Panel
            id="education-details"
            title="Educational Details"
            action={<span className="text-body-sm text-cobalt-600">{rows.length} {rows.length === 1 ? "Record" : "Records"}</span>}
          >
            {rows.length === 0 ? (
              <p className="text-body-sm text-ink-500">No education is listed on this candidate&apos;s profile.</p>
            ) : (
              <ul className="space-y-3">
                {rows.map((row) => (
                  <DegreeCard key={row.degree} row={row} />
                ))}
              </ul>
            )}

            <h3 className="mt-7 mb-3 font-display text-title font-bold text-ink-900">Additional Information</h3>
            <dl className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              <InfoTile icon={<CapIcon size={20} />} label="Highest Qualification" value={highest?.degree ?? "Not stated"} />
              <InfoTile icon={<BookIcon size={20} />} label="Field of Study" value={highest?.field ?? "Not recognised"} />
              <InfoTile icon={<CalendarCheckIcon size={20} />} label="Job Requirement" value={requirement ?? "None specified"} />
              <InfoTile
                icon={<ChartUpIcon size={20} />}
                label="Education Match"
                value={educationScore != null ? `${levelOf(educationScore).label} (${educationScore}%)` : "Not assessable"}
              />
            </dl>
          </Panel>

          {certificationNames.length > 0 && (
            <Panel
              id="certifications"
              title="Certifications"
              subtitle="Certifications named on the candidate's profile."
              icon={<TrophyIcon size={24} />}
              iconClass="text-warn"
            >
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {certificationNames.map((name) => (
                  <li key={name} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50/70 px-4 py-3">
                    <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand-100 text-brand-600 shrink-0">
                      <CertIcon size={19} />
                    </span>
                    <span className="text-body-sm font-semibold text-ink-900 wrap-break-word">{name}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      }
      rail={<EducationRail {...props} rows={rows} educationScore={educationScore} requirement={requirement} />}
    />
  );
}

function DegreeCard({ row }: { row: DegreeRow }) {
  const [open, setOpen] = useState(false);
  const relevanceTone = row.relevance == null ? "neutral" : row.relevance >= 85 ? "success" : row.relevance >= 60 ? "info" : row.relevance >= 35 ? "warn" : "danger";
  const detailId = `degree-${row.degree.replace(/\W+/g, "-")}`;
  return (
    <li className="rounded-2xl border border-ink-100 p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <span aria-hidden="true" className="grid place-items-center w-14 h-14 rounded-full bg-cobalt-50 text-cobalt-600 shrink-0">
            <CapIcon size={26} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-body-lg font-bold text-ink-900 wrap-break-word">{row.degree}</h3>
            </div>
            <div className="mt-0.5 text-body-sm text-ink-600">{row.level ?? "Degree level not recognised"}</div>
            {row.field && <div className="text-body-sm text-ink-500">{row.field}</div>}
          </div>
        </div>
        <div className="flex items-stretch gap-3 shrink-0">
          <div className="rounded-xl bg-ink-50 px-4 py-3 w-28">
            <div className="text-micro text-ink-500">Level</div>
            <div className="mt-1 font-display text-title font-bold text-ink-900">{row.level ? SHORT_LEVEL[row.level] ?? row.level : "—"}</div>
          </div>
          <div className="rounded-xl bg-ink-50 px-4 py-3 w-48">
            <div className="text-micro text-ink-500">Relevance to Role</div>
            {row.relevance != null ? (
              <>
                <div className="mt-1 text-body-sm font-medium text-ink-800">{row.relevanceLabel}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <ScoreBar value={row.relevance} tone={relevanceTone} label={`${row.degree} relevance`} className="flex-1" />
                  <span className="text-caption font-bold text-ink-900 tabular">{row.relevance}%</span>
                </div>
              </>
            ) : (
              <div className="mt-1 text-body-sm text-ink-500">No requirement set</div>
            )}
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailId}
            aria-label={`${open ? "Hide" : "Show"} details for ${row.degree}`}
            onClick={() => setOpen((value) => !value)}
            className={`self-center grid place-items-center w-8 h-8 rounded-lg text-ink-500 hover:bg-ink-100 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>
      <p id={detailId} hidden={!open} className="mt-3 rounded-xl bg-ink-50 px-4 py-3 text-body-sm text-ink-600">
        {row.relationship ?? "This job sets no education requirement, so the degree was not compared against one."}
      </p>
    </li>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50/70 px-4 py-3 min-w-0">
      <span aria-hidden="true" className="text-cobalt-600 shrink-0">{icon}</span>
      <div className="min-w-0">
        <dt className="text-caption text-ink-500">{label}</dt>
        <dd className="text-body-sm font-bold text-ink-900 wrap-break-word">{value}</dd>
      </div>
    </div>
  );
}

function EducationRail({
  analysis,
  applicant,
  rows,
  educationScore,
  requirement,
}: TabProps & { rows: DegreeRow[]; educationScore: number | null; requirement: string | null }) {
  const qualifications = categoryOf(analysis, "qualifications");
  const best = rows.find((row) => row.relevance != null) ?? null;

  const insight = requirement
    ? rows.length
      ? `This job asks for ${requirement}. The closest match on the profile is ${best?.degree ?? rows[0].degree}: ${(best?.relationship ?? "no comparable degree found").toLowerCase()}.`
      : `This job asks for ${requirement}, but no degree was found in the available resume evidence.`
    : `No formal education requirement is set on this job. The profile lists ${rows.length} ${rows.length === 1 ? "degree" : "degrees"}.`;

  const alignment =
    educationScore == null
      ? { tone: "neutral" as const, text: "Education could not be assessed from the available evidence." }
      : !requirement
        ? { tone: "success" as const, text: "No education requirement to meet for this role." }
        : educationScore >= 75
          ? { tone: "success" as const, text: "Strong alignment with the role's requirements." }
          : educationScore >= 50
            ? { tone: "warn" as const, text: "Partial alignment with the role's requirements." }
            : { tone: "danger" as const, text: "Limited alignment with the role's requirements." };

  const takeaways = (qualifications?.matches ?? []).map((match) => ({
    key: match.id,
    ok: match.score >= 0.65 ? (true as const) : match.score >= 0.4 ? ("warn" as const) : (false as const),
    title: `${match.requirement}: ${match.relationship.replace(/\.$/, "").toLowerCase()}.`,
  }));
  if (rows[0]) takeaways.push({ key: "highest", ok: true, title: `Highest qualification: ${rows[0].degree}.` });
  if (rows[0]?.field) takeaways.push({ key: "field", ok: true, title: `Field of study: ${rows[0].field}.` });
  const certCount = Math.max(applicant.certificationCount ?? 0, (applicant.certifications ?? []).length);
  if (certCount > 0) takeaways.push({ key: "certs", ok: true, title: `${certCount} ${certCount === 1 ? "certification" : "certifications"} on the profile.` });

  const Glyph = alignment.tone === "success" ? CheckDot : AlertDot;
  return (
    <>
      <Panel id="education-insight" title="AI Insight" icon={<SparkleIcon size={24} />}>
        <p className="text-body text-ink-600 leading-relaxed">{insight}</p>
        <div className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-4 ${TONE[alignment.tone].tile}`}>
          <Glyph size={30} className={`${TONE[alignment.tone].text} shrink-0`} />
          <div>
            <div className="text-body font-semibold text-ink-900">Education Alignment</div>
            <p className="mt-0.5 text-body-sm text-ink-600">{alignment.text}</p>
          </div>
        </div>
      </Panel>
      <Panel id="education-takeaways" title="Key Takeaways" icon={<BulbIcon size={24} />} iconClass="text-warn">
        <StatusList items={takeaways} empty="No education details are available to summarise." />
      </Panel>
    </>
  );
}
