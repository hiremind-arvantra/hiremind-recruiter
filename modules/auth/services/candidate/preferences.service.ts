import { authedFetch, handleResponse } from "./http";

/* ── Preferences ── */

// Employment types are stored as enum names (e.g. "FULL_TIME") — no re-map needed.

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
    noticePeriod: data.noticePeriod || undefined,
    expectedSalary: data.expectedSalary || undefined,
    salaryType: data.salaryType || undefined,
    preferredLocation: data.preferredLocations.length ? data.preferredLocations.join(", ") : undefined,
    openToRelocate: data.openToRelocate,
    rolePreferences: data.jobRolePreferences.length ? data.jobRolePreferences : undefined,
    preferredEmploymentTypes: data.employmentTypes.length ? data.employmentTypes : undefined,
    benefits: data.benefits.length ? data.benefits : undefined,
    additionalPreferences: data.additionalNotes || undefined,
  };
}
