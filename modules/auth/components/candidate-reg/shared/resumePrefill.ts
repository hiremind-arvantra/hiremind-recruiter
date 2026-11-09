import type { ResumeParsePreview } from "../../../services/candidate.service";
import { estimateSkillYears, skillKey } from "../../../../company/matching/skillExperience";
import type {
  CandidateRegStep1Data,
  Education,
  Experience,
  Skill,
} from "../../../types/auth.types";

/**
 * Maps a parsed resume onto the registration form's own shapes.
 *
 * Every field is only ever *filled in* — never overwritten. The candidate may have typed
 * something before picking their resume, and a parse is a suggestion, not the truth.
 */

let seq = 0;
const nextId = () => `parsed-${Date.now()}-${seq++}`;

/** "2021-06-15" → "06/2021", the MM/YYYY the experience form expects. */
function toMonthYear(iso: string | null): string {
  if (!iso) return "";
  const [year, month] = iso.split("-");
  return year && month ? `${month}/${year}` : "";
}

/** "2019-05-01" → "2019" — education stores only the passing year. */
function toYear(iso: string | null): string {
  if (!iso) return "";
  return iso.split("-")[0] ?? "";
}

const clean = (value: string | null | undefined): string => (value ?? "").trim();

/** The step-1 values a parse wrote, so a later parse knows what it may overwrite. */
export type AutoFilledStep1 = Partial<Record<keyof CandidateRegStep1Data, string>>;

/**
 * Applies a parsed resume to step 1.
 *
 * A field is written when it is empty, or when it still holds exactly what the previous
 * resume put there — so replacing a resume genuinely refreshes the details, while anything
 * the candidate typed or corrected themselves survives untouched.
 *
 * Returns the new data alongside a record of what was written, which the caller keeps and
 * feeds back in on the next parse.
 */
export function prefillStep1(
  current: CandidateRegStep1Data,
  preview: ResumeParsePreview,
  previouslyFilled: AutoFilledStep1 = {},
): { data: CandidateRegStep1Data; filled: AutoFilledStep1 } {
  const next = { ...current };
  const filled: AutoFilledStep1 = {};

  const put = (field: keyof CandidateRegStep1Data, value: string) => {
    const currentValue = clean(next[field] as string);
    const isUntouched = !currentValue || currentValue === clean(previouslyFilled[field]);
    if (!value || !isUntouched) return;
    (next[field] as string) = value;
    filled[field] = value;
  };

  const fullName = clean(preview.fullName);
  if (fullName) {
    const parts = fullName.split(/\s+/);
    put("firstName", parts[0] ?? "");
    if (parts.length > 1) put("lastName", parts.slice(1).join(" "));
  }
  // Email and phone drive OTP verification, so a value the candidate typed (or already
  // verified) is never replaced — only one the previous resume supplied.
  put("email", clean(preview.email));
  put("phone", clean(preview.phone).replace(/[^\d+]/g, ""));
  put("currentLocation", clean(preview.location));
  put("professionalSummary", clean(preview.headline));

  return { data: next, filled };
}

/** True for rows a resume parse created — see `nextId`. Manual rows never match. */
export function isParsedRow(id: string): boolean {
  return id.startsWith("parsed-");
}

/**
 * Swaps the rows a previous parse contributed for the new resume's, keeping any the
 * candidate added by hand. Used for education, experience and skills.
 */
export function replaceParsedRows<T extends { id: string }>(existing: T[], fresh: T[]): T[] {
  const manual = existing.filter((row) => !isParsedRow(row.id));
  return [...fresh, ...manual];
}

/** Resume experience → the step-2 experience rows. */
export function prefillExperience(preview: ResumeParsePreview): Experience[] {
  return preview.experience
    .filter((row) => clean(row.company) || clean(row.title))
    .map((row) => ({
      id: nextId(),
      company: clean(row.company),
      employmentType: "",
      startDate: toMonthYear(row.startDate),
      endDate: row.current ? "Present" : toMonthYear(row.endDate),
      isCurrent: row.current,
      totalExperience: "",
      jobTitle: clean(row.title),
      location: "",
      noticePeriod: "",
      description: clean(row.description ?? ""),
      expanded: false,
      projects: [],
    }));
}

/** Resume education → the step-2 education rows. */
export function prefillEducation(preview: ResumeParsePreview): Education[] {
  return preview.education
    .filter((row) => clean(row.institution) || clean(row.degree))
    .map((row) => ({
      id: nextId(),
      degree: clean(row.degree),
      institution: clean(row.institution),
      specialization: clean(row.fieldOfStudy),
      location: "",
      yearOfPassing: toYear(row.endDate),
      grade: clean(row.grade),
      educationType: "",
      description: "",
    }));
}

/**
 * Resume skills → the step-3 skill rows.
 *
 * Years are filled only when the résumé evidences them: the dated roles whose title or
 * description names the skill (overlaps merged — the same measurement recruiters see).
 * Everything else is left blank for the candidate to answer on step 3; proficiency is
 * never guessed, since a résumé listing a skill says nothing about how good they are at it.
 */
export function prefillSkills(preview: ResumeParsePreview): Skill[] {
  const seen = new Set<string>();
  const names = preview.skills.map((name) => clean(name)).filter(Boolean);
  const measured = estimateSkillYears(
    names,
    [],
    preview.experience.map((row) => ({
      label: clean(row.company) || clean(row.title) || "Role",
      text: [row.title, row.description].filter(Boolean).join(". "),
      start: row.startDate,
      end: row.endDate,
      ongoing: row.current,
    })),
  );
  return preview.skills
    .map((name) => clean(name))
    .filter((name) => {
      const key = name.toLowerCase();
      if (!name || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((name) => {
      const years = measured[skillKey(name)]?.years;
      const fromResume = years != null && years > 0;
      return {
        id: nextId(),
        name,
        proficiency: "",
        // Under a year reads better in months ("8 Months" rather than "0.7 Years").
        experienceValue: fromResume ? (years < 1 ? String(Math.max(1, Math.round(years * 12))) : String(years)) : "",
        experienceUnit: fromResume && years < 1 ? "Months" : "Years",
        lastUsed: "",
        highlighted: false,
        ...(fromResume ? { experienceSource: "resume" as const } : {}),
      };
    });
}

/** One-line summary of what was filled, for the confirmation shown on step 1. */
export function prefillSummary(preview: ResumeParsePreview): string {
  const bits: string[] = [];
  if (preview.experience.length) bits.push(`${preview.experience.length} role${preview.experience.length > 1 ? "s" : ""}`);
  if (preview.education.length) bits.push(`${preview.education.length} qualification${preview.education.length > 1 ? "s" : ""}`);
  if (preview.skills.length) bits.push(`${preview.skills.length} skill${preview.skills.length > 1 ? "s" : ""}`);
  return bits.length ? bits.join(", ") : "your details";
}
