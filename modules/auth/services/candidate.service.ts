import { API, getAccessToken, setStoredUserName, setStoredJobTitle } from "@/lib/api/config";
import type { CandidateRegStep1Data } from "../types/auth.types";

/* ── helpers ── */
async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");
  return fetch(`${API.CANDIDATE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

/** Multipart upload — omits Content-Type so the browser sets the boundary. */
async function authedUpload(path: string, formData: FormData): Promise<Response> {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");
  return fetch(`${API.CANDIDATE}${path}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData,
  });
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined") { window.location.href = "/login"; }
    throw new Error("Session expired. Please log in again.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? `API error ${res.status}`);
  return json.data as T;
}

/* ── Master data (public — no auth required) ── */

export interface DegreeCourse { name: string; category: string; }
export interface EducationTypeItem { name: string; }

export async function fetchDegreeCourses(): Promise<DegreeCourse[]> {
  const res = await fetch(`${API.CANDIDATE}/master/degrees`);
  const json = await res.json().catch(() => ({}));
  return (json.data ?? []) as DegreeCourse[];
}

export async function fetchEducationTypes(): Promise<EducationTypeItem[]> {
  const res = await fetch(`${API.CANDIDATE}/master/education-types`);
  const json = await res.json().catch(() => ({}));
  return (json.data ?? []) as EducationTypeItem[];
}

export interface EmploymentTypeItem { name: string; }

/** GET /master/employment-types — public, no auth required */
export async function fetchEmploymentTypes(): Promise<EmploymentTypeItem[]> {
  const res = await fetch(`${API.CANDIDATE}/master/employment-types`);
  const json = await res.json().catch(() => ({}));
  return (json.data ?? []) as EmploymentTypeItem[];
}

/* ── Full Profile (GET /profile) ── */

export interface ProjectProfile {
  id: string;
  projectName: string;
  roleName: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  teamSize: number | null;
  technologiesUsed: string | null;
}

export interface WorkExperienceProfile {
  id: string;
  companyName: string;
  jobTitle: string;
  employmentType: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  currentlyWorking: boolean;
  noticePeriod: string | null;
  description?: string | null;
  projects: ProjectProfile[];
}

export interface EducationProfile {
  id: string;
  degree: string;
  institution: string;
  specialization: string | null;
  location: string | null;
  yearOfPassing: string | null;
  grade: string | null;
  educationType: string | null;
  attachmentFileKeys?: string[] | null;
}

export interface SkillProfile {
  id: string;
  skillName: string;
  proficiencyLevel: string;
  experienceYears: number | null;
  lastUsed: string | null;
  topSkill: boolean;
  additionalDetails: string | null;
}

export interface CertificationProfile {
  id: string;
  certificationName: string;
  issuingInstitution: string;
  credentialId?: string | null;
  certificateUrl?: string | null;
  passedYear: number | null;
  validTill: string | null;
  doesNotExpire: boolean;
  description?: string | null;
  displayOnProfile?: boolean;
  certificateFileKey?: string | null;
}

export interface PreferenceProfile {
  id: string;
  type: string;
  value: string;
}

export interface FullProfile {
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  currentLocation: string | null;
  linkedinUrl: string | null;
  professionalSummary: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  totalExperienceYears: number | null;
  profileStrength: number;
  profileStatus: string;
  noticePeriod: string | null;
  expectedSalary: string | null;
  salaryType: string | null;
  preferredLocation: string | null;
  openToRelocate: boolean;
  additionalPreferences: string | null;
  resumeFileKey: string | null;
  profilePictureKey: string | null;
  profilePictureUrl: string | null;
  workExperiences: WorkExperienceProfile[];
  educations: EducationProfile[];
  skills: SkillProfile[];
  certifications: CertificationProfile[];
  preferences: PreferenceProfile[];
}

/** GET /profile — full profile with all nested data */
export async function fetchFullProfile(): Promise<FullProfile> {
  const res = await authedFetch("/profile");
  return handleResponse<FullProfile>(res);
}

/* ── Basic Info ── */

export interface CandidateProfile {
  fullName:        string;
  currentLocation: string | null;
  phoneNumber:     string | null;
  jobTitle:        string | null;
  profilePicture:  string | null;
  profileStrength: number | null;
}

