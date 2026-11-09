"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { encodeId } from "@/lib/urlId";
import {
  fetchHiringTrend,
  type CompanyDashboardResponse,
  type DashboardJobRow,
  type HiringRange,
  type HiringTrend,
  type HiringTrendPoint,
  type JobCountsResponse,
} from "@/modules/company/jobs/services/job.service";
import { StatCard } from "@/modules/company/jobs/components/StatCard";
import { JobStatusBadge } from "@/modules/company/jobs/components/JobStatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  BriefIcon,
  CalendarIcon,
  DocIcon,
  UsersIcon,
  UserCheckIcon,
  ArrowRightLong,
} from "../icons";

interface Aggregate {
  applications: number;
  shortlisted: number;
  interview: number;
  offered: number;
}

const EMPTY_AGG: Aggregate = { applications: 0, shortlisted: 0, interview: 0, offered: 0 };

const RANGE_OPTIONS: { key: HiringRange; label: string }[] = [
  { key: "WEEKLY", label: "Weekly" },
  { key: "MONTHLY", label: "Monthly" },
  { key: "YEARLY", label: "Yearly" },
];

/* Live company dashboard, shown once the company has at least one job. All its
 * live data — the Active Jobs table rows and the application aggregates
 * (Applications / Shortlisted / Interviews / funnel) — arrives as props from
 * the single dashboard call in CompanyDashboard; this component does no
 * fetching of its own. Total Candidates / Hires, the hiring-overview trend and
 * Upcoming Interviews have no backend domain yet and render as
 * empty/illustrative placeholders.
 *
 * Hierarchy: KPI strip → primary band (Active Jobs + Hiring Funnel, elevated) →
 * secondary band (Hiring Overview + Recent Activity, flat). */
