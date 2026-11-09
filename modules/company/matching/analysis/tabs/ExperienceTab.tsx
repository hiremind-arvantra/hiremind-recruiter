"use client";

import { TabLayout } from "../chrome";
import {
  AlertDot,
  BriefcaseIcon,
  BuildingIcon,
  ChartUpIcon,
  CheckDot,
  ClipboardIcon,
  PinIcon,
  TargetIcon,
} from "../icons";
import { categoryOf, experienceOverview, levelOf, roleRows, type RoleRow } from "../model";
import { Panel, Pill, ScoreBar, StatTile, StatusList, TONE } from "../ui";
import type { CategoryId } from "../../types";
import type { TabProps } from "./types";

const EXPERIENCE_CATEGORIES: CategoryId[] = ["experience", "career", "industry", "leadership", "responsibilities"];

function fmtYears(years: number): string {
  const rounded = Math.round(years * 10) / 10;
  return `${rounded} ${rounded === 1 ? "year" : "years"}`;
}

export function ExperienceTab(props: TabProps) {
  const { analysis, job, applicant } = props;
  const overview = experienceOverview(analysis, job, applicant);
  const roles = roleRows(job, applicant.experiences);
  const experience = categoryOf(analysis, "experience");

  const banner = experience?.assessable ? levelOf(experience.score) : null;
  const bannerTitle = !banner
    ? "Experience needs validation"
    : banner.label === "High"
      ? "Good match"
      : banner.label === "Medium"
        ? "Partial match"
        : "Limited match";
  const bannerTone = banner?.tone ?? "neutral";

  return (
    <TabLayout
      tab="experience"
      main={
        <>
          <Panel id="experience-overview">
            <div className="@container">
            <div className="flex flex-col @5xl:flex-row gap-5 @5xl:items-start">
              <div className="@5xl:w-60 shrink-0">
                <h2 id="experience-overview-title" className="font-display text-title font-bold text-ink-900">Experience Overview</h2>
                <p className="mt-1 text-body-sm text-ink-500 leading-snug">
                  Summary of candidate&apos;s professional experience and relevance to the job.
                </p>
              </div>
              <div className="grid gap-3 grid-cols-1 @sm:grid-cols-2 @3xl:grid-cols-4 flex-1 min-w-0">
                <StatTile
                  compact
                  tone="brand"
                  icon={<BriefcaseIcon size={22} />}
                  value={overview.totalYears != null ? `${Math.round(overview.totalYears * 10) / 10}+` : "—"}
                  label="Total Experience"
                />
                <StatTile compact tone="info" icon={<BuildingIcon size={22} />} value={overview.companies} label="Companies" />
                <StatTile
                  compact
                  tone="brand"
                  icon={<ChartUpIcon size={22} />}
                  value={overview.relevantShare != null ? `${overview.relevantShare}%` : "—"}
                  label="Relevant Experience"
                />
                <StatTile
                  compact
                  tone={overview.relevance?.tone ?? "neutral"}
                  icon={<TargetIcon size={22} />}
                  value={overview.relevance?.label ?? "—"}
                  label="Experience Relevance"
                />
              </div>
            </div>
            </div>
            <div className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 ${TONE[bannerTone].tile}`}>
              {bannerTone === "success" ? (
                <CheckDot size={28} className="text-success shrink-0" />
              ) : (
                <AlertDot size={28} className={`${TONE[bannerTone].text} shrink-0`} />
              )}
              <div className="min-w-0">
                <div className="text-body font-semibold text-ink-900">{bannerTitle}</div>
                <p className="mt-0.5 text-body-sm text-ink-600">
                  {experience?.summary ?? "The candidate's experience could not be compared with this job."}
                </p>
              </div>
            </div>
          </Panel>

          <Panel
            id="professional-experience"
            title="Professional Experience"
            subtitle="Detailed work history with relevance to the current job requirements."
            action={
              <ul className="hidden md:flex items-center gap-4 text-caption text-ink-700" aria-label="Legend">
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" />High Relevance</li>
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warn" />Medium Relevance</li>
                <li className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger" />Low Relevance</li>
              </ul>
            }
          >
            {roles.length === 0 ? (
              <p className="text-body-sm text-ink-500">No work history is available in this candidate&apos;s profile.</p>
            ) : (
              <ol className="relative">
                {roles.map((role, index) => (
                  <RoleItem key={role.key} role={role} last={index === roles.length - 1} />
                ))}
              </ol>
            )}
          </Panel>
        </>
      }
      rail={<ExperienceRail {...props} relevantYears={overview.relevantYears} />}
    />
  );
}

function RoleItem({ role, last }: { role: RoleRow; last: boolean }) {
  const tone = role.level?.tone ?? "neutral";
  return (
    <li className={`relative grid grid-cols-[20px_minmax(0,1fr)] sm:grid-cols-[20px_130px_minmax(0,1fr)] gap-x-3 ${last ? "" : "pb-5"}`}>
      <span aria-hidden="true" className="relative flex justify-center">
        <span className={`mt-1 w-3.5 h-3.5 rounded-full ${TONE[tone].bar} ring-4 ring-white z-1`} />
        {!last && <span className="absolute top-5 bottom-0 w-px bg-ink-200" />}
      </span>
      <div className="hidden sm:block text-body-sm text-ink-700">
        <div>{role.period}</div>
        {role.duration && <div className="text-ink-500">({role.duration})</div>}
      </div>
      <div className={`min-w-0 flex flex-col md:flex-row gap-4 ${last ? "" : "pb-5 border-b border-ink-100"}`}>
        <div className="min-w-0 flex-1">
          <div className="sm:hidden text-caption text-ink-500 mb-1">
            {role.period}
            {role.duration ? ` · ${role.duration}` : ""}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3 className="text-body-lg font-bold text-ink-900">{role.company ?? "Company not stated"}</h3>
            {role.level && <Pill tone={role.level.tone} size="sm">{role.level.label}</Pill>}
          </div>
          <div className="mt-0.5 text-body-sm font-medium text-ink-700">{role.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-500">
            {role.location && (
              <span className="inline-flex items-center gap-1"><PinIcon size={13} /> {role.location}</span>
            )}
            {role.employmentType && <span>{role.employmentType.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</span>}
            {role.current && <span className="font-medium text-success">Current role</span>}
          </div>
        </div>
        <div className="md:w-56 shrink-0">
          <div className="text-caption font-medium text-ink-800">Match to Job</div>
          {role.relevance != null ? (
            <div className="mt-2 flex items-center gap-3">
              <ScoreBar value={role.relevance} tone={tone} label={`${role.title} match to job`} className="flex-1" />
              <span className="w-10 text-right text-body-sm font-bold text-ink-900 tabular">{role.relevance}%</span>
            </div>
          ) : (
            <div className="mt-1 text-caption text-ink-500">Role title not stated</div>
          )}
        </div>
      </div>
    </li>
  );
}

function ExperienceRail({ analysis, job, applicant, relevantYears }: TabProps & { relevantYears: number | null }) {
  const highlights: { key: string; ok: boolean | "warn"; title: string }[] = [];
  if (applicant.experienceYears != null) {
    highlights.push({ key: "total", ok: true, title: `${fmtYears(applicant.experienceYears)} of total experience` });
  }
  if (relevantYears != null && relevantYears > 0) {
    highlights.push({ key: "relevant", ok: true, title: `${fmtYears(relevantYears)} in roles comparable to ${job.title}` });
  }
  if (applicant.currentRole) {
    highlights.push({
      key: "current",
      ok: true,
      title: `Currently ${applicant.currentRole}${applicant.currentCompany ? ` at ${applicant.currentCompany}` : ""}`,
    });
  }
  const industry = categoryOf(analysis, "industry");
  if (industry?.assessable) {
    highlights.push({ key: "industry", ok: industry.score >= 60 ? true : "warn", title: industry.summary.replace(/\.$/, "") });
  }
  const leadership = categoryOf(analysis, "leadership");
  if (leadership?.assessable && leadership.score >= 60) {
    highlights.push({ key: "leadership", ok: true, title: leadership.summary.replace(/\.$/, "") });
  }

  const concerns = EXPERIENCE_CATEGORIES.flatMap((id) => categoryOf(analysis, id)?.matches ?? [])
    .filter((match) => match.score < 0.5)
    .slice(0, 4)
    .map((match) => ({
      key: match.id,
      ok: false as const,
      title: match.evidence ? `${match.requirement}: ${match.relationship.toLowerCase()}` : `${match.requirement} — not found in the available resume evidence`,
    }));

  const summary = EXPERIENCE_CATEGORIES.map((id) => categoryOf(analysis, id))
    .filter((category) => category?.assessable)
    .slice(0, 3)
    .map((category) => category!.summary.trim().replace(/([^.])$/, "$1."))
    .join(" ");

  return (
    <>
      <Panel id="experience-highlights" title="Experience Highlights">
        <StatusList items={highlights} empty="No work history details are available in the profile." />
      </Panel>
      <Panel
        id="experience-concerns"
        title="Potential Concerns"
        icon={<span className="grid place-items-center w-6 h-6 rounded-md bg-brand-600 text-white text-micro font-bold">!</span>}
      >
        <StatusList items={concerns} empty="No experience requirement is below expectations based on the available evidence." />
      </Panel>
      <Panel
        id="experience-summary"
        title="Summary"
        icon={<span className="grid place-items-center w-6 h-6 rounded-md bg-brand-600 text-white"><ClipboardIcon size={15} /></span>}
      >
        <div className="rounded-xl bg-brand-50/60 border border-brand-100/60 p-4 text-body-sm text-ink-700 leading-relaxed">
          {summary || "The experience-related categories could not be assessed from the available resume evidence."}
        </div>
      </Panel>
    </>
  );
}
