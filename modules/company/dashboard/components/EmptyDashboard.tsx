"use client";

import Link from "next/link";
import type { JobCountsResponse } from "@/modules/company/jobs/services/job.service";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard as KpiCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImageStage } from "@/components/ui/ImageStage";

/* First-run dashboard shown when the company has not posted any jobs yet.
 * Mirrors the populated dashboard's stat-card row but leads with an onboarding
 * empty state + "Get Started" checklist instead of live hiring data. */
export default function EmptyDashboard({
  companyName,
  counts,
}: {
  companyName: string;
  counts: JobCountsResponse;
}) {
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
      />

      <div className="space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            iconBg="bg-brand-50 text-brand-600"
            icon={<BriefIcon />}
            value={String(counts.published)}
            label="Active Jobs"
            sub={counts.drafts > 0 ? `${counts.drafts} draft${counts.drafts === 1 ? "" : "s"}` : "Published"}
          />
          <StatCard iconBg="bg-success/10 text-success" icon={<UserPlusIcon />} value="0" label="Total Candidates" sub="Total" />
          <StatCard iconBg="bg-cobalt-50 text-cobalt-600" icon={<DocIcon />} value="0" label="Applications" sub="Received" />
          <StatCard iconBg="bg-warn/10 text-warn" icon={<CalendarIcon />} value="0" label="Interviews" sub="Scheduled" />
          <StatCard iconBg="bg-brand-50 text-brand-600" icon={<UserCheckIcon />} value="0" label="Hires" sub="This month" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          {/* MAIN — spatial empty state */}
          <section className="card-elevated relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12 flex flex-col items-center text-center">
            {/* Faint floor grid under the stage, fading out toward the edges. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-brand-50/70 to-transparent"
            />
            <div className="relative flex flex-col items-center">
              <span className="eyebrow">Get Started</span>
              <h2 className="mt-2 font-display text-heading font-extrabold tracking-tight text-ink-900">
                Let&apos;s get you started!
              </h2>
              <p className="text-ink-500 text-body mt-1.5">
                You haven&apos;t posted any jobs yet.
              </p>

              <ImageStage tone="violet" className="w-72 max-w-full h-52 my-6">
                <ChairIllustration />
              </ImageStage>

              <h3 className="font-display text-title font-bold text-ink-900 max-w-md">
                Post your first job and find the perfect candidates
              </h3>
              <p className="text-ink-500 text-body-sm mt-1.5 mb-6">
                Reach top talent and build your dream team.
              </p>

              <Link href="/company/jobs/new" className="btn btn-primary btn-lg">
                <PlusIcon /> Post Your First Job
              </Link>
            </div>
          </section>

          {/* RIGHT rail — stacks below under xl */}
          <aside className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 items-start">
            {/* Profile completion */}
            <div className="card p-5">
              <SectionHeader as="h3" title="Profile Completion" />
              <div className="mt-4 flex items-center gap-4">
                <Ring percent={85} />
                <div className="leading-snug min-w-0">
                  <div className="text-body-sm font-bold text-ink-900">Almost there!</div>
                  <div className="text-caption text-ink-500 mt-0.5">
                    Complete your profile to unlock more features.
                  </div>
                  <Link href="/company/settings" className="btn btn-secondary text-body-sm mt-3">
                    Complete Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Get Started */}
            <div className="card p-5">
              <SectionHeader as="h3" title="Get Started" />
              <ul className="mt-3 -mx-2 space-y-0.5">
                <GetStarted
                  icon={<BriefIcon />}
                  title="Post a Job"
                  sub="Create your first job post"
                  href="/company/jobs/new"
                />
                <GetStarted
                  icon={<UserPlusIcon />}
                  title="Invite Team Members"
                  sub="Add your team to collaborate"
                />
                <GetStarted
                  icon={<BuildingIcon />}
                  title="Add Clients"
                  sub="Add your clients to start hiring"
                  href="/company/clients/new"
                />
                <GetStarted
                  icon={<ChartIcon />}
                  title="View Reports"
                  sub="Track your hiring performance"
                />
              </ul>
            </div>
          </aside>
        </div>

        {/* Recent Activity — recedes */}
        <div className="card p-5">
          <SectionHeader as="h3" title="Recent Activity" icon={<FilterIcon />} />
          <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 py-8 px-4 text-center text-ink-500 text-body-sm">
            No activity yet. Post a job to start seeing applications and updates here.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pieces ─── */
function StatCard({
  iconBg,
  icon,
  value,
  label,
  sub,
}: {
  iconBg: string;
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
}) {
  return <KpiCard label={label} value={value} sub={sub} icon={icon} iconClassName={iconBg} />;
}
function Ring({ percent }: { percent: number }) {
  return (
    <div
      role="img"
      aria-label={`Profile completion: ${percent}%`}
      className="relative w-18 h-18 rounded-full grid place-items-center shrink-0 shadow-card"
      style={{
        background: `conic-gradient(var(--color-success) ${percent * 3.6}deg, var(--color-ink-100) 0deg)`,
      }}
    >
      <div className="w-14 h-14 rounded-full bg-white grid place-items-center shadow-elevated">
        <span className="font-display text-body font-extrabold tabular text-ink-900">
          {percent}
          <span className="text-micro text-ink-500">%</span>
        </span>
      </div>
    </div>
  );
}
function GetStarted({
  icon,
  title,
  sub,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="icon-tile icon-tile-sm bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div className="flex-1 min-w-0 leading-snug">
        <div className="text-body-sm font-semibold text-ink-900">{title}</div>
        <div className="text-caption text-ink-500">{sub}</div>
      </div>
      <span className="text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600">
        <ArrowRight />
      </span>
    </>
  );
  const className =
    "group flex items-center gap-3 min-h-12 rounded-xl px-2 py-2 transition-colors hover:bg-ink-50";
  return (
    <li>
      {href ? (
        <Link href={href} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}
function ChairIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 160" width="240" height="160" fill="none" className="relative max-w-full h-auto">
      {/* Job board window */}
      <rect x="50" y="25" width="120" height="70" rx="8" className="fill-white stroke-brand-200" strokeWidth="2" />
      <circle cx="62" cy="36" r="2" className="fill-brand-300" />
      <circle cx="70" cy="36" r="2" className="fill-brand-300" />
      <circle cx="78" cy="36" r="2" className="fill-brand-300" />
      <rect x="60" y="48" width="100" height="6" rx="3" className="fill-brand-100" />
      <rect x="60" y="58" width="80" height="6" rx="3" className="fill-brand-100" />
      <rect x="60" y="68" width="90" height="6" rx="3" className="fill-brand-100" />
      {/* Empty chair */}
      <rect x="100" y="95" width="60" height="40" rx="8" className="fill-brand-600" />
      <rect x="100" y="95" width="60" height="12" rx="6" className="fill-brand-500" />
      <rect x="118" y="135" width="24" height="14" className="fill-brand-700" />
      <ellipse cx="130" cy="152" rx="50" ry="4" className="fill-brand-100" />
      {/* Sparkles */}
      <path d="M205 35l3-8 3 8 8 3-8 3-3 8-3-8-8-3z" className="fill-brand-400" />
      <path d="M30 90l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" className="fill-warn" />
      <circle cx="40" cy="55" r="3" className="fill-cobalt-400" />
    </svg>
  );
}

/* Icons */
function PlusIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function BriefIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function UserPlusIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5M18 7v4M16 9h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function UserCheckIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5M16 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 4v16h16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 16l3-4 3 2 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10m0 0L8 3m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
