/* Requirement extraction — turns a job posting into structured, comparable requirements.
 * Nothing here scores anything; it only says what the job asks for. */

import { CERTIFICATION_HINTS } from "./taxonomy";
import { containsTerm, normalizeText, parseYears, splitStatements } from "./normalize";
import type { JobRequirementsInput } from "./types";

export interface SkillRequirement {
  name: string;
  mandatory: boolean;
  minExperience?: number;
}

export interface ExtractedRequirements {
  title: string | null;
  seniority: string | null;
  responsibilities: string[];
  skills: SkillRequirement[];
  education: string | null;
  certifications: string[];
  industry: string | null;
  minYears: number | null;
  maxYears: number | null;
  location: string | null;
  workMode: string | null;
  noticePeriod: string | null;
  /** Leadership expectations found in the JD text, e.g. "lead cross-functional teams". */
  leadershipCues: string[];
  /** Stakeholder / client expectations found in the JD text. */
  stakeholderCues: string[];
}

const LEADERSHIP_TERMS = [
  "lead", "leading", "leadership", "manage a team", "team management", "people management",
  "mentor", "mentoring", "coach", "line management", "supervise", "head of", "own the",
  "drive the", "build and lead", "grow the team", "hiring",
];

const STAKEHOLDER_TERMS = [
  "stakeholder", "client", "customer", "vendor", "cross functional", "cross-functional",
  "business partner", "account", "senior management", "leadership team", "communication",
];

/** Sentence filler that must never end up inside a certification's name. */
const CERT_NOISE_WORDS = new Set([
  "a", "an", "the", "any", "some", "valid", "current", "active", "relevant", "professional",
  "role", "roles", "job", "position", "candidate", "candidates", "must", "should", "will",
  "requires", "require", "required", "requiring", "prefer", "preferred", "holding", "hold",
  "holds", "with", "and", "or", "of", "in", "have", "has", "having", "is", "be", "possess",
  "equivalent", "such", "as", "e.g", "eg", "ideally", "plus", "strong", "good",
]);

const DESCRIPTIVE_OPENERS =
  /^(?:we(?:'re| are)?|our|us|join|about|this (?:role|position|job|is|opportunity)|the (?:company|team|role|position|job|ideal candidate|successful candidate))\b/i;

/** True for a sentence that describes the role or company rather than a duty. */
function isDescriptiveSentence(line: string, title: string | null | undefined): boolean {
  if (DESCRIPTIVE_OPENERS.test(line)) return true;
  const role = normalizeText(title);
  return Boolean(role) && normalizeText(line).startsWith(`the ${role} `);
}

/** Free-text blocks a requirement may hide in. */
function jdText(job: JobRequirementsInput): string {
  return [job.description, job.responsibilities].filter(Boolean).join("\n");
}

export function extractRequirements(job: JobRequirementsInput): ExtractedRequirements {
  const responsibilities = splitStatements(job.responsibilities);
  // Fall back to the description when responsibilities were not filled in separately.
  // Descriptions open with context ("We are hiring…", "The Solution Architect bridges…") —
  // prose about the role, not duties to evidence — so those sentences are left out.
  const fromDescription = responsibilities.length
    ? []
    : splitStatements(job.description).filter((line) => !isDescriptiveSentence(line, job.title));

  const allResponsibilities = [...responsibilities, ...fromDescription].slice(0, 12);
  const text = jdText(job);

  const skills: SkillRequirement[] = (job.skills ?? [])
    .filter((skill) => skill && skill.name && skill.name.trim().length > 0)
    .map((skill) => ({
      name: skill.name.trim(),
      mandatory: skill.mandatory !== false,
      minExperience: skill.minExperience && skill.minExperience > 0 ? skill.minExperience : undefined,
    }));

  const minYears =
    firstNumber(job.experienceMinYears) ??
    firstNumber(job.requirementExpYears) ??
    parseYears(text);

  return {
    title: job.title ?? null,
    seniority: job.seniorityLevel ?? job.roleCategory ?? null,
    responsibilities: allResponsibilities,
    skills,
    education: blankToNull(job.educationQualification),
    certifications: extractCertifications(text),
    industry: blankToNull(job.industry),
    minYears,
    maxYears: firstNumber(job.experienceMaxYears),
    location: blankToNull(job.workplaceLocation),
    workMode: blankToNull(job.workMode),
    noticePeriod: blankToNull(job.noticePeriod),
    leadershipCues: cuesFrom(allResponsibilities, text, LEADERSHIP_TERMS),
    stakeholderCues: cuesFrom(allResponsibilities, text, STAKEHOLDER_TERMS),
  };
}

/** Certifications named in the JD ("PMP certification required", "AWS Certified Solutions Architect"). */
export function extractCertifications(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const found = new Set<string>();
  for (const hint of CERTIFICATION_HINTS) {
    if (containsTerm(normalized, hint)) found.add(hint.toUpperCase());
  }
  /* Generic "<something> certification" phrasing the hint list does not cover.
     Scanned sentence by sentence: normalising the whole JD first would strip the full
     stops, letting the previous sentence bleed into the name ("hiring a senior engineer.
     AWS certification preferred" → "ENGINEER AWS"). Only the words immediately before
     "certification" name it, and sentence filler is trimmed off the front. */
  for (const sentence of text.split(/[.\n;•·!?]+/)) {
    const line = normalizeText(sentence);
    if (!line) continue;
    for (const phrase of line.match(/([a-z0-9+#]+(?:\s[a-z0-9+#]+){0,3})\s+certifi(?:cation|ed)/g) ?? []) {
      const words = phrase
        .replace(/\s+certifi(?:cation|ed).*$/, "")
        .split(" ")
        .filter((word) => word && !CERT_NOISE_WORDS.has(word));
      const cleaned = words.slice(-2).join(" ").trim();
      if (cleaned.length > 2) found.add(cleaned.toUpperCase());
    }
  }
  return [...found].slice(0, 6);
}

function cuesFrom(statements: string[], text: string, terms: string[]): string[] {
  const cues = new Set<string>();
  for (const statement of statements) {
    if (terms.some((term) => containsTerm(statement, term))) cues.add(statement.trim());
  }
  if (cues.size === 0) {
    for (const term of terms) {
      if (containsTerm(text, term)) {
        cues.add(term);
        break;
      }
    }
  }
  return [...cues].slice(0, 6);
}

function blankToNull(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function firstNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}
