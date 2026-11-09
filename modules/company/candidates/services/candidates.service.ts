import { API, getAccessToken } from "@/lib/api/config";

/* ── Types (mirror hiremind_ai's CandidateProfile, passed through by company_api) ── */
export interface ParsedExperience {
  company: string | null;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
}
export interface ParsedEducation {
  institution: string | null;
  degree: string | null;
  field: string | null;
  start_date: string | null;
  end_date: string | null;
  grade: string | null;
}
export interface ParsedCertification {
  name: string | null;
  issuer: string | null;
  issued_date: string | null;
  expires_date: string | null;
}
export interface ParsedLanguage {
  language: string | null;
  proficiency: string | null;
}
export interface ParsedCandidate {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
  experience: ParsedExperience[];
  education: ParsedEducation[];
  certifications: ParsedCertification[];
  languages: ParsedLanguage[];
}

interface ParseStatus {
  parseJobId: string;
  status: string;
  candidateId: string | null;
  error: string | null;
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.message ?? json?.message ?? `Request failed (${res.status})`);
  }
  return json.data as T;
}

/** POST /company/candidates/parse — multipart upload; returns the parse job id. */
async function dispatchParse(file: File): Promise<string> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API.COMPANY}/company/candidates/parse`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await unwrap<{ parseJobId: string }>(res);
  return data.parseJobId;
}

/** GET /company/candidates/parse/{id} — poll parse status. */
async function getParseStatus(parseJobId: string): Promise<ParseStatus> {
  const token = getAccessToken();
  const res = await fetch(`${API.COMPANY}/company/candidates/parse/${parseJobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<ParseStatus>(res);
}

/** GET /company/candidates/{id}/parsed — fetch the parsed profile for preview. */
async function fetchParsedCandidate(candidateId: string): Promise<ParsedCandidate> {
  const token = getAccessToken();
  const res = await fetch(`${API.COMPANY}/company/candidates/${candidateId}/parsed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<ParsedCandidate>(res);
}

/* ── Saved candidates (talent pool) + per-job match scores ── */
export interface JobMatch {
  jobId: string;
  jobTitle: string | null;
  score: number | null;
}
export interface SavedCandidate {
  id: string;
  candidateProfileId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
  experienceYears: number | null;
  source: string;
  createdAt: string;
  bestScore: number | null;
  matches: JobMatch[];
}

/** POST /company/candidates/save — persist a parsed candidate to the recruiter's pool. */
export async function saveCandidate(parsed: ParsedCandidate): Promise<SavedCandidate> {
  const res = await fetch(`${API.COMPANY}/company/candidates/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify({
      candidateProfileId: parsed.id,
      fullName: parsed.full_name,
      email: parsed.email,
      phone: parsed.phone,
      headline: parsed.headline,
      location: parsed.location,
      skills: parsed.skills,
      experienceYears: null,
    }),
  });
  return unwrap<SavedCandidate>(res);
}

/** GET /company/candidates — saved candidates, each scored against every published job. */
export async function listSavedCandidates(): Promise<SavedCandidate[]> {
  const res = await fetch(`${API.COMPANY}/company/candidates`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  return unwrap<SavedCandidate[]>(res);
}

/**
 * GET /company/candidates/{candidateProfileId}/matches — score a candidate (parsed or
 * saved) against every published job, best-first. Works before saving, so the parse
 * preview can show match scores immediately.
 */
export async function getCandidateMatches(candidateProfileId: string): Promise<JobMatch[]> {
  const res = await fetch(`${API.COMPANY}/company/candidates/${candidateProfileId}/matches`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  return unwrap<JobMatch[]>(res);
}

/* ── Messaging (email via SMTP, SMS via Twilio) ── */
export type MessageChannel = "EMAIL" | "SMS";

/** One recipient's send outcome. */
export interface MessageResult {
  candidateId: string;
  recipient: string | null;
  sent: boolean;
  error: string | null;
}

/** Summary of a send across the selected recipients. */
export interface SendMessageResult {
  channel: MessageChannel;
  sent: number;
  failed: number;
  results: MessageResult[];
}

/**
 * POST /company/candidates/message — send an email or SMS to one or more saved
 * candidates. `subject` is used for EMAIL only. `body` supports the `{{name}}` and
 * `{{firstName}}` placeholders, substituted per recipient on the server.
 */
export async function sendMessage(input: {
  channel: MessageChannel;
  candidateIds: string[];
  subject?: string;
  body: string;
}): Promise<SendMessageResult> {
  const res = await fetch(`${API.COMPANY}/company/candidates/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify(input),
  });
  return unwrap<SendMessageResult>(res);
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Upload → dispatch async parse → poll until succeeded/failed → fetch the parsed
 * profile. `onPhase` reports coarse progress for the UI. `shouldCancel` lets the
 * caller abort an in-flight poll (e.g. component unmount / user cancel).
 */
export async function parseResume(
  file: File,
  opts: { onPhase?: (phase: "uploading" | "parsing") => void; shouldCancel?: () => boolean } = {},
): Promise<ParsedCandidate> {
  opts.onPhase?.("uploading");
  const parseJobId = await dispatchParse(file);
  opts.onPhase?.("parsing");

  const MAX_ATTEMPTS = 40; // ~60s at 1.5s intervals
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (opts.shouldCancel?.()) throw new Error("Parsing cancelled");
    await wait(1500);
    const status = await getParseStatus(parseJobId);
    if (status.status === "succeeded" && status.candidateId) {
      return fetchParsedCandidate(status.candidateId);
    }
    if (status.status === "failed") {
      throw new Error(status.error || "Resume parsing failed");
    }
  }
  throw new Error("Parsing timed out. Please try again.");
}
