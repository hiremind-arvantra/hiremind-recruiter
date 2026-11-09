"use client";

/* Header, tab strip and right-rail cards shared by every analysis tab. */

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/PageHeader";
import { VerifiedTick } from "@/modules/company/jobs/shared/icons";
import { formatDate } from "@/modules/company/jobs/shared/format";
import type {
  ApplicantDetail,
  ApplicationResponse,
  ApplicationStatusKey,
} from "@/modules/company/jobs/services/applications.service";
import type { Gap, Highlight } from "../types";
import { recommendationFor } from "./model";
import {
  AlertDot,
  ArrowRight,
  BarsIcon,
  CalendarCheckIcon,
  CalendarIcon,
  CapIcon,
  CheckDot,
  ChevronLeft,
  InsightIcon,
  MailIcon,
  PhoneIcon,
  SkillsIcon,
  SparkleIcon,
  TargetIcon,
  XCircleIcon,
  BulbIcon,
} from "./icons";
import { Panel, StatusList, TONE, initials } from "./ui";

/* ── Header ────────────────────────────────────────────────────────────────── */

const STATUS_LABEL: Record<ApplicationStatusKey, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFERED: "Offered",
  REJECTED: "Rejected",
};

export function CandidateHeader({
  jobId,
  jobTitle,
  candidateName,
  applicant,
  application,
  busy,
  onStatus,
  loading,
}: {
  jobId: string;
  jobTitle: string | null;
  candidateName: string;
  applicant: ApplicantDetail | null;
  application: ApplicationResponse | null;
  busy: ApplicationStatusKey | null;
  onStatus: (status: ApplicationStatusKey) => void;
  loading: boolean;
}) {
  const applicationsHref = `/company/jobs/${jobId}/applications`;
  const role = applicant?.currentRole || application?.candidate?.currentRole || null;
  const location = applicant?.currentLocation || null;
  const years = applicant?.experienceYears ?? application?.candidate?.experienceYears ?? null;
  const email = applicant?.email || application?.candidate?.email || null;
  const phone = applicant?.phone || application?.candidate?.phone || null;
  const meta = [role, location, years != null ? `${years}+ Years Experience` : null].filter(Boolean) as string[];

  const status = application?.status ?? null;
  const inInterview = status === "INTERVIEW" || status === "OFFERED";

  return (
    <div className="page-header">
      <div className="page-header-eyebrow">
        <div className="min-w-0 max-w-full overflow-x-auto scrollbar-none [&_ol]:flex-nowrap [&_li]:shrink-0 [&_li]:whitespace-nowrap">
          <Breadcrumbs
            items={[
              { label: "Jobs", href: "/company/jobs" },
              { label: jobTitle ?? "Job" },
              { label: "Applications", href: applicationsHref },
              { label: loading ? "Candidate" : candidateName },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-start gap-5">
        <div className="flex items-start gap-5 min-w-0 flex-1">
          <span
            aria-hidden="true"
            className="grid place-items-center w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-cobalt-50 text-cobalt-600 font-display text-heading font-bold shrink-0"
          >
            {loading ? "" : initials(candidateName)}
          </span>
          <div className="min-w-0">
            <h1 className="page-title flex items-center gap-2 flex-wrap">
              <span className="truncate">{loading ? "Match Analysis" : candidateName}</span>
              {applicant?.verified && (
                <span className="inline-flex text-brand-600" title="Verified profile">
                  <VerifiedTick />
                  <span className="sr-only">Verified profile</span>
                </span>
              )}
            </h1>
            {meta.length > 0 && (
              <p className="mt-1.5 flex flex-wrap items-center text-body text-ink-600">
                {meta.map((item, index) => (
                  <span key={item} className="inline-flex items-center">
                    {index > 0 && <span aria-hidden="true" className="mx-3 h-4 w-px bg-ink-200" />}
                    {item}
                  </span>
                ))}
              </p>
            )}
            {(email || phone) && (
              <ul className="mt-3 flex flex-wrap items-center gap-x-7 gap-y-2 text-body-sm">
                {email && (
                  <li>
                    <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-cobalt-600 hover:text-brand-700">
                      <MailIcon size={16} /> {email}
                    </a>
                  </li>
                )}
                {phone && (
                  <li>
                    <a href={`tel:${phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 text-cobalt-600 hover:text-brand-700">
                      <PhoneIcon size={16} /> {phone}
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end shrink-0">
          {application && (
            <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-body-sm font-medium ${TONE.success.pill}`}>
              Applied on {formatDate(application.appliedAt)}
            </span>
          )}
          {status && status !== "APPLIED" && (
            <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-caption font-semibold ${status === "REJECTED" ? TONE.danger.pill : TONE.brand.pill}`}>
              {STATUS_LABEL[status]}
            </span>
          )}
          <Link href={applicationsHref} className="btn btn-outline h-11">
            <ChevronLeft size={16} /> Back to Applications
          </Link>
          <button
            type="button"
            className="btn btn-primary h-11"
            disabled={!application || inInterview || status === "REJECTED" || busy !== null}
            onClick={() => onStatus("INTERVIEW")}
            title={application ? "Moves this application to the Interview stage" : "Application record not available"}
          >
            <CalendarIcon size={17} />
            {busy === "INTERVIEW" ? "Moving…" : inInterview ? "In Interview Stage" : "Schedule Interview"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────────────── */

export type AnalysisTab = "fit" | "skills" | "experience" | "education" | "role" | "insights";

export const ANALYSIS_TABS: { key: AnalysisTab; label: string; icon: React.ReactNode }[] = [
  { key: "fit", label: "Job Fit Analysis", icon: <TargetIcon size={18} /> },
  { key: "skills", label: "Matched Skills", icon: <SkillsIcon size={18} /> },
  { key: "experience", label: "Experience", icon: <CalendarCheckIcon size={18} /> },
  { key: "education", label: "Education", icon: <CapIcon size={19} /> },
  { key: "role", label: "Role Alignment", icon: <BarsIcon size={18} /> },
  { key: "insights", label: "Insights & Summary", icon: <InsightIcon size={18} /> },
];

export function tabPanelId(key: AnalysisTab) {
  return `analysis-panel-${key}`;
}
export function tabId(key: AnalysisTab) {
  return `analysis-tab-${key}`;
}

export function AnalysisTabs({ value, onChange }: { value: AnalysisTab; onChange: (key: AnalysisTab) => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const measure = useCallback(() => {
    const active = listRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!active) return;
    const next = { left: active.offsetLeft, width: active.offsetWidth };
    setIndicator((prev) => (prev && prev.left === next.left && prev.width === next.width ? prev : next));
  }, []);

  useLayoutEffect(() => {
    measure();
  });

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure]);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = ANALYSIS_TABS.findIndex((tab) => tab.key === value);
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % ANALYSIS_TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + ANALYSIS_TABS.length) % ANALYSIS_TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ANALYSIS_TABS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    onChange(ANALYSIS_TABS[next].key);
    listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div className="card p-1.5 xl:p-0 xl:px-4 mb-5">
      <div
        ref={listRef}
        role="tablist"
        aria-label="Candidate analysis sections"
        onKeyDown={onKeyDown}
        className="relative grid grid-cols-2 sm:grid-cols-3 gap-1 xl:flex xl:justify-between xl:gap-2"
      >
        {indicator && (
          <span
            aria-hidden="true"
            className="hidden xl:block absolute bottom-0 h-0.75 rounded-full bg-brand-600 motion-safe:transition-all motion-safe:duration-300"
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}
        {ANALYSIS_TABS.map((tab) => {
          const selected = tab.key === value;
          return (
            <button
              key={tab.key}
              id={tabId(tab.key)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={tabPanelId(tab.key)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.key)}
              className={`relative inline-flex min-w-0 items-center gap-2 xl:gap-2.5 h-11 xl:h-14 px-3 xl:px-4 rounded-xl xl:rounded-none text-body-sm text-left transition-colors ${
                selected
                  ? "font-semibold text-brand-700 bg-brand-50 xl:bg-transparent"
                  : "font-medium text-ink-700 hover:text-ink-900 hover:bg-ink-50 xl:hover:bg-transparent"
              }`}
            >
              <span className={`shrink-0 ${selected ? "text-brand-600" : "text-ink-500"}`}>{tab.icon}</span>
              <span className="truncate xl:overflow-visible xl:whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Right rail ────────────────────────────────────────────────────────────── */

export function RecommendationCard({ overall, title = "AI Recommendation" }: { overall: number; title?: string }) {
  const recommendation = recommendationFor(overall);
  const Glyph = recommendation.tone === "success" ? CheckDot : AlertDot;
  return (
    <Panel title={title} icon={<SparkleIcon size={24} />} id="rail-recommendation">
      <p className="text-body text-ink-600 leading-relaxed">{recommendation.detail}</p>
      <div className={`mt-4 flex items-center gap-3 rounded-xl border px-4 py-3.5 ${TONE[recommendation.tone].pill}`}>
        <Glyph size={24} className={`${TONE[recommendation.tone].text} shrink-0`} />
        <span className="text-body-lg font-semibold">{recommendation.label}</span>
      </div>
    </Panel>
  );
}

export function StrengthsCard({ highlights, title = "Key Strengths" }: { highlights: Highlight[]; title?: string }) {
  return (
    <Panel title={title} icon={<CheckDot size={22} />} iconClass="text-success" id="rail-strengths">
      <StatusList
        clamp
        items={highlights.slice(0, 4).map((item) => ({ key: item.title, ok: true, title: item.detail || item.title }))}
        empty="No standout strengths were evidenced in the available resume material."
      />
    </Panel>
  );
}

export function GapsCard({ gaps, title = "Key Gaps" }: { gaps: Gap[]; title?: string }) {
  return (
    <Panel title={title} icon={<AlertDot size={22} />} iconClass="text-danger" id="rail-gaps">
      <StatusList
        clamp
        items={gaps.slice(0, 4).map((gap) => ({
          key: gap.title,
          ok: gap.severity === "low" ? "warn" : false,
          title: gap.title,
        }))}
        empty="Every requirement found evidence in the profile."
      />
    </Panel>
  );
}

export function NextStepsCard({
  application,
  busy,
  onStatus,
}: {
  application: ApplicationResponse | null;
  busy: ApplicationStatusKey | null;
  onStatus: (status: ApplicationStatusKey) => void;
}) {
  const [confirmReject, setConfirmReject] = useState(false);
  const status = application?.status ?? null;
  const shortlisted = status === "SHORTLISTED" || status === "INTERVIEW" || status === "OFFERED";
  const rejected = status === "REJECTED";

  return (
    <Panel title="Next Steps" icon={<BulbIcon size={24} />} iconClass="text-warn" id="rail-next">
      {!application && (
        <p className="mb-3 text-caption text-ink-500">The application record could not be loaded, so status changes are unavailable.</p>
      )}
      <div className="space-y-3">
        <button
          type="button"
          className="btn btn-primary w-full h-12 text-body"
          disabled={!application || shortlisted || busy !== null}
          onClick={() => onStatus("SHORTLISTED")}
        >
          {busy === "SHORTLISTED" ? "Shortlisting…" : shortlisted ? "Shortlisted" : "Shortlist Candidate"}
          {!shortlisted && busy !== "SHORTLISTED" && <ArrowRight size={18} />}
        </button>
        {confirmReject && !rejected ? (
          <div className="rounded-xl border border-danger/25 bg-danger/5 p-3">
            <p className="text-body-sm text-ink-700">Reject this application?</p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                className="btn btn-danger btn-sm flex-1"
                disabled={busy !== null}
                onClick={() => {
                  onStatus("REJECTED");
                  setConfirmReject(false);
                }}
              >
                {busy === "REJECTED" ? "Rejecting…" : "Yes, reject"}
              </button>
              <button type="button" className="btn btn-outline btn-sm flex-1" onClick={() => setConfirmReject(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-outline w-full h-12 text-body"
            disabled={!application || rejected || busy !== null}
            onClick={() => setConfirmReject(true)}
          >
            <XCircleIcon size={20} className="text-brand-600" />
            {rejected ? "Rejected" : "Reject"}
          </button>
        )}
      </div>
    </Panel>
  );
}

/** The rail shown on Job Fit Analysis and Role Alignment. */
export function DecisionRail({
  overall,
  highlights,
  gaps,
  application,
  busy,
  onStatus,
}: {
  overall: number;
  highlights: Highlight[];
  gaps: Gap[];
  application: ApplicationResponse | null;
  busy: ApplicationStatusKey | null;
  onStatus: (status: ApplicationStatusKey) => void;
}) {
  return (
    <>
      <RecommendationCard overall={overall} />
      <StrengthsCard highlights={highlights} />
      <GapsCard gaps={gaps} />
      <NextStepsCard application={application} busy={busy} onStatus={onStatus} />
    </>
  );
}

/** Two-column tab layout: content on the left, a 360px rail on wide screens. */
export function TabLayout({ tab, main, rail }: { tab: AnalysisTab; main: React.ReactNode; rail: React.ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={tabPanelId(tab)}
      aria-labelledby={tabId(tab)}
      className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] items-start"
    >
      <div className="space-y-5 min-w-0">{main}</div>
      <aside aria-label="Analysis summary" className="space-y-5 min-w-0">{rail}</aside>
    </div>
  );
}
