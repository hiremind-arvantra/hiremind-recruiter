import { authedFetch, handleResponse } from "./http";

/* ── Work Experience ── */

export interface ProjectPayload {
  projectName: string;
  roleName?: string;
  description?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  teamSize?: number;
  technologiesUsed?: string; // comma-separated
}

export interface WorkExperiencePayload {
  companyName: string;
  jobTitle: string;
  employmentType: string; // backend enum: FULL_TIME, PART_TIME, etc.
  location?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  currentlyWorking: boolean;
  noticePeriod?: string;
  projects?: ProjectPayload[];
}

/** POST /profile/work-experiences → returns backend-assigned experience id */
export async function addWorkExperience(payload: WorkExperiencePayload): Promise<string> {
  const res = await authedFetch("/profile/work-experiences", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const profile = await handleResponse<{ workExperiences: { id: string }[] }>(res);
  const list = profile.workExperiences ?? [];
  return list[list.length - 1]?.id ?? crypto.randomUUID();
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
