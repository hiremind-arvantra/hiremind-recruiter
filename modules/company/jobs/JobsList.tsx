"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listJobs,
  fetchJobCounts,
  fetchCompanyDashboard,
  type JobApiResponse,
  type JobCountsResponse,
} from "./services/job.service";
import {
  fetchRecommendations,
  type CandidateRecommendation,
} from "./services/recommendations.service";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { TabBar } from "@/components/ui/TabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Skeleton";
import {
  BriefIcon,
  CalendarIcon,
  ChevronDown,
  DocIcon,
  FunnelIcon,
  UsersIcon,
} from "./shared/icons";
import { StatCard } from "./components/StatCard";
import { FilterSelect } from "./components/FilterSelect";
import { JobCard } from "./components/jobs-list/JobCard";
import {
  WORKPLACE_LOCATIONS,
  EXPERIENCE_LEVELS,
  DEPARTMENTS,
} from "./shared/constants";
import {
  JobInsightsPanel,
  RecommendedCandidatesPanel,
  TopSkillsPanel,
} from "./components/jobs-list/RailPanels";

type StatusTab = "ALL" | "PUBLISHED" | "DRAFT" | "CLOSED";

const TABS: { key: StatusTab; label: string }[] = [
  { key: "ALL", label: "All Jobs" },
  { key: "PUBLISHED", label: "Active" },
  { key: "DRAFT", label: "Draft" },
  { key: "CLOSED", label: "Closed" },
];

const PAGE_SIZE = 3;

/** A filter value of "" or one starting with "All" means "no filter". */
const norm = (v: string): string | undefined =>
  !v || v.startsWith("All") ? undefined : v;

/** Map an experience-level label to an experience-min-years range. */
function expRange(label: string): { min?: number; max?: number } {
  if (label.includes("Entry")) return { min: 0, max: 2 };
  if (label.includes("Early")) return { min: 2, max: 5 };
  if (label.includes("Mid")) return { min: 5, max: 8 };
  if (label.includes("Senior")) return { min: 8, max: 12 };
  if (label.includes("Lead")) return { min: 12 };
  return {};
}

