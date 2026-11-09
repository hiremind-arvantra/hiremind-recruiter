import { API, getAccessToken } from "@/lib/api/config";
import { DEFAULT_WEIGHTS } from "@/modules/company/matching";
import type { JobDraft } from "../shared/types";

export interface JobApiResponse {
  id: string;
  title: string;
  department: string | null;
  workMode: string | null;
  employmentType: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "EXPIRED";
  openings: number;
  workplaceLocation: string | null;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  salaryType: string | null;
  currency: string | null;
  annualCtc: number | null;
  skills: { name: string; minExperience: number; unit: string; mandatory: boolean }[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobCountsResponse {
  total: number;
  published: number;
  drafts: number;
}

/** One Active-Jobs dashboard row — job identity + application funnel counts,
 * all aggregated server-side (no per-job count calls needed). */
export interface DashboardJobRow {
  id: string;
  title: string;
  department: string | null;
  applications: number;
  shortlisted: number;
  interviews: number;
  offered: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "EXPIRED";
}

/** Whole company-dashboard payload in one response: job-status tallies +
 * the Active-Jobs rows with funnel counts. */
export interface CompanyDashboardResponse {
  total: number;
  published: number;
  drafts: number;
  activeJobs: DashboardJobRow[];
}

/** Full backend JobDetailResponse — used to prefill the Edit Job form. */
export interface JobFullDetail {
  id: string;
  // details
  title: string;
  clientId: string | null;
  roleCategory: string | null;
  department: string | null;
  employmentType: string | null;
  openings: number;
  workplaceLocation: string | null;
  workMode: string | null;
  startingDate: string | null;
  description: string | null;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  noticePeriod: string | null;
  educationQualification: string | null;
  industry: string | null;
  jobShift: string | null;
  applicationDeadline: string | null;
  jobExpiry: string | null;
  confidential: boolean;
  // requirements
  requirementExpYears: number | null;
  requirementExpUnit: string | null;
  seniorityLevel: string | null;
  responsibilities: string | null;
  skills: { name: string; minExperience: number; unit: string; mandatory: boolean }[];
  // compensation
  salaryType: string | null;
  currency: string | null;
  annualCtc: number | null;
  basicPay: number | null;
  hra: number | null;
  specialAllowance: number | null;
  otherAllowances: number | null;
  variablePay: number | null;
  joiningBonus: number | null;
  benefits: string[];
  otherBenefits: string | null;
  // preferences
  workArrangement: string | null;
  prefWorkLocation: string | null;
  workingHours: string | null;
  timeZone: string | null;
  genderPreference: string | null;
  diversityHiring: string | null;
  equalOpportunity: boolean;
  additionalPreferences: string | null;
  employmentTypePrefs: string[];
  noticePeriodPrefs: string[];
  // lifecycle
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Subset of the backend JobDetailResponse used by the published-success summary. */
export interface JobDetail {
  id: string;
  title: string;
  roleCategory: string | null;
  department: string | null;
  employmentType: string | null;
  openings: number;
  workplaceLocation: string | null;
  workMode: string | null;
  noticePeriod: string | null;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  salaryType: string | null;
  currency: string | null;
  annualCtc: number | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

function jsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAccessToken()}`,
  };
}

/** "12,00,000" → 1200000 ; "" / undefined → null */
function toNum(value: string | undefined | null): number | null {
  if (value == null) return null;
  const cleaned = String(value).replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** "" → null ; otherwise the trimmed string (used for optional date fields) */
function orNull(value: string | undefined | null): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/** Maps the in-memory wizard draft to the backend JobUpsertRequest payload. */
export function draftToRequest(draft: JobDraft) {
  const d = draft.details;
  const r = draft.requirements;
  const c = draft.compensation;
  const p = draft.preferences;

  return {
    details: {
      title: d.title.trim(),
      clientId: orNull(d.clientId),
      roleCategory: orNull(d.roleCategory),
      department: orNull(d.department),
      employmentType: orNull(d.employmentType),
      openings: d.openings,
      workplaceLocation: orNull(d.workplaceLocation),
      workMode: orNull(d.workMode),
      startingDate: orNull(d.startingDate),
      description: orNull(d.description),
      experienceMinYears: toNum(d.experienceMin),
      experienceMaxYears: toNum(d.experienceMax),
      noticePeriod: orNull(d.noticePeriod),
      educationQualification: orNull(d.educationQualification),
      industry: orNull(d.industry),
      jobShift: orNull(d.jobShift),
      applicationDeadline: orNull(d.applicationDeadline),
      jobExpiry: orNull(d.jobExpiry),
      confidential: d.confidential === "Yes",
    },
    requirements: {
      requirementExpYears: r.minExperience ?? null,
      requirementExpUnit: orNull(r.experienceUnit),
      seniorityLevel: orNull(r.experienceLevel),
      responsibilities: orNull(r.responsibilities),
      skills: r.skills
        .filter((s) => s.name?.trim())
        .map((s) => ({
          name: s.name.trim(),
          minExperience: s.years ?? 0,
          unit: "YEARS",
          mandatory: true,
        })),
    },
    compensation: {
      salaryType: orNull(c.salaryType),
      currency: orNull(c.currency),
      annualCtc: toNum(c.annualCtc),
      basicPay: toNum(c.basicPay),
      hra: toNum(c.hra),
      specialAllowance: toNum(c.specialAllowance),
      otherAllowances: toNum(c.otherAllowances),
      variablePay: toNum(c.variablePay),
      joiningBonus: toNum(c.joiningBonus),
      benefits: c.benefits,
      otherBenefits: orNull(c.otherBenefits),
    },
    preferences: {
      workArrangement: orNull(p.workArrangement),
      prefWorkLocation: orNull(p.workLocation),
      workingHours: orNull(p.workingHours),
      timeZone: orNull(p.timeZone),
      seniority: orNull(p.seniority),
      employmentTypes: p.employmentTypes,
      noticePeriods: p.noticePeriods,
      genderPreference: orNull(p.genderPreference),
      diversityHiring: orNull(p.diversityHiring),
      equalOpportunity: p.equalOpportunity,
      additionalPreferences: orNull(p.additionalPreferences),
    },
  };
}

/** POST /company/jobs/publish — creates the job and publishes it in one call. */
export async function publishJob(draft: JobDraft): Promise<{ id: string }> {
  const res = await fetch(`${API.COMPANY}/company/jobs/publish`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(draftToRequest(draft)),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to publish job (${res.status})`);
  return { id: json.data.id as string };
}

/** POST /company/jobs/draft — saves the job without publishing. */
export async function saveDraftJob(draft: JobDraft): Promise<{ id: string }> {
  const res = await fetch(`${API.COMPANY}/company/jobs/draft`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(draftToRequest(draft)),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to save draft (${res.status})`);
  return { id: json.data.id as string };
}

export interface JobListFilters {
  /** Single status, or a comma-separated list (e.g. "CLOSED,EXPIRED"). */
  status?: string;
  location?: string;
  /** matches department OR role/category (case-insensitive substring) */
  jobFunction?: string;
  /** experience-min-years range (inclusive) */
  expMin?: number;
  expMax?: number;
  page?: number;
  size?: number;
}

/** GET /company/jobs — paginated list with optional status / location / function / experience filters. */
export async function listJobs(
  filters: JobListFilters = {},
): Promise<{ content: JobApiResponse[]; totalElements: number }> {
  const { status, location, jobFunction, expMin, expMax, page = 0, size = 20 } = filters;
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set("status", status);
  if (location) params.set("location", location);
  if (jobFunction) params.set("function", jobFunction);
  if (expMin != null) params.set("expMin", String(expMin));
  if (expMax != null) params.set("expMax", String(expMax));

  const res = await fetch(`${API.COMPANY}/company/jobs?${params.toString()}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to load jobs (${res.status})`);
  return {
    content: (json?.data?.content ?? []) as JobApiResponse[],
    totalElements: (json?.data?.totalElements ?? 0) as number,
  };
}

/** GET /company/jobs/dashboard — the whole company dashboard in one request:
 * job-status counts + Active-Jobs rows with funnel counts already aggregated
 * server-side. Replaces the separate /counts call and per-job count calls. */
export async function fetchCompanyDashboard(limit = 5): Promise<CompanyDashboardResponse> {
  const res = await fetch(`${API.COMPANY}/company/jobs/dashboard?limit=${limit}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to load dashboard (${res.status})`);
  return json.data as CompanyDashboardResponse;
}

/** The ranges the Hiring Overview can be shown over. */
export type HiringRange = "WEEKLY" | "MONTHLY" | "YEARLY";

/** One bucket of the hiring trend — a day, a week or a month. */
export interface HiringTrendPoint {
  label: string;
  applications: number;
}

/** Applications over the chosen range, with the totals for that same window. */
export interface HiringTrend {
  range: HiringRange;
  points: HiringTrendPoint[];
  applications: number;
  shortlisted: number;
  interviews: number;
  offered: number;
}

/** GET /company/jobs/dashboard/trend — the Hiring Overview card for one range. */
export async function fetchHiringTrend(range: HiringRange): Promise<HiringTrend> {
  const res = await fetch(`${API.COMPANY}/company/jobs/dashboard/trend?range=${range}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to load hiring overview (${res.status})`);
  return json.data as HiringTrend;
}

/** GET /company/jobs/{id} — full detail for a single job (ownership-guarded). */
export async function fetchJob(id: string): Promise<JobDetail> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${id}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to load job (${res.status})`);
  return json.data as JobDetail;
}

/** GET /company/jobs/{id} — full detail for prefilling the Edit Job form. */
export async function fetchJobFull(id: string): Promise<JobFullDetail> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${id}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to load job (${res.status})`);
  return json.data as JobFullDetail;
}

/** PUT /company/jobs/{id} — update an existing job (ownership-guarded). */
export async function updateJob(id: string, draft: JobDraft): Promise<{ id: string }> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${id}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(draftToRequest(draft)),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to update job (${res.status})`);
  return { id: json.data.id as string };
}

