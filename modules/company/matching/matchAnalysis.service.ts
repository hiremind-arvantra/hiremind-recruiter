/* ─────────────────────────────────────────────────────────────────────────────
 * Match analysis service — the single place the UI asks "how does this candidate
 * match this job?".
 *
 * Today it runs the local semantic engine (engine.ts) over the job and candidate
 * data the recruiter APIs already return. When the AI service exposes a
 * requirement-level analysis, implement `MatchAnalysisProvider` against it and call
 * `setMatchAnalysisProvider()` — no screen changes required. Anything the engine
 * cannot evidence is reported as "not found in the available résumé evidence",
 * never as an assertion about the candidate.
 * ───────────────────────────────────────────────────────────────────────────── */

import type { ApplicantDetail, ApplicantExperience } from "../jobs/services/applications.service";
import type { JobFullDetail } from "../jobs/services/job.service";
import { computeMatchAnalysis, summarizeMatch, type MatchSummary } from "./engine";
import { estimateSkillYears, type DatedWork } from "./skillExperience";
import { loadJobWeights } from "./matchConfig.service";
import { titleSimilarity } from "./similarity";
import type { CandidateEvidenceInput, JobRequirementsInput, MatchAnalysis, MatchWeights } from "./types";

export type { MatchSummary };

/** Maps the recruiter job detail onto the engine's requirement input. */
export function toJobRequirements(job: JobFullDetail): JobRequirementsInput {
  return {
    id: job.id,
    title: job.title,
    roleCategory: job.roleCategory,
    department: job.department,
    seniorityLevel: job.seniorityLevel,
    employmentType: job.employmentType,
    description: job.description,
    responsibilities: job.responsibilities,
    skills: (job.skills ?? []).map((skill) => ({
      name: skill.name,
      minExperience: skill.minExperience,
      mandatory: skill.mandatory,
    })),
    educationQualification: job.educationQualification,
    industry: job.industry,
    experienceMinYears: job.experienceMinYears,
    experienceMaxYears: job.experienceMaxYears,
    requirementExpYears: job.requirementExpYears,
    workplaceLocation: job.workplaceLocation,
    workMode: job.workMode,
    noticePeriod: job.noticePeriod,
  };
}

/**
 * Maps the applicant profile onto the engine's evidence input.
 *
 * `extra` carries richer résumé evidence (summary, statements, certifications,
 * past titles, industries, relevant years) for when the backend can supply it —
 * the engine uses whatever is present and stays silent about the rest.
 */
export function toCandidateEvidence(
  applicant: ApplicantDetail,
  extra: Partial<CandidateEvidenceInput> = {},
): CandidateEvidenceInput {
  return {
    candidateUserId: applicant.candidateUserId,
    fullName: applicant.fullName,
    currentRole: applicant.currentRole,
    currentCompany: applicant.currentCompany,
    currentLocation: applicant.currentLocation,
    preferredLocation: applicant.preferredLocation,
    experienceYears: applicant.experienceYears,
    skills: applicant.skills ?? [],
    educationDegrees: applicant.educationDegrees ?? [],
    certificationCount: applicant.certificationCount ?? 0,
    verified: applicant.verified,
    profileStatus: applicant.profileStatus,
    summary: applicant.professionalSummary ?? null,
    statements: resumeStatements(applicant),
    certifications: applicant.certifications ?? [],
    titles: (applicant.experiences ?? []).map((role) => role.jobTitle ?? "").filter(Boolean),
    industries: (applicant.experiences ?? []).map((role) => role.companyName ?? "").filter(Boolean),
    availability: applicant.noticePeriod ?? null,
    ...extra,
  };
}

/**
 * Free-text evidence, strongest first: the professional summary, then project work.
 *
 * Role headlines ("Engineering Manager at Acme") are appended only when there is real
 * narrative evidence to sit alongside — on their own they would flip a category from
 * "not assessable" to "assessed and scored near zero", which misrepresents a thin profile.
 */
function resumeStatements(applicant: ApplicantDetail): string[] {
  const narrative: string[] = [];
  if (applicant.professionalSummary?.trim()) narrative.push(applicant.professionalSummary.trim());

  for (const role of applicant.experiences ?? []) {
    const description = role.description?.trim();
    if (!description) continue;
    const heading = [role.jobTitle, role.companyName].filter(Boolean).join(" at ");
    narrative.push(heading ? `${heading}: ${description}` : description);
  }

  for (const project of applicant.projects ?? []) {
    const heading = [project.projectName, project.roleName].filter(Boolean).join(" — ");
    const detail = [
      project.description,
      project.technologiesUsed ? `Technologies used: ${project.technologiesUsed}` : null,
      project.teamSize ? `Team of ${project.teamSize}` : null,
    ]
      .filter(Boolean)
      .join(". ");
    const line = [heading, detail].filter(Boolean).join(": ").trim();
    if (line.length > 8) narrative.push(line);
  }

  if (narrative.length === 0) return [];

  const roles = (applicant.experiences ?? [])
    .map((role) => {
      const line = [role.jobTitle, role.companyName].filter(Boolean).join(" at ");
      return line ? `${line}${role.currentlyWorking ? " (current role)" : ""}` : "";
    })
    .filter(Boolean);
  return [...narrative, ...roles];
}

