/* Shared shapes for the candidate ↔ job matching engine. Framework-free on purpose:
 * this module must be runnable in a test script and replaceable by an AI backend. */

import type { MatchClass } from "./taxonomy";

export type { MatchClass };

/** The ten scoring categories. Weights are recruiter-configurable per job. */
export type CategoryId =
  | "responsibilities"
  | "experience"
  | "skills"
  | "qualifications"
  | "industry"
  | "achievements"
  | "leadership"
  | "career"
  | "location"
  | "professional";

export type MatchWeights = Record<CategoryId, number>;

/** One JD requirement compared against the candidate's evidence. */
export interface RequirementMatch {
  id: string;
  category: CategoryId;
  /** What the JD asks for, in the recruiter's words. */
  requirement: string;
  /** Extra qualifier shown next to the requirement, e.g. "Mandatory" or "5+ years". */
  qualifier?: string;
  /** The candidate text that produced the match — null when nothing was found. */
  evidence: string | null;
  /** Why these two relate, e.g. "Master's-level equivalent". */
  relationship: string;
  matchClass: MatchClass;
  /** 0–1. */
  score: number;
  /** 0–1 — how much the evidence supports this conclusion. */
  confidence: number;
  /** Relative importance inside its category (mandatory skills count more). */
  importance: number;
}

export interface CategoryResult {
  id: CategoryId;
  label: string;
  description: string;
  /** Configured weight (percentage points). */
  weight: number;
  /** 0–100. */
  score: number;
  /** 0–1. */
  confidence: number;
  /**
   * False when the profile carries no evidence of this kind at all (e.g. no résumé
   * statements to judge responsibilities). Unassessable categories are excluded from
   * the weighted average and surfaced as "needs validation" instead of scoring zero.
   */
  assessable: boolean;
  summary: string;
  matches: RequirementMatch[];
}

export interface Highlight {
  title: string;
  detail: string;
}

export interface Gap {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface InterviewFocusArea {
  title: string;
  reason: string;
}

export interface MatchAnalysis {
  jobId: string;
  candidateUserId: string;
  generatedAt: string;
  /** 0–100, weighted across assessable categories. */
  overall: number;
  /** 0–1 — evidence-weighted confidence in the overall figure. */
  confidence: number;
  /** Descriptive, never a bare verdict: "Strong alignment based on available evidence". */
  verdict: string;
  categories: CategoryResult[];
  highlights: Highlight[];
  gaps: Gap[];
  interviewFocus: InterviewFocusArea[];
  /** 0–1 — how complete the candidate profile was. Drives the "based on available evidence" note. */
  evidenceCoverage: number;
  /** Which implementation produced this analysis. */
  source: "local-engine" | "ai-service";
  weights: MatchWeights;
}

/** The JD side, mapped from `JobFullDetail` by the service layer. */
export interface JobRequirementsInput {
  id: string;
  title: string | null;
  roleCategory?: string | null;
  department?: string | null;
  seniorityLevel?: string | null;
  employmentType?: string | null;
  description?: string | null;
  responsibilities?: string | null;
  skills?: { name: string; minExperience?: number; mandatory?: boolean }[];
  educationQualification?: string | null;
  industry?: string | null;
  experienceMinYears?: number | null;
  experienceMaxYears?: number | null;
  requirementExpYears?: number | null;
  workplaceLocation?: string | null;
  workMode?: string | null;
  noticePeriod?: string | null;
}

/**
 * The candidate side. The first block is what `ApplicantDetail` already provides;
 * the optional block is richer résumé evidence the backend can supply later —
 * the engine uses it when present and says "not found in the available résumé
 * evidence" when it is not.
 */
export interface CandidateEvidenceInput {
  candidateUserId: string;
  fullName?: string | null;
  currentRole?: string | null;
  currentCompany?: string | null;
  currentLocation?: string | null;
  preferredLocation?: string | null;
  experienceYears?: number | null;
  skills?: string[];
  educationDegrees?: string[];
  certificationCount?: number;
  verified?: boolean;
  profileStatus?: string | null;

  // ── Richer evidence (optional) ───────────────────────────────────────────
  /** Professional summary / résumé headline. */
  summary?: string | null;
  /** Résumé bullet points: experience, project and achievement statements. */
  statements?: string[];
  /** Named certifications, when the profile exposes them. */
  certifications?: string[];
  /** Past and present role titles. */
  titles?: string[];
  /** Industries / domains the candidate has worked in. */
  industries?: string[];
  /** Years in work relevant to this kind of role, when known separately from the total. */
  relevantExperienceYears?: number | null;
  /** Notice period / availability, when known. */
  availability?: string | null;
  /**
   * Years the candidate has used each required skill, keyed by the normalised job-skill
   * name. Stated on the profile, or estimated from dated roles / projects that mention it.
   */
  skillYears?: Record<string, SkillYears>;
}

export interface SkillYears {
  years: number;
  source: "stated" | "work-history";
  /** Human-readable basis, e.g. "from 2 roles: Acme (2019–2022), Orbit (2022–now)". */
  basis: string;
}