/** GET /profile — returns the logged-in candidate's full profile */
export async function fetchCandidateProfile(): Promise<CandidateProfile> {
  const res = await authedFetch("/profile");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await handleResponse<any>(res);
  if (raw.fullName) setStoredUserName(raw.fullName);
  if (raw.currentRole) setStoredJobTitle(raw.currentRole);
  return {
    fullName:        raw.fullName ?? null,
    currentLocation: raw.currentLocation ?? null,
    phoneNumber:     raw.phoneNumber ?? null,
    jobTitle:        raw.currentRole ?? null,
    profilePicture:  raw.profilePictureUrl ?? null,
    profileStrength: raw.profileStrength ?? raw.profile_strength ?? null,
  };
}

/** PUT /profile/basic-info */
export async function updateCandidateBasicInfo(data: CandidateRegStep1Data): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error("No access token — register first");

  const body = {
    fullName:        `${data.firstName} ${data.lastName}`.trim(),
    countryCode:     "+91",
    phoneNumber:     data.phone,
    dateOfBirth:     data.dateOfBirth || null,
    currentLocation:     data.currentLocation,
    linkedinUrl:         null,
    professionalSummary: data.professionalSummary || null,
  };

  const res = await fetch(`${API.CANDIDATE}/profile/basic-info`, {
    method:  "PUT",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Candidate API error ${res.status}`);
  }
}

/* ── Education ── */

export interface EducationPayload {
  degree: string;
  institution: string;
  specialization?: string;
  location?: string;
  yearOfPassing?: string;
  grade?: string;
  educationType?: string;
  description?: string;
}

/** POST /profile/educations → returns backend-assigned education id */
export async function addEducation(payload: EducationPayload, existingIds: string[] = []): Promise<string> {
  const res = await authedFetch("/profile/educations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const profile = await handleResponse<{ educations: { id: string }[] }>(res);
  const list = profile.educations ?? [];
  // Identify the new row by diffing against ids the caller already had — the
  // response order isn't guaranteed to put the newest education last, so taking
  // the last item made new rows collide (couldn't add more than one).
  const known = new Set(existingIds);
  const created = list.find((e) => !known.has(e.id));
  return created?.id ?? list[list.length - 1]?.id ?? crypto.randomUUID();
}

/** PUT /profile/educations/:id */
export async function updateEducation(id: string, payload: EducationPayload): Promise<void> {
  const res = await authedFetch(`/profile/educations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  await handleResponse<unknown>(res);
}

/** DELETE /profile/educations/:id */
export async function deleteEducation(id: string): Promise<void> {
  const res = await authedFetch(`/profile/educations/${id}`, {
    method: "DELETE",
  });
  await handleResponse<unknown>(res);
}

/* ── Skill Catalog ── */

export interface SkillCatalogItem { id: string; name: string; category: string; }

/** GET /skills?q= — public, no auth */
export async function fetchSkills(q = ""): Promise<SkillCatalogItem[]> {
  const url = `${API.CANDIDATE}/skills${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  const res  = await fetch(url);
  const json = await res.json().catch(() => ({}));
  return (json.data ?? []) as SkillCatalogItem[];
}

/* ── Candidate Skills ── */

const PROFICIENCY_MAP: Record<string, string> = {
  Beginner: "BEGINNER", Intermediate: "INTERMEDIATE",
  Advanced: "ADVANCED", Expert: "EXPERT", Master: "MASTER",
};

export interface SkillPayload {
  skillName: string;
  proficiencyLevel: string;   // BEGINNER | INTERMEDIATE | ADVANCED | EXPERT | MASTER
  experienceYears?: number;   // BigDecimal — convert months → fractional years
  lastUsed?: string;          // YYYY-MM-DD (first of month)
  topSkill: boolean;
  additionalDetails?: string;
}

/** POST /profile/skills → returns backend-assigned skill id */
export async function addCandidateSkill(payload: SkillPayload, existingIds: string[] = []): Promise<string> {
  const res = await authedFetch("/profile/skills", { method: "POST", body: JSON.stringify(payload) });
  const profile = await handleResponse<{ skills: { id: string; name?: string }[] }>(res);
  const list = profile.skills ?? [];
  // The backend upserts by skill name, so the row is found by name first (it may be one
  // the résumé parse already created). Otherwise diff against ids the caller already had —
  // the response order isn't guaranteed to put the newest skill last.
  const byName = list.find((s) => s.name?.trim().toLowerCase() === payload.skillName.trim().toLowerCase());
  if (byName) return byName.id;
  const known = new Set(existingIds);
  const created = list.find((s) => !known.has(s.id));
  return created?.id ?? list[list.length - 1]?.id ?? crypto.randomUUID();
}

/** PUT /profile/skills/:id */
export async function updateCandidateSkill(id: string, payload: SkillPayload): Promise<void> {
  const res = await authedFetch(`/profile/skills/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  await handleResponse<unknown>(res);
}

/** DELETE /profile/skills/:id */
export async function deleteCandidateSkill(id: string): Promise<void> {
  const res = await authedFetch(`/profile/skills/${id}`, { method: "DELETE" });
  await handleResponse<unknown>(res);
}

export function buildSkillPayload(skill: import("../types/auth.types").Skill): SkillPayload {
  const expNum = parseFloat(skill.experienceValue) || 0;
  const expYears = skill.experienceUnit === "Months" ? Math.round((expNum / 12) * 10) / 10 : expNum;
  const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let lastUsed: string | undefined;
  if (skill.lastUsed) {
    const parts = skill.lastUsed.split(" ");
    const mIdx = MONTHS_SHORT.indexOf(parts[0]);
    if (mIdx !== -1 && parts[1]) lastUsed = `${parts[1]}-${String(mIdx + 1).padStart(2, "0")}-01`;
  }
  return {
    skillName:        skill.name,
    proficiencyLevel: PROFICIENCY_MAP[skill.proficiency] ?? "INTERMEDIATE",
    experienceYears:  expYears > 0 ? expYears : undefined,
    lastUsed,
    topSkill:         skill.highlighted,
    additionalDetails: skill.additionalDetails || undefined,
  };
}

/* ── Preferences ── */

// Employment types are now stored as enum names (e.g. "FULL_TIME") — no re-map needed.

export interface PreferencesPayload {
  noticePeriod?: string;
  expectedSalary?: string;
  salaryType?: string;
  preferredLocation?: string;
  openToRelocate: boolean;
  rolePreferences?: string[];
  preferredEmploymentTypes?: string[];
  benefits?: string[];
  additionalPreferences?: string;
}

/** PUT /profile/preferences */
export async function savePreferences(payload: PreferencesPayload): Promise<void> {
  const res = await authedFetch("/profile/preferences", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  await handleResponse<unknown>(res);
}

export function buildPreferencesPayload(data: {
  noticePeriod: string;
  expectedSalary: string;
  salaryType: string;
  preferredLocations: string[];
  openToRelocate: boolean;
  jobRolePreferences: string[];
  employmentTypes: string[];
  benefits: string[];
  additionalNotes: string;
}): PreferencesPayload {
  return {
    noticePeriod:             data.noticePeriod || undefined,
    expectedSalary:           data.expectedSalary || undefined,
    salaryType:               data.salaryType || undefined,
    preferredLocation:        data.preferredLocations.length ? data.preferredLocations.join(", ") : undefined,
    openToRelocate:           data.openToRelocate,
    rolePreferences:          data.jobRolePreferences.length ? data.jobRolePreferences : undefined,
    preferredEmploymentTypes: data.employmentTypes.length ? data.employmentTypes : undefined,
    benefits:                 data.benefits.length ? data.benefits : undefined,
    additionalPreferences:    data.additionalNotes || undefined,
  };
}

/* ── Certifications ── */

export interface CertificationPayload {
  certificationName: string;
  issuingInstitution: string;
  credentialId?: string;
  certificateUrl?: string;
  passedYear?: number;
  validTill?: string;         // YYYY-MM-DD
  doesNotExpire: boolean;
  displayOnProfile: boolean;
  description?: string;
}

/** POST /profile/certifications → returns backend-assigned cert id */
export async function addCertification(payload: CertificationPayload, existingIds: string[] = []): Promise<string> {
  const res = await authedFetch("/profile/certifications", { method: "POST", body: JSON.stringify(payload) });
  const profile = await handleResponse<{ certifications: { id: string }[] }>(res);
  const list = profile.certifications ?? [];
  // The response is ordered by passedYear (not insertion), so the new row is the
  // id that wasn't already known to the caller — not necessarily the last item.
  const known = new Set(existingIds);
  const created = list.find((c) => !known.has(c.id));
  return created?.id ?? list[list.length - 1]?.id ?? crypto.randomUUID();
}

/** PUT /profile/certifications/:id */
export async function updateCertification(id: string, payload: CertificationPayload): Promise<void> {
  const res = await authedFetch(`/profile/certifications/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  await handleResponse<unknown>(res);
}

/** DELETE /profile/certifications/:id */
export async function deleteCertification(id: string): Promise<void> {
  const res = await authedFetch(`/profile/certifications/${id}`, { method: "DELETE" });
  await handleResponse<unknown>(res);
}

/* ── Work Experience ── */

export interface ProjectPayload {
  projectName: string;
  roleName?: string;
  description?: string;
  startDate?: string;        // YYYY-MM-DD
  endDate?: string;          // YYYY-MM-DD
  teamSize?: number;
  technologiesUsed?: string; // comma-separated
}

export interface WorkExperiencePayload {
  companyName: string;
  jobTitle: string;
  employmentType: string;   // backend enum: FULL_TIME, PART_TIME, etc.
  location?: string;
  startDate: string;        // YYYY-MM-DD
  endDate?: string | null;  // YYYY-MM-DD
  currentlyWorking: boolean;
  noticePeriod?: string;
  projects?: ProjectPayload[];
  /** What the candidate did in the role. */
  description?: string;
}

/** POST /profile/work-experiences → returns backend-assigned experience id */
export async function addWorkExperience(payload: WorkExperiencePayload, existingIds: string[] = []): Promise<string> {
  const res = await authedFetch("/profile/work-experiences", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const profile = await handleResponse<{ workExperiences: { id: string }[] }>(res);
  const list = profile.workExperiences ?? [];
  // Identify the new row by diffing against ids the caller already had — the
  // response order isn't guaranteed to put the newest experience last, so taking
  // the last item made new rows collide (couldn't add more than one or two).
  const known = new Set(existingIds);
  const created = list.find((w) => !known.has(w.id));
  return created?.id ?? list[list.length - 1]?.id ?? crypto.randomUUID();
}

/** PUT /profile/work-experiences/:id */
export async function updateWorkExperience(id: string, payload: WorkExperiencePayload): Promise<void> {
  const res = await authedFetch(`/profile/work-experiences/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  await handleResponse<unknown>(res);
}

/** DELETE /profile/work-experiences/:id */
export async function deleteWorkExperience(id: string): Promise<void> {
  const res = await authedFetch(`/profile/work-experiences/${id}`, {
    method: "DELETE",
  });
  await handleResponse<unknown>(res);
}

/* ── File uploads ── */

/** POST /profile/educations/:id/upload — uploads attachment, returns updated S3 keys for that record */
export async function uploadEducationFile(eduId: string, file: File): Promise<string[]> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authedUpload(`/profile/educations/${eduId}/upload`, formData);
  const profile = await handleResponse<{ educations: { id: string; attachmentFileKeys?: string[] | null }[] }>(res);
  return profile.educations?.find((e) => e.id === eduId)?.attachmentFileKeys ?? [];
}

export async function uploadResume(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authedUpload("/profile/resume/upload", formData);
  const profile = await handleResponse<{ resumeFileKey?: string | null }>(res);
  return profile?.resumeFileKey ?? null;
}

/** POST /profile/picture/upload — uploads profile picture to S3; returns S3 key */
export async function uploadProfilePicture(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authedUpload("/profile/picture/upload", formData);
  const profile = await handleResponse<{ profilePictureKey?: string | null }>(res);
  return profile?.profilePictureKey ?? null;
}

/** POST /profile/certifications/:id/upload — uploads cert document to S3 */
export async function uploadCertificateFile(certId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authedUpload(`/profile/certifications/${certId}/upload`, formData);
  await handleResponse<unknown>(res);
}

/**
 * POST /profile/submit — finalize registration: transitions the profile
 * DRAFT → SUBMITTED (backend requires at least one skill). Returns nothing;
 * throws with the backend message (e.g. PROFILE_INCOMPLETE) on failure.
 */
export async function submitProfile(): Promise<void> {
  const res = await authedFetch("/profile/submit", { method: "POST" });
  await handleResponse<unknown>(res);
}

/* ── Resume parse-preview (public — runs on step 1, before the account exists) ── */

/** Raw shape returned by POST /profile/resume/parse-preview. */
export interface ResumeParsePreview {
  parsed: boolean;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
  experience: {
    company: string | null;
    title: string | null;
    startDate: string | null;
    endDate: string | null;
    current: boolean;
    description?: string | null;
  }[];
  education: {
    institution: string | null;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: string | null;
    endDate: string | null;
    grade: string | null;
  }[];
  certifications: string[];
}

/**
 * POST /profile/resume/parse-preview — parse a resume and get its fields back.
 *
 * Deliberately unauthenticated: this runs as the first field of step 1, before the
 * candidate has an account. Nothing is stored; the file is persisted separately via
 * `uploadResume` once registration completes.
 *
 * A resume the parser cannot read comes back as `parsed: false` rather than an error, so
 * the caller falls back to manual entry. Only a rejected file (too large, wrong type) or
 * the per-IP rate limit throws.
 */
export async function parseResumePreview(file: File): Promise<ResumeParsePreview> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API.CANDIDATE}/profile/resume/parse-preview`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<ResumeParsePreview>(res);
}
