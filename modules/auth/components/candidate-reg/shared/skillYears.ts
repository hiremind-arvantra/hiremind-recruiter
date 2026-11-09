/* Shared handling for "how long have you used this skill" inputs on registration. */

import type { Skill } from "../../../types/auth.types";

/** Keeps digits and one decimal point, one decimal place, at most 2 whole digits ("12.5"). */
export function cleanYears(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  const decimals = rest.join("").slice(0, 1);
  return rest.length ? `${whole.slice(0, 2)}.${decimals}` : whole.slice(0, 2);
}

/** A skill still needs an answer when it has no positive experience value. */
export function missingYears(skill: Skill): boolean {
  return !(Number.parseFloat(skill.experienceValue) > 0);
}
