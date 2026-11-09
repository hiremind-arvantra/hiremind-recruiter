"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { UsersIcon } from "@/modules/company/jobs/shared/icons";
import { fetchJobFull, type JobFullDetail } from "@/modules/company/jobs/services/job.service";
import {
  fetchApplicantDetail,
  fetchApplications,
  updateApplicationStatus,
  type ApplicantDetail,
  type ApplicationResponse,
  type ApplicationStatusKey,
} from "@/modules/company/jobs/services/applications.service";
import { getMatchAnalysis, type MatchAnalysis } from "@/modules/company/matching";
import { ANALYSIS_TABS, AnalysisTabs, CandidateHeader, type AnalysisTab } from "./analysis/chrome";
import { EducationTab } from "./analysis/tabs/EducationTab";
import { ExperienceTab } from "./analysis/tabs/ExperienceTab";
import { InsightsTab } from "./analysis/tabs/InsightsTab";
import { JobFitTab } from "./analysis/tabs/JobFitTab";
import { RoleAlignmentTab } from "./analysis/tabs/RoleAlignmentTab";
import { SkillsTab } from "./analysis/tabs/SkillsTab";
import type { TabProps } from "./analysis/tabs/types";

/* ─────────────────────────────────────────────────────────────────────────────
 * Candidate Match Analysis — why this candidate scores the way they do against
 * one job, in six tabs: job fit, skills, experience, education, role alignment
 * and a summary. Every figure is derived from the match engine and the applicant
 * profile (see analysis/model.ts); the only writes are application status
 * changes through the existing recruiter endpoint.
 * ───────────────────────────────────────────────────────────────────────────── */

const STATUS_DONE: Partial<Record<ApplicationStatusKey, string>> = {
  SHORTLISTED: "Candidate shortlisted.",
  INTERVIEW: "Moved to the Interview stage.",
  REJECTED: "Application rejected.",
};

function isTab(value: string | null): value is AnalysisTab {
  return ANALYSIS_TABS.some((tab) => tab.key === value);
}

export default function CandidateMatchAnalysisPage({
  jobId,
  candidateUserId,
}: {
  jobId: string;
  candidateUserId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab: AnalysisTab = isTab(requestedTab) ? requestedTab : "fit";

  const [job, setJob] = useState<JobFullDetail | null>(null);
  const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
  const [application, setApplication] = useState<ApplicationResponse | null>(null);
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ApplicationStatusKey | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const fetched = useRef(false); // blocks the StrictMode double-invoke

  const applicationsHref = `/company/jobs/${jobId}/applications`;

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    (async () => {
      try {
        const [jobFull, detail, appsPage] = await Promise.all([
          fetchJobFull(jobId),
          fetchApplicantDetail(candidateUserId),
          // The application row carries the stored score, status and applied date.
          fetchApplications(jobId, undefined, 0, 200).catch(() => ({ content: [], totalElements: 0 })),
        ]);
        setJob(jobFull);
        setApplicant(detail);
        setApplication(appsPage.content.find((row) => row.candidateUserId === candidateUserId) ?? null);
        setAnalysis(await getMatchAnalysis(jobFull, detail));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load the match analysis");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId, candidateUserId]);

  const selectTab = useCallback(
    (next: AnalysisTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "fit") params.delete("tab");
      else params.set("tab", next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const changeStatus = useCallback(
    async (status: ApplicationStatusKey) => {
      if (!application || busy) return;
      setBusy(status);
      setNotice(null);
      try {
        const updated = await updateApplicationStatus(jobId, application.id, status);
        setApplication((previous) => (previous ? { ...previous, ...updated, candidate: updated.candidate ?? previous.candidate } : updated));
        setNotice({ tone: "success", text: STATUS_DONE[status] ?? "Status updated." });
      } catch (err) {
        setNotice({ tone: "danger", text: err instanceof Error ? err.message : "Could not update the application status." });
      } finally {
        setBusy(null);
      }
    },
    [application, busy, jobId],
  );

  const candidateName = applicant?.fullName?.trim() || application?.candidate?.fullName?.trim() || "Candidate";

  const tabProps: TabProps | null =
    analysis && job && applicant
      ? { analysis, job, applicant, application, candidateName, busy, onStatus: changeStatus }
      : null;

  return (
    <div>
      <CandidateHeader
        jobId={jobId}
        jobTitle={job?.title ?? null}
        candidateName={candidateName}
        applicant={applicant}
        application={application}
        busy={busy}
        onStatus={changeStatus}
        loading={loading}
      />

      {notice && (
        <div role={notice.tone === "danger" ? "alert" : "status"} className={`alert alert-${notice.tone} mb-5 justify-between`}>
          <span>{notice.text}</span>
          <button type="button" className="text-caption font-semibold underline" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <AnalysisSkeleton />
      ) : error ? (
        <div role="alert" className="alert alert-danger">{error}</div>
      ) : !tabProps ? (
        <EmptyState
          icon={<UsersIcon size={22} />}
          title="This candidate could not be found for this job."
          description="They may have been withdrawn, or the profile is no longer reachable. Go back to the applicants list and try again."
          action={<Link href={applicationsHref} className="btn btn-secondary">Back to Applications</Link>}
        />
      ) : (
        <>
          <AnalysisTabs value={tab} onChange={selectTab} />
          {tab === "fit" && <JobFitTab {...tabProps} />}
          {tab === "skills" && <SkillsTab {...tabProps} />}
          {tab === "experience" && <ExperienceTab {...tabProps} />}
          {tab === "education" && <EducationTab {...tabProps} />}
          {tab === "role" && <RoleAlignmentTab {...tabProps} />}
          {tab === "insights" && <InsightsTab {...tabProps} />}
        </>
      )}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading the match analysis…</span>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="w-36 h-36 rounded-full shrink-0" />
            <div className="flex-1 w-full grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          </div>
          <div className="card p-6 space-y-4">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <Skeleton key={row} className="h-6 w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
