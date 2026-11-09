"use client";

import { decodeIds, encodeId, encodeIds } from "@/lib/urlId";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Breadcrumbs, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getMatchAnalysis, type MatchAnalysis } from "@/modules/company/matching";
import {
  AlertDot,
  ArrowLeft,
  BriefcaseIcon,
  CATEGORY_ICON,
  CheckDot,
  DocIcon,
  DotsIcon,
  ListIcon,
  PinIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparkleIcon,
  CalendarCheckIcon,
  ClockIcon,
} from "@/modules/company/matching/analysis/icons";
import { barTone, fitTier, recommendationFor } from "@/modules/company/matching/analysis/model";
import { Pill, RingGauge, ScoreBar, TONE, initials } from "@/modules/company/matching/analysis/ui";
import { CompareIcon, VerifiedTick } from "./shared/icons";
import { fetchJobFull, type JobFullDetail } from "./services/job.service";
import {
  fetchApplicantDetail,
  fetchApplications,
  updateApplicationStatus,
  type ApplicantDetail,
  type ApplicationStatusKey,
} from "./services/applications.service";

/** A selected applicant: their application, full profile and match analysis. */
interface CompareCandidate {
  applicationId: string;
  status: ApplicationStatusKey;
  storedScore: number | null;
  detail: ApplicantDetail;
  analysis: MatchAnalysis;
}

/** Most candidates that fit side by side. */
const MAX_COMPARE = 4;

const STATUS_LABEL: Record<ApplicationStatusKey, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFERED: "Offered",
  REJECTED: "Rejected",
};

/** Header tint per overall tier, as in the mockup. */
const HEAD_TINT = {
  success: "bg-success/7",
  warn: "bg-warn/8",
  danger: "bg-danger/6",
  brand: "bg-brand-50",
  neutral: "bg-ink-50",
} as const;

/* Compare Candidates — the applicants selected on View Applications (?ids=<applicationId,...>)
 * side by side, each with the same match analysis the Candidate Match Analysis page shows. */