/** PATCH /company/jobs/{id}/status — manually set a job Active (PUBLISHED) or Closed. */
export async function setJobStatus(id: string, status: "PUBLISHED" | "CLOSED"): Promise<JobFullDetail> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${id}/status`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ status }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to update job status (${res.status})`);
  return json.data as JobFullDetail;
}

/**
 * POST /company/jobs/{id}/publish — publish an existing DRAFT job.
 *
 * Separate from `setJobStatus`, which rejects DRAFT outright ("Publish this job before
 * changing its status"): going live for the first time is the publish path, while
 * PATCH /status only moves an already-published job between Active and Closed.
 */
export async function publishExistingJob(id: string): Promise<JobFullDetail> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${id}/publish`, {
    method: "POST",
    headers: jsonHeaders(),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to publish job (${res.status})`);
  return json.data as JobFullDetail;
}

/** Maps a backend JobFullDetail back into the in-memory JobDraft used by the form. */
export function responseToDraft(d: JobFullDetail): JobDraft {
  const numStr = (n: number | null) => (n == null ? "" : String(n));
  return {
    details: {
      title: d.title ?? "",
      clientId: d.clientId ?? "",
      roleCategory: d.roleCategory ?? "",
      department: d.department ?? "",
      employmentType: d.employmentType ?? "",
      openings: d.openings ?? 1,
      workplaceLocation: d.workplaceLocation ?? "",
      startingDate: d.startingDate ?? "",
      workMode: (d.workMode as JobDraft["details"]["workMode"]) ?? "On-site",
      description: d.description ?? "",
      experienceRange: "",
      experienceMin: numStr(d.experienceMinYears),
      experienceMax: numStr(d.experienceMaxYears),
      noticePeriod: d.noticePeriod ?? "",
      educationQualification: d.educationQualification ?? "",
      industry: d.industry ?? "",
      jobShift: d.jobShift ?? "",
      applicationDeadline: d.applicationDeadline ?? "",
      jobExpiry: d.jobExpiry ?? "",
      confidential: d.confidential ? "Yes" : "No",
    },
    requirements: {
      minExperience: d.requirementExpYears ?? 0,
      experienceUnit: d.requirementExpUnit ?? "Years",
      experienceLevel: d.seniorityLevel ?? "",
      responsibilities: d.responsibilities ?? "",
      skills: (d.skills ?? []).map((s, i) => ({ id: String(i + 1), name: s.name, years: s.minExperience })),
    },
    compensation: {
      salaryType: "Fixed CTC",
      currency: d.currency ?? "",
      annualCtc: numStr(d.annualCtc),
      salaryMin: "",
      salaryMax: "",
      fixedPay: "",
      basicPay: numStr(d.basicPay),
      hra: numStr(d.hra),
      specialAllowance: numStr(d.specialAllowance),
      otherAllowances: numStr(d.otherAllowances),
      variablePay: numStr(d.variablePay),
      joiningBonus: numStr(d.joiningBonus),
      benefits: d.benefits ?? [],
      otherBenefits: d.otherBenefits ?? "",
    },
    preferences: {
      workArrangement: (d.workArrangement as JobDraft["preferences"]["workArrangement"]) ?? "On-site",
      workLocation: d.prefWorkLocation ?? "",
      jobShift: d.jobShift ?? "",
      workingHours: d.workingHours ?? "",
      timeZone: d.timeZone ?? "",
      seniority: d.seniorityLevel ?? "",
      employmentTypes: d.employmentTypePrefs ?? [],
      noticePeriods: d.noticePeriodPrefs ?? [],
      genderPreference: d.genderPreference ?? "",
      diversityHiring: d.diversityHiring ?? "",
      equalOpportunity: d.equalOpportunity,
      additionalPreferences: d.additionalPreferences ?? "",
    },
    // Matching weights are not part of the job payload — the form loads the job's
    // stored configuration separately (see loadJobWeights).
    matching: { ...DEFAULT_WEIGHTS },
  };
}

/** GET /company/jobs/counts — totals for the dashboard stat card. */
export async function fetchJobCounts(): Promise<JobCountsResponse> {
  const res = await fetch(`${API.COMPANY}/company/jobs/counts`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to load job counts (${res.status})`);
  return json.data as JobCountsResponse;
}
