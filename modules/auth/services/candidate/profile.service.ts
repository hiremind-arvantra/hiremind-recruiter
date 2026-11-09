import { API, getAccessToken, setStoredUserName, setStoredJobTitle } from "@/lib/api/config";
import type { CandidateRegStep1Data } from "../../types/auth.types";
import { authedFetch, handleResponse } from "./http";

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
  fullName: string;
  currentLocation: string | null;
  phoneNumber: string | null;
  jobTitle: string | null;
  profilePicture: string | null;
}

/** GET /profile — returns the logged-in candidate's full profile */
export async function fetchCandidateProfile(): Promise<CandidateProfile> {
  const res = await authedFetch("/profile");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await handleResponse<any>(res);
  if (raw.fullName) setStoredUserName(raw.fullName);
  if (raw.currentRole) setStoredJobTitle(raw.currentRole);
  return {
    fullName: raw.fullName ?? null,
    currentLocation: raw.currentLocation ?? null,
    phoneNumber: raw.phoneNumber ?? null,
    jobTitle: raw.currentRole ?? null,
    profilePicture: raw.profilePictureUrl ?? null,
  };
}

/** PUT /profile/basic-info */
export async function updateCandidateBasicInfo(data: CandidateRegStep1Data): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error("No access token — register first");

  const body = {
    fullName: `${data.firstName} ${data.lastName}`.trim(),
    countryCode: "+91",
    phoneNumber: data.phone,
    dateOfBirth: data.dateOfBirth || null,
    currentLocation: data.currentLocation,
    linkedinUrl: null,
    professionalSummary: data.professionalSummary || null,
  };

  const res = await fetch(`${API.CANDIDATE}/profile/basic-info`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Candidate API error ${res.status}`);
  }
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