export default function JobsList() {
  const [tab, setTab] = useState<StatusTab>("ALL");
  const [jobs, setJobs] = useState<JobApiResponse[]>([]);
  // Every job the company has posted, independent of the active tab/filter — so
  // "Top Skills in Demand" reflects overall demand, not just the current view.
  const [allJobs, setAllJobs] = useState<JobApiResponse[]>([]);
  const [counts, setCounts] = useState<JobCountsResponse>({
    total: 0,
    published: 0,
    drafts: 0,
  });
  // Application/interview funnel totals across active jobs (from the dashboard aggregate).
  const [funnel, setFunnel] = useState({ applications: 0, interviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  // Recommended candidates, scoped to the selected job (match-score ranked).
  const [railLoading, setRailLoading] = useState(false);
  const [recommended, setRecommended] = useState<CandidateRecommendation[]>([]);
  // Pending dropdown selections — edited freely; do NOT trigger a fetch.
  const [location, setLocation] = useState("");
  const [jobFunction, setJobFunction] = useState("");
  const [expLevel, setExpLevel] = useState("");
  // Applied filters — only these drive the job query (set on "Search Filter").
  const [applied, setApplied] = useState({
    location: "",
    jobFunction: "",
    expLevel: "",
  });

  const applyFilters = () => {
    setApplied({ location, jobFunction, expLevel });
  };

  const resetFilters = () => {
    setLocation("");
    setJobFunction("");
    setExpLevel("");
    setApplied({ location: "", jobFunction: "", expLevel: "" });
  };

  useEffect(() => {
    fetchJobCounts()
      .then(setCounts)
      .catch(() => {}); // non-fatal
    // All jobs (every status) for the overall Top-Skills aggregate.
    listJobs({})
      .then(({ content }) => setAllJobs(content))
      .catch(() => {}); // non-fatal
    // Aggregate applications + interviews across the recruiter's active jobs.
    fetchCompanyDashboard()
      .then((dashboard) => {
        const applications = dashboard.activeJobs.reduce((sum, row) => sum + row.applications, 0);
        const interviews = dashboard.activeJobs.reduce((sum, row) => sum + row.interviews, 0);
        setFunnel({ applications, interviews });
      })
      .catch(() => {}); // non-fatal
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const exp = expRange(applied.expLevel);
    listJobs({
      // The "Closed" tab covers both manually-closed and auto-expired jobs.
      status:
        tab === "ALL" ? undefined : tab === "CLOSED" ? "CLOSED,EXPIRED" : tab,
      location: norm(applied.location),
      jobFunction: norm(applied.jobFunction),
      expMin: exp.min,
      expMax: exp.max,
    })
      .then(({ content }) => {
        if (active) setJobs(content);
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : "Failed to load jobs");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, applied]);

  const totalPages = Math.ceil(jobs.length / PAGE_SIZE);
  const pageJobs = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Top skills in demand — aggregated across ALL the company's jobs (skill → # of
  // jobs requesting it), so it reflects overall demand regardless of the active tab.
  const topSkills = (() => {
    const counts = new Map<string, number>();
    for (const job of allJobs) {
      for (const skill of job.skills ?? []) {
        counts.set(skill.name, (counts.get(skill.name) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, jobs: count }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 5);
  })();

  // When the job set changes (load / tab / filter), default-select the latest
  // Active job (falling back to the most recent job), and jump to its page.
  // Selection otherwise only changes on an explicit user click.
  useEffect(() => {
    if (jobs.length === 0) {
      setSelectedJobId(null);
      setPage(1);
      return;
    }
    const defaultJob = jobs.find((job) => job.status === "PUBLISHED") ?? jobs[0];
    setSelectedJobId(defaultJob.id);
    setPage(Math.floor(jobs.indexOf(defaultJob) / PAGE_SIZE) + 1);
  }, [jobs]);

  // Load Recommended Candidates for the selected job; refresh on change.
  useEffect(() => {
    if (!selectedJobId) {
      setRecommended([]);
      return;
    }
    let active = true;
    setRailLoading(true);
    // Fetch a wider set; the panel keeps only strong (>80%) matches for this job.
    fetchRecommendations(selectedJobId, 12)
      .then((list) => {
        if (active) setRecommended(list);
      })
      .catch(() => {
        if (active) setRecommended([]);
      })
      .finally(() => {
        if (active) setRailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedJobId]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;

  const isFiltered = Boolean(
    norm(applied.location) || norm(applied.jobFunction) || applied.expLevel,
  );
  const tabCount: Record<StatusTab, number> = {
    ALL: counts.total,
    PUBLISHED: counts.published,
    DRAFT: counts.drafts,
    CLOSED: Math.max(counts.total - counts.published - counts.drafts, 0),
  };
  // When filters are applied, the visible tab reflects the actual filtered result count.
  if (isFiltered) tabCount[tab] = jobs.length;

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Find the right talent by posting jobs or exploring candidates."
        actions={
          <Link href="/company/jobs/new" className="btn btn-primary">
            <PlusIcon /> Post a New Job
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-5">
          {/* KPI strip */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              iconBg="bg-brand-50 text-brand-600"
              icon={<BriefIcon size={18} />}
              value={String(counts.published)}
              label="Active Jobs"
            />
            <StatCard
              iconBg="bg-ink-100 text-ink-600"
              icon={<UsersIcon size={18} />}
              value={String(counts.drafts)}
              label="Draft Jobs"
            />
            <StatCard
              iconBg="bg-cobalt-50 text-cobalt-600"
              icon={<DocIcon size={18} />}
              value={String(funnel.applications)}
              label="Applications"
            />
            <StatCard
              iconBg="bg-success/10 text-success"
              icon={<CalendarIcon size={18} />}
              value={String(funnel.interviews)}
              label="Interviews"
            />
          </div>

          {/* Filter toolbar — selections apply on Search */}
          <div className="card px-3 py-3 flex flex-wrap items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 pl-1.5 pr-2 text-caption font-semibold uppercase tracking-wider text-ink-500">
              <FunnelIcon size={13} /> Filters
            </span>
            <FilterSelect
              label="All Locations"
              value={location}
              onChange={setLocation}
              options={["All Locations", ...WORKPLACE_LOCATIONS]}
            />
            <FilterSelect
              label="Job Function"
              value={jobFunction}
              onChange={setJobFunction}
              options={["All", ...DEPARTMENTS]}
            />
            <FilterSelect
              label="Experience Level"
              value={expLevel}
              onChange={setExpLevel}
              options={["All", ...EXPERIENCE_LEVELS]}
            />
            <div className="flex items-center gap-2 sm:ml-auto">
              <button type="button" onClick={resetFilters} className="btn btn-ghost">
                Reset
              </button>
              <button type="button" onClick={applyFilters} className="btn btn-primary">
                <FunnelIcon /> Search
              </button>
            </div>
          </div>

          {/* Status tabs + sort */}
          <TabBar
            variant="line"
            ariaLabel="Job status"
            value={tab}
            onChange={setTab}
            items={TABS.map((t) => ({ key: t.key, label: t.label, count: tabCount[t.key] }))}
            trailing={
              <div className="hidden sm:flex items-center gap-1.5 text-body-sm text-ink-500">
                Sort by:{" "}
                <span className="font-semibold text-ink-800">Most Recent</span>
                <ChevronDown />
              </div>
            }
          />

          {/* Content */}
          {loading ? (
            <div>
              <p className="mb-3 text-body-sm text-ink-500">Loading jobs…</p>
              <LoadingState label="Loading jobs…" rows={3} />
            </div>
          ) : error ? (
            <div role="alert" className="alert alert-danger">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 8v4.5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={<BriefIcon size={22} />}
              title="No jobs here yet"
              description={
                tab === "DRAFT"
                  ? "You have no draft jobs."
                  : "Post your first job to start attracting candidates."
              }
              action={
                <Link href="/company/jobs/new" className="btn btn-primary">
                  <PlusIcon /> Post a Job
                </Link>
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {pageJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    selected={job.id === selectedJobId}
                    onSelect={() => setSelectedJobId(job.id)}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center pt-2">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right rail — stacks below the list under xl ── */}
        <aside aria-label="Job insights" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 items-start">
          <JobInsightsPanel counts={counts} />
          <RecommendedCandidatesPanel job={selectedJob} candidates={recommended} loading={railLoading} />
          <TopSkillsPanel skills={topSkills} />
        </aside>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
