import type { JobApiResponse } from "../services/job.service";

/* Pill showing a job's lifecycle status (Active / Draft / Closed / Expired). */
export function JobStatusBadge({ status }: { status: JobApiResponse["status"] }) {
  const styles: Record<JobApiResponse["status"], { label: string; cls: string }> = {
    PUBLISHED: { label: "Active", cls: "badge-success" },
    DRAFT: { label: "Draft", cls: "badge-neutral" },
    CLOSED: { label: "Closed", cls: "badge-danger" },
    EXPIRED: { label: "Expired", cls: "badge-warn" },
  };
  const s = styles[status];
  return (
    <span className={`badge ${s.cls}`}>
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {s.label}
    </span>
  );
}
