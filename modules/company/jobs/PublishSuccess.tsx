"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredCompanyName } from "@/lib/api/config";
import { fetchJob, type JobDetail } from "./services/job.service";
import { NextCard, Detail } from "./components/publish-success/pieces";
import { SuccessRail } from "./components/publish-success/SuccessRail";
import {
  ArrowRight, BriefIcon, BuildingIcon, GridIcon, PaperPlane, PinIcon,
  ShareIcon, ShieldIcon, ShortlistIcon, SuccessGraphic, TargetIcon, UserIcon,
} from "./components/publish-success/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImageStage } from "@/components/ui/ImageStage";

const DASH = "—";

function formatDate(iso?: string | null): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return DASH;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function formatMoney(amount: number | null | undefined, currency: string | null): string {
  if (amount == null) return DASH;
  return `${currency || "₹"} ${amount.toLocaleString("en-IN")} per annum`;
}
function formatExperience(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null && max == null) return DASH;
  if (min != null && max != null) return `${min} – ${max} Years`;
  return `${min ?? max} Years`;
}

export default function PublishSuccess({ jobId }: { jobId?: string }) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [shared, setShared] = useState(false);

  useEffect(() => {
    setCompanyName(getStoredCompanyName() ?? "");
    if (jobId) fetchJob(jobId).then(setJob).catch(() => {});
  }, [jobId]);

  async function shareJob() {
    const link = `${window.location.origin}/company/jobs/${jobId ?? ""}`;
    try {
      await navigator.clipboard.writeText(link);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  const jobHref = jobId ? `/company/jobs/${jobId}/applications` : "/company/jobs";
  const locationText = job?.workplaceLocation
    ? `${job.workplaceLocation}${job.workMode ? ` (${job.workMode})` : ""}`
    : DASH;
  const openingsText =
    job?.openings != null ? `${job.openings} Opening${job.openings === 1 ? "" : "s"}` : DASH;

  return (
    <div>
      <PageHeader
        title={<>Job Published Successfully! <span aria-hidden="true">🎉</span></>}
        subtitle="Your job post is now live and visible to candidates."
        actions={
          <>
            <Link href="/company/dashboard" className="btn btn-outline">
              <GridIcon /> Go to Jobs Dashboard
            </Link>
            <Link href={jobHref} className="btn btn-primary">
              View Job Post <PaperPlane />
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="min-w-0 space-y-6">
          {/* Celebration + Published Job Summary */}
          <section className="card-elevated overflow-hidden">
            <div className="relative flex flex-col md:flex-row items-center gap-6 px-6 py-6 sm:px-8 bg-linear-to-br from-success/10 via-white to-brand-50/60 border-b border-ink-100">
              <ImageStage tone="neutral" floor={false} className="shrink-0">
                <SuccessGraphic />
              </ImageStage>
              <div className="flex-1 min-w-0 text-center md:text-left">
                <h2 className="section-title">Published Job Summary</h2>
                <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="badge badge-success">
                    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-success" /> Live
                  </span>
                  <span className="inline-flex items-center gap-1 text-caption text-ink-500"><BriefIcon /> {job?.employmentType ?? DASH}</span>
                </div>
                <div className="mt-2 font-display text-heading font-extrabold tracking-tight text-ink-900 wrap-break-word">{job?.title ?? DASH}</div>
                <div className="flex items-center justify-center md:justify-start gap-x-3 gap-y-1 text-caption text-ink-600 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1"><BuildingIcon /> {companyName || DASH}</span>
                  <span aria-hidden="true" className="text-ink-300">•</span>
                  <span className="inline-flex items-center gap-1"><PinIcon /> {locationText}</span>
                  <span aria-hidden="true" className="text-ink-300">•</span>
                  <span className="inline-flex items-center gap-1"><UserIcon /> {openingsText}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 sm:px-8">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                <Detail label="Department" value={job?.department ?? DASH} />
                <Detail label="Salary" value={formatMoney(job?.annualCtc, job?.currency ?? null)} />
                <Detail label="Role / Category" value={job?.roleCategory ?? DASH} />
                <Detail label="Notice Period" value={job?.noticePeriod ?? DASH} />
                <Detail label="Experience" value={formatExperience(job?.experienceMinYears, job?.experienceMaxYears)} />
                <Detail label="Job ID" value={job?.id ?? DASH} />
                <Detail label="Posted On" value={formatDate(job?.publishedAt ?? job?.createdAt)} />
              </dl>
              <Link href={jobHref} className="mt-4 inline-flex items-center gap-1.5 h-10 text-body-sm text-brand-700 font-semibold hover:text-brand-900 transition-colors">
                View Full Job Details <ArrowRight />
              </Link>
            </div>
          </section>

          {/* What's Next */}
          <section>
            <SectionHeader title="What's Next?" className="mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NextCard icon={<TargetIcon />} title="Track Applications" body="We'll notify you when candidates start applying." action="View Applications" tint="bg-cobalt-50 text-cobalt-600" href={jobHref} />
              <NextCard icon={<ShortlistIcon />} title="Shortlist Candidates" body="Review and shortlist the best candidates for your job." action="Go to Candidates" tint="bg-warn/10 text-warn" href={jobHref} />
              <NextCard icon={<ShareIcon />} title="Share with your Network" body="Increase visibility by sharing this job with your network." action={shared ? "Link Copied!" : "Share Job"} tint="bg-brand-50 text-brand-600" onClick={shareJob} />
            </div>
          </section>

          {/* Confirmation strip */}
          <div className="surface-muted p-4 flex items-start gap-3">
            <span className="icon-tile bg-white text-brand-600 border border-ink-100"><ShieldIcon /></span>
            <p className="text-body-sm text-ink-700 flex-1 self-center">
              I confirm that all the information provided is accurate and complies with company policies and applicable laws.
            </p>
            <span aria-hidden="true" className="w-5 h-5 mt-2.5 rounded-md bg-brand-600 text-white grid place-items-center text-micro shrink-0">✓</span>
          </div>
        </div>

        {/* Right Rail — stacks below under xl */}
        <SuccessRail />
      </div>
    </div>
  );
}