export default function PopulatedDashboard({
  companyName,
  counts,
  activeJobs,
}: {
  companyName: string;
  counts: JobCountsResponse;
  activeJobs: CompanyDashboardResponse["activeJobs"];
}) {
  const rows: DashboardJobRow[] = activeJobs;
  const agg = useMemo<Aggregate>(
    () =>
      rows.reduce<Aggregate>(
        (acc, row) => ({
          applications: acc.applications + row.applications,
          shortlisted: acc.shortlisted + row.shortlisted,
          interview: acc.interview + row.interviews,
          offered: acc.offered + row.offered,
        }),
        EMPTY_AGG,
      ),
    [rows],
  );

  // Stage tones follow the palette: violet → cobalt → amber → green, Hired in soft violet.
  const funnel = [
    { label: "Applications", value: agg.applications, tone: "bg-linear-to-r from-brand-700 via-brand-600 to-brand-500", dot: "bg-brand-600" },
    { label: "Shortlisted", value: agg.shortlisted, tone: "bg-linear-to-r from-cobalt-600 via-cobalt-500 to-cobalt-400", dot: "bg-cobalt-500" },
    { label: "Interviews", value: agg.interview, tone: "bg-warn", dot: "bg-warn" },
    { label: "Offered", value: agg.offered, tone: "bg-success", dot: "bg-success" },
    { label: "Hired", value: 0, tone: "bg-linear-to-r from-brand-400 to-brand-300", dot: "bg-brand-300" },
  ];
  const conversion =
    agg.applications > 0 ? ((0 / agg.applications) * 100).toFixed(1) : "0.0";

  return (
    <div>
      <PageHeader
        title={
          <>
            Welcome back{companyName ? `, ${companyName}` : ""}!{" "}
            <span aria-hidden="true">👋</span>
          </>
        }
        subtitle={<>Here&apos;s what&apos;s happening with your hiring today.</>}
        actions={
          <Link href="/company/jobs/new" className="btn btn-primary">
            <PlusIcon /> Post a New Job
          </Link>
        }
      />

      <div className="space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard iconBg="bg-brand-50 text-brand-600" icon={<BriefIcon size={18} />} value={String(counts.published)} label="Active Jobs" />
          <StatCard iconBg="bg-success/10 text-success" icon={<UsersIcon size={18} />} value={String(agg.applications)} label="Total Candidates" />
          <StatCard iconBg="bg-cobalt-50 text-cobalt-600" icon={<DocIcon size={18} />} value={String(agg.applications)} label="Applications" />
          <StatCard iconBg="bg-warn/10 text-warn" icon={<CalendarIcon size={18} />} value={String(agg.interview)} label="Interviews" />
          <StatCard iconBg="bg-brand-50 text-brand-600" icon={<UserCheckIcon size={18} />} value="0" label="Hires" />
        </div>

        {/* ── Primary band ── */}
        {/* Two columns only once the Active Jobs table fits beside the funnel — below that
           it takes the full width, because clipping the Status column (or making the
           recruiter scroll sideways to reach it) is worse than stacking the two cards. */}
        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-stretch">
          {/* Active Jobs */}
          <section className="card-elevated overflow-hidden h-full flex flex-col">
            <SectionHeader
              className="px-5 pt-5 pb-4"
              title="Active Jobs"
              action={
                <Link href="/company/jobs" className="inline-flex items-center gap-1 h-10 text-body-sm text-brand-700 font-semibold hover:text-brand-900 transition-colors">
                  View All Jobs <ArrowRightLong size={13} />
                </Link>
              }
            />
            {rows.length === 0 ? (
              <div className="mx-5 mb-5 rounded-2xl border border-dashed border-ink-200 py-10 text-center text-ink-500 text-body-sm">No active jobs to show.</div>
            ) : (
              <div className="table-scroll border-t border-ink-100">
                <table className="data-table data-table-compact min-w-140">
                  <thead>
                    <tr>
                      <th scope="col" className="pl-5">Job Title</th>
                      <th scope="col">Department</th>
                      <th scope="col" className="text-center">Applications</th>
                      <th scope="col" className="text-center">Shortlisted</th>
                      <th scope="col" className="text-center">Interviews</th>
                      <th scope="col" className="text-center">Offered</th>
                      <th scope="col" className="pr-5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td className="pl-5">
                          <Link href={`/company/jobs/${encodeId(row.id)}/applications`} className="font-semibold text-ink-900 hover:text-brand-700 transition-colors">
                            {row.title}
                          </Link>
                        </td>
                        <td className="text-ink-600">{row.department || "—"}</td>
                        <td className="text-center tabular font-bold text-ink-900">{row.applications}</td>
                        <td className="text-center tabular">{row.shortlisted}</td>
                        <td className="text-center tabular">{row.interviews}</td>
                        <td className="text-center tabular">{row.offered}</td>
                        <td className="pr-5"><JobStatusBadge status={row.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Hiring Funnel — centred bands narrow stage by stage */}
          <section className="card-elevated p-5 h-full flex flex-col">
            <SectionHeader as="h3" title="Hiring Funnel" />
            <ol className="mt-5 space-y-3 flex-1">
              {funnel.map((stage) => {
                const max = funnel[0].value || 1;
                const width = Math.max((stage.value / max) * 100, stage.value > 0 ? 6 : 2);
                return (
                  <li key={stage.label}>
                    <div className="flex items-center justify-between text-caption mb-1.5">
                      <span className="inline-flex items-center gap-2 text-ink-600 font-medium">
                        <span aria-hidden="true" className={`w-2 h-2 rounded-full ${stage.dot}`} />
                        {stage.label}
                      </span>
                      <span className="font-display font-extrabold text-body tabular text-ink-900">{stage.value}</span>
                    </div>
                    <div aria-hidden="true" className="relative h-8 rounded-xl bg-ink-50 border border-ink-100 overflow-hidden">
                      <div
                        className={`absolute inset-y-1 left-1/2 -translate-x-1/2 rounded-lg shadow-card transition-[width] duration-500 ${stage.tone}`}
                        style={{ width: `${width}%` }}
                      >
                        {/* Top-lit bevel gives each band its depth. */}
                        <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-white/25" />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="flex items-center justify-between mt-5 surface-muted px-4 py-3">
              <span className="text-body-sm font-semibold text-ink-700">Conversion Rate</span>
              <span className="font-display text-title-sm font-extrabold tabular text-success">{conversion}%</span>
            </div>
          </section>
        </div>

        {/* ── Secondary band — recedes ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-stretch">
          {/* Hiring Overview */}
          <HiringOverview />

          {/* Recent Activity — derived from live jobs + application counts */}
          <section className="card p-5 h-full">
            <SectionHeader
              as="h3"
              title="Recent Activity"
              action={<Link href="/company/applications" className="inline-flex items-center h-10 text-body-sm text-brand-700 font-semibold hover:text-brand-900 transition-colors">View all</Link>}
            />
            {rows.length === 0 ? (
              <div className="mt-3 py-6 text-center text-ink-500 text-body-sm">No recent activity yet.</div>
            ) : (
              <ul className="mt-3 relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-ink-100">
                {rows.slice(0, 5).map((row) => (
                  <li key={row.id} className="relative flex items-start gap-3">
                    <span className="relative icon-tile icon-tile-sm bg-white border border-ink-200 text-brand-600">
                      <BriefIcon size={14} />
                    </span>
                    <div className="leading-snug min-w-0 pt-1">
                      <div className="text-body-sm text-ink-700">
                        <b className="font-semibold text-ink-900">{row.title}</b>{" "}
                        {row.applications > 0
                          ? `has ${row.applications} application${row.applications === 1 ? "" : "s"}`
                          : "is now live"}
                      </div>
                      <div className="text-caption text-ink-500 mt-0.5">{row.department || "—"}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ─── Pieces ─── */
function PlusIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function MiniStat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: number; tint: string }) {
  return (
    <div className="surface-muted p-3 flex items-center gap-2.5 min-w-0">
      <span className={`icon-tile icon-tile-sm ${tint}`}>{icon}</span>
      <div className="leading-tight min-w-0">
        <div className="text-micro text-ink-500 truncate">{label}</div>
        <div className="font-display font-extrabold text-title-sm tabular text-ink-900">{value}</div>
      </div>
    </div>
  );
}

/**
 * Applications over time, for the range the recruiter picked. The card owns the range
 * and loads its own data, so changing it costs one small request rather than reloading
 * the dashboard. Every figure here — the curve and the four totals — describes that same
 * window.
 */
function HiringOverview() {
  const [range, setRange] = useState<HiringRange>("WEEKLY");
  const [trend, setTrend] = useState<HiringTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    fetchHiringTrend(range)
      .then((data) => { if (active) setTrend(data); })
      .catch(() => { if (active) { setTrend(null); setFailed(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);

  return (
    <section className="card p-5 h-full flex flex-col">
      <SectionHeader
        as="h3"
        title="Hiring Overview"
        action={
          <label className="relative block">
            <span className="sr-only">Show hiring overview by</span>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as HiringRange)}
              className="field-input h-10 w-auto cursor-pointer appearance-none pl-3.5 pr-9 text-body-sm"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400"><polyline points="6 9 12 15 18 9" /></svg>
          </label>
        }
      />

      {failed ? (
        <p role="alert" className="mt-4 rounded-2xl border border-dashed border-ink-200 py-10 text-center text-body-sm text-ink-500">
          Couldn&apos;t load the hiring overview.
        </p>
      ) : (
        <>
          <div className="mt-4">
            <HiringChart points={trend?.points ?? []} loading={loading} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <MiniStat icon={<UsersIcon size={16} />} label="Applications" value={trend?.applications ?? 0} tint="bg-brand-50 text-brand-600" />
            <MiniStat icon={<UserCheckIcon size={16} />} label="Shortlisted" value={trend?.shortlisted ?? 0} tint="bg-success/10 text-success" />
            <MiniStat icon={<CalendarIcon size={16} />} label="Interviews" value={trend?.interviews ?? 0} tint="bg-warn/10 text-warn" />
            <MiniStat icon={<UserCheckIcon size={16} />} label="Offered" value={trend?.offered ?? 0} tint="bg-brand-50 text-brand-600" />
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Area chart of applications per bucket. Each point sits at the centre of its bucket's
 * column and the labels are laid out on the same columns, so a label always sits under
 * its own point — they were spread edge-to-edge before, independently of the curve.
 */
function HiringChart({ points, loading }: { points: HiringTrendPoint[]; loading: boolean }) {
  const values = points.map((point) => point.applications);
  const peak = Math.max(...values, 1);
  const w = 520;
  const h = 150;
  const columns = points.length;
  const coords = values.map((value, index) => {
    const x = ((index + 0.5) * w) / columns;
    const y = h - (value / peak) * (h - 20) - 10;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const first = coords[0];
  const last = coords[coords.length - 1];
  const area = first && last ? `${line} L${last[0].toFixed(1)},${h} L${first[0].toFixed(1)},${h} Z` : "";

  if (loading || columns === 0) {
    return (
      <div role="status" aria-live="polite" className="w-full">
        <span className="sr-only">Loading hiring overview…</span>
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="mt-2 h-3 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative">
        {/* Hairline guides */}
        <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => <span key={i} className="block h-px bg-ink-100" />)}
        </div>
        <svg aria-hidden="true" viewBox={`0 0 ${w} ${h}`} className="relative w-full h-36 text-brand-500 overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hm-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#hm-area)" />
          <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* Points as HTML so they stay round when the chart stretches. */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          {coords.map(([x, y], index) => (
            <span
              key={points[index].label}
              className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full bg-white border-2 border-brand-500"
              style={{ left: `${(x / w) * 100}%`, top: `${(y / h) * 100}%` }}
            />
          ))}
        </div>
      </div>
      {/* Same columns as the points above, so every label sits under its own point. */}
      <div
        aria-hidden="true"
        className="mt-2 grid text-micro text-ink-500"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {points.map((point) => <span key={point.label} className="truncate text-center">{point.label}</span>)}
      </div>
      <table className="sr-only">
        <caption>Applications received per period</caption>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{point.applications}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