export default function CompareCandidatesPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedIds = useMemo(
    () => decodeIds(searchParams.get("ids")),
    [searchParams],
  );
  const ids = useMemo(() => requestedIds.slice(0, MAX_COMPARE), [requestedIds]);
  const droppedCount = requestedIds.length - ids.length;
  const applicationsHref = `/company/jobs/${encodeId(jobId)}/applications`;

  const [job, setJob] = useState<JobFullDetail | null>(null);
  const [candidates, setCandidates] = useState<CompareCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const idsKey = ids.join(",");
  // Application ids already loaded for this job — removing a column needs no refetch.
  const loaded = useRef<{ jobId: string; ids: Set<string> } | null>(null);
  useEffect(() => {
    const wanted = idsKey ? idsKey.split(",") : [];
    const cache = loaded.current;
    if (cache && cache.jobId === jobId && wanted.every((id) => cache.ids.has(id))) return;

    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [jobFull, appsPage] = await Promise.all([
          fetchJobFull(jobId),
          fetchApplications(jobId, undefined, 0, 200),
        ]);
        if (!active) return;
        setJob(jobFull);
        const byId = new Map(appsPage.content.map((row) => [row.id, row]));
        const chosen = wanted.map((id) => byId.get(id)).filter((row): row is NonNullable<typeof row> => Boolean(row));
        const results = await Promise.all(
          chosen.map(async (row) => {
            const detail = await fetchApplicantDetail(row.candidateUserId).catch(() => null);
            if (!detail) return null;
            const analysis = await getMatchAnalysis(jobFull, detail);
            return {
              applicationId: row.id,
              status: row.status,
              storedScore: row.matchScore,
              detail,
              analysis,
            } satisfies CompareCandidate;
          }),
        );
        if (!active) return;
        const found = results.filter((item): item is CompareCandidate => item !== null);
        loaded.current = { jobId, ids: new Set(found.map((item) => item.applicationId)) };
        setCandidates(found);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load candidates");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [jobId, idsKey]);

  const removeCandidate = useCallback(
    (applicationId: string) => {
      const next = requestedIds.filter((id) => id !== applicationId);
      const params = new URLSearchParams(searchParams.toString());
      if (next.length) params.set("ids", encodeIds(next));
      else params.delete("ids");
      const query = params.toString();
      setCandidates((current) => current.filter((candidate) => candidate.applicationId !== applicationId));
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, requestedIds, router, searchParams],
  );

  const shortlist = useCallback(
    async (candidate: CompareCandidate) => {
      if (busyId) return;
      setBusyId(candidate.applicationId);
      setNotice(null);
      try {
        const updated = await updateApplicationStatus(jobId, candidate.applicationId, "SHORTLISTED");
        setCandidates((current) =>
          current.map((item) => (item.applicationId === candidate.applicationId ? { ...item, status: updated.status } : item)),
        );
        setNotice({ tone: "success", text: `${candidate.detail.fullName ?? "Candidate"} shortlisted.` });
      } catch (err) {
        setNotice({ tone: "danger", text: err instanceof Error ? err.message : "Could not shortlist the candidate." });
      } finally {
        setBusyId(null);
      }
    },
    [busyId, jobId],
  );

  const ranked = [...candidates].sort((a, b) => b.analysis.overall - a.analysis.overall);
  const rankOf = new Map(ranked.map((candidate, index) => [candidate.applicationId, index + 1]));
  const categories = candidates[0]?.analysis.categories ?? [];

  const gridStyle = {
    gridTemplateColumns: `minmax(8.5rem, 11rem) repeat(${Math.max(candidates.length, 1)}, minmax(0, 1fr))`,
  };

  return (
    <div>
      <PageHeader
        eyebrow={
          <div className="min-w-0 max-w-full overflow-x-auto scrollbar-none [&_ol]:flex-nowrap [&_li]:shrink-0 [&_li]:whitespace-nowrap">
            <Breadcrumbs
              items={[
                { label: "Jobs", href: "/company/jobs" },
                { label: job?.title ?? "Job" },
                { label: "Candidates", href: applicationsHref },
                { label: "Compare Candidates" },
              ]}
            />
          </div>
        }
        title="Compare Candidates"
        subtitle="Compare multiple candidates side by side to find the best fit for your job requirements."
        actions={
          <>
            <Link href={applicationsHref} className="btn btn-outline h-11">
              <ArrowLeft size={16} /> Back to Candidates
            </Link>
            <Link href={applicationsHref} className="btn btn-primary h-11" title="Select more applicants on View Applications">
              <PlusIcon size={17} /> Add Candidates
            </Link>
          </>
        }
      />

      {droppedCount > 0 && (
        <div role="status" className="alert alert-warn mb-5">
          <span>
            Showing the first {MAX_COMPARE} of {requestedIds.length} selected candidates — {droppedCount} not shown. Compare up to{" "}
            {MAX_COMPARE} at a time to keep them side by side.
          </span>
        </div>
      )}

      {notice && (
        <div role={notice.tone === "danger" ? "alert" : "status"} className={`alert alert-${notice.tone} mb-5 justify-between`}>
          <span>{notice.text}</span>
          <button type="button" className="text-caption font-semibold underline" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div role="status" aria-live="polite" className="grid gap-4 grid-cols-1 md:grid-cols-[200px_repeat(3,minmax(0,1fr))]">
          <span className="sr-only">Loading candidates…</span>
          <Skeleton className="hidden md:block h-160 rounded-2xl" />
          {[0, 1, 2].map((column) => (
            <div key={column} className="card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-28 w-28 rounded-full mx-auto" />
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <Skeleton key={row} className="h-3 w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="alert alert-danger">{error}</div>
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={<CompareIcon size={22} />}
          title="No candidates to compare."
          description="Select two or more applicants on View Applications and click Compare."
          action={<Link href={applicationsHref} className="btn btn-secondary">Go to Applications</Link>}
        />
      ) : (
        <>
          {/* Side by side where the columns fit (xl+). Columns share the width — no sideways scroll. */}
          <div role="table" aria-label="Candidate comparison" className="hidden xl:grid gap-x-3" style={gridStyle}>
            {/* Identity */}
            <div role="row" className="contents">
              <LabelCell first className="pt-5">
                <span className="sr-only">Candidate</span>
              </LabelCell>
              {candidates.map((candidate) => (
                <ColumnCell key={candidate.applicationId} first className={`${HEAD_TINT[fitTier(candidate.analysis.overall).tone]} rounded-t-2xl`}>
                  <IdentityCard candidate={candidate} jobId={jobId} onRemove={() => removeCandidate(candidate.applicationId)} />
                </ColumnCell>
              ))}
            </div>

            {/* Overview */}
            <div role="row" className="contents">
              <LabelCell>
                <div className="font-display text-title-sm font-bold text-ink-900">Candidate Overview</div>
                <div className="mt-8 flex items-center gap-2.5 text-body-sm font-semibold text-ink-900">
                  <span className="text-cobalt-600"><BriefcaseIcon size={18} /></span>
                  Overall Job Fit
                </div>
              </LabelCell>
              {candidates.map((candidate) => (
                <ColumnCell key={candidate.applicationId}>
                  <OverviewBlock analysis={candidate.analysis} name={candidate.detail.fullName ?? "Candidate"} />
                </ColumnCell>
              ))}
            </div>

            {/* Categories */}
            {categories.map((category) => {
              const Icon = CATEGORY_ICON[category.id];
              return (
                <div role="row" key={category.id} className="contents">
                  <LabelCell compact>
                    <span className="flex items-center gap-2.5 text-caption text-ink-800 min-w-0">
                      <span className="text-cobalt-600 shrink-0"><Icon size={16} /></span>
                      <span className="leading-tight" title={category.label}>{shortLabel(category.label)}</span>
                    </span>
                  </LabelCell>
                  {candidates.map((candidate) => (
                    <ColumnCell key={candidate.applicationId} compact>
                      <CategoryBar candidate={candidate} categoryId={category.id} label={category.label} />
                    </ColumnCell>
                  ))}
                </div>
              );
            })}

            <div role="row" className="contents">
              <LabelCell className="pt-4">
                <RowLabel icon={<CheckDot size={16} className="text-success" />}>Key Strengths</RowLabel>
              </LabelCell>
              {candidates.map((candidate) => (
                <ColumnCell key={candidate.applicationId} className="pt-4">
                  <StrengthsBox analysis={candidate.analysis} />
                </ColumnCell>
              ))}
            </div>

            <div role="row" className="contents">
              <LabelCell className="pt-2">
                <RowLabel icon={<AlertDot size={16} className="text-danger" />}>Key Gaps</RowLabel>
              </LabelCell>
              {candidates.map((candidate) => (
                <ColumnCell key={candidate.applicationId} className="pt-2">
                  <GapsBox analysis={candidate.analysis} />
                </ColumnCell>
              ))}
            </div>

            <div role="row" className="contents">
              <LabelCell className="pt-2">
                <RowLabel icon={<SparkleIcon size={16} className="text-brand-600" />}>AI Recommendation</RowLabel>
              </LabelCell>
              {candidates.map((candidate) => (
                <ColumnCell key={candidate.applicationId} className="pt-2">
                  <RecommendationBox analysis={candidate.analysis} />
                </ColumnCell>
              ))}
            </div>

            <div role="row" className="contents">
              <LabelCell last className="pt-2">
                <RowLabel icon={<ClockIcon size={16} className="text-ink-700" />}>Next Action</RowLabel>
              </LabelCell>
              {candidates.map((candidate) => (
                <ColumnCell key={candidate.applicationId} last className="pt-2 rounded-b-2xl">
                  <NextAction
                    candidate={candidate}
                    busyId={busyId}
                    onShortlist={() => shortlist(candidate)}
                    onRemove={() => removeCandidate(candidate.applicationId)}
                  />
                </ColumnCell>
              ))}
            </div>
          </div>

          {/* Below xl: one full-width card per candidate, same content. */}
          <ul className="xl:hidden grid gap-5 lg:grid-cols-2">
            {candidates.map((candidate) => (
              <li key={candidate.applicationId} className="card overflow-hidden min-w-0">
                <div className={`p-4 sm:p-5 ${HEAD_TINT[fitTier(candidate.analysis.overall).tone]}`}>
                  <IdentityCard candidate={candidate} jobId={jobId} onRemove={() => removeCandidate(candidate.applicationId)} />
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  <OverviewBlock analysis={candidate.analysis} name={candidate.detail.fullName ?? "Candidate"} />
                  <div className="space-y-2">
                    {candidate.analysis.categories.map((category) => (
                      <CategoryBar key={category.id} candidate={candidate} categoryId={category.id} label={category.label} showName />
                    ))}
                  </div>
                  <StrengthsBox analysis={candidate.analysis} />
                  <GapsBox analysis={candidate.analysis} />
                  <RecommendationBox analysis={candidate.analysis} />
                  <dl className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-3 gap-y-2 text-caption border-t border-ink-100 pt-4">
                    {profileFacts(job, rankOf).map((fact) => (
                      <Fragment key={fact.label}>
                        <dt className="font-semibold text-ink-600">{fact.label}</dt>
                        <dd className="text-ink-800 wrap-break-word min-w-0">{fact.render(candidate)}</dd>
                      </Fragment>
                    ))}
                  </dl>
                  <NextAction
                    candidate={candidate}
                    busyId={busyId}
                    onShortlist={() => shortlist(candidate)}
                    onRemove={() => removeCandidate(candidate.applicationId)}
                  />
                </div>
              </li>
            ))}
          </ul>

          <ProfileDetails candidates={candidates} rankOf={rankOf} job={job} gridStyle={gridStyle} />
        </>
      )}
    </div>
  );
}

function shortLabel(label: string): string {
  return label
    .replace("Technical / Functional Skills", "Technical Skills")
    .replace("Qualification & Certification", "Qualifications")
    .replace("Industry / Domain Experience", "Industry Experience")
    .replace("Achievement & Business Impact", "Achievements & Impact")
    .replace("Leadership & Stakeholder Experience", "Leadership & Stakeholder")
    .replace("Career Progression & Role Alignment", "Career Progression")
    .replace("Location / Work Mode / Availability", "Location / Availability");
}

/* ── Grid cells ────────────────────────────────────────────────────────────── */

function LabelCell({
  children,
  first,
  last,
  compact,
  className = "",
}: {
  children: React.ReactNode;
  first?: boolean;
  last?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="rowheader"
      className={`bg-white border-x border-ink-100 px-4 ${compact ? "py-1.5" : "py-4"} ${first ? "border-t rounded-t-2xl" : ""} ${
        last ? "border-b rounded-b-2xl pb-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

function ColumnCell({
  children,
  first,
  last,
  compact,
  className = "",
}: {
  children: React.ReactNode;
  first?: boolean;
  last?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="cell"
      className={`min-w-0 bg-white border-x border-ink-100 px-4 ${compact ? "py-1.5" : "py-4"} ${first ? "border-t" : ""} ${
        last ? "border-b pb-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

function RowLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5 text-body-sm font-semibold text-ink-900">
      <span className="shrink-0">{icon}</span>
      {children}
    </span>
  );
}

function BulletList({ items, ok, empty }: { items: string[]; ok: boolean; empty: string }) {
  if (items.length === 0) return <p className="mt-2 text-caption text-ink-500">{empty}</p>;
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-caption text-ink-700">
          {ok ? (
            <CheckDot size={15} className="text-success shrink-0 mt-px" />
          ) : (
            <AlertDot size={15} className="text-danger shrink-0 mt-px" />
          )}
          <span className="line-clamp-2" title={item}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Checked = kept in the comparison; unchecking removes the column. */
function KeepCheckbox({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked
        onChange={onRemove}
        className="w-5 h-5 rounded accent-brand-600 cursor-pointer"
        aria-label={`Keep ${name} in the comparison`}
      />
    </label>
  );
}

/* ── Column blocks ─────────────────────────────────────────────────────────── */

function IdentityCard({
  candidate,
  jobId,
  onRemove,
}: {
  candidate: CompareCandidate;
  jobId: string;
  onRemove: () => void;
}) {
  const { detail } = candidate;
  const name = detail.fullName ?? "Candidate";
  const meta = [
    detail.currentLocation ? { key: "loc", icon: <PinIcon size={14} />, text: detail.currentLocation } : null,
    detail.experienceYears != null
      ? { key: "exp", icon: <BriefcaseIcon size={14} />, text: `${detail.experienceYears}+ Years` }
      : null,
  ].filter((item): item is { key: string; icon: React.ReactElement; text: string } => item !== null);

  return (
    <div className="flex items-start gap-3">
      <div className="pt-1">
        <KeepCheckbox name={name} onRemove={onRemove} />
      </div>
      <span
        aria-hidden="true"
        className="hidden 2xl:grid place-items-center w-14 h-14 rounded-full bg-white text-cobalt-600 border border-ink-100 font-display text-title font-bold shrink-0 max-xl:grid"
      >
        {initials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-title font-bold text-ink-900 leading-tight wrap-break-word min-w-0" title={name}>{name}</span>
          {detail.verified && (
            <span className="text-brand-600 shrink-0" title="Verified profile">
              <VerifiedTick />
              <span className="sr-only">Verified profile</span>
            </span>
          )}
        </div>
        <div className="text-body-sm text-ink-600 leading-snug wrap-break-word">{detail.currentRole ?? "Role not stated"}</div>
        {meta.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-ink-600">
            {meta.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1">
                <span className="text-cobalt-600">{item.icon}</span>
                {item.text}
              </span>
            ))}
          </div>
        )}
      </div>
      <ColumnMenu
        name={name}
        analysisHref={`/company/jobs/${encodeId(jobId)}/candidates/${encodeId(detail.candidateUserId)}/match`}
        onRemove={onRemove}
      />
    </div>
  );
}

function ColumnMenu({ name, analysisHref, onRemove }: { name: string; analysisHref: string; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${name}`}
        onClick={() => setOpen((value) => !value)}
        className="grid place-items-center w-8 h-8 rounded-lg text-ink-600 hover:bg-white/80"
      >
        <DotsIcon size={18} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-ink-100 bg-white p-1.5 shadow-elevated">
          <Link role="menuitem" href={analysisHref} className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm text-ink-800 hover:bg-ink-50">
            <DocIcon size={16} className="text-cobalt-600" /> View full analysis
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm text-danger hover:bg-danger/5"
          >
            <AlertDot size={16} /> Remove from comparison
          </button>
        </div>
      )}
    </div>
  );
}

function OverviewBlock({ analysis, name }: { analysis: MatchAnalysis; name: string }) {
  const tier = fitTier(analysis.overall);
  const assessable = analysis.categories.filter((category) => category.assessable).length;
  const ringTone = tier.tone === "danger" ? "brand" : tier.tone;
  return (
    <div className="@container">
    <div className="flex flex-col items-stretch gap-3 @[17rem]:flex-row @[17rem]:items-center @[17rem]:gap-4">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <RingGauge value={analysis.overall} tone={ringTone} size={104} stroke={10} label={`${name} overall job fit`}>
          <span className="font-display text-heading-lg font-extrabold text-ink-900 tabular">{analysis.overall}%</span>
        </RingGauge>
        <Pill tone={tier.tone} size="sm">{tier.label}</Pill>
      </div>
      <dl className="flex-1 min-w-0 space-y-2.5 rounded-xl bg-ink-50/70 p-3">
        <MiniStat icon={<ShieldCheckIcon size={20} />} tone="success" value={`${Math.round(analysis.confidence * 100)}%`} label="Confidence" />
        <MiniStat icon={<DocIcon size={20} />} tone="info" value={`${Math.round(analysis.evidenceCoverage * 100)}%`} label="Evidence Coverage" />
        <MiniStat icon={<ListIcon size={20} />} tone="brand" value={`${assessable} of ${analysis.categories.length}`} label="Categories" />
      </dl>
    </div>
    </div>
  );
}

function MiniStat({
  icon,
  tone,
  value,
  label,
}: {
  icon: React.ReactNode;
  tone: "success" | "info" | "brand";
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden="true" className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 ${TONE[tone].icon}`}>{icon}</span>
      <div className="min-w-0 leading-tight">
        <dd className="font-display text-body-lg font-bold text-ink-900 tabular">{value}</dd>
        <dt className="text-caption text-ink-500 truncate">{label}</dt>
      </div>
    </div>
  );
}

/* ── Per-candidate blocks (shared by the grid and the stacked cards) ─────── */

function CategoryBar({
  candidate,
  categoryId,
  label,
  showName = false,
}: {
  candidate: CompareCandidate;
  categoryId: string;
  label: string;
  showName?: boolean;
}) {
  const result = candidate.analysis.categories.find((item) => item.id === categoryId);
  const score = result?.assessable ? result.score : null;
  return (
    <div className="@container">
      <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] @[15rem]:grid-cols-[minmax(0,1fr)_5.5rem_2.5rem] items-center gap-2">
        <span className={`text-caption text-ink-700 leading-tight ${showName ? "" : "hidden @[15rem]:block truncate"}`} title={label}>
          {shortLabel(label)}
        </span>
        <ScoreBar
          value={score ?? 0}
          tone={score == null ? "neutral" : barTone(score)}
          label={`${candidate.detail.fullName ?? "Candidate"} ${label}`}
          className={showName ? "col-span-2 order-last @[15rem]:order-none @[15rem]:col-span-1" : ""}
        />
        <span className={`text-right text-caption font-bold tabular ${score == null ? "text-ink-400" : "text-ink-900"}`}>
          {score == null ? "—" : `${score}%`}
        </span>
      </div>
    </div>
  );
}

function StrengthsBox({ analysis }: { analysis: MatchAnalysis }) {
  return (
    <div className="rounded-xl bg-success/6 border border-success/10 p-3.5 h-full">
      <div className="flex items-center gap-2 text-caption font-bold text-ink-900">
        <ShieldCheckIcon size={16} className="text-success" /> Key Strengths
      </div>
      <BulletList ok items={analysis.highlights.slice(0, 3).map((item) => item.detail || item.title)} empty="No standout strengths evidenced." />
    </div>
  );
}

function GapsBox({ analysis }: { analysis: MatchAnalysis }) {
  return (
    <div className="rounded-xl bg-danger/5 border border-danger/10 p-3.5 h-full">
      <div className="flex items-center gap-2 text-caption font-bold text-ink-900">
        <SparkleIcon size={15} className="text-danger" /> Key Gaps
      </div>
      <BulletList ok={false} items={analysis.gaps.slice(0, 3).map((gap) => gap.title)} empty="Every requirement found evidence." />
    </div>
  );
}

function RecommendationBox({ analysis }: { analysis: MatchAnalysis }) {
  const recommendation = recommendationFor(analysis.overall);
  return (
    <div className={`rounded-xl border px-3.5 py-3 flex flex-wrap items-center justify-between gap-2 ${TONE[recommendation.tone].tile}`}>
      <span className="flex items-center gap-2 text-caption font-bold text-ink-900">
        <SparkleIcon size={16} className={TONE[recommendation.tone].text} /> AI Recommendation
      </span>
      <Pill tone={recommendation.tone} size="sm" className="whitespace-normal text-left">{recommendation.label}</Pill>
    </div>
  );
}

function NextAction({
  candidate,
  busyId,
  onShortlist,
  onRemove,
}: {
  candidate: CompareCandidate;
  busyId: string | null;
  onShortlist: () => void;
  onRemove: () => void;
}) {
  const done = candidate.status === "SHORTLISTED" || candidate.status === "INTERVIEW" || candidate.status === "OFFERED";
  const name = candidate.detail.fullName ?? "Candidate";
  return (
    <div className="flex items-center justify-center gap-3 pb-1">
      <KeepCheckbox name={name} onRemove={onRemove} />
      <button
        type="button"
        className="btn btn-primary h-11 flex-1 max-w-44 min-w-0"
        disabled={done || candidate.status === "REJECTED" || busyId !== null}
        onClick={onShortlist}
      >
        <CalendarCheckIcon size={17} />
        <span className="truncate">
          {busyId === candidate.applicationId
            ? "Shortlisting…"
            : done
              ? STATUS_LABEL[candidate.status]
              : candidate.status === "REJECTED"
                ? "Rejected"
                : "Shortlist"}
        </span>
      </button>
    </div>
  );
}

/* ── Profile details — the facts the earlier comparison table carried ─────── */

interface ProfileFact {
  label: string;
  render: (candidate: CompareCandidate) => React.ReactNode;
}

function profileFacts(job: JobFullDetail | null, rankOf: Map<string, number>): ProfileFact[] {
  const jobSkills = new Set((job?.skills ?? []).map((skill) => skill.name.toLowerCase().trim()));
  return [
    { label: "Rank by match", render: (c) => <span className="font-semibold tabular">#{rankOf.get(c.applicationId)}</span> },
    {
      label: "Application status",
      render: (c) => (
        <Pill tone={c.status === "REJECTED" ? "danger" : c.status === "APPLIED" ? "info" : "brand"} size="sm">
          {STATUS_LABEL[c.status]}
        </Pill>
      ),
    },
    { label: "Stored match score", render: (c) => (c.storedScore != null ? <span className="tabular">{c.storedScore}%</span> : "—") },
    { label: "Current company", render: (c) => c.detail.currentCompany ?? "—" },
    { label: "Location", render: (c) => c.detail.currentLocation ?? "—" },
    { label: "Preferred location", render: (c) => c.detail.preferredLocation ?? "—" },
    {
      label: "Education",
      render: (c) =>
        c.detail.educationDegrees.length ? (
          <ul className="space-y-0.5">{c.detail.educationDegrees.map((degree) => <li key={degree}>{degree}</li>)}</ul>
        ) : (
          "—"
        ),
    },
    { label: "Certifications", render: (c) => <span className="tabular">{c.detail.certificationCount}</span> },
    {
      label: "Job skills held",
      render: (c) => {
        if (jobSkills.size === 0) return "—";
        const held = c.detail.skills.filter((skill) => jobSkills.has(skill.toLowerCase().trim()));
        return (
          <span>
            <span className="font-semibold tabular">{held.length}</span>
            <span className="text-ink-500"> of {jobSkills.size} (exact name)</span>
          </span>
        );
      },
    },
    {
      label: "Verified",
      render: (c) =>
        c.detail.verified ? (
          <span className="inline-flex items-center gap-1.5 text-success font-semibold"><VerifiedTick /> Verified</span>
        ) : (
          <span className="text-ink-500">Not verified</span>
        ),
    },
  ];
}

function ProfileDetails({
  candidates,
  rankOf,
  job,
  gridStyle,
}: {
  candidates: CompareCandidate[];
  rankOf: Map<string, number>;
  job: JobFullDetail | null;
  gridStyle: React.CSSProperties;
}) {
  return (
    <section aria-labelledby="profile-details-title" className="mt-6 card overflow-hidden hidden xl:block">
      <h2 id="profile-details-title" className="px-5 pt-4 pb-3 font-display text-title font-bold text-ink-900 border-b border-ink-100">
        Profile Details
      </h2>
      <div role="table" aria-labelledby="profile-details-title" className="grid gap-x-3" style={gridStyle}>
        {profileFacts(job, rankOf).map((row) => (
          <Fragment key={row.label}>
            <div role="rowheader" className="px-5 py-3 text-caption font-semibold text-ink-600 border-b border-ink-100">{row.label}</div>
            {candidates.map((candidate) => (
              <div key={candidate.applicationId} role="cell" className="min-w-0 px-4 py-3 text-body-sm text-ink-800 border-b border-ink-100 wrap-break-word">
                {row.render(candidate)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
