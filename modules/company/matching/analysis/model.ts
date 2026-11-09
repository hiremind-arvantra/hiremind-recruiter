/* ─────────────────────────────────────────────────────────────────────────────
 * View model for the Candidate Match Analysis screens.
 *
 * Pure functions that turn a MatchAnalysis (engine output) plus the applicant and
 * job records into exactly what each tab renders. Nothing here fetches, and
 * nothing here invents a fact: every figure is derived from the analysis or the
 * profile, and anything the data cannot support is returned as null so the UI
 * can say so instead of guessing.
 * ───────────────────────────────────────────────────────────────────────────── */

import type { ApplicantDetail, ApplicantExperience } from "../../jobs/services/applications.service";
import type { JobFullDetail } from "../../jobs/services/job.service";
import { toPercent } from "../classify";
import { relevantExperienceYears } from "../matchAnalysis.service";
import { parseDegree } from "../normalize";
import { bestDegreeMatch, titleSimilarity } from "../similarity";
import { FIELD_FAMILIES, type DegreeLevel } from "../taxonomy";
import { skillKey } from "../skillExperience";
import type { CategoryId, CategoryResult, MatchAnalysis, RequirementMatch, SkillYears } from "../types";

export type Tone = "success" | "brand" | "warn" | "danger" | "neutral";

/* ── Tiers ─────────────────────────────────────────────────────────────────── */

export interface Tier {
  label: string;
  tone: Tone;
}

/** Overall fit pill: Low / Medium / Good Match. */
export function fitTier(pct: number): Tier {
  if (pct >= 75) return { label: "Good Match", tone: "success" };
  if (pct >= 50) return { label: "Medium Match", tone: "warn" };
  return { label: "Low Match", tone: "danger" };
}

/** Per-category level pill: Low / Medium / High. */
export function levelOf(pct: number): Tier {
  if (pct >= 75) return { label: "High", tone: "success" };
  if (pct >= 40) return { label: "Medium", tone: "warn" };
  return { label: "Low", tone: "danger" };
}

/** Bar colour for a 0–100 score. */
export function barTone(pct: number): Tone {
  if (pct >= 75) return "success";
  if (pct >= 60) return "brand";
  if (pct >= 35) return "warn";
  return "danger";
}

/** Requirement-row status: Strong / Partial / Not Matched. */
export function alignmentStatus(pct: number): Tier {
  if (pct >= 75) return { label: "Strong", tone: "success" };
  if (pct >= 50) return { label: "Partial", tone: "warn" };
  return { label: "Not Matched", tone: "danger" };
}

export interface Recommendation extends Tier {
  detail: string;
}

/**
 * Shortlist guidance from the overall score. Worded as guidance from this
 * analysis, never as a verdict on the person.
 */
export function recommendationFor(pct: number): Recommendation {
  if (pct >= 75) {
    return {
      label: "Recommended for Shortlist",
      tone: "success",
      detail: "Based on the current analysis, this candidate is a strong fit for the role. Consider moving them forward.",
    };
  }
  if (pct >= 50) {
    return {
      label: "Consider for Shortlist",
      tone: "warn",
      detail: "Based on the current analysis, this candidate is a partial fit. A screening call can validate the open requirements.",
    };
  }
  return {
    label: "Not Recommended for Shortlist",
    tone: "danger",
    detail: "Based on the current analysis, this candidate may not be the best fit. Consider a screening call to validate key gaps.",
  };
}

export function categoryOf(analysis: MatchAnalysis, id: CategoryId): CategoryResult | undefined {
  return analysis.categories.find((category) => category.id === id);
}

/* ── Skills tab ────────────────────────────────────────────────────────────── */

export type SkillBucket = "matched" | "partial" | "missing";

export interface SkillRow {
  name: string;
  /** 0–100. */
  score: number;
  bucket: SkillBucket;
  mandatory: boolean;
  /** The candidate skill or résumé line that evidenced it. */
  evidence: string | null;
  /** Where the evidence came from: the profile skill list or free résumé text. */
  source: "skills" | "resume" | null;
  relationship: string;
  /** Minimum experience the job asks for on this skill, e.g. "3+ yrs". */
  required: string | null;
  /** The candidate's years with this skill — stated, or measured from dated work. */
  yours: SkillYears | null;
}

