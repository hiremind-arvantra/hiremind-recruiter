import { API, getAccessToken } from "@/lib/api/config";

/** Mirrors company_api's CandidateRecommendation (weighted match-score result). */
export interface CandidateRecommendation {
  userId: string;
  fullName: string | null;
  currentRole: string | null;
  currentLocation: string | null;
  experienceYears: number | null;
  score: number; // 0–100 overall match
  skillsMatched: number;
  skillsRequired: number;
}

/** GET /company/jobs/{id}/recommendations — top candidates ranked by match score. */
export async function fetchRecommendations(jobId: string, limit = 5): Promise<CandidateRecommendation[]> {
  const res = await fetch(`${API.COMPANY}/company/jobs/${jobId}/recommendations?limit=${limit}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message ?? `Failed to load recommendations (${res.status})`);
  }
  // Anything but a list means no recommendations, not a broken page: the callers filter
  // this straight away, and a non-array took the whole Jobs page down with it.
  return Array.isArray(json?.data) ? (json.data as CandidateRecommendation[]) : [];
}
