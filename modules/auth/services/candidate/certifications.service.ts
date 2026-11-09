import { authedFetch, handleResponse } from "./http";

/* ── Certifications ── */

export interface CertificationPayload {
  certificationName: string;
  issuingInstitution: string;
  credentialId?: string;
  certificateUrl?: string;
  passedYear?: number;
  validTill?: string; // YYYY-MM-DD
  doesNotExpire: boolean;
  displayOnProfile: boolean;
  description?: string;
}

/** POST /profile/certifications → returns backend-assigned cert id */
export async function addCertification(
  payload: CertificationPayload,
  existingIds: string[] = [],
): Promise<string> {
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
  const res = await authedFetch(`/profile/certifications/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  await handleResponse<unknown>(res);
}

/** DELETE /profile/certifications/:id */
export async function deleteCertification(id: string): Promise<void> {
  const res = await authedFetch(`/profile/certifications/${id}`, { method: "DELETE" });
  await handleResponse<unknown>(res);
}
