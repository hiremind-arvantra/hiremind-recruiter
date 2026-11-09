"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { encodeId, encodeIds } from "@/lib/urlId";
import { getStoredCompanyName } from "@/lib/api/config";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader, Breadcrumbs } from "@/components/ui/PageHeader";
import { TabBar } from "@/components/ui/TabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { BriefIcon, ChevronDown, ClockIcon, CompareIcon, PinIcon, RupeeIcon, SearchIcon, VerifiedTick, UsersIcon } from "./shared/icons";
import { formatDate, formatExperience, formatSalary } from "./shared/format";
import { FilterSelect } from "./components/FilterSelect";
import { JobStatusBadge } from "./components/JobStatusBadge";
import { CandidateCard, CandidateRow } from "./components/job-applications/CandidateRow";
import { getMatchSummary, type MatchSummary } from "@/modules/company/matching";
import { ApplicationSummaryPanel, FakeProfilesPanel, MatchDistributionPanel } from "./components/job-applications/RailPanels";
import type { AppStatus, Candidate } from "./components/job-applications/data";
import { fetchJobFull, type JobFullDetail } from "./services/job.service";
import {
  fetchApplicationCounts,
  fetchApplications,
  fetchApplicantDetail,
  updateApplicationStatus,
  type ApplicantDetail,
  type ApplicationCounts,
  type ApplicationResponse,
  type ApplicationStatusKey,
} from "./services/applications.service";

const PAGE_SIZE = 10;

const STATUS_TABS: { key: string; status?: ApplicationStatusKey }[] = [
  { key: "All" },
  { key: "Applied", status: "APPLIED" },
  { key: "Shortlisted", status: "SHORTLISTED" },
  { key: "Interview", status: "INTERVIEW" },
  { key: "Offered", status: "OFFERED" },
  { key: "Rejected", status: "REJECTED" },
];

const STATUS_LABEL: Record<ApplicationStatusKey, AppStatus> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFERED: "Offered",
  REJECTED: "Rejected",
};

const STATUS_KEY: Record<AppStatus, ApplicationStatusKey> = {
  Applied: "APPLIED",
  Shortlisted: "SHORTLISTED",
  Interview: "INTERVIEW",
  Offered: "OFFERED",
  Rejected: "REJECTED",
};

const AVATAR_BGS = ["bg-brand-50", "bg-cobalt-50", "bg-ink-100", "bg-cobalt-100"];

type KnownJobStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "EXPIRED";
const isJobStatus = (status: string | undefined): status is KnownJobStatus =>
  status === "DRAFT" || status === "PUBLISHED" || status === "CLOSED" || status === "EXPIRED";

/** Map an API application (+ hydrated candidate) onto the table's view model. */
function toCandidate(application: ApplicationResponse, index: number, analysed?: number): Candidate {
  const info = application.candidate;
  const applied = new Date(application.appliedAt);
  const validDate = !Number.isNaN(applied.getTime());
  return {
    id: application.id,
    candidateUserId: application.candidateUserId,
    name: info?.fullName ?? "Unknown Candidate",
    verified: info?.verified ?? false,
    email: info?.email ?? "—",
    phone: info?.phone ?? "—",
    avatarBg: AVATAR_BGS[index % AVATAR_BGS.length],
    experience: info?.experienceYears != null ? `${info.experienceYears} yrs` : "—",
    company: info?.currentCompany ?? "Not Specified",
    companyRole: info?.currentRole ?? "",
    companyChar: (info?.currentCompany ?? "?").charAt(0).toUpperCase(),
    appliedDate: validDate ? applied.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—",
    appliedTime: validDate ? applied.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "",
    match: analysed ?? application.matchScore ?? 0,
    matchSource: analysed != null ? "analysis" : "stored",
    status: STATUS_LABEL[application.status],
  };
}