export interface SkillBreakdown {
  matched: SkillRow[];
  partial: SkillRow[];
  missing: SkillRow[];
  total: number;
  /** Share of required skills with at least partial evidence, 0–100. */
  coverage: number;
  /** Skills listed on the job — can exceed `total` when the engine caps the list. */
  listedOnJob: number;
}

function bucketOf(match: RequirementMatch): SkillBucket {
  if (match.matchClass === "EXACT" || match.matchClass === "STRONG_SEMANTIC") return "matched";
  if (match.matchClass === "RELATED" || match.matchClass === "PARTIAL") return "partial";
  return "missing";
}

export function skillBreakdown(
  analysis: MatchAnalysis,
  job: JobFullDetail,
  candidateSkills: string[] = [],
  skillYears: Record<string, SkillYears> = {},
): SkillBreakdown {
  const listed = new Set(candidateSkills.map((skill) => skill.trim().toLowerCase()));
  const skills = categoryOf(analysis, "skills");
  const jobSkills = job.skills ?? [];
  const rows: SkillRow[] = (skills?.matches ?? []).map((match) => {
    const spec = jobSkills.find((skill) => skill.name.trim().toLowerCase() === match.requirement.trim().toLowerCase());
    const unit = spec?.unit?.toLowerCase().startsWith("month") ? "mo" : "yrs";
    return {
      name: match.requirement,
      score: toPercent(match.score),
      bucket: bucketOf(match),
      mandatory: match.qualifier === "Mandatory",
      evidence: match.evidence,
      source: match.evidence ? (listed.has(match.evidence.trim().toLowerCase()) ? "skills" : "resume") : null,
      relationship: match.relationship,
      required: spec && spec.minExperience > 0 ? `${spec.minExperience}+ ${unit}` : null,
      yours: skillYears[skillKey(match.requirement)] ?? null,
    };
  });
  const byScore = (a: SkillRow, b: SkillRow) => b.score - a.score;
  const matched = rows.filter((row) => row.bucket === "matched").sort(byScore);
  const partial = rows.filter((row) => row.bucket === "partial").sort(byScore);
  const missing = rows
    .filter((row) => row.bucket === "missing")
    .sort((a, b) => Number(b.mandatory) - Number(a.mandatory) || byScore(a, b));
  const total = rows.length;
  return {
    matched,
    partial,
    missing,
    total,
    coverage: total === 0 ? 0 : Math.round(((matched.length + partial.length) / total) * 100),
    listedOnJob: jobSkills.length,
  };
}

/* ── Experience tab ────────────────────────────────────────────────────────── */

export interface RoleRow {
  key: string;
  title: string;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  period: string;
  duration: string | null;
  current: boolean;
  /** Title similarity to the job, 0–100; null when the role has no title. */
  relevance: number | null;
  level: Tier | null;
}

const MONTH_FORMAT: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };

function monthYear(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("en-US", MONTH_FORMAT);
}

