"use client";

import { useEffect, useRef, useState } from "react";
import { getStoredCompanyName } from "@/lib/api/config";
import {
  fetchCompanyDashboard,
  type CompanyDashboardResponse,
} from "@/modules/company/jobs/services/job.service";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyDashboard from "./components/EmptyDashboard";
import PopulatedDashboard from "./components/PopulatedDashboard";

const ZERO_DASHBOARD: CompanyDashboardResponse = {
  total: 0,
  published: 0,
  drafts: 0,
  activeJobs: [],
};

/* Orchestrator: the company dashboard has two faces. With no jobs it shows the
 * onboarding empty state; once any job exists it shows the live hiring
 * dashboard. A single dashboard call returns both the job-status counts (which
 * decide the face — total > 0 → populated) and the Active-Jobs rows. */
export default function CompanyDashboard() {
  const [companyName, setCompanyName] = useState("");
  const [dashboard, setDashboard] = useState<CompanyDashboardResponse>(ZERO_DASHBOARD);
  const [ready, setReady] = useState(false);
  // Guard against React StrictMode double-invoking the fetch effect in dev,
  // which would call /jobs/dashboard twice. The ref persists across the
  // double-mount, so the request fires exactly once.
  const fetched = useRef(false);

  useEffect(() => {
    setCompanyName(getStoredCompanyName() ?? "");
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchCompanyDashboard()
      .then((data) => setDashboard(data ?? ZERO_DASHBOARD))
      .catch(() => {
        // non-fatal — fall back to the empty state if company_api is unavailable
        setDashboard(ZERO_DASHBOARD);
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    // Skeleton in the dashboard's own geometry, so nothing jumps when data lands.
    return (
      <div role="status" aria-live="polite">
        <div className="page-header">
          <div className="page-header-eyebrow" />
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full mt-3" />
        </div>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card px-5 py-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
        <div className="py-16 text-center text-ink-500 text-body-sm">Loading dashboard…</div>
      </div>
    );
  }

  const counts = {
    total: dashboard.total,
    published: dashboard.published,
    drafts: dashboard.drafts,
  };

  return dashboard.total > 0 ? (
    <PopulatedDashboard companyName={companyName} counts={counts} activeJobs={dashboard.activeJobs} />
  ) : (
    <EmptyDashboard companyName={companyName} counts={counts} />
  );
}
