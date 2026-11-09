import { authedFetch, handleResponse } from "./http";

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
export async function addEducation(payload: EducationPayload): Promise<string> {
  const res = await authedFetch("/profile/educations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const profile = await handleResponse<{ educations: { id: string }[] }>(res);
  const list = profile.educations ?? [];
  return list[list.length - 1]?.id ?? crypto.randomUUID();
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
