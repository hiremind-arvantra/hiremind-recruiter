"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { MatchScore } from "@/components/ui/MatchScore";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/modules/company/jobs/components/StatCard";
import { listJobs, type JobApiResponse } from "@/modules/company/jobs/services/job.service";
import {
  fetchAgencyApplications,
  fetchAgencyCounts,
  type AgencyApplication,
  type AgencyCounts,
  type AgencyStatus,
} from "./services/agency-applications.service";
import { updateApplicationStatus } from "@/modules/company/jobs/services/applications.service";
import { useAnalysisScores, type AnalysisScore } from "@/modules/company/matching/useAnalysisScores";

const PAGE_SIZE = 10;
// Agency application volume is modest; load a wide window so the on-page search
// filters the whole set (not just one server page) and paginate client-side.
const FETCH_SIZE = 200;

const ACTION_STAGES: { label: string; status: AgencyStatus }[] = [
  { label: "Shortlist", status: "SHORTLISTED" },
  { label: "Move to Interview", status: "INTERVIEW" },
  { label: "Mark as Offered", status: "OFFERED" },
  { label: "Reject", status: "REJECTED" },
];

const STATUS_LABEL: Record<AgencyStatus, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFERED: "Offered",
  REJECTED: "Rejected",
};
const STATUS_STYLE: Record<AgencyStatus, string> = {
  APPLIED: "badge-info",
  SHORTLISTED: "badge-success",
  INTERVIEW: "badge-brand",
  OFFERED: "badge-warn",
  REJECTED: "badge-danger",
};

const STAGE_OPTIONS = ["All Stages", "Applied", "Shortlisted", "Interview", "Offered", "Rejected"];
const EXP_OPTIONS = ["All Experience", "0 – 3 yrs", "3 – 6 yrs", "6+ yrs"];
const AVATAR_BGS = ["bg-brand-50 text-brand-700", "bg-cobalt-50 text-cobalt-700", "bg-ink-100 text-ink-700"];

const labelToStatus = (label: string): AgencyStatus | undefined =>
  (Object.keys(STATUS_LABEL) as AgencyStatus[]).find((k) => STATUS_LABEL[k] === label);

function expInRange(years: number | null, range: string): boolean {
  if (range === "All Experience") return true;
  const y = years ?? 0;
  if (range.startsWith("0")) return y <= 3;
  if (range.startsWith("3")) return y > 3 && y <= 6;
  return y > 6;
}

