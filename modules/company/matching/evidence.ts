/* Candidate evidence extraction — what the résumé/profile actually demonstrates.
 *
 * The engine only ever reasons over what is here. When a field is missing, the
 * matcher says "not found in the available résumé evidence" rather than asserting
 * the candidate lacks it. */

import { containsTerm, normalizeText, splitStatements, tokens } from "./normalize";
import type { CandidateEvidenceInput, SkillYears } from "./types";

export interface ExtractedEvidence {
  candidateUserId: string;
  name: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  titles: string[];
  locations: string[];
  totalYears: number | null;
  relevantYears: number | null;
  skills: string[];
  degrees: string[];
  certifications: string[];
  certificationCount: number;
  industries: string[];
  /** Every free-text statement available: summary + résumé bullets. */
  statements: string[];
  availability: string | null;
  verified: boolean;
  /** 0–1: how complete the profile is. Drives confidence and the evidence note. */
  dataQuality: number;
  /** Statements containing a measurable outcome. */
  quantifiedStatements: string[];
  /** Statements evidencing leading people or owning delivery. */
  leadershipStatements: string[];
  /** Statements evidencing collaboration, mentoring, ownership, communication. */
  professionalStatements: string[];
  /** Largest team size mentioned, when stated. */
  teamSize: number | null;
  /** Years per required skill, keyed by normalised skill name (see skillExperience.ts). */
  skillYears: Record<string, SkillYears>;
}

const LEADERSHIP_MARKERS = [
  "lead", "led", "leading", "managed", "manage", "managing", "head", "headed", "mentor", "mentored",
  "coached", "supervised", "directed", "owned", "ownership", "hired", "hiring", "built the team",
  "team of", "member team", "reports",
];

const PROFESSIONAL_MARKERS = [
  "collaborat", "mentor", "stakeholder", "client", "customer", "communicat", "present", "document",
  "review", "train", "onboard", "knowledge sharing", "cross functional", "cross-functional",
  "improve", "initiative", "ownership", "agile", "scrum",
];

const IMPACT_VERBS = [
  "reduc", "increas", "improv", "sav", "grew", "grow", "scal", "cut", "deliver", "launch", "accelerat",
  "boost", "optimis", "optimiz", "automat", "achiev", "exceed",
];

export function extractEvidence(input: CandidateEvidenceInput): ExtractedEvidence {
  const statements = collectStatements(input);
  const skills = clean(input.skills);
  const degrees = clean(input.educationDegrees);
  const certifications = clean(input.certifications);
  const titles = clean([input.currentRole, ...(input.titles ?? [])]);
  const locations = clean([input.currentLocation, input.preferredLocation]);
  const industries = clean([...(input.industries ?? []), input.currentCompany]);

  const quantifiedStatements = statements.filter(isQuantified);
  const leadershipStatements = statements.filter((statement) =>
    LEADERSHIP_MARKERS.some((marker) => normalizeText(statement).includes(marker)),
  );
  const professionalStatements = statements.filter((statement) =>
    PROFESSIONAL_MARKERS.some((marker) => normalizeText(statement).includes(marker)),
  );

  return {
    candidateUserId: input.candidateUserId,
    name: input.fullName ?? null,
    currentRole: input.currentRole ?? null,
    currentCompany: input.currentCompany ?? null,
    titles,
    locations,
    totalYears: numberOrNull(input.experienceYears),
    relevantYears: numberOrNull(input.relevantExperienceYears),
    skills,
    degrees,
    certifications,
    certificationCount: input.certificationCount ?? certifications.length,
    industries,
    statements,
    availability: input.availability ?? null,
    verified: Boolean(input.verified),
    dataQuality: dataQualityOf(input, statements, skills, degrees),
    quantifiedStatements,
    leadershipStatements,
    professionalStatements,
    teamSize: largestTeamSize(statements),
    skillYears: input.skillYears ?? {},
  };
}

/** Summary and résumé bullets, split into individual statements. */
function collectStatements(input: CandidateEvidenceInput): string[] {
  const fromSummary = splitStatements(input.summary ?? "");
  const provided = (input.statements ?? [])
    .flatMap((statement) => (statement.includes("\n") ? splitStatements(statement) : [statement]))
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 8);
  return [...fromSummary, ...provided].slice(0, 60);
}

/**
 * How much of the profile exists, 0–1. A candidate with only a name and a role
 * yields low-confidence conclusions, and the UI says so.
 */
function dataQualityOf(
  input: CandidateEvidenceInput,
  statements: string[],
  skills: string[],
  degrees: string[],
): number {
  const signals = [
    Boolean(input.currentRole),
    Boolean(input.currentCompany),
    typeof input.experienceYears === "number",
    skills.length >= 3,
    degrees.length > 0,
    (input.certificationCount ?? 0) > 0 || (input.certifications?.length ?? 0) > 0,
    statements.length >= 3,
    statements.length >= 10,
    Boolean(input.currentLocation || input.preferredLocation),
    Boolean(input.verified),
  ];
  return signals.filter(Boolean).length / signals.length;
}

function isQuantified(statement: string): boolean {
  const normalized = normalizeText(statement);
  const hasNumber = /\b\d+(\.\d+)?\s*(%|percent|x|k|m|cr|lakh|million|billion|users|customers|clients|members|people|hours|days|weeks|months)?\b/.test(normalized);
  const hasImpactVerb = IMPACT_VERBS.some((verb) => normalized.includes(verb));
  return hasNumber && hasImpactVerb;
}

/** "Managed a 15-member engineering team" → 15. */
function largestTeamSize(statements: string[]): number | null {
  let largest: number | null = null;
  for (const statement of statements) {
    const normalized = normalizeText(statement);
    const matches = normalized.matchAll(/(\d+)\s*(?:member|person|people|engineer|developer|strong)?\s*(?:team|reports|engineers|developers)/g);
    for (const match of matches) {
      const size = Number(match[1]);
      if (Number.isFinite(size) && size > 0 && size < 10000) largest = Math.max(largest ?? 0, size);
    }
  }
  return largest;
}

/** Every string the candidate provides, for "is this concept mentioned anywhere" checks. */
export function evidenceCorpus(evidence: ExtractedEvidence): string {
  return [
    evidence.currentRole,
    evidence.currentCompany,
    ...evidence.titles,
    ...evidence.skills,
    ...evidence.degrees,
    ...evidence.certifications,
    ...evidence.industries,
    ...evidence.statements,
  ]
    .filter(Boolean)
    .join(" • ");
}

/** True when the corpus mentions the term at all — used for "no evidence" phrasing. */
export function mentions(evidence: ExtractedEvidence, term: string): boolean {
  return containsTerm(evidenceCorpus(evidence), term);
}

/**
 * True when a statement names the term *as a certification* ("AWS Certified …",
 * "… AWS certification"). A bare mention ("built apps on AWS") is not evidence of
 * holding the certification.
 */
export function mentionsCertification(evidence: ExtractedEvidence, term: string): boolean {
  return evidence.statements.some((line) => /certif/i.test(line) && containsTerm(line, term));
}

/** Distinct content tokens available — a rough measure of how much there is to match on. */
export function evidenceBreadth(evidence: ExtractedEvidence): number {
  return new Set(tokens(evidenceCorpus(evidence))).size;
}

function clean(values: (string | null | undefined)[] | undefined): string[] {
  if (!values) return [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (!trimmed) continue;
    const key = normalizeText(trimmed);
    if (key && !seen.has(key)) {
      seen.add(key);
      output.push(trimmed);
    }
  }
  return output;
}

function numberOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