function durationLabel(start: string | null, end: string | null, current: boolean): string | null {
  if (!start) return null;
  const from = new Date(start);
  const to = current || !end ? new Date() : new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return null;
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [
    years > 0 ? `${years} ${years === 1 ? "yr" : "yrs"}` : null,
    rest > 0 ? `${rest} ${rest === 1 ? "month" : "months"}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : "Less than a month";
}

/** Relevance pill for a past role: High ≥ 75, Medium ≥ 45, else Low. */
function roleLevel(pct: number): Tier {
  if (pct >= 75) return { label: "High Relevance", tone: "success" };
  if (pct >= 45) return { label: "Medium Relevance", tone: "warn" };
  return { label: "Low Relevance", tone: "danger" };
}

export function roleRows(job: JobFullDetail, experiences: ApplicantExperience[] | undefined): RoleRow[] {
  return [...(experiences ?? [])]
    .sort((a, b) => {
      if (a.currentlyWorking !== b.currentlyWorking) return a.currentlyWorking ? -1 : 1;
      return (b.startDate ?? "").localeCompare(a.startDate ?? "");
    })
    .map((role, index) => {
      const relevance = role.jobTitle && job.title ? toPercent(titleSimilarity(job.title, role.jobTitle).score) : null;
      const start = monthYear(role.startDate);
      const end = role.currentlyWorking ? "Present" : monthYear(role.endDate);
      return {
        key: `${role.companyName ?? "role"}-${role.startDate ?? index}-${index}`,
        title: role.jobTitle?.trim() || "Role not stated",
        company: role.companyName?.trim() || null,
        location: role.location?.trim() || null,
        employmentType: role.employmentType?.trim() || null,
        period: [start, end].filter(Boolean).join(" – ") || "Dates not stated",
        duration: durationLabel(role.startDate, role.endDate, role.currentlyWorking),
        current: role.currentlyWorking,
        relevance,
        level: relevance == null ? null : roleLevel(relevance),
      };
    });
}

export interface ExperienceOverview {
  totalYears: number | null;
  companies: number;
  /** Years spent in roles comparable to the job title; null when unknown. */
  relevantYears: number | null;
  /** Years in comparable roles ÷ total years, 0–100; null when either is unknown. */
  relevantShare: number | null;
  relevance: Tier | null;
}

export function experienceOverview(
  analysis: MatchAnalysis,
  job: JobFullDetail,
  applicant: ApplicantDetail,
): ExperienceOverview {
  const experiences = applicant.experiences ?? [];
  const companies = new Set(
    experiences.map((role) => role.companyName?.trim().toLowerCase()).filter((name): name is string => Boolean(name)),
  ).size;
  const total = applicant.experienceYears;
  const relevant = relevantExperienceYears(job.title, experiences);
  const relevantShare =
    total && total > 0 && relevant != null ? Math.min(100, Math.round((relevant / total) * 100)) : null;
  const category = categoryOf(analysis, "experience");
  return {
    totalYears: total,
    companies,
    relevantYears: relevant,
    relevantShare,
    relevance: category?.assessable ? levelOf(category.score) : null,
  };
}

/* ── Education tab ─────────────────────────────────────────────────────────── */

const LEVEL_LABEL: Record<DegreeLevel, string> = {
  secondary: "Secondary",
  diploma: "Diploma",
  bachelors: "Bachelor's",
  masters: "Master's",
  doctorate: "Doctorate",
};

export interface DegreeRow {
  degree: string;
  level: string | null;
  levelRank: number;
  field: string | null;
  /** Fit against the job's education requirement, 0–100; null when the job sets none. */
  relevance: number | null;
  relevanceLabel: string | null;
  relationship: string | null;
}

function relevanceLabel(pct: number): string {
  if (pct >= 85) return "Highly Relevant";
  if (pct >= 60) return "Relevant";
  if (pct >= 35) return "Partially Relevant";
  return "Low Relevance";
}

export function degreeRows(job: JobFullDetail, degrees: string[]): DegreeRow[] {
  const requirement = job.educationQualification?.trim() || null;
  return degrees
    .filter((degree) => degree.trim())
    .map((degree) => {
      const parsed = parseDegree(degree);
      const match = requirement ? bestDegreeMatch(requirement, [degree]) : null;
      const relevance = match ? toPercent(match.score) : null;
      return {
        degree: degree.trim(),
        level: parsed.level ? LEVEL_LABEL[parsed.level] : null,
        levelRank: parsed.levelRank,
        field: FIELD_FAMILIES.find((family) => family.id === parsed.fieldId)?.label ?? null,
        relevance,
        relevanceLabel: relevance == null ? null : relevanceLabel(relevance),
        relationship: match?.relationship ?? null,
      };
    })
    .sort((a, b) => b.levelRank - a.levelRank);
}

/* ── Role alignment tab ────────────────────────────────────────────────────── */

export interface ResponsibilityRow {
  id: string;
  requirement: string;
  score: number;
  evidence: string | null;
  status: Tier;
}

export interface RequirementLine {
  id: string;
  label: string;
  met: boolean;
  detail: string;
}

export interface RoleAlignment {
  /** Responsibilities score, 0–100; null when responsibilities could not be assessed. */
  alignment: number | null;
  alignmentTier: Tier | null;
  rows: ResponsibilityRow[];
  responsibilitiesMatched: number;
  mandatory: RequirementLine[];
  preferred: RequirementLine[];
  careerFit: Tier | null;
}

const MET_THRESHOLD = 0.65;

function toLine(match: RequirementMatch): RequirementLine {
  return {
    id: match.id,
    label: match.requirement,
    met: match.score >= MET_THRESHOLD,
    detail: match.evidence ? `${match.relationship} — ${match.evidence}` : match.relationship,
  };
}

function alignmentTier(pct: number): Tier {
  if (pct >= 75) return { label: "Good Fit", tone: "success" };
  if (pct >= 50) return { label: "Partial Fit", tone: "warn" };
  return { label: "Low Fit", tone: "danger" };
}

export function roleAlignment(analysis: MatchAnalysis): RoleAlignment {
  const responsibilities = categoryOf(analysis, "responsibilities");
  const rows: ResponsibilityRow[] = (responsibilities?.matches ?? []).map((match) => {
    const score = toPercent(match.score);
    return { id: match.id, requirement: match.requirement, score, evidence: match.evidence, status: alignmentStatus(score) };
  });

  const all = analysis.categories.flatMap((category) => category.matches);
  const mandatory = all.filter(
    (match) =>
      match.qualifier === "Mandatory" ||
      match.qualifier === "Education" ||
      (match.category === "experience" && /relevant experience/i.test(match.requirement)),
  );
  const preferred = all.filter((match) => match.qualifier === "Preferred" || match.qualifier === "Certification");

  const career = categoryOf(analysis, "career");
  const alignment = responsibilities?.assessable ? responsibilities.score : null;
  return {
    alignment,
    alignmentTier: alignment == null ? null : alignmentTier(alignment),
    rows,
    responsibilitiesMatched: rows.filter((row) => row.score >= 60).length,
    mandatory: mandatory.map(toLine),
    preferred: preferred.map(toLine),
    careerFit: career?.assessable ? levelOf(career.score) : null,
  };
}

/* ── Insights tab ──────────────────────────────────────────────────────────── */

function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function formatYears(years: number): string {
  const rounded = Math.round(years * 10) / 10;
  return `${rounded} ${rounded === 1 ? "year" : "years"}`;
}

function joinPhrase(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** A plain-language summary composed only from the analysis and the profile. */
export function summaryText(
  name: string,
  applicant: ApplicantDetail,
  job: JobFullDetail,
  analysis: MatchAnalysis,
): string {
  const sentences: string[] = [];
  const role = applicant.currentRole?.trim();
  const opener = [
    role ? `${name} is ${article(role)} ${role}` : `${name}'s profile`,
    applicant.currentCompany?.trim() && role ? ` at ${applicant.currentCompany.trim()}` : "",
    applicant.experienceYears != null
      ? `${role ? " with" : " shows"} ${formatYears(applicant.experienceYears)} of experience`
      : "",
  ].join("");
  sentences.push(`${opener}.`);

  const assessable = analysis.categories.filter((category) => category.assessable);
  const tier = fitTier(analysis.overall).label.toLowerCase();
  sentences.push(
    `Against the ${job.title} role the overall match is ${analysis.overall}% (${tier}), assessed across ${assessable.length} of ${analysis.categories.length} categories.`,
  );

  const ranked = [...assessable].sort((a, b) => b.score - a.score);
  const strongest = ranked.filter((category) => category.score >= 60).slice(0, 2).map((category) => category.label);
  if (strongest.length) sentences.push(`The strongest alignment is in ${joinPhrase(strongest)}.`);

  const weakest = [...ranked].reverse().filter((category) => category.score < 50).slice(0, 2).map((category) => category.label);
  if (weakest.length) sentences.push(`The main open questions are ${joinPhrase(weakest)}.`);

  const unassessed = analysis.categories.length - assessable.length;
  if (unassessed > 0) {
    sentences.push(
      `${unassessed} ${unassessed === 1 ? "category" : "categories"} could not be assessed from the available resume evidence.`,
    );
  }
  return sentences.join(" ");
}

export interface FitBar {
  label: string;
  /** 0–100, or null when the underlying category was not assessable. */
  value: number | null;
  tone: Tone;
}

/** Technical / experience / role fit — each read straight from its category. */
export function fitProfile(analysis: MatchAnalysis): FitBar[] {
  const read = (id: CategoryId) => {
    const category = categoryOf(analysis, id);
    return category?.assessable ? category.score : null;
  };
  return [
    { label: "Technical Fit", value: read("skills"), tone: "success" },
    { label: "Experience Fit", value: read("experience"), tone: "brand" },
    { label: "Role Fit", value: read("responsibilities"), tone: "brand" },
  ];
}
