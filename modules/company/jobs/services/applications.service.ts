import { API, getAccessToken } from "@/lib/api/config";

export type ApplicationStatusKey = "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED";

/** Candidate details hydrated from candidate_api (null if profile unreachable). */
export interface ApplicantInfo {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  experienceYears: number | null;
  verified: boolean;
}

export interface ApplicationResponse {
  id: string;
  candidateUserId: string;
  status: ApplicationStatusKey;
  matchScore: number | null;
  appliedAt: string;
  candidate: ApplicantInfo | null;
}

export interface ApplicationCounts {
  total: number;
  applied: number;
  shortlisted: number;
  interview: number;
  offered: number;
  rejected: number;
}

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` };
}

/** GET /company/jobs/{id}/applications — paginated, optional status filter. */
export async function fetchApplications(
  jobId: string,
  status?: ApplicationStatusKey,
  page = 0,
  size = 20,
): Promise<{ content: ApplicationResponse[]; totalElements: number }> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set("status", status);
  const res = await fetch(`${API.COMPANY}/company/jobs/${jobId}/applications?${params.toString()}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to load applications (${res.status})`);
  return {
    content: (json?.data?.content ?? []) as ApplicationResponse[],
    totalElements: (json?.data?.totalElements ?? 0) as number,
  };
}

/** One role held by the applicant — lets the matcher measure *relevant* experience. */
export interface ApplicantExperience {
  jobTitle: string | null;
  companyName: string | null;
  location: string | null;
  employmentType: string | null;
  /** ISO date. */
  startDate: string | null;
  endDate: string | null;
  currentlyWorking: boolean;
  /** What the candidate did in the role (stored since candidate_api V10). */
  description?: string | null;
}

/** Project work — the applicant's closest equivalent to résumé bullet points. */
export interface ApplicantProject {
  projectName: string | null;
  roleName: string | null;
  description: string | null;
  technologiesUsed: string | null;
  teamSize: number | null;
  /** The project's dates, or its role's when the project has none. */
  startDate?: string | null;
  endDate?: string | null;
  ongoing?: boolean;
}

/** A profile skill and the years the candidate stated for it (null when not stated). */
export interface ApplicantSkillDetail {
  name: string;
  experienceYears: number | null;
}

/** Fuller candidate profile for View Profile / Compare (recruiter-visible fields). */
export interface ApplicantDetail {
  candidateUserId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  currentLocation: string | null;
  preferredLocation: string | null;
  experienceYears: number | null;
  skills: string[];
  educationDegrees: string[];
  certificationCount: number;
  verified: boolean;
  profileStatus: string | null;
  // ── Résumé evidence (company_api hydrates these from candidate_api; may be absent
  //    on older deployments or when the candidate profile carries none of it). ──
  professionalSummary?: string | null;
  noticePeriod?: string | null;
  certifications?: string[];
  experiences?: ApplicantExperience[];
  projects?: ApplicantProject[];
  skillDetails?: ApplicantSkillDetail[];
}

/** GET /company/jobs/applicant/{candidateUserId} — full profile of an applicant to your jobs. */
export async function fetchApplicantDetail(candidateUserId: string): Promise<ApplicantDetail> {
  const res = await fetch(`${API.COMPANY}/company/jobs/applicant/${candidateUserId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to load candidate profile (${res.status})`);
  return json.data as ApplicantDetail;
}

/** GET /company/jobs/{id}/applications/counts — totals for the status tabs. */
export async function fetchApplicationCounts(jobId: string): Promise<ApplicationCounts> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${jobId}/applications/counts`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to load counts (${res.status})`);
  return json.data as ApplicationCounts;
}

/** PATCH /company/jobs/{id}/applications/{appId}/status */
export async function updateApplicationStatus(
  jobId: string,
  applicationId: string,
  status: ApplicationStatusKey,
): Promise<ApplicationResponse> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${jobId}/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ status }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Failed to update status (${res.status})`);
  return json.data as ApplicationResponse;
}
