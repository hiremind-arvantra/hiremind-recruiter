import { authedUpload, handleResponse } from "./http";

/* ── File uploads (multipart — never use authedFetch here) ── */

/** POST /profile/educations/:id/upload — uploads attachment, returns updated S3 keys for that record */
export async function uploadEducationFile(eduId: string, file: File): Promise<string[]> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authedUpload(`/profile/educations/${eduId}/upload`, formData);
  const profile = await handleResponse<{
    educations: { id: string; attachmentFileKeys?: string[] | null }[];
  }>(res);
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
