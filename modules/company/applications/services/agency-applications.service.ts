import { API, getAccessToken } from "@/lib/api/config";

export type AgencyStatus = "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED";

export interface AgencyApplication {
  id: string;
  jobId: string;
  jobTitle: string | null;
  candidateUserId: string;
  candidateName: string | null;
  candidateEmail: string | null;
  experienceYears: number | null;
  status: AgencyStatus;
  matchScore: number | null;
  fakeSuspected: boolean | null;
  appliedAt: string;
}

export interface AgencyCounts {
  total: number;
  applied: number;
  shortlisted: number;
  interview: number;
  offered: number;
  rejected: number;
}

interface Page<T> {
  content: T[];
  totalElements: number;
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? json?.message ?? `Request failed (${res.status})`);
  return json.data as T;
}

/** GET /company/applications — all applications across the recruiter's jobs. */
export async function fetchAgencyApplications(opts: {
  jobId?: string;
  status?: AgencyStatus;
  page?: number;
  size?: number;
} = {}): Promise<Page<AgencyApplication>> {
  const params = new URLSearchParams();
  if (opts.jobId) params.set("jobId", opts.jobId);
  if (opts.status) params.set("status", opts.status);
  params.set("page", String(opts.page ?? 0));
  params.set("size", String(opts.size ?? 10));
  const res = await fetch(`${API.COMPANY}/company/applications?${params.toString()}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const data = await unwrap<{ content: AgencyApplication[]; totalElements: number }>(res);
  return { content: data.content ?? [], totalElements: data.totalElements ?? 0 };
}

/** GET /company/applications/counts — stat-tile counts across all the recruiter's jobs. */
export async function fetchAgencyCounts(): Promise<AgencyCounts> {
  const res = await fetch(`${API.COMPANY}/company/applications/counts`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  return unwrap<AgencyCounts>(res);
}