/* View Applications — candidates who applied to a single job. */
export default function JobApplicationsPage({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobFullDetail | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [counts, setCounts] = useState<ApplicationCounts>({ total: 0, applied: 0, shortlisted: 0, interview: 0, offered: 0, rejected: 0 });
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [tab, setTab] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<Candidate | null>(null);
  // Strengths / gaps per candidate, filled in after the rows are already on screen.
  const [summaries, setSummaries] = useState<Record<string, MatchSummary>>({});
  const enrichAttempted = useRef<Set<string>>(new Set());
  // Profiles that could not be analysed keep the stored score.
  const [unscored, setUnscored] = useState<Set<string>>(new Set());
  const [jobFailed, setJobFailed] = useState(false);
  const searchId = useId();

  // Job header + counts — fetched once.
  useEffect(() => {
    setCompanyName(getStoredCompanyName() ?? "");
    fetchJobFull(jobId).then(setJob).catch(() => setJobFailed(true));
    fetchApplicationCounts(jobId).then(setCounts).catch(() => {});
  }, [jobId]);

  // Applications — refetched on tab / page change.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const status = STATUS_TABS.find((t) => t.key === tab)?.status;
    fetchApplications(jobId, status, page - 1, PAGE_SIZE)
      .then(({ content, totalElements: total }) => {
        if (!active) return;
        setApplications(content);
        setTotalElements(total);
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Failed to load applications"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [jobId, tab, page]);

  // Progressive enrichment: once the visible rows and the job are known, pull each
  // candidate's profile and derive their strong / gap areas. Rows render without it,
  // and a profile that fails to load simply keeps its row plain.
  useEffect(() => {
    if (!job || applications.length === 0) return;
    const pending = applications
      .map((application) => application.candidateUserId)
      .filter((id): id is string => Boolean(id) && !enrichAttempted.current.has(id));
    if (pending.length === 0) return;
    pending.forEach((id) => enrichAttempted.current.add(id));

    (async () => {
      const results = await Promise.allSettled(
        pending.map(async (id) => [id, await getMatchSummary(job, await fetchApplicantDetail(id))] as const),
      );
      const resolved = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const failedIds = pending.filter((_, index) => results[index].status === "rejected");
      if (resolved.length) setSummaries((prev) => ({ ...prev, ...Object.fromEntries(resolved) }));
      if (failedIds.length) setUnscored((prev) => new Set([...prev, ...failedIds]));
    })();
  }, [job, applications]);

  const countFor = (key: string): number => {
    switch (key) {
      case "Applied": return counts.applied;
      case "Shortlisted": return counts.shortlisted;
      case "Interview": return counts.interview;
      case "Offered": return counts.offered;
      case "Rejected": return counts.rejected;
      default: return counts.total;
    }
  };

  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  // The list shows the same score as the Candidate Match Analysis page, so rows wait until
  // every visible applicant has been analysed (or could not be), then rank by that score.
  const scoresReady =
    jobFailed ||
    (job !== null &&
      applications.every(
        (application) =>
          !application.candidateUserId ||
          summaries[application.candidateUserId] !== undefined ||
          unscored.has(application.candidateUserId),
      ));
  const candidates = applications
    .map((application, index) =>
      toCandidate(application, index, application.candidateUserId ? summaries[application.candidateUserId]?.overall : undefined),
    )
    .map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => b.candidate.match - a.candidate.match || a.index - b.index)
    .map(({ candidate }) => candidate);
  const showRows = !loading && !error && scoresReady;
  const skills = (job?.skills ?? []).map((s) => s.name);
  const fakeCount = candidates.filter((c) => c.fake).length;
  const allSelected = candidates.length > 0 && candidates.every((c) => selected.has(c.id));
  // Rank follows the analysed score within this page.
  const rankOffset = (page - 1) * PAGE_SIZE;

  const rowProps = (c: Candidate, index: number) => ({
    c,
    rank: rankOffset + index + 1,
    selected: selected.has(c.id),
    onToggle: () => toggle(c.id),
    onView: () => setViewing(c),
    onStatusChange: (status: AppStatus) => handleStatusChange(c.id, status),
    matchHref: c.candidateUserId ? `/company/jobs/${encodeId(jobId)}/candidates/${encodeId(c.candidateUserId)}/match` : undefined,
    summary: c.candidateUserId ? summaries[c.candidateUserId] : undefined,
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      if (candidates.length > 0 && candidates.every((c) => prev.has(c.id))) return new Set();
      return new Set(candidates.map((c) => c.id));
    });

  async function handleStatusChange(appId: string, next: AppStatus) {
    const previous = applications;
    // Optimistic update so the badge reflects the change immediately.
    setApplications((apps) => apps.map((a) => (a.id === appId ? { ...a, status: STATUS_KEY[next] } : a)));
    try {
      await updateApplicationStatus(jobId, appId, STATUS_KEY[next]);
      fetchApplicationCounts(jobId).then(setCounts).catch(() => {});
    } catch {
      setApplications(previous); // roll back on failure
    }
  }

  const compareControl = selected.size >= 2 ? (
    <Link
      href={`/company/jobs/${encodeId(jobId)}/compare?ids=${encodeIds([...selected])}`}
      className="btn btn-secondary"
      title="Compare the selected candidates"
    >
      <CompareIcon /> Compare ({selected.size})
    </Link>
  ) : (
    <span
      aria-disabled="true"
      className="btn btn-outline select-none"
      title="Select at least two candidates to compare"
    >
      <CompareIcon /> Compare{selected.size === 1 ? " (1)" : ""}
    </span>
  );

  return (
    <div>
      <PageHeader
        eyebrow={
          // One line at every width (scrolls sideways if long) so the title never shifts down.
          <div className="min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&_ol]:flex-nowrap [&_li]:shrink-0 [&_li]:whitespace-nowrap">
            <Breadcrumbs
              items={[
                { label: "Jobs", href: "/company/jobs" },
                { label: job?.title ?? "Job" },
                { label: "View Applications" },
              ]}
            />
          </div>
        }
        title={job?.title ?? "—"}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className="inline-flex items-center gap-1 font-medium text-ink-700">
              {companyName || "—"}
              <VerifiedTick />
            </span>
            {isJobStatus(job?.status) ? (
              <JobStatusBadge status={job.status} />
            ) : (
              <span className="badge badge-neutral">{job?.status ?? "—"}</span>
            )}
          </span>
        }
        actions={
          <Link href={`/company/jobs/${encodeId(jobId)}/edit`} className="btn btn-outline">Edit Job</Link>
        }
      />

      {/* The applicant list gets the full content width; the insight panels sit below it. */}
      <div className="grid gap-6 items-start">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-6">
          {/* Job context */}
          <section aria-label="Job details" className="card p-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              <div className="flex-1 min-w-0">
                <dl className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-x-6 gap-y-3">
                  <JobFact icon={<PinIcon size={14} />} label="Location" value={`${job?.workplaceLocation || "—"}${job?.workMode ? ` · ${job.workMode}` : ""}`} />
                  <JobFact icon={<BriefIcon size={14} />} label="Employment type" value={job?.employmentType || "—"} />
                  <JobFact icon={<ClockIcon size={14} />} label="Experience" value={formatExperience(job?.experienceMinYears ?? null, job?.experienceMaxYears ?? null)} />
                  <JobFact icon={<RupeeIcon size={14} />} label="Salary" value={formatSalary(job?.annualCtc ?? null, job?.currency ?? null)} />
                </dl>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-ink-100">
                    {skills.slice(0, 5).map((s) => <span key={s} className="badge badge-neutral">{s}</span>)}
                    {skills.length > 5 && <span className="badge badge-neutral">+{skills.length - 5}</span>}
                  </div>
                )}
              </div>
              <div className="flex items-stretch gap-3 shrink-0">
                <div className="surface-muted px-4 py-3 min-w-32">
                  <div className="text-caption text-ink-500">Posted on</div>
                  <div className="mt-1 text-body-sm font-semibold text-ink-800 tabular">{formatDate(job?.publishedAt ?? job?.createdAt ?? null)}</div>
                </div>
                <div className="surface-muted px-4 py-3 min-w-32">
                  <div className="text-caption text-ink-500">Applications</div>
                  <div className="mt-1 kpi-value text-heading">{counts.total}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Status tabs + Compare */}
          <TabBar
            ariaLabel="Application status"
            items={STATUS_TABS.map((t) => ({ key: t.key, label: t.key, count: countFor(t.key) }))}
            value={tab}
            onChange={(key) => { setTab(key); setPage(1); }}
            trailing={<div className="hidden xl:block pb-1.5">{compareControl}</div>}
          />

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-full sm:min-w-60">
              <label htmlFor={searchId} className="sr-only">Search applicants</label>
              <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"><SearchIcon /></span>
              <input id={searchId} type="text" placeholder="Search by name, skills, or email" className="field-input h-10 pl-10 text-body-sm" />
            </div>
            <FilterSelect label="Experience" options={["Any", "0 – 3 yrs", "3 – 6 yrs", "6+ yrs"]} variant="outline" />
            <FilterSelect label="Current Location" options={["All", "Bangalore", "Hyderabad", "Pune"]} variant="outline" />
            <FilterSelect label="Notice Period" options={["Any", "Immediate", "30 Days", "60 Days"]} variant="outline" />
            <div className="xl:hidden">{compareControl}</div>
            <div className="ml-auto hidden sm:flex items-center gap-1.5 text-body-sm text-ink-500">
              Sort by: <span className="font-semibold text-ink-800">Best Match</span>
              <ChevronDown />
            </div>
          </div>

          {/* Ranked applicants: a table where it fits (xl+), cards below that. Never scrolls sideways. */}
          <div className="card overflow-hidden">
            {showRows && candidates.length > 0 && (
              <>
                <table className="data-table table-fixed hidden xl:table">
                  <colgroup>
                    <col className="w-12" />
                    <col className="w-12" />
                    <col />
                    <col className="w-32" />
                    <col className="w-52 2xl:w-64" />
                    <col className="w-32" />
                    <col className="w-34" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col" className="pr-0">
                        <label className="grid place-items-center w-10 h-10 -ml-2 -my-2.5 cursor-pointer">
                          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-brand-600 w-4 h-4" aria-label="Select all" />
                        </label>
                      </th>
                      <th scope="col" className="px-1">Rank</th>
                      <th scope="col">Candidate</th>
                      <th scope="col">Applied On</th>
                      <th scope="col">Match Score</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c, i) => (
                      <CandidateRow key={c.id} {...rowProps(c, i)} />
                    ))}
                  </tbody>
                </table>

                <div className="xl:hidden">
                  <label className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-ink-100 bg-ink-50/60 text-caption font-semibold text-ink-600 cursor-pointer">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-brand-600 w-4 h-4" />
                    Select all
                  </label>
                  <ul className="divide-y divide-ink-100">
                    {candidates.map((c, i) => (
                      <CandidateCard key={c.id} {...rowProps(c, i)} />
                    ))}
                  </ul>
                </div>
              </>
            )}
            {loading || (!error && !scoresReady && applications.length > 0) ? (
              <div role="status" aria-live="polite" className="px-5 py-6 space-y-3">
                <p className="text-body-sm text-ink-500">{loading ? "Loading applications…" : "Scoring applicants…"}</p>
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/5" />
                    </div>
                    <Skeleton className="w-10 h-10 rounded-full" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div role="alert" className="alert alert-danger m-4">{error}</div>
            ) : candidates.length === 0 ? (
              <EmptyState
                icon={<UsersIcon size={22} />}
                title="No applications in this category yet."
                className="border-0 rounded-none bg-transparent"
              />
            ) : null}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-body-sm text-ink-500 tabular">
              Showing {candidates.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {(page - 1) * PAGE_SIZE + candidates.length} of {countFor(tab)} applications
            </span>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>

        {/* ── Right rail ── */}
        <aside aria-label="Applicant insights" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 min-w-0">
          <MatchDistributionPanel candidates={showRows ? candidates : []} />
          <ApplicationSummaryPanel counts={counts} />
          <FakeProfilesPanel fakeCount={fakeCount} />
        </aside>
      </div>

      {viewing && <CandidateProfileModal c={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function JobFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <span aria-hidden="true" className="icon-tile icon-tile-sm bg-ink-100 text-ink-500">{icon}</span>
      <div className="min-w-0">
        <dt className="text-caption text-ink-500">{label}</dt>
        <dd className="text-body-sm font-semibold text-ink-800 wrap-break-word">{value}</dd>
      </div>
    </div>
  );
}

function CandidateProfileModal({ c, onClose }: { c: Candidate; onClose: () => void }) {
  const [detail, setDetail] = useState<ApplicantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!c.candidateUserId) { setLoading(false); setFailed(true); return; }
    let active = true;
    setLoading(true); setFailed(false);
    fetchApplicantDetail(c.candidateUserId)
      .then((d) => { if (active) setDetail(d); })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [c.candidateUserId]);

  // Fall back to the row's data when the full profile can't be loaded.
  const rows: { label: string; value: string; full?: boolean }[] = [
    { label: "Email", value: detail?.email ?? c.email },
    { label: "Phone", value: detail?.phone ?? c.phone },
    { label: "Experience", value: detail?.experienceYears != null ? `${detail.experienceYears} yrs` : c.experience },
    { label: "Current Company", value: detail?.currentCompany ?? c.company },
    { label: "Current Role", value: (detail?.currentRole ?? c.companyRole) || "—" },
    { label: "Current Location", value: detail?.currentLocation ?? "—" },
    { label: "Preferred Location", value: detail?.preferredLocation ?? "—" },
    { label: "Certifications", value: detail ? String(detail.certificationCount) : "—" },
    { label: "Applied On", value: `${c.appliedDate}${c.appliedTime ? ` · ${c.appliedTime}` : ""}` },
    { label: "Match Score", value: `${c.match}%` },
    { label: "Status", value: c.status },
    { label: "Profile Status", value: detail?.profileStatus ?? "—" },
  ];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 p-5 border-b border-ink-100 sticky top-0 z-1 bg-white">
          <span aria-hidden="true" className={`w-12 h-12 rounded-full ${c.avatarBg} text-ink-700 grid place-items-center text-body-lg font-bold shrink-0`}>{c.name.split(" ").map((w) => w[0]).join("")}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 id={titleId} className="section-title">{detail?.fullName ?? c.name}</h3>
              {(detail?.verified ?? c.verified) && <VerifiedTick />}
              {c.fake && <span className="badge badge-danger h-5 px-2 text-nano">Suspected Fake</span>}
            </div>
            <p className="text-caption text-ink-500">{(detail?.currentRole ?? c.companyRole) || "Candidate"}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon -mr-2 -mt-1" aria-label="Close">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
            {rows.map((r) => (
              <div key={r.label} className={r.full ? "sm:col-span-2" : ""}>
                <dt className="text-caption text-ink-500">{r.label}</dt>
                <dd className="text-body-sm font-medium text-ink-900 wrap-break-word">{r.value}</dd>
              </div>
            ))}
          </dl>

          {loading ? (
            <div role="status" className="text-body-sm text-ink-500">Loading full profile…</div>
          ) : (
            <>
              <ProfileChips label="Skills" items={detail?.skills ?? []} empty="No skills listed." />
              <ProfileChips label="Education" items={detail?.educationDegrees ?? []} empty="No education listed." />
              {failed && <div className="alert alert-warn">Showing summary only — the full profile couldn&apos;t be loaded.</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileChips({ label, items, empty }: { label: string; items: string[]; empty: string }) {
  return (
    <div className="pt-4 border-t border-ink-100">
      <div className="text-caption font-semibold text-ink-500 mb-2">{label}</div>
      {items.length === 0 ? (
        <div className="text-body-sm text-ink-500">{empty}</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s) => (
            <span key={s} className="badge badge-neutral">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}