export default function CompanyApplicationsPage() {
  const [counts, setCounts] = useState<AgencyCounts>({ total: 0, applied: 0, shortlisted: 0, interview: 0, offered: 0, rejected: 0 });
  const [jobs, setJobs] = useState<JobApiResponse[]>([]);
  const [applications, setApplications] = useState<AgencyApplication[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<AgencyApplication | null>(null);
  const searchId = useId();

  // Filters
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("All Jobs");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [expFilter, setExpFilter] = useState("All Experience");

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetchAgencyCounts().then(setCounts).catch(() => {});
    listJobs({ size: 100 }).then((r) => setJobs(r.content)).catch(() => {});
  }, []);

  const jobIdByTitle = useMemo(() => {
    const map = new Map<string, string>();
    jobs.forEach((j) => map.set(j.title, j.id));
    return map;
  }, [jobs]);

  // Server-side filters: job + stage. Search/experience/pagination are client-side
  // over the loaded window so the search box filters the whole set, not one page.
  const reload = () => {
    let active = true;
    setLoading(true);
    setError(null);
    const jobId = jobFilter === "All Jobs" ? undefined : jobIdByTitle.get(jobFilter);
    const status = stageFilter === "All Stages" ? undefined : labelToStatus(stageFilter);
    fetchAgencyApplications({ jobId, status, page: 0, size: FETCH_SIZE })
      .then(({ content, totalElements: total }) => {
        if (!active) return;
        setApplications(content);
        setTotalElements(total);
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Failed to load applications"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  };
  useEffect(reload, [jobFilter, stageFilter, jobIdByTitle]);

  // Client-side filters: search + experience.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (!expInRange(a.experienceYears, expFilter)) return false;
      if (!q) return true;
      return (
        (a.candidateName ?? "").toLowerCase().includes(q) ||
        (a.candidateEmail ?? "").toLowerCase().includes(q) ||
        (a.jobTitle ?? "").toLowerCase().includes(q)
      );
    });
  }, [applications, search, expFilter]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const paged = visible.slice(pageStart, pageStart + PAGE_SIZE);
  // Snap back to page 1 whenever the filtered result set shrinks past the cursor.
  useEffect(() => { if (page > totalPages) setPage(1); }, [page, totalPages]);

  // The match score shown here is the one the Candidate Match Analysis page shows, computed
  // per row from the job and the candidate profile. Only the visible page is scored.
  const { scores } = useAnalysisScores(
    paged.map((a) => ({ key: a.id, jobId: a.jobId, candidateUserId: a.candidateUserId, storedScore: a.matchScore })),
  );

  const jobTitles = useMemo(() => ["All Jobs", ...Array.from(new Set(jobs.map((j) => j.title)))], [jobs]);

  const allChecked = paged.length > 0 && paged.every((a) => selected.has(a.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(paged.map((a) => a.id)));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // "Actions" is a single-target control: enabled only when exactly one row is
  // selected, disabled when none or many (per the review doc).
  const selectedApp = selected.size === 1 ? applications.find((a) => selected.has([...selected][0])) ?? null : null;

  async function applyStage(app: AgencyApplication, status: AgencyStatus) {
    try {
      await updateApplicationStatus(app.jobId, app.id, status);
      setSelected(new Set());
      fetchAgencyCounts().then(setCounts).catch(() => {});
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update application");
    }
  }

  const clearFilters = () => { setSearch(""); setJobFilter("All Jobs"); setStageFilter("All Stages"); setExpFilter("All Experience"); setPage(1); };

  const STATS = [
    { key: "total", label: "Total Applications", value: counts.total, iconBg: "bg-brand-50 text-brand-600", icon: <DocIcon /> },
    { key: "applied", label: "Applied", value: counts.applied, iconBg: "bg-cobalt-50 text-cobalt-600", icon: <UsersIcon /> },
    { key: "short", label: "Shortlisted", value: counts.shortlisted, iconBg: "bg-success/10 text-success", icon: <UsersIcon /> },
    { key: "interview", label: "Interview", value: counts.interview, iconBg: "bg-brand-50 text-brand-600", icon: <ClipboardIcon /> },
    { key: "offered", label: "Offered", value: counts.offered, iconBg: "bg-warn/10 text-warn", icon: <UserCheckIcon /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        subtitle="Only candidates who have applied to your jobs — across all postings."
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATS.map((s) => <StatCard key={s.key} iconBg={s.iconBg} icon={s.icon} value={String(s.value)} label={s.label} />)}
      </div>

      {/* Search + filters toolbar */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col basis-full xl:basis-auto xl:flex-[2] min-w-0">
            <label htmlFor={searchId} className="field-label">Search</label>
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"><SearchIcon /></span>
              <input
                id={searchId}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search by candidate name, email or job title…"
                className="field-input pl-10"
              />
            </div>
          </div>
          <LabeledSelect label="Job" value={jobFilter} onChange={(v) => { setJobFilter(v); setPage(1); }} options={jobTitles} />
          <LabeledSelect label="Stage" value={stageFilter} onChange={(v) => { setStageFilter(v); setPage(1); }} options={STAGE_OPTIONS} />
          <LabeledSelect label="Experience" value={expFilter} onChange={setExpFilter} options={EXP_OPTIONS} />
          <button type="button" onClick={clearFilters} className="btn btn-ghost h-11">Clear Filters</button>
        </div>
      </div>

      {/* List heading + single-target Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="section-title">
            All Applications <span className="text-ink-500 font-semibold tabular">({totalElements})</span>
          </h2>
          <ActionsMenu
            app={selectedApp}
            selectedCount={selected.size}
            onView={() => selectedApp && setViewing(selectedApp)}
            onStage={applyStage}
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="table-scroll max-h-[70vh]">
            <table className="data-table min-w-225">
              <thead>
                <tr>
                  <th scope="col" className="w-12 pr-0">
                    <label className="grid place-items-center w-10 h-10 -ml-2 -my-2.5 cursor-pointer">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-brand-600 w-4 h-4" aria-label="Select all" />
                    </label>
                  </th>
                  <th scope="col">Candidate</th>
                  <th scope="col">Job</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Match Score</th>
                  <th scope="col">Experience</th>
                  <th scope="col">Date Applied</th>
                  <th scope="col" className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((a, i) => (
                  <Row key={a.id} a={a} index={i} selected={selected.has(a.id)} onToggle={() => toggle(a.id)} onView={() => setViewing(a)} score={scores.get(a.id)}
                    />
                ))}
              </tbody>
            </table>
          </div>
          {loading ? (
            <div role="status" aria-live="polite" className="px-5 py-6 space-y-3">
              <p className="text-body-sm text-ink-500">Loading applications…</p>
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-1/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="alert alert-danger m-4">{error}</div>
          ) : paged.length === 0 ? (
            <EmptyState
              icon={<DocIcon />}
              title={totalElements === 0 ? "No candidates have applied to your jobs yet." : "No applications match your filters."}
              className="border-0 rounded-none bg-transparent"
            />
          ) : null}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-body-sm text-ink-500 tabular">
            Showing {pageStart + 1} to {Math.min(pageStart + PAGE_SIZE, visible.length)} of {visible.length} results
          </span>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {viewing && <ApplicantModal a={viewing} score={scores.get(viewing.id)} onClose={() => setViewing(null)} />}
    </div>
  );
}

/* ─── Row ─── */
function Row({ a, index, selected, onToggle, onView, score }: { a: AgencyApplication; index: number; selected: boolean; onToggle: () => void; onView: () => void; score?: AnalysisScore }) {
  const name = a.candidateName ?? "Unknown Candidate";
  const applied = new Date(a.appliedAt);
  const validDate = !Number.isNaN(applied.getTime());
  return (
    <tr className={selected ? "bg-brand-50/40" : undefined}>
      <td className="w-12 pr-0">
        <label className="grid place-items-center w-10 h-10 -ml-2 cursor-pointer">
          <input type="checkbox" checked={selected} onChange={onToggle} className="accent-brand-600 w-4 h-4" aria-label={`Select ${name}`} />
        </label>
      </td>
      <td>
        <div className="flex items-center gap-3 min-w-0">
          <span aria-hidden="true" className={`w-10 h-10 rounded-full ${AVATAR_BGS[index % AVATAR_BGS.length]} grid place-items-center text-caption font-bold shrink-0`}>
            {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </span>
          <div className="leading-snug min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-ink-900">{name}</span>
              {a.fakeSuspected && (
                <span className="badge badge-danger h-5 px-2 text-nano"><WarnIcon /> Suspected Fake</span>
              )}
            </div>
            <div className="text-caption text-ink-500 truncate">{a.candidateEmail ?? "—"}</div>
          </div>
        </div>
      </td>
      <td className="leading-snug">
        <div className="font-medium text-ink-800">{a.jobTitle ?? "—"}</div>
        <div className="text-caption text-ink-500 tabular">{a.jobId.slice(0, 8).toUpperCase()}</div>
      </td>
      <td><span className={`badge ${STATUS_STYLE[a.status]}`}>{STATUS_LABEL[a.status]}</span></td>
      <td>
        {score ? (
          <div className="flex items-center gap-2">
            <MatchScore value={score.score} size="sm" label="Match score" />
            {score.source === "stored" && (
              <span className="text-nano text-ink-500" title="The candidate profile could not be loaded, so this is the score stored with the application.">
                Stored
              </span>
            )}
          </div>
        ) : (
          <Skeleton className="w-10 h-10 rounded-full" />
        )}
      </td>
      <td className="whitespace-nowrap tabular text-ink-800">{a.experienceYears != null ? `${a.experienceYears} yrs` : "—"}</td>
      <td className="whitespace-nowrap leading-snug">
        <div className="text-ink-800 tabular">{validDate ? applied.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
        <div className="text-caption text-ink-500 tabular">{validDate ? applied.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : ""}</div>
      </td>
      <td className="text-right">
        <div className="flex items-center gap-1.5 justify-end">
          <button type="button" onClick={onView} className="btn btn-outline btn-icon text-ink-500 hover:text-brand-700" aria-label="View"><EyeIcon /></button>
        </div>
      </td>
    </tr>
  );
}

/** "Actions" — enabled only when exactly one application is selected. */
function ActionsMenu({
  app, selectedCount, onView, onStage,
}: {
  app: AgencyApplication | null;
  selectedCount: number;
  onView: () => void;
  onStage: (app: AgencyApplication, status: AgencyStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const disabled = app == null; // none, or more than one, selected
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const hint = selectedCount === 0 ? "Select one application to act on it"
    : selectedCount > 1 ? "Select a single application — actions apply to one at a time"
    : undefined;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        title={hint}
        aria-haspopup="true"
        aria-expanded={open}
        className="btn btn-outline"
      >
        Actions <ChevronDownIcon />
      </button>
      {open && app && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl border border-ink-200 shadow-elevated p-1.5 z-30 animate-scale-in">
          <button type="button" onClick={() => { setOpen(false); onView(); }} className="w-full h-10 text-left px-2.5 rounded-lg text-body-sm text-ink-700 font-medium hover:bg-ink-100 transition-colors flex items-center gap-2">
            <EyeIcon /> View full details
          </button>
          <div className="my-1 border-t border-ink-100" />
          <div className="px-2.5 pt-1 pb-1 text-micro uppercase tracking-wider text-ink-500 font-semibold">Move to stage</div>
          {ACTION_STAGES.filter((s) => s.status !== app.status).map((s) => (
            <button key={s.status} type="button" onClick={() => { setOpen(false); onStage(app, s.status); }}
              className={`w-full h-10 text-left px-2.5 rounded-lg text-body-sm font-medium hover:bg-ink-100 transition-colors ${s.status === "REJECTED" ? "text-danger" : "text-ink-700"}`}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantModal({ a, score, onClose }: { a: AgencyApplication; score?: AnalysisScore; onClose: () => void }) {
  const titleId = useId();
  const name = a.candidateName ?? "Unknown Candidate";
  const applied = new Date(a.appliedAt);
  const validDate = !Number.isNaN(applied.getTime());
  const rows = [
    { label: "Candidate Name", value: name },
    { label: "Email", value: a.candidateEmail ?? "—" },
    { label: "Job Applied", value: a.jobTitle ?? "—" },
    { label: "Job Reference", value: a.jobId.slice(0, 8).toUpperCase() },
    { label: "Stage", value: STATUS_LABEL[a.status] },
    { label: "Match Score", value: score ? `${score.score}%` : "Calculating…" },
    { label: "Experience", value: a.experienceYears != null ? `${a.experienceYears} yrs` : "—" },
    { label: "Applied On", value: validDate ? applied.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—" },
    { label: "Fake Profile Check", value: a.fakeSuspected == null ? "Not scored" : a.fakeSuspected ? "⚠ Suspected Fake" : "✓ Looks genuine", full: true },
    { label: "Candidate ID", value: a.candidateUserId, full: true },
  ];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 p-5 border-b border-ink-100 sticky top-0 z-1 bg-white">
          <span aria-hidden="true" className="w-12 h-12 rounded-full bg-brand-50 text-brand-700 grid place-items-center text-body-lg font-bold shrink-0">{name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="section-title">{name}</h3>
            <p className="text-caption text-ink-500">Applicant</p>
          </div>
          <MatchScore value={score?.score ?? a.matchScore ?? 0} size="sm" label="Match score" />
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon -mr-2 -mt-1" aria-label="Close">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <dl className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
          {rows.map((r) => (
            <div key={r.label} className={r.full ? "sm:col-span-2" : ""}>
              <dt className="text-caption text-ink-500">{r.label}</dt>
              <dd className="text-body-sm font-medium text-ink-900 wrap-break-word">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function LabeledSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const id = useId();
  return (
    <div className="flex flex-col min-w-40 flex-1">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative flex items-center">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field-input appearance-none pr-9 text-body-sm cursor-pointer">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span aria-hidden="true" className="absolute right-3.5 text-ink-400 pointer-events-none"><ChevronDownIcon /></span>
      </div>
    </div>
  );
}

/* ─── Icons ─── */
function DocIcon() { return (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>); }
function UsersIcon() { return (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></svg>); }
function ClipboardIcon() { return (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>); }
function UserCheckIcon() { return (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>); }
function SearchIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>); }
function EyeIcon() { return (<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>); }
function WarnIcon() { return (<svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>); }
function ChevronDownIcon() { return (<svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
