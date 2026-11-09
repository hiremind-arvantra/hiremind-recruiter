/* ─────────────────────────────────────────────────────────────────────────────
 * Years of experience per required skill.
 *
 * Two sources, in order of trust:
 *   1. stated        — the years the candidate entered against that skill.
 *   2. work-history  — measured, not guessed: the dated roles and projects whose
 *                      text names the skill (or a close equivalent — "Postgres" for
 *                      PostgreSQL, "EC2" for AWS), with overlapping periods merged
 *                      so parallel projects are not double-counted.
 *
 * A skill with neither is left out, and the engine says its years are not evidenced
 * rather than inventing a figure. This is also how a skill the résumé never lists
 * explicitly still counts: if a role says "built the data pipeline in Python", that
 * role's time counts towards Python.
 * ───────────────────────────────────────────────────────────────────────────── */

import { normalizeText } from "./normalize";
import { bestSkillMatch } from "./similarity";
import type { SkillYears } from "./types";

/** Anything with a period and some text describing what was done in it. */
export interface DatedWork {
  label: string;
  text: string;
  start: string | null | undefined;
  end: string | null | undefined;
  ongoing: boolean;
}

export interface StatedSkill {
  name: string;
  experienceYears: number | null | undefined;
}

/**
 * Similarity at which a mention counts as the same skill for crediting *time*. Stricter
 * than presence: an exact name or an alias ("Postgres" for PostgreSQL) counts, but a
 * related member of a family does not — four years of Terraform is not four years of CI/CD.
 */
const SAME_SKILL = 0.9;
const DAY = 24 * 60 * 60 * 1000;

export function skillKey(name: string): string {
  return normalizeText(name);
}

export function estimateSkillYears(
  requiredSkills: string[],
  stated: StatedSkill[],
  work: DatedWork[],
  now: Date = new Date(),
): Record<string, SkillYears> {
  const result: Record<string, SkillYears> = {};

  for (const required of requiredSkills) {
    const key = skillKey(required);
    if (!key || result[key]) continue;

    // 1. The candidate's own figure for this skill (or a strong equivalent).
    const claimed = stated
      .filter((skill) => (skill.experienceYears ?? 0) > 0)
      .filter((skill) => bestSkillMatch(required, [skill.name]).score >= SAME_SKILL)
      .map((skill) => Number(skill.experienceYears))
      .sort((a, b) => b - a)[0];
    if (claimed) {
      result[key] = { years: round(claimed), source: "stated", basis: "stated on the candidate's profile" };
      continue;
    }

    // 2. Time spent in roles / projects whose text names the skill.
    const using = work.filter((item) => item.start && mentions(required, item.text));
    if (using.length === 0) continue;
    const spans = using
      .map((item) => span(item, now))
      .filter((range): range is [number, number] => range !== null);
    const years = mergedYears(spans);
    if (years <= 0) continue;
    result[key] = {
      years: round(years),
      source: "work-history",
      basis: `estimated from ${using.length} ${using.length === 1 ? "role/project" : "roles/projects"} using it: ${using
        .slice(0, 3)
        .map((item) => `${item.label} (${period(item)})`)
        .join(", ")}${using.length > 3 ? "…" : ""}`,
    };
  }
  return result;
}

/** Does this text name the skill — itself or a strong equivalent — anywhere? */
function mentions(skill: string, text: string): boolean {
  if (!text.trim()) return false;
  // Check the whole text and each comma/semicolon-separated fragment, so a
  // "Technologies used: Python, FastAPI, PostgreSQL" list is read item by item.
  const fragments = [text, ...text.split(/[,;|/\n•·]|\band\b/i).map((part) => part.trim()).filter((part) => part.length > 1)];
  return bestSkillMatch(skill, fragments).score >= SAME_SKILL;
}

function toTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function span(item: DatedWork, now: Date): [number, number] | null {
  const from = toTime(item.start);
  if (from == null) return null;
  const to = item.ongoing || !item.end ? now.getTime() : toTime(item.end);
  if (to == null || to <= from) return null;
  return [from, to];
}

/** Total length of the union of the spans, in years. */
function mergedYears(spans: [number, number][]): number {
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let current: [number, number] | null = null;
  for (const range of sorted) {
    if (!current || range[0] > current[1]) {
      if (current) total += current[1] - current[0];
      current = [...range];
    } else {
      current[1] = Math.max(current[1], range[1]);
    }
  }
  if (current) total += current[1] - current[0];
  return total / (365.25 * DAY);
}

function period(item: DatedWork): string {
  const year = (value: string | null | undefined) => (value ? new Date(value).getFullYear() : null);
  const from = year(item.start);
  const to = item.ongoing || !item.end ? "now" : year(item.end);
  return from ? `${from}–${to}` : "undated";
}

function round(years: number): number {
  return Math.round(years * 10) / 10;
}