/**
 * Every dated piece of work on the profile, with the text that says what was done:
 * each role (title + description) and each project (name, description, technologies).
 */
export function datedWork(applicant: ApplicantDetail): DatedWork[] {
  const roles: DatedWork[] = (applicant.experiences ?? []).map((role) => ({
    label: role.companyName?.trim() || role.jobTitle?.trim() || "Role",
    text: [role.jobTitle, role.description].filter(Boolean).join(". "),
    start: role.startDate,
    end: role.endDate,
    ongoing: role.currentlyWorking,
  }));
  const projects: DatedWork[] = (applicant.projects ?? []).map((project) => ({
    label: project.projectName?.trim() || "Project",
    text: [project.projectName, project.description, project.technologiesUsed].filter(Boolean).join(". "),
    start: project.startDate ?? null,
    end: project.endDate ?? null,
    ongoing: Boolean(project.ongoing),
  }));
  return [...roles, ...projects];
}

/** Years spent in roles whose title is comparable to the job's, from the applicant's history. */
export function relevantExperienceYears(
  jobTitle: string | null | undefined,
  experiences: ApplicantExperience[] | undefined,
): number | null {
  if (!jobTitle || !experiences || experiences.length === 0) return null;
  let years = 0;
  for (const role of experiences) {
    if (!role.jobTitle) continue;
    if (titleSimilarity(jobTitle, role.jobTitle).score >= 0.65) {
      years += yearsBetween(role.startDate, role.endDate, role.currentlyWorking);
    }
  }
  return Math.round(years * 10) / 10;
}

function yearsBetween(start: string | null, end: string | null, current: boolean): number {
  if (!start) return 0;
  const from = new Date(start).getTime();
  const to = current || !end ? Date.now() : new Date(end).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  return (to - from) / (365.25 * 24 * 60 * 60 * 1000);
}

export interface MatchAnalysisProvider {
  analyse(
    job: JobRequirementsInput,
    candidate: CandidateEvidenceInput,
    weights: MatchWeights,
  ): Promise<MatchAnalysis>;
}

/** Runs the local engine. Synchronous work wrapped in a promise so providers are interchangeable. */
export const localMatchAnalysisProvider: MatchAnalysisProvider = {
  async analyse(job, candidate, weights) {
    return computeMatchAnalysis(job, candidate, weights);
  },
};

let provider: MatchAnalysisProvider = localMatchAnalysisProvider;

/** Swap in a backend-powered analysis (e.g. hiremind_ai) without touching the UI. */
export function setMatchAnalysisProvider(next: MatchAnalysisProvider): void {
  provider = next;
}

export function currentProviderIsLocal(): boolean {
  return provider === localMatchAnalysisProvider;
}

/**
 * Full analysis for one candidate against one job. Weights resolve to the job's
 * override, else the company default, unless the caller passes them in.
 */
export async function getMatchAnalysis(
  job: JobFullDetail,
  applicant: ApplicantDetail,
  options: { weights?: MatchWeights; evidence?: Partial<CandidateEvidenceInput> } = {},
): Promise<MatchAnalysis> {
  const weights = options.weights ?? (await loadJobWeights(job.id)).weights;
  const relevantYears = relevantExperienceYears(job.title, applicant.experiences);
  const skillYears = estimateSkillYears(
    (job.skills ?? []).map((skill) => skill.name),
    applicant.skillDetails ?? [],
    datedWork(applicant),
  );
  const evidence = toCandidateEvidence(applicant, {
    ...(relevantYears !== null ? { relevantExperienceYears: relevantYears } : {}),
    skillYears,
    ...options.evidence,
  });
  return provider.analyse(toJobRequirements(job), evidence, weights);
}

/** Compact strengths/gaps for list screens. */
export async function getMatchSummary(
  job: JobFullDetail,
  applicant: ApplicantDetail,
  options: { weights?: MatchWeights; evidence?: Partial<CandidateEvidenceInput> } = {},
): Promise<MatchSummary> {
  return summarizeMatch(await getMatchAnalysis(job, applicant, options));
}
